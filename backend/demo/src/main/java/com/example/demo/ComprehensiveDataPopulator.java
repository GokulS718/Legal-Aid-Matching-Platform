package com.example.demo;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

//@Component
//@Order(4) // Run after CaseDataPopulator
public class ComprehensiveDataPopulator implements CommandLineRunner {

    private final CaseRepository caseRepository;
    private final CaseMatchRepository caseMatchRepository;
    private final LawyerRepository lawyerRepository;
    private final NGORepository ngoRepository;
    private final CitizenRepository citizenRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AppointmentRepository appointmentRepository;
    private final NotificationRepository notificationRepository;
    private final AdminRepository adminRepository;
    private final Random random = new Random();

    // Sample messages for chat
    private final List<String> greetingMessages = Arrays.asList(
            "Hello, I need help with my case.",
            "Good morning, I would like to discuss my legal matter.",
            "Hi, can you assist me with this case?",
            "Hello, I'm seeking legal advice.",
            "Good day, I need consultation regarding my case."
    );

    private final List<String> responseMessages = Arrays.asList(
            "Hello! I'd be happy to help you with your case. Can you provide more details?",
            "Thank you for reaching out. Let me review your case details.",
            "I understand your concern. Let's discuss this further.",
            "I can assist you with this matter. Please share more information.",
            "Thank you for contacting me. I'll review your case and get back to you."
    );

    private final List<String> followUpMessages = Arrays.asList(
            "I have reviewed your case. We can proceed with the next steps.",
            "Based on the information provided, I recommend the following approach.",
            "I need some additional documents to proceed with your case.",
            "The case looks strong. We should file the necessary paperwork.",
            "I'll prepare the required documentation for your case."
    );

    public ComprehensiveDataPopulator(
            CaseRepository caseRepository,
            CaseMatchRepository caseMatchRepository,
            LawyerRepository lawyerRepository,
            NGORepository ngoRepository,
            CitizenRepository citizenRepository,
            ChatSessionRepository chatSessionRepository,
            ChatMessageRepository chatMessageRepository,
            AppointmentRepository appointmentRepository,
            NotificationRepository notificationRepository,
            AdminRepository adminRepository) {
        this.caseRepository = caseRepository;
        this.caseMatchRepository = caseMatchRepository;
        this.lawyerRepository = lawyerRepository;
        this.ngoRepository = ngoRepository;
        this.citizenRepository = citizenRepository;
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.appointmentRepository = appointmentRepository;
        this.notificationRepository = notificationRepository;
        this.adminRepository = adminRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        System.out.println("🔗 Populating comprehensive data with relationships...");

        // 1. Create CaseMatches for submitted cases
        populateCaseMatches();

        // 2. Create ChatSessions for some matched cases
        populateChatSessions();

        // 3. Create ChatMessages for active sessions
        populateChatMessages();

        // 4. Create Appointments
        populateAppointments();

        // 5. Create Notifications
        populateNotifications();

        // 6. Create Admin users
        populateAdmins();

        System.out.println("✅ Comprehensive data population completed!");
    }

    private void populateCaseMatches() {
        System.out.println("  📊 Creating case matches...");
        
        List<Case> submittedCases = caseRepository.findAll().stream()
                .filter(c -> c.getIsSubmitted() != null && c.getIsSubmitted())
                .collect(Collectors.toList());

        if (submittedCases.isEmpty()) {
            System.out.println("    ⚠️  No submitted cases found. Skipping case matches.");
            return;
        }

        List<Lawyer> lawyers = lawyerRepository.findAll();
        List<NGO> ngos = ngoRepository.findAll();

        int matchesCreated = 0;

        for (Case caseEntity : submittedCases) {
            try {
                // Match with lawyers based on specialization
                if (caseEntity.getSpecialization() != null && !lawyers.isEmpty()) {
                    List<Lawyer> matchedLawyers = lawyers.stream()
                            .filter(l -> caseEntity.getSpecialization().equalsIgnoreCase(l.getSpecialization()))
                            .limit(2 + random.nextInt(3)) // 2-4 matches per case
                            .collect(Collectors.toList());

                    for (Lawyer lawyer : matchedLawyers) {
                        if (caseMatchRepository
                                .findByCaseIdAndProviderIdAndProviderRole(caseEntity.getId(), lawyer.getId(), "LAWYER")
                                .isEmpty()) {
                            CaseMatch match = new CaseMatch();
                            match.setCaseId(caseEntity.getId());
                            match.setProviderId(lawyer.getId());
                            match.setProviderRole("LAWYER");
                            match.setMatchScore(0.7 + random.nextDouble() * 0.3); // Score between 0.7-1.0
                            match.setStatus("SUGGESTED");
                            match.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(30)));
                            caseMatchRepository.save(match);
                            matchesCreated++;
                        }
                    }
                }

                // Match with NGOs based on ngoType
                if (caseEntity.getSeekingNgoHelp() != null && "YES".equalsIgnoreCase(caseEntity.getSeekingNgoHelp())
                        && caseEntity.getNgoType() != null && !ngos.isEmpty()) {
                    List<NGO> matchedNgos = ngos.stream()
                            .filter(n -> caseEntity.getNgoType().equalsIgnoreCase(n.getNgoType()))
                            .limit(1 + random.nextInt(2)) // 1-2 matches per case
                            .collect(Collectors.toList());

                    for (NGO ngo : matchedNgos) {
                        if (caseMatchRepository
                                .findByCaseIdAndProviderIdAndProviderRole(caseEntity.getId(), ngo.getId(), "NGO")
                                .isEmpty()) {
                            CaseMatch match = new CaseMatch();
                            match.setCaseId(caseEntity.getId());
                            match.setProviderId(ngo.getId());
                            match.setProviderRole("NGO");
                            match.setMatchScore(0.7 + random.nextDouble() * 0.3);
                            match.setStatus("SUGGESTED");
                            match.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(30)));
                            caseMatchRepository.save(match);
                            matchesCreated++;
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("    ✗ Failed to create matches for case " + caseEntity.getId() + ": " + e.getMessage());
            }
        }

        System.out.println("    ✓ Created " + matchesCreated + " case matches");
    }

    private void populateChatSessions() {
        System.out.println("  💬 Creating chat sessions...");
        
        List<CaseMatch> matches = caseMatchRepository.findAll();
        if (matches.isEmpty()) {
            System.out.println("    ⚠️  No case matches found. Skipping chat sessions.");
            return;
        }

        // Create sessions for 30% of matches
        int sessionsToCreate = Math.min(matches.size(), (int) (matches.size() * 0.3));
        List<CaseMatch> selectedMatches = matches.stream()
                .limit(sessionsToCreate)
                .collect(Collectors.toList());

        int sessionsCreated = 0;

        for (CaseMatch match : selectedMatches) {
            try {
                Optional<Case> caseOpt = caseRepository.findById(match.getCaseId());
                if (caseOpt.isEmpty()) continue;

                Case caseEntity = caseOpt.get();
                
                // Check if session already exists
                if (chatSessionRepository
                        .findByCaseIdAndCitizenIdAndProviderIdAndProviderRole(
                                match.getCaseId(), caseEntity.getCitizenId(), match.getProviderId(),
                                match.getProviderRole())
                        .isPresent()) {
                    continue;
                }

                ChatSession session = new ChatSession();
                session.setCaseId(match.getCaseId());
                session.setCitizenId(caseEntity.getCitizenId());
                session.setProviderId(match.getProviderId());
                session.setProviderRole(match.getProviderRole());
                session.setStatus("ACTIVE");

                // Set provider name
                if ("LAWYER".equals(match.getProviderRole())) {
                    lawyerRepository.findById(match.getProviderId())
                            .ifPresent(l -> session.setProviderName(l.getFullName()));
                } else if ("NGO".equals(match.getProviderRole())) {
                    ngoRepository.findById(match.getProviderId())
                            .ifPresent(n -> session.setProviderName(n.getNgoName()));
                }

                // Set citizen name
                citizenRepository.findById(caseEntity.getCitizenId())
                        .ifPresent(c -> session.setCitizenName(c.getFullName()));

                session.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(20)));
                session.setUpdatedAt(LocalDateTime.now().minusDays(random.nextInt(5)));

                chatSessionRepository.save(session);
                sessionsCreated++;
            } catch (Exception e) {
                System.err.println("    ✗ Failed to create chat session: " + e.getMessage());
            }
        }

        System.out.println("    ✓ Created " + sessionsCreated + " chat sessions");
    }

    private void populateChatMessages() {
        System.out.println("  📨 Creating chat messages...");
        
        List<ChatSession> sessions = chatSessionRepository.findAll();
        if (sessions.isEmpty()) {
            System.out.println("    ⚠️  No chat sessions found. Skipping messages.");
            return;
        }

        int messagesCreated = 0;

        for (ChatSession session : sessions) {
            try {
                // Create 3-8 messages per session
                int messageCount = 3 + random.nextInt(6);
                LocalDateTime baseTime = session.getCreatedAt();

                for (int i = 0; i < messageCount; i++) {
                    ChatMessage message = new ChatMessage();
                    message.setSessionId(session.getId());

                    // Alternate between citizen and provider
                    boolean isFromCitizen = (i % 2 == 0);
                    if (isFromCitizen) {
                        message.setSenderId(session.getCitizenId());
                        message.setSenderRole("CITIZEN");
                    } else {
                        message.setSenderId(session.getProviderId());
                        message.setSenderRole(session.getProviderRole());
                    }

                    // Set message content
                    if (i == 0) {
                        message.setContent(greetingMessages.get(random.nextInt(greetingMessages.size())));
                    } else if (i == 1 && !isFromCitizen) {
                        message.setContent(responseMessages.get(random.nextInt(responseMessages.size())));
                    } else {
                        message.setContent(followUpMessages.get(random.nextInt(followUpMessages.size())));
                    }

                    message.setTimestamp(baseTime.plusMinutes(5 + i * 10));
                    message.setRead(i < messageCount - 1); // Last message is unread
                    message.setDeleted(false);
                    message.setEdited(false);

                    chatMessageRepository.save(message);
                    messagesCreated++;

                    // Update session with last message info
                    if (i == messageCount - 1) {
                        session.setLastMessageId(message.getId());
                        String preview = message.getContent();
                        if (preview.length() > 50) {
                            preview = preview.substring(0, 47) + "...";
                        }
                        session.setLastMessagePreview(preview);
                        session.setLastMessageTime(message.getTimestamp());
                        session.setUnreadCount(isFromCitizen ? 0 : 1);
                        chatSessionRepository.save(session);
                    }
                }
            } catch (Exception e) {
                System.err.println("    ✗ Failed to create messages for session " + session.getId() + ": " + e.getMessage());
            }
        }

        System.out.println("    ✓ Created " + messagesCreated + " chat messages");
    }

    private void populateAppointments() {
        System.out.println("  📅 Creating appointments...");
        
        List<Citizen> citizens = citizenRepository.findAll();
        List<Lawyer> lawyers = lawyerRepository.findAll();
        List<NGO> ngos = ngoRepository.findAll();

        if (citizens.isEmpty() || (lawyers.isEmpty() && ngos.isEmpty())) {
            System.out.println("    ⚠️  Insufficient data for appointments. Skipping.");
            return;
        }

        List<String> appointmentTypes = Arrays.asList("CALL", "VIDEO_CALL", "MEETING");
        List<String> appointmentStatuses = Arrays.asList("PENDING", "CONFIRMED", "COMPLETED", "CANCELLED");

        int appointmentsCreated = 0;
        int appointmentsToCreate = Math.min(30, citizens.size() * 2);

        for (int i = 0; i < appointmentsToCreate; i++) {
            try {
                Citizen citizen = citizens.get(random.nextInt(citizens.size()));
                Appointment appointment = new Appointment();

                appointment.setRequesterId(citizen.getId());
                appointment.setRequesterRole("CITIZEN");
                appointment.setRequesterName(citizen.getFullName());

                // Randomly choose lawyer or NGO
                boolean useLawyer = random.nextBoolean() && !lawyers.isEmpty();
                if (useLawyer && !lawyers.isEmpty()) {
                    Lawyer lawyer = lawyers.get(random.nextInt(lawyers.size()));
                    appointment.setProviderId(lawyer.getId());
                    appointment.setProviderRole("LAWYER");
                    appointment.setProviderName(lawyer.getFullName());
                } else if (!ngos.isEmpty()) {
                    NGO ngo = ngos.get(random.nextInt(ngos.size()));
                    appointment.setProviderId(ngo.getId());
                    appointment.setProviderRole("NGO");
                    appointment.setProviderName(ngo.getNgoName());
                } else {
                    continue;
                }

                // Set appointment time (between now and 30 days from now)
                LocalDateTime startTime = LocalDateTime.now().plusDays(random.nextInt(30))
                        .plusHours(9 + random.nextInt(8)) // Between 9 AM and 5 PM
                        .withMinute(random.nextBoolean() ? 0 : 30);
                appointment.setStartTime(startTime);
                appointment.setEndTime(startTime.plusHours(1)); // 1 hour duration

                appointment.setType(appointmentTypes.get(random.nextInt(appointmentTypes.size())));
                appointment.setStatus(appointmentStatuses.get(random.nextInt(appointmentStatuses.size())));

                appointment.setDescription("Consultation regarding legal matter. " +
                        "Please confirm your availability for the scheduled time.");

                appointment.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(10)));
                appointment.setUpdatedAt(LocalDateTime.now().minusDays(random.nextInt(3)));

                appointmentRepository.save(appointment);
                appointmentsCreated++;
            } catch (Exception e) {
                System.err.println("    ✗ Failed to create appointment " + (i + 1) + ": " + e.getMessage());
            }
        }

        System.out.println("    ✓ Created " + appointmentsCreated + " appointments");
    }

    private void populateNotifications() {
        System.out.println("  🔔 Creating notifications...");
        
        List<Citizen> citizens = citizenRepository.findAll();
        List<Lawyer> lawyers = lawyerRepository.findAll();
        List<NGO> ngos = ngoRepository.findAll();
        List<Case> cases = caseRepository.findAll();

        int notificationsCreated = 0;

        // Notifications for citizens (case matches, appointments, etc.)
        for (Citizen citizen : citizens) {
            try {
                // Match notification
                List<Case> citizenCases = cases.stream()
                        .filter(c -> c.getCitizenId().equals(citizen.getId()))
                        .collect(Collectors.toList());

                if (!citizenCases.isEmpty() && random.nextDouble() < 0.7) {
                    Case caseEntity = citizenCases.get(random.nextInt(citizenCases.size()));
                    Notification notif = new Notification();
                    notif.setRecipientId(citizen.getId());
                    notif.setRecipientRole("CITIZEN");
                    notif.setMessage("Found " + (2 + random.nextInt(3)) + " matches for your case: " +
                            (caseEntity.getCaseTitle() != null ? caseEntity.getCaseTitle() : caseEntity.getCaseNumber()));
                    notif.setType("MATCH");
                    notif.setReferenceId(caseEntity.getId());
                    notif.setRead(random.nextDouble() < 0.3); // 30% read
                    notif.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(7)));
                    notificationRepository.save(notif);
                    notificationsCreated++;
                }

                // Appointment notification
                if (random.nextDouble() < 0.4) {
                    Notification notif = new Notification();
                    notif.setRecipientId(citizen.getId());
                    notif.setRecipientRole("CITIZEN");
                    notif.setMessage("Your appointment has been " +
                            (random.nextBoolean() ? "confirmed" : "scheduled") + ".");
                    notif.setType("APPOINTMENT");
                    notif.setRead(random.nextDouble() < 0.4);
                    notif.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(5)));
                    notificationRepository.save(notif);
                    notificationsCreated++;
                }
            } catch (Exception e) {
                System.err.println("    ✗ Failed to create notification for citizen " + citizen.getId());
            }
        }

        // Notifications for lawyers
        for (Lawyer lawyer : lawyers) {
            try {
                if (random.nextDouble() < 0.5) {
                    Notification notif = new Notification();
                    notif.setRecipientId(lawyer.getId());
                    notif.setRecipientRole("LAWYER");
                    notif.setMessage("You have a new case match. A citizen is seeking your expertise.");
                    notif.setType("MATCH");
                    notif.setRead(random.nextDouble() < 0.5);
                    notif.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(5)));
                    notificationRepository.save(notif);
                    notificationsCreated++;
                }
            } catch (Exception e) {
                System.err.println("    ✗ Failed to create notification for lawyer " + lawyer.getId());
            }
        }

        // Notifications for NGOs
        for (NGO ngo : ngos) {
            try {
                if (random.nextDouble() < 0.4) {
                    Notification notif = new Notification();
                    notif.setRecipientId(ngo.getId());
                    notif.setRecipientRole("NGO");
                    notif.setMessage("A new case has been matched with your organization.");
                    notif.setType("MATCH");
                    notif.setRead(random.nextDouble() < 0.5);
                    notif.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(5)));
                    notificationRepository.save(notif);
                    notificationsCreated++;
                }
            } catch (Exception e) {
                System.err.println("    ✗ Failed to create notification for NGO " + ngo.getId());
            }
        }

        System.out.println("    ✓ Created " + notificationsCreated + " notifications");
    }

    private void populateAdmins() {
        System.out.println("  👤 Creating admin users...");
        
        long adminCount = adminRepository.count();
        
        if (adminCount >= 3) {
            System.out.println("    ⚠️  Database has sufficient admins (" + adminCount + "). Skipping.");
            return;
        }

        List<String> adminFirstNames = Arrays.asList("Admin", "Super", "System", "Platform");
        List<String> adminLastNames = Arrays.asList("Manager", "Administrator", "Controller", "Officer");

        int adminsToCreate = 3 - (int) adminCount;
        int adminsCreated = 0;

        for (int i = 0; i < adminsToCreate; i++) {
            try {
                String firstName = adminFirstNames.get(random.nextInt(adminFirstNames.size()));
                String lastName = adminLastNames.get(random.nextInt(adminLastNames.size()));
                String fullName = firstName + " " + lastName;

                String email = "admin" + (i + 1) + "@advocare.com";
                if (adminRepository.existsByEmail(email)) {
                    email = "admin" + (i + 1) + "_" + System.currentTimeMillis() + "@advocare.com";
                }

                String aadharNum = "9000" + String.format("%08d", 1000 + i);
                if (adminRepository.existsByAadharNum(aadharNum)) {
                    aadharNum = "9000" + String.format("%08d", 2000 + i);
                }

                Admin admin = new Admin();
                admin.setFullName(fullName);
                admin.setEmail(email);
                admin.setAadharNum(aadharNum);
                admin.setMobileNum("90000" + String.format("%05d", 1000 + i));
                admin.setDateOfBirth(LocalDate.of(1980 + random.nextInt(20), 1 + random.nextInt(12), 1 + random.nextInt(28)));
                admin.setPassword("Admin@123");
                admin.setState("Delhi");
                admin.setDistrict("Delhi");
                admin.setCity("New Delhi");
                admin.setAddress("Admin Office, Legal Aid Platform, New Delhi - 110001");

                adminRepository.save(admin);
                adminsCreated++;
            } catch (Exception e) {
                System.err.println("    ✗ Failed to create admin " + (i + 1) + ": " + e.getMessage());
            }
        }

        System.out.println("    ✓ Created " + adminsCreated + " admin users");
    }
}
