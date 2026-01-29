package com.example.demo.service;

import com.example.demo.entity.Appointment;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.LawyerUnavailabilityRepository;
import com.example.demo.repository.ChatSessionRepository;
import com.example.demo.entity.ChatSession;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;
    private final com.example.demo.repository.LawyerRepository lawyerRepository;
    private final com.example.demo.repository.NGORepository ngoRepository;
    private final com.example.demo.repository.CitizenRepository citizenRepository;
    private final com.example.demo.service.EmailService emailService;
    private final LawyerUnavailabilityRepository lawyerUnavailabilityRepository;
    private final AuditLogService auditLogService;
    private final ChatSessionRepository chatSessionRepository;

    public AppointmentService(AppointmentRepository appointmentRepository, NotificationService notificationService,
            com.example.demo.repository.LawyerRepository lawyerRepository,
            com.example.demo.repository.NGORepository ngoRepository,
            com.example.demo.repository.CitizenRepository citizenRepository,
            com.example.demo.service.EmailService emailService,
            LawyerUnavailabilityRepository lawyerUnavailabilityRepository,
            AuditLogService auditLogService,
            ChatSessionRepository chatSessionRepository) {
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
        this.lawyerRepository = lawyerRepository;
        this.ngoRepository = ngoRepository;
        this.citizenRepository = citizenRepository;
        this.emailService = emailService;
        this.lawyerUnavailabilityRepository = lawyerUnavailabilityRepository;
        this.auditLogService = auditLogService;
        this.chatSessionRepository = chatSessionRepository;
    }

    public Appointment scheduleAppointment(Appointment appointment) {
        // Normalize roles to uppercase
        if (appointment.getProviderRole() != null) {
            appointment.setProviderRole(appointment.getProviderRole().toUpperCase());
        }
        if (appointment.getRequesterRole() != null) {
            appointment.setRequesterRole(appointment.getRequesterRole().toUpperCase());
        }

        // For lawyers, check if they have marked this time as unavailable
        if ("LAWYER".equalsIgnoreCase(appointment.getProviderRole())) {
            List<com.example.demo.entity.LawyerUnavailability> unavailabilityPeriods = 
                lawyerUnavailabilityRepository.findByLawyerIdAndStartTimeLessThanAndEndTimeGreaterThan(
                    appointment.getProviderId(),
                    appointment.getEndTime(),
                    appointment.getStartTime());
            
            if (!unavailabilityPeriods.isEmpty()) {
                com.example.demo.entity.LawyerUnavailability u = unavailabilityPeriods.get(0);
                String reason = (u.getReason() != null && !u.getReason().isBlank()) ? u.getReason().trim() : null;
                String msg = reason != null
                    ? "The lawyer is not available during this time: " + reason + ". Please select another slot."
                    : "The lawyer is not available during this time period. Please select another time slot.";
                throw new IllegalArgumentException(msg);
            }
        }

        // Validate overlaps - check for CONFIRMED or PENDING appointments that would block this slot
        List<Appointment> conflicts = appointmentRepository.findOverlappingAppointments(
                appointment.getProviderId(),
                appointment.getProviderRole(),
                appointment.getStartTime(),
                appointment.getEndTime());

        if (!conflicts.isEmpty()) {
            // Check if any conflicting appointment is already CONFIRMED
            boolean hasConfirmed = conflicts.stream()
                    .anyMatch(a -> "CONFIRMED".equalsIgnoreCase(a.getStatus()));
            
            if (hasConfirmed) {
                throw new IllegalArgumentException("This time slot is already confirmed and booked. Please select another time.");
            }
            throw new IllegalArgumentException("Provider is not available at the selected time.");
        }

        // Validate requester overlaps (Citizen-side conflict)
        System.err.println("!!! CONFLICT CHECK START !!!");
        System.err.println(
                "New Appt Requester: ID=" + appointment.getRequesterId() + ", Role=" + appointment.getRequesterRole());
        System.err.println("New Appt Time: " + appointment.getStartTime() + " to " + appointment.getEndTime());

        // DEBUG: Print all appointments for this requester
        List<Appointment> allUserAppts = appointmentRepository.findByRequesterIdAndRequesterRole(
                appointment.getRequesterId(), appointment.getRequesterRole());
        System.err.println("Database total appts for this user: " + allUserAppts.size());
        for (Appointment a : allUserAppts) {
            System.err.println("  - DB Appt ID=" + a.getId() + ", Time=" + a.getStartTime() + " to " + a.getEndTime()
                    + ", Status=" + a.getStatus());
        }

        List<Appointment> requesterConflicts = appointmentRepository.findRequesterOverlappingAppointments(
                appointment.getRequesterId(),
                appointment.getRequesterRole(),
                appointment.getStartTime(),
                appointment.getEndTime());

        System.err.println("Found Conflicts Count: " + requesterConflicts.size());
        if (!requesterConflicts.isEmpty()) {
            for (Appointment c : requesterConflicts) {
                System.err.println("Conflict with ID: " + c.getId() + ", Time: " + c.getStartTime() + " - "
                        + c.getEndTime() + ", Status: " + c.getStatus());
            }
        }

        // We check for a specific "IGNORE_CONFLICT" string in the description or a new
        // field.
        // For simplicity, let's look for "[FORCE]" at the start of the description if
        // we want to allow override.
        boolean forceOverride = appointment.getDescription() != null
                && appointment.getDescription().startsWith("[FORCE]");

        System.err.println("Force Override: " + forceOverride);

        if (!requesterConflicts.isEmpty() && !forceOverride) {
            Appointment existing = requesterConflicts.get(0);
            String providerName = existing.getProviderName() != null ? existing.getProviderName() : "another provider";
            String errorMsg = "REACTION_REQUIRED: You already have a slot booked with " + providerName
                    + ". Do you want to book this slot with this lawyer?";
            System.err.println("THROWING CONFLICT: " + errorMsg);
            throw new IllegalArgumentException(errorMsg);
        }
        System.err.println("!!! CONFLICT CHECK END (NO CONFLICT) !!!");

        // Populate Names
        if (appointment.getProviderRole().equalsIgnoreCase("LAWYER")) {
            lawyerRepository.findById(appointment.getProviderId())
                    .ifPresent(l -> appointment.setProviderName(l.getFullName()));
        } else if (appointment.getProviderRole().equalsIgnoreCase("NGO")) {
            ngoRepository.findById(appointment.getProviderId())
                    .ifPresent(n -> appointment.setProviderName(n.getNgoName()));
        }

        if (appointment.getRequesterRole().equalsIgnoreCase("CITIZEN")) {
            citizenRepository.findById(appointment.getRequesterId())
                    .ifPresent(c -> appointment.setRequesterName(c.getFullName()));
        }

        // Set appointment status to PENDING so lawyer can confirm/reject
        appointment.setStatus("PENDING");
        Appointment saved = appointmentRepository.save(appointment);

        // Audit Log for Appointment Booking
        try {
            String requesterEmail = "";
            if ("CITIZEN".equalsIgnoreCase(appointment.getRequesterRole())) {
                requesterEmail = citizenRepository.findById(appointment.getRequesterId())
                        .map(c -> c.getEmail()).orElse("Unknown");
            }

            String auditDetails = String.format("Appointment booked with %s (%s) on %s at %s. Status: PENDING",
                    appointment.getProviderName(),
                    appointment.getProviderRole(),
                    appointment.getStartTime().toLocalDate(),
                    appointment.getStartTime().toLocalTime());

            auditLogService.logAction(
                    requesterEmail,
                    appointment.getRequesterRole(),
                    "Appointment Requested",
                    "APPOINTMENT",
                    auditDetails,
                    "N/A"); // IP not available in service layer without extra context
        } catch (Exception e) {
            System.err.println("Failed to log appointment audit: " + e.getMessage());
        }

        // Format date and time for notification
        String dateStr = appointment.getStartTime().toLocalDate().toString();
        String timeStr = appointment.getStartTime().toLocalTime().toString();
        String requesterName = appointment.getRequesterName() != null ? appointment.getRequesterName() : "a citizen";
        
        // Notify Provider (Lawyer/NGO) with detailed information
        String providerMessage = String.format("New %s request from %s on %s at %s. Please confirm or reject.",
                appointment.getType(), requesterName, dateStr, timeStr);
        notificationService.createNotification(
                appointment.getProviderId(),
                appointment.getProviderRole(),
                providerMessage,
                "APPOINTMENT",
                saved.getId());

        // Notify Citizen that appointment request has been sent
        String citizenMessage = String.format("%s request sent to %s for %s at %s. Waiting for confirmation.",
                appointment.getType(),
                appointment.getProviderName() != null ? appointment.getProviderName() : "lawyer",
                dateStr, timeStr);
        notificationService.createNotification(
                appointment.getRequesterId(),
                appointment.getRequesterRole(),
                citizenMessage,
                "APPOINTMENT",
                saved.getId());

        // Send Email Notification to Provider
        try {
            String providerEmail = "";
            String requesterEmail = "";

            if (appointment.getProviderRole().equalsIgnoreCase("LAWYER")) {
                providerEmail = lawyerRepository.findById(appointment.getProviderId())
                        .map(l -> l.getEmail()).orElse("");
            } else if (appointment.getProviderRole().equalsIgnoreCase("NGO")) {
                providerEmail = ngoRepository.findById(appointment.getProviderId())
                        .map(n -> n.getEmail()).orElse("");
            }

            if (appointment.getRequesterRole().equalsIgnoreCase("CITIZEN")) {
                requesterEmail = citizenRepository.findById(appointment.getRequesterId())
                        .map(c -> c.getEmail()).orElse("");
            }

            if (!providerEmail.isEmpty()) {
                emailService.sendAppointmentNotificationEmail(
                        providerEmail,
                        appointment.getProviderName(),
                        appointment.getProviderRole(),
                        appointment.getRequesterName(),
                        requesterEmail,
                        appointment.getStartTime().toLocalDate().toString(),
                        appointment.getStartTime().toLocalTime().toString(),
                        appointment.getType(),
                        appointment.getDescription());
            }
        } catch (Exception e) {
            System.err.println("Failed to send appointment notification email: " + e.getMessage());
        }

        return saved;
    }

    public List<Appointment> getAppointmentsForProvider(Integer providerId, String providerRole) {
        return appointmentRepository.findByProviderIdAndProviderRole(providerId, providerRole);
    }

    public List<Appointment> getAppointmentsForRequester(Integer requesterId, String requesterRole) {
        return appointmentRepository.findByRequesterIdAndRequesterRole(requesterId, requesterRole);
    }

    public List<Appointment> getAllAppointmentsForUser(Integer userId) {
        return appointmentRepository.findAllByUserId(userId);
    }

    public Appointment updateStatus(Long appointmentId, String status, String updaterEmail, String updaterRole) {
        Optional<Appointment> optional = appointmentRepository.findById(appointmentId);
        if (optional.isPresent()) {
            Appointment appt = optional.get();
            appt.setStatus(status);
            Appointment saved = appointmentRepository.save(appt);

            // Format date and time for notifications
            String dateStr = appt.getStartTime().toLocalDate().toString();
            String timeStr = appt.getStartTime().toLocalTime().toString();
            String requesterName = appt.getRequesterName() != null ? appt.getRequesterName() : "Citizen";
            String providerName = appt.getProviderName() != null ? appt.getProviderName() : "Lawyer";

            if ("CONFIRMED".equalsIgnoreCase(status)) {
                // Notify Citizen that appointment is confirmed
                String citizenMessage = String.format("Your appointment with %s on %s at %s has been confirmed!",
                        providerName, dateStr, timeStr);
                notificationService.createNotification(
                        appt.getRequesterId(),
                        appt.getRequesterRole(),
                        citizenMessage,
                        "APPOINTMENT",
                        saved.getId());

                // Notify Provider (Lawyer) that they confirmed the appointment
                String providerMessage = String.format("You confirmed the appointment with %s on %s at %s.",
                        requesterName, dateStr, timeStr);
                notificationService.createNotification(
                        appt.getProviderId(),
                        appt.getProviderRole(),
                        providerMessage,
                        "INFO",
                        saved.getId());
            } else {
                // For REJECTED or other statuses, notify requester
                String requesterMessage = String.format("Your appointment request with %s on %s at %s has been %s.",
                        providerName, dateStr, timeStr, status.toLowerCase());
                notificationService.createNotification(
                        appt.getRequesterId(),
                        appt.getRequesterRole(),
                        requesterMessage,
                        "APPOINTMENT",
                        saved.getId());
            }

            // Audit Log for Status Update
            try {
                String action = "APPOINTMENT_UPDATED";
                String details = "";
                
                if ("CONFIRMED".equalsIgnoreCase(status)) {
                    action = "Appointment Booked";
                    details = String.format("Appointment confirmed by %s (%s)", providerName, appt.getProviderRole());
                } else if ("REJECTED".equalsIgnoreCase(status)) {
                    action = "Appointment Rejected";
                    details = String.format("Appointment rejected by %s (%s)", providerName, appt.getProviderRole());
                } else {
                    action = "Appointment Status: " + status;
                    details = String.format("Status updated to %s by %s", status, updaterEmail);
                }

                auditLogService.logAction(
                    updaterEmail != null ? updaterEmail : "Unknown",
                    updaterRole != null ? updaterRole : "UNKNOWN",
                    action,
                    "APPOINTMENT",
                    details,
                    "N/A"
                );
            } catch (Exception e) {
                System.err.println("Failed to log appointment status audit: " + e.getMessage());
            }

            return saved;
        } else {
            throw new RuntimeException("Appointment not found");
        }
    }

    public List<java.util.Map<String, Object>> getAvailability(Integer providerId, String providerRole,
            java.time.LocalDate date, Integer requesterId, String requesterRole) {
        System.out.println("DEBUG: [VERBOSE] getAvailability for Prov=" + providerId + " (" + providerRole + "), Date="
                + date + ", Req=" + requesterId + " (" + requesterRole + ")");
        LocalDateTime dayStart = date.atStartOfDay();
        // Use 9 AM to 5 PM
        LocalDateTime workStart = date.atTime(9, 0);
        LocalDateTime workEnd = date.atTime(17, 0);

        List<Appointment> appts = appointmentRepository.findOverlappingAppointments(providerId, providerRole, workStart,
                workEnd);
        System.out.println("DEBUG: [VERBOSE] Found " + appts.size() + " provider overlaps");

        // Also find requester overlaps if requesterId is provided
        List<Appointment> requesterAppts = (requesterId != null && requesterRole != null)
                ? appointmentRepository.findRequesterOverlappingAppointments(requesterId, requesterRole, workStart,
                        workEnd)
                : new java.util.ArrayList<>();
        System.out.println("DEBUG: [VERBOSE] Found " + requesterAppts.size() + " requester overlaps");
        // For lawyers, check unavailability periods
        List<com.example.demo.entity.LawyerUnavailability> unavailabilityPeriods = new java.util.ArrayList<>();
        if ("LAWYER".equalsIgnoreCase(providerRole)) {
            unavailabilityPeriods = lawyerUnavailabilityRepository
                .findByLawyerIdAndStartTimeLessThanAndEndTimeGreaterThan(
                    providerId, workEnd, workStart);
        }

        List<java.util.Map<String, Object>> slots = new java.util.ArrayList<>();
        for (int hour = 9; hour < 17; hour++) {
            LocalDateTime slotStart = date.atTime(hour, 0);
            LocalDateTime slotEnd = date.atTime(hour + 1, 0);

            boolean isProviderBooked = appts.stream()
                    .anyMatch(appt -> (appt.getStartTime().isBefore(slotEnd) && appt.getEndTime().isAfter(slotStart)));

            // Check if slot is in an unavailability period
            java.util.Optional<com.example.demo.entity.LawyerUnavailability> unavMatch = unavailabilityPeriods.stream()
                    .filter(unav -> (unav.getStartTime().isBefore(slotEnd) && unav.getEndTime().isAfter(slotStart)))
                    .findFirst();
            boolean isUnavailable = unavMatch.isPresent();

            Optional<Appointment> conflictAppt = requesterAppts.stream()
                    .filter(appt -> (appt.getStartTime().isBefore(slotEnd) && appt.getEndTime().isAfter(slotStart)))
                    .findFirst();

            java.util.Map<String, Object> slot = new java.util.HashMap<>();
            slot.put("time", String.format("%02d:00", hour));
            slot.put("displayTime", String.format("%02d:00 - %02d:00", hour, hour + 1));

            if (isUnavailable) {
                slot.put("status", "UNAVAILABLE");
                String reason = unavMatch.get().getReason();
                if (reason != null && !reason.isBlank()) {
                    slot.put("unavailabilityReason", reason.trim());
                }
            } else if (isProviderBooked) {
                slot.put("status", "BOOKED");
            } else if (conflictAppt.isPresent()) {
                slot.put("status", "CONFLICT");
                slot.put("conflictWith", conflictAppt.get().getProviderName());
            } else {
                slot.put("status", "AVAILABLE");
            }

            slots.add(slot);
        }
        return slots;
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public com.example.demo.dto.LawyerAnalyticsDTO getLawyerAnalytics(Integer lawyerId) {
        return getProviderAnalytics(lawyerId, "LAWYER");
    }

    public com.example.demo.dto.LawyerAnalyticsDTO getNGOAnalytics(Integer ngoId) {
        return getProviderAnalytics(ngoId, "NGO");
    }

    private com.example.demo.dto.LawyerAnalyticsDTO getProviderAnalytics(Integer providerId, String role) {
        com.example.demo.dto.LawyerAnalyticsDTO dto = new com.example.demo.dto.LawyerAnalyticsDTO();
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1);
        
        LocalDateTime startOf6Months = now.minusMonths(5).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        
        // 1. All Time Counts
        long allTimeTotal = appointmentRepository.countAllTimeAppointmentsByProvider(providerId, role);
        long allTimeConfirmed = appointmentRepository.countAllTimeAppointmentsByProviderAndStatus(providerId, role, "CONFIRMED");
        long allTimePending = appointmentRepository.countAllTimeAppointmentsByProviderAndStatus(providerId, role, "PENDING");
        
        dto.setAllTimeAppointments(allTimeTotal);
        dto.setAllTimeConfirmedAppointments(allTimeConfirmed);
        dto.setAllTimePendingAppointments(allTimePending);

        long allTimeRejected = appointmentRepository.countAllTimeAppointmentsByProviderAndStatus(providerId, role, "REJECTED");
        dto.setAllTimeRejectedAppointments(allTimeRejected);

        // Calculate Confirmation Rate (All Time)
        if (allTimeTotal > 0) {
            dto.setConfirmationRate((double) allTimeConfirmed / allTimeTotal * 100);
        } else {
            dto.setConfirmationRate(0);
        }
        
        // 2. This Month (for cards)
        List<Appointment> thisMonthAppts = appointmentRepository.findAppointmentsByProviderAndDateRange(providerId, role, startOfMonth, endOfMonth);
        dto.setTotalAppointments(thisMonthAppts.size());
        
        // Use ALL TIME counts for main dashboard cards to match user expectation of "Status"
        dto.setConfirmedAppointments(allTimeConfirmed);
        dto.setConfirmedAppointments(allTimeConfirmed);
        dto.setPendingAppointments(allTimePending);
        dto.setRejectedAppointments(allTimeRejected);
        
        // 3. 6 Month Trend & Pie Chart Data
        List<Appointment> sixMonthAppts = appointmentRepository.findAppointmentsByProviderAndDateRange(providerId, role, startOf6Months, endOfMonth);
        
        java.util.Map<String, Long> monthlyTotal = new java.util.LinkedHashMap<>();
        java.util.Map<String, Long> monthlyConfirmed = new java.util.LinkedHashMap<>();
        java.util.Map<String, Long> monthlyPending = new java.util.LinkedHashMap<>();
        java.util.Map<String, Long> monthlyRejected = new java.util.LinkedHashMap<>();
        
        // Initialize maps with 0 for last 6 months to ensure continuity
        for (int i = 5; i >= 0; i--) {
            String monthName = now.minusMonths(i).getMonth().toString(); 
            // Title Case: JANUARY -> January
            monthName = monthName.substring(0, 1) + monthName.substring(1).toLowerCase();
            monthlyTotal.put(monthName, 0L);
            monthlyConfirmed.put(monthName, 0L);
            monthlyPending.put(monthName, 0L);
            monthlyRejected.put(monthName, 0L);
        }

        java.util.Map<String, Long> typeBreakdown = new java.util.HashMap<>();
        // Initialize common types if desired, or let them populate dynamically
        typeBreakdown.put("In-Person", 0L);
        typeBreakdown.put("Voice Call", 0L);
        typeBreakdown.put("Video Call", 0L);

        for (Appointment a : sixMonthAppts) {
            String month = a.getStartTime().getMonth().toString();
            month = month.substring(0, 1) + month.substring(1).toLowerCase();
            
            // Only update if it's within our 6 month bucket keys (should be, given the query)
            if (monthlyTotal.containsKey(month)) {
                monthlyTotal.put(month, monthlyTotal.getOrDefault(month, 0L) + 1);
                
                if ("CONFIRMED".equalsIgnoreCase(a.getStatus())) {
                    monthlyConfirmed.put(month, monthlyConfirmed.getOrDefault(month, 0L) + 1);
                } else if ("PENDING".equalsIgnoreCase(a.getStatus())) {
                    monthlyPending.put(month, monthlyPending.getOrDefault(month, 0L) + 1);
                } else if ("REJECTED".equalsIgnoreCase(a.getStatus())) {
                    monthlyRejected.put(month, monthlyRejected.getOrDefault(month, 0L) + 1);
                }
            }
            
            // Type breakdown
            String type = a.getType();
            if (type != null && typeBreakdown.containsKey(type)) {
                typeBreakdown.put(type, typeBreakdown.get(type) + 1);
            }
        }
        
        dto.setMonthlyTotal(monthlyTotal);
        dto.setMonthlyConfirmed(monthlyConfirmed);
        dto.setMonthlyPending(monthlyPending);
        dto.setMonthlyRejected(monthlyRejected);
        dto.setAppointmentTypeBreakdown(typeBreakdown);
        
        // 4. Upcoming Appointments
        List<Appointment> upcoming = appointmentRepository.findUpcomingAppointmentsByProvider(providerId, role, now);
        // Limit to 5
        List<com.example.demo.dto.LawyerAnalyticsDTO.AppointmentDTO> upcomingDTOs = upcoming.stream()
            .limit(5)
            .map(a -> new com.example.demo.dto.LawyerAnalyticsDTO.AppointmentDTO(
                a.getId(),
                a.getRequesterName() != null ? a.getRequesterName() : "Unknown Client",
                a.getStartTime().toLocalDate().toString(),
                a.getStartTime().toLocalTime().toString(),
                a.getStatus(),
                a.getType(),
                a.getDescription()
            ))
            .collect(java.util.stream.Collectors.toList());
            
        dto.setUpcomingAppointments(upcomingDTOs);
        
        // 5. Recent Client Interactions (Chat Sessions)
        List<ChatSession> sessions = chatSessionRepository.findByProviderIdAndProviderRole(providerId, role);
        
        List<com.example.demo.dto.LawyerAnalyticsDTO.InteractionDTO> interactions = sessions.stream()
            .sorted((s1, s2) -> {
                if (s1.getLastMessageTime() == null) return 1;
                if (s2.getLastMessageTime() == null) return -1;
                return s2.getLastMessageTime().compareTo(s1.getLastMessageTime());
            })
            .limit(5)
            .map(s -> new com.example.demo.dto.LawyerAnalyticsDTO.InteractionDTO(
                s.getId(),
                s.getCitizenName() != null ? s.getCitizenName() : "Unknown Client",
                s.getLastMessagePreview() != null ? s.getLastMessagePreview() : "Start a conversation",
                s.getLastMessageTime() != null ? s.getLastMessageTime().toLocalDate().toString() : "",
                "Message"
            ))
            .collect(java.util.stream.Collectors.toList());
            
        dto.setRecentInteractions(interactions);
        
        return dto;
    }
}
