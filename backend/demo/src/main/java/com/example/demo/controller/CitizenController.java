package com.example.demo.controller;

import com.example.demo.repository.CitizenRepository;
import com.example.demo.repository.CaseRepository;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.entity.Citizen;
import com.example.demo.entity.Case;
import com.example.demo.entity.Appointment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/citizens")

public class CitizenController {

    private final CitizenRepository repo;
    private final CaseRepository caseRepository;
    private final AppointmentRepository appointmentRepository;
    private final com.example.demo.service.EmailService emailService;
    private final com.example.demo.service.AuditLogService auditLogService;

    public CitizenController(CitizenRepository repo, 
                             CaseRepository caseRepository,
                             AppointmentRepository appointmentRepository,
                             com.example.demo.service.EmailService emailService, 
                             com.example.demo.service.AuditLogService auditLogService) {
        this.repo = repo;
        this.caseRepository = caseRepository;
        this.appointmentRepository = appointmentRepository;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
    }

    // GET → /citizens
    @GetMapping
    public List<Citizen> getAll() {
        return repo.findAll();
    }

    // POST → /citizens/add (must come before /{id} to avoid path conflict)
    @PostMapping("/add")
    @Transactional
    public ResponseEntity<?> addCitizen(@RequestBody Map<String, Object> requestData, jakarta.servlet.http.HttpServletRequest request) {
        try {
            System.out.println("DEBUG: addCitizen payload: " + requestData);
            // Validate required fields
            if (requestData.get("email") == null || requestData.get("email").toString().trim().isEmpty()) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body("Email is required");
            }

            if (requestData.get("aadharNum") == null || requestData.get("aadharNum").toString().trim().isEmpty()) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body("Aadhar number is required");
            }

            // EMAIL already exists?
            if (repo.existsByEmail(requestData.get("email").toString())) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body("Email already exists");
            }

            // AADHAR already exists?
            if (repo.existsByAadharNum(requestData.get("aadharNum").toString())) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body("Aadhar number already exists");
            }

            // Create new Citizen entity
            Citizen c = new Citizen();

            // Set basic fields
            c.setFullName(requestData.get("fullName") != null ? requestData.get("fullName").toString() : "");
            c.setAadharNum(requestData.get("aadharNum").toString());
            c.setEmail(requestData.get("email").toString());
            c.setMobileNum(requestData.get("mobileNum") != null ? requestData.get("mobileNum").toString() : "");
            c.setPassword(requestData.get("password") != null ? requestData.get("password").toString() : "");

            // Parse date of birth
            if (requestData.get("dateOfBirth") != null) {
                try {
                    String dobStr = requestData.get("dateOfBirth").toString();
                    LocalDate dob = LocalDate.parse(dobStr);
                    c.setDateOfBirth(dob);
                } catch (Exception e) {
                    return ResponseEntity
                            .status(HttpStatus.BAD_REQUEST)
                            .body("Invalid date format. Use YYYY-MM-DD");
                }
            } else {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body("Date of birth is required");
            }

            // Set location fields (with empty string defaults if null)
            String state = requestData.get("state") != null ? requestData.get("state").toString().trim() : "";
            String district = requestData.get("district") != null ? requestData.get("district").toString().trim() : "";
            String city = requestData.get("city") != null ? requestData.get("city").toString().trim() : "";
            String address = requestData.get("address") != null ? requestData.get("address").toString().trim() : "";

            // Validate location fields
            if (state.isEmpty()) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body("State is required");
            }
            if (district.isEmpty()) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body("District is required");
            }
            if (city.isEmpty()) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body("City is required");
            }
            if (address.isEmpty()) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body("Address is required");
            }

            c.setState(state);
            c.setDistrict(district);
            c.setCity(city);
            c.setAddress(address);

            // SAVE citizen
            Citizen saved = repo.save(c);

            // Send Welcome Email
            try {
                emailService.sendWelcomeEmail(saved.getEmail(), "CITIZEN", saved.getFullName());
            } catch (Exception e) {
                System.err.println("Failed to send welcome email: " + e.getMessage());
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Citizen registered successfully");
            response.put("data", saved);

            // Log Audit
            String ip = request.getRemoteAddr();
            auditLogService.logAction(
                saved.getEmail(), 
                "CITIZEN",
                "Created Account",
                "Citizen Registration",
                "New citizen registered: " + saved.getEmail(),
                ip
            );

            return ResponseEntity.ok(response);

        } catch (org.hibernate.exception.SQLGrammarException e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Database schema error. Please restart the Spring Boot application to update the database schema. Error: "
                            + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            String errorMessage = e.getMessage();
            if (e.getCause() != null) {
                errorMessage += " | Cause: " + e.getCause().getMessage();
            }
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error saving citizen: " + errorMessage);
        }
    }

    // GET → /citizens/{id} (must come after /add to avoid path conflict)
    @GetMapping("/{id}")
    public ResponseEntity<?> getCitizenById(@PathVariable Integer id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET → /citizens/{id}/analytics
    @GetMapping("/{id}/analytics")
    public ResponseEntity<Map<String, Object>> getCitizenAnalytics(@PathVariable Integer id) {
        try {
            Map<String, Object> analytics = new HashMap<>();
            
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime endOfMonth = startOfMonth.plusMonths(1);
            LocalDateTime startOf6Months = now.minusMonths(5).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            
            // Get all cases for this citizen
            List<Case> allCases = caseRepository.findByCitizenIdOrderByUpdatedAtDesc(id);
            
            // Cases Analytics
            long totalCases = allCases.size();
            long submittedCases = allCases.stream().filter(c -> c.getIsSubmitted() != null && c.getIsSubmitted()).count();
            long draftCases = allCases.stream().filter(c -> c.getIsSubmitted() == null || !c.getIsSubmitted()).count();
            
            // Cases by Status
            Map<String, Long> casesByStatus = allCases.stream()
                    .filter(c -> c.getStatus() != null)
                    .collect(Collectors.groupingBy(
                            c -> c.getStatus(),
                            Collectors.counting()
                    ));
            
            // Cases by Type
            Map<String, Long> casesByType = allCases.stream()
                    .filter(c -> c.getCaseType() != null && !c.getCaseType().isEmpty())
                    .collect(Collectors.groupingBy(
                            Case::getCaseType,
                            Collectors.counting()
                    ));
            
            // Monthly Cases Trend (last 6 months)
            Map<String, Long> monthlyCases = new LinkedHashMap<>();
            for (int i = 5; i >= 0; i--) {
                String monthName = now.minusMonths(i).getMonth().toString();
                monthName = monthName.substring(0, 1) + monthName.substring(1).toLowerCase();
                monthlyCases.put(monthName, 0L);
            }
            
            allCases.stream()
                    .filter(c -> c.getCreatedAt() != null && c.getCreatedAt().isAfter(startOf6Months))
                    .forEach(c -> {
                        String month = c.getCreatedAt().getMonth().toString();
                        month = month.substring(0, 1) + month.substring(1).toLowerCase();
                        if (monthlyCases.containsKey(month)) {
                            monthlyCases.put(month, monthlyCases.get(month) + 1);
                        }
                    });
            
            // Get all appointments for this citizen
            List<Appointment> allAppointments = appointmentRepository.findAllByUserId(id).stream()
                    .filter(a -> a.getRequesterId() != null && a.getRequesterId().equals(id) && "CITIZEN".equalsIgnoreCase(a.getRequesterRole()))
                    .collect(Collectors.toList());
            
            // Appointments Analytics
            long totalAppointments = allAppointments.size();
            long confirmedAppointments = allAppointments.stream().filter(a -> "CONFIRMED".equalsIgnoreCase(a.getStatus())).count();
            long pendingAppointments = allAppointments.stream().filter(a -> "PENDING".equalsIgnoreCase(a.getStatus())).count();
            long rejectedAppointments = allAppointments.stream().filter(a -> "REJECTED".equalsIgnoreCase(a.getStatus())).count();
            
            // Appointment Status Breakdown
            Map<String, Long> appointmentsByStatus = allAppointments.stream()
                    .filter(a -> a.getStatus() != null)
                    .collect(Collectors.groupingBy(
                            a -> a.getStatus().toUpperCase(),
                            Collectors.counting()
                    ));
            
            // Monthly Appointments Trend (last 6 months)
            Map<String, Long> monthlyAppointments = new LinkedHashMap<>();
            Map<String, Long> monthlyConfirmedAppointments = new LinkedHashMap<>();
            for (int i = 5; i >= 0; i--) {
                String monthName = now.minusMonths(i).getMonth().toString();
                monthName = monthName.substring(0, 1) + monthName.substring(1).toLowerCase();
                monthlyAppointments.put(monthName, 0L);
                monthlyConfirmedAppointments.put(monthName, 0L);
            }
            
            allAppointments.stream()
                    .filter(a -> a.getCreatedAt() != null && a.getCreatedAt().isAfter(startOf6Months))
                    .forEach(a -> {
                        String month = a.getCreatedAt().getMonth().toString();
                        month = month.substring(0, 1) + month.substring(1).toLowerCase();
                        if (monthlyAppointments.containsKey(month)) {
                            monthlyAppointments.put(month, monthlyAppointments.get(month) + 1);
                            if ("CONFIRMED".equalsIgnoreCase(a.getStatus())) {
                                monthlyConfirmedAppointments.put(month, monthlyConfirmedAppointments.get(month) + 1);
                            }
                        }
                    });
            
            // This month's cases and appointments
            long thisMonthCases = allCases.stream()
                    .filter(c -> c.getCreatedAt() != null && c.getCreatedAt().isAfter(startOfMonth) && c.getCreatedAt().isBefore(endOfMonth))
                    .count();
            
            long thisMonthAppointments = allAppointments.stream()
                    .filter(a -> a.getCreatedAt() != null && a.getCreatedAt().isAfter(startOfMonth) && a.getCreatedAt().isBefore(endOfMonth))
                    .count();
            
            // Build response
            analytics.put("totalCases", totalCases);
            analytics.put("submittedCases", submittedCases);
            analytics.put("draftCases", draftCases);
            analytics.put("thisMonthCases", thisMonthCases);
            analytics.put("casesByStatus", casesByStatus);
            analytics.put("casesByType", casesByType);
            analytics.put("monthlyCases", monthlyCases);
            
            analytics.put("totalAppointments", totalAppointments);
            analytics.put("confirmedAppointments", confirmedAppointments);
            analytics.put("pendingAppointments", pendingAppointments);
            analytics.put("rejectedAppointments", rejectedAppointments);
            analytics.put("thisMonthAppointments", thisMonthAppointments);
            analytics.put("appointmentsByStatus", appointmentsByStatus);
            analytics.put("monthlyAppointments", monthlyAppointments);
            analytics.put("monthlyConfirmedAppointments", monthlyConfirmedAppointments);
            
            // Confirmation rate
            double confirmationRate = totalAppointments > 0 ? (double) confirmedAppointments / totalAppointments * 100 : 0;
            analytics.put("confirmationRate", confirmationRate);
            
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching analytics: " + e.getMessage()));
        }
    }
}
