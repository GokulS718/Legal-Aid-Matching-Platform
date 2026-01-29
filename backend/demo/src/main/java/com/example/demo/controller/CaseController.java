package com.example.demo.controller;

import com.example.demo.entity.Case;
import com.example.demo.entity.CaseMatch;
import com.example.demo.entity.Lawyer;
import com.example.demo.entity.NGO;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.CaseMatchRepository;
import com.example.demo.repository.CaseRepository;
import com.example.demo.repository.LawyerRepository;
import com.example.demo.repository.NGORepository;
import com.example.demo.repository.CitizenRepository;
import com.example.demo.service.CloudinaryService;
import com.example.demo.util.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cases")
public class CaseController {

    private final CaseRepository caseRepository;
    private final CaseMatchRepository caseMatchRepository;
    private final AppointmentRepository appointmentRepository;
    private final LawyerRepository lawyerRepository;
    private final NGORepository ngoRepository;
    private final CitizenRepository citizenRepository;
    private final JwtUtil jwtUtil;
    private final CloudinaryService cloudinaryService;
    private final com.example.demo.service.MatchingService matchingService;
    private final com.example.demo.service.AuditLogService auditLogService;
    private final com.example.demo.service.EmailService emailService;
    private final ObjectMapper objectMapper;

    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

    public CaseController(CaseRepository caseRepository, CaseMatchRepository caseMatchRepository,
            AppointmentRepository appointmentRepository, LawyerRepository lawyerRepository, NGORepository ngoRepository,
            CitizenRepository citizenRepository,
            JwtUtil jwtUtil, CloudinaryService cloudinaryService,
            com.example.demo.service.MatchingService matchingService,
            com.example.demo.service.AuditLogService auditLogService,
            com.example.demo.service.EmailService emailService,
            ObjectMapper objectMapper) {
        this.caseRepository = caseRepository;
        this.caseMatchRepository = caseMatchRepository;
        this.appointmentRepository = appointmentRepository;
        this.lawyerRepository = lawyerRepository;
        this.ngoRepository = ngoRepository;
        this.citizenRepository = citizenRepository;
        this.jwtUtil = jwtUtil;
        this.cloudinaryService = cloudinaryService;
        this.matchingService = matchingService;
        this.auditLogService = auditLogService;
        this.emailService = emailService;
        this.objectMapper = objectMapper;
    }

    // Extract userId from JWT token
    private Integer extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        try {
            return jwtUtil.extractClaim(token, claims -> claims.get("userId", Integer.class));
        } catch (Exception e) {
            return null;
        }
    }

    // Extract role from JWT token
    private String extractUserRole(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        try {
            return jwtUtil.extractRole(token);
        } catch (Exception e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private ResponseEntity<?> resultForProvider(Case caseEntity) {
        try {
            if (Boolean.TRUE.equals(caseEntity.getDocumentsSharedWithProviders())) {
                return ResponseEntity.ok(caseEntity);
            }
            Map<String, Object> map = objectMapper.convertValue(caseEntity, Map.class);
            map.put("documentsUrl", null);
            return ResponseEntity.ok(map);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error serializing case");
        }
    }

    // Save step data (creates new case or updates existing draft)
    @PostMapping("/save-step")
    public ResponseEntity<?> saveStep(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> requestData) {
        try {
            Integer citizenId = extractUserId(authHeader);
            System.out.println("DEBUG: saveStep - Auth User ID: " + citizenId); // DEBUG LOG

            if (citizenId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }

            Integer step = (Integer) requestData.get("step");
            Long caseId = requestData.get("caseId") != null ? Long.valueOf(requestData.get("caseId").toString()) : null;
            System.out.println("DEBUG: saveStep - Received CaseID: " + caseId + ", Step: " + step); // DEBUG LOG

            Case caseEntity;

            // If caseId provided, update that case; otherwise find latest draft or create
            // new
            if (caseId != null) {
                Optional<Case> existingCase = caseRepository.findByIdAndCitizenId(caseId, citizenId);
                if (existingCase.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Case not found");
                }
                caseEntity = existingCase.get();
            } else {
                // Find latest draft case for this user or create new
                Optional<Case> draftCase = caseRepository
                        .findFirstByCitizenIdAndIsSubmittedFalseOrderByUpdatedAtDesc(citizenId);
                caseEntity = draftCase.orElseGet(() -> {
                    Case newCase = new Case();
                    newCase.setCitizenId(citizenId);
                    return newCase;
                });
            }

            // Update fields based on step
            updateCaseFields(caseEntity, step, requestData);
            caseEntity.setCurrentStep(step);

            Case saved = caseRepository.save(caseEntity);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Step " + step + " saved successfully");
            response.put("caseId", saved.getId());
            response.put("caseNumber", saved.getCaseNumber());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error saving step: " + e.getMessage());
        }
    }

    // Submit final case
    @PostMapping("/submit")
    public ResponseEntity<?> submitCase(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> requestData,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            Integer citizenId = extractUserId(authHeader);
            if (citizenId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }

            Long caseId = requestData.get("caseId") != null ? Long.valueOf(requestData.get("caseId").toString()) : null;

            Case caseEntity;
            if (caseId != null) {
                Optional<Case> existingCase = caseRepository.findByIdAndCitizenId(caseId, citizenId);
                if (existingCase.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Case not found");
                }
                caseEntity = existingCase.get();
            } else {
                Optional<Case> draftCase = caseRepository
                        .findFirstByCitizenIdAndIsSubmittedFalseOrderByUpdatedAtDesc(citizenId);
                if (draftCase.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No draft case found");
                }
                caseEntity = draftCase.get();
            }

            caseEntity.setIsSubmitted(true);
            caseEntity.setStatus("SUBMITTED");
            caseEntity.setCurrentStep(7);

            Case saved = caseRepository.save(caseEntity);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Case submitted successfully");
            response.put("caseId", saved.getId());
            response.put("caseNumber", saved.getCaseNumber());

            // Log Audit
            String token = authHeader.substring(7);
            String email = jwtUtil.extractEmail(token);
            String ip = request.getRemoteAddr();
            
            auditLogService.logAction(
                email, 
                "CITIZEN",
                "Submitted Case",
                "Case Management",
                "Submitted new case: " + saved.getCaseNumber(),
                ip
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error submitting case: " + e.getMessage());
        }
    }

    // Get all cases for logged-in user
    @GetMapping("/my-cases")
    public ResponseEntity<?> getMyCases(@RequestHeader("Authorization") String authHeader) {
        try {
            Integer citizenId = extractUserId(authHeader);
            if (citizenId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }

            System.out.println("DEBUG: [VERBOSE] Entering getMyCases for CitizenID: " + citizenId);

            // Debug: Print ALL cases for this citizen with details
            List<Case> allCases = caseRepository.findByCitizenIdOrderByUpdatedAtDesc(citizenId);
            System.out.println("DEBUG: [VERBOSE] Found " + allCases.size() + " total cases for citizen " + citizenId);
            for (Case c : allCases) {
                System.out.println("   -> Case ID: " + c.getId() + ", Number: " + c.getCaseNumber() + ", Title: "
                        + c.getCaseTitle() + ", Submitted: " + c.getIsSubmitted());
            }

            return ResponseEntity.ok(allCases);

        } catch (Exception e) {
            System.err.println("DEBUG: CaseController ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching cases: " + e.getMessage());
        }
    }

    // Get current draft case (for resuming)
    @GetMapping("/draft")
    public ResponseEntity<?> getDraftCase(@RequestHeader("Authorization") String authHeader) {
        try {
            Integer citizenId = extractUserId(authHeader);
            if (citizenId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }

            Optional<Case> draftCase = caseRepository
                    .findFirstByCitizenIdAndIsSubmittedFalseOrderByUpdatedAtDesc(citizenId);
            if (draftCase.isEmpty()) {
                return ResponseEntity.ok(null);
            }
            return ResponseEntity.ok(draftCase.get());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching draft: " + e.getMessage());
        }
    }

    // Start a new case (clears any existing draft behavior)
    @PostMapping("/new")
    public ResponseEntity<?> startNewCase(@RequestHeader("Authorization") String authHeader) {
        try {
            Integer citizenId = extractUserId(authHeader);
            if (citizenId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }

            Case newCase = new Case();
            newCase.setCitizenId(citizenId);
            Case saved = caseRepository.save(newCase);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "New case started");
            response.put("caseId", saved.getId());
            response.put("caseNumber", saved.getCaseNumber());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating case: " + e.getMessage());
        }
    }

    @GetMapping("/debug/all")
    public ResponseEntity<?> getAllCasesDebug() {
        System.out.println("DEBUG: [VERBOSE] Entering getAllCasesDebug");
        List<Case> all = caseRepository.findAll();
        System.out.println("DEBUG: [VERBOSE] Returning " + all.size() + " cases from DB");
        return ResponseEntity.ok(all);
    }

    // Get case by ID (owner OR admin)
    @GetMapping("/{id}")
    public ResponseEntity<?> getCaseById(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        try {
            Integer userId = extractUserId(authHeader);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }

            String role = extractUserRole(authHeader);
            Optional<Case> caseOpt = caseRepository.findById(id);
            if (caseOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Case not found");
            }
            Case caseEntity = caseOpt.get();

            if ("ADMIN".equalsIgnoreCase(role)) {
                return ResponseEntity.ok(caseEntity);
            }
            if ("CITIZEN".equalsIgnoreCase(role)) {
                if (caseEntity.getCitizenId().equals(userId)) {
                    return ResponseEntity.ok(caseEntity);
                }
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
            }
            // Lawyer or NGO: allow if they have ACCEPTED CaseMatch or CONFIRMED appointment for this case
            if ("LAWYER".equalsIgnoreCase(role) || "NGO".equalsIgnoreCase(role)) {
                List<CaseMatch> accepted = caseMatchRepository.findByCaseIdAndStatus(id, "ACCEPTED");
                boolean hasAccepted = accepted.stream()
                        .anyMatch(m -> m.getProviderId().equals(userId) && m.getProviderRole().equalsIgnoreCase(role));
                if (hasAccepted) {
                    return resultForProvider(caseEntity);
                }
                List<com.example.demo.entity.Appointment> confirmedForCase = appointmentRepository
                        .findByCaseIdAndProviderIdAndProviderRoleAndStatusConfirmed(id, userId, role);
                if (!confirmedForCase.isEmpty()) {
                    return resultForProvider(caseEntity);
                }
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
            }

            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching case: " + e.getMessage());
        }
    }

    // Get matched lawyers and NGOs for a case
    @GetMapping("/{id}/matches")
    public ResponseEntity<?> getMatches(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        try {
            Integer userId = extractUserId(authHeader);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }

            // Check if user has access to this case (own citizenId OR admin/provider)
            Optional<Case> caseEntity = caseRepository.findById(id);
            if (caseEntity.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Case not found");
            }

            // Simple security: for now, only the citizen who created the case can view
            // matches
            // (Or we can allow matched providers to view later if needed)
            if (!caseEntity.get().getCitizenId().equals(userId)) {
                // Check if it's an admin
                String role = extractUserRole(authHeader);
                if (!"ADMIN".equalsIgnoreCase(role)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
                }
            }

            return ResponseEntity.ok(matchingService.findMatchesForCase(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching matches: " + e.getMessage());
        }
    }

    @GetMapping("/{caseId}/assigned")
    public ResponseEntity<?> getAssignedProviders(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long caseId) {
        try {
            Integer userId = extractUserId(authHeader);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }
            Optional<Case> caseOpt = caseRepository.findById(caseId);
            if (caseOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Case not found");
            }
            Case c = caseOpt.get();
            if (!c.getCitizenId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
            }
            List<CaseMatch> accepted = caseMatchRepository.findByCaseIdAndStatus(caseId, "ACCEPTED");
            List<Map<String, Object>> result = new ArrayList<>();
            for (CaseMatch m : accepted) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("matchId", m.getId());
                entry.put("providerId", m.getProviderId());
                entry.put("providerRole", m.getProviderRole());
                String name = "Unknown";
                String specializationOrType = null;
                String city = null;
                String state = null;
                if ("LAWYER".equalsIgnoreCase(m.getProviderRole())) {
                    Optional<Lawyer> l = lawyerRepository.findById(m.getProviderId());
                    if (l.isPresent()) {
                        name = l.get().getFullName();
                        specializationOrType = l.get().getSpecialization();
                        city = l.get().getCity();
                        state = l.get().getState();
                    }
                } else {
                    Optional<NGO> n = ngoRepository.findById(m.getProviderId());
                    if (n.isPresent()) {
                        name = n.get().getNgoName();
                        specializationOrType = n.get().getNgoType();
                        city = n.get().getCity();
                        state = n.get().getState();
                    }
                }
                entry.put("providerName", name);
                if (specializationOrType != null) entry.put("specializationOrType", specializationOrType);
                if (city != null) entry.put("city", city);
                if (state != null) entry.put("state", state);
                result.add(entry);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching assigned providers: " + e.getMessage());
        }
    }

    @PostMapping("/{caseId}/assign")
    public ResponseEntity<?> assignCase(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long caseId,
            @RequestBody Map<String, Object> body,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            Integer userId = extractUserId(authHeader);
            String role = extractUserRole(authHeader);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }
            if (!"LAWYER".equalsIgnoreCase(role) && !"NGO".equalsIgnoreCase(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only lawyers or NGOs can take a case");
            }
            Long appointmentId = body.get("appointmentId") != null ? Long.valueOf(body.get("appointmentId").toString()) : null;
            if (appointmentId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("appointmentId required");
            }
            Optional<com.example.demo.entity.Appointment> apptOpt = appointmentRepository.findById(appointmentId);
            if (apptOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Appointment not found");
            }
            com.example.demo.entity.Appointment appt = apptOpt.get();
            if (!appt.getProviderId().equals(userId) || !appt.getProviderRole().equalsIgnoreCase(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not the provider of this appointment");
            }
            if (!"CONFIRMED".equalsIgnoreCase(appt.getStatus())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Appointment must be CONFIRMED before taking the case");
            }
            if (appt.getCaseId() == null || !appt.getCaseId().equals(caseId)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Appointment is not linked to this case");
            }
            Optional<CaseMatch> existing = caseMatchRepository.findByCaseIdAndProviderIdAndProviderRole(caseId, userId, role);
            CaseMatch match;
            if (existing.isPresent()) {
                match = existing.get();
                if ("ACCEPTED".equals(match.getStatus())) {
                    return ResponseEntity.ok(match);
                }
            } else {
                match = new CaseMatch(caseId, userId, role, 1.0);
            }
            match.setStatus("ACCEPTED");
            match.setAppointmentId(appointmentId);
            caseMatchRepository.save(match);

            // Log Audit
            try {
                String token = authHeader.substring(7);
                String email = jwtUtil.extractEmail(token);
                String ip = request.getRemoteAddr();
                Optional<Case> cOpt = caseRepository.findById(caseId);
                String caseNum = cOpt.map(Case::getCaseNumber).orElse(String.valueOf(caseId));

                auditLogService.logAction(
                    email,
                    role, // LAWYER or NGO
                    "Case Accepted",
                    "Case Management",
                    "Accepted case assignment: " + caseNum,
                    ip
                );
            } catch (Exception e) {
                System.err.println("Audit log failed: " + e.getMessage());
            }

            return ResponseEntity.ok(match);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error assigning case: " + e.getMessage());
        }
    }

    @GetMapping("/assigned/mine")
    public ResponseEntity<?> getMyAssignedCases(
            @RequestHeader("Authorization") String authHeader) {
        try {
            Integer userId = extractUserId(authHeader);
            String role = extractUserRole(authHeader);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }
            if (!"LAWYER".equalsIgnoreCase(role) && !"NGO".equalsIgnoreCase(role)) {
                return ResponseEntity.ok(List.of());
            }
            List<CaseMatch> accepted = caseMatchRepository.findByProviderIdAndProviderRoleAndStatus(userId, role, "ACCEPTED");
            List<Map<String, Object>> result = accepted.stream().map(m -> {
                Map<String, Object> e = new HashMap<>();
                e.put("matchId", m.getId());
                e.put("caseId", m.getCaseId());
                e.put("appointmentId", m.getAppointmentId());
                return e;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching assigned cases: " + e.getMessage());
        }
    }

    @PostMapping("/{caseId}/unassign")
    public ResponseEntity<?> unassignCase(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long caseId,
            @RequestBody Map<String, Object> body) {
        try {
            Integer userId = extractUserId(authHeader);
            String role = extractUserRole(authHeader);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }
            Optional<Case> caseOpt = caseRepository.findById(caseId);
            if (caseOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Case not found");
            }
            Case c = caseOpt.get();
            Long matchId = body.get("matchId") != null ? Long.valueOf(body.get("matchId").toString()) : null;
            Integer providerId = body.get("providerId") != null ? Integer.valueOf(body.get("providerId").toString()) : null;
            String providerRole = body.get("providerRole") != null ? body.get("providerRole").toString() : null;

            CaseMatch match = null;
            if (matchId != null) {
                Optional<CaseMatch> m = caseMatchRepository.findById(matchId);
                if (m.isPresent() && m.get().getCaseId().equals(caseId)) {
                    match = m.get();
                }
            } else if (providerId != null && providerRole != null) {
                match = caseMatchRepository.findByCaseIdAndProviderIdAndProviderRole(caseId, providerId, providerRole).orElse(null);
            }
            if (match == null || !"ACCEPTED".equals(match.getStatus())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Assignment not found or not active");
            }
            boolean isCitizen = c.getCitizenId().equals(userId);
            boolean isProvider = match.getProviderId().equals(userId) && match.getProviderRole().equalsIgnoreCase(role);
            if (!isCitizen && !isProvider) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only the citizen or the assigned provider can cancel");
            }
            
            // Get cancellation reason
            String reason = body.get("reason") != null ? body.get("reason").toString() : "No reason provided";
            
            // Get provider details for email
            String providerEmail = "";
            String providerName = "";
            String citizenName = "";
            String citizenEmail = "";
            
            if ("LAWYER".equalsIgnoreCase(match.getProviderRole())) {
                Optional<Lawyer> lawyerOpt = lawyerRepository.findById(match.getProviderId());
                if (lawyerOpt.isPresent()) {
                    Lawyer lawyer = lawyerOpt.get();
                    providerEmail = lawyer.getEmail();
                    providerName = lawyer.getFullName();
                }
            } else if ("NGO".equalsIgnoreCase(match.getProviderRole())) {
                Optional<NGO> ngoOpt = ngoRepository.findById(match.getProviderId());
                if (ngoOpt.isPresent()) {
                    NGO ngo = ngoOpt.get();
                    providerEmail = ngo.getEmail();
                    providerName = ngo.getNgoName();
                }
            }
            
            // Get citizen details
            Optional<com.example.demo.entity.Citizen> citizenOpt = citizenRepository.findById(c.getCitizenId());
            if (citizenOpt.isPresent()) {
                com.example.demo.entity.Citizen citizen = citizenOpt.get();
                citizenName = citizen.getFullName() != null ? citizen.getFullName() : "Citizen";
                citizenEmail = citizen.getEmail() != null ? citizen.getEmail() : "";
            }
            
            // Update match status
            match.setStatus("CANCELLED");
            caseMatchRepository.save(match);
            
            // Send email notification to provider
            if (!providerEmail.isEmpty() && !providerName.isEmpty()) {
                try {
                    emailService.sendCaseCancellationEmail(
                        providerEmail,
                        providerName,
                        match.getProviderRole(),
                        citizenName,
                        c.getCaseNumber(),
                        c.getCaseTitle(),
                        reason
                    );
                } catch (Exception e) {
                    System.err.println("Failed to send cancellation email: " + e.getMessage());
                    // Don't fail the request if email fails
                }
            }
            
            return ResponseEntity.ok(Map.of("message", "Assignment cancelled", "matchId", match.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error unassigning case: " + e.getMessage());
        }
    }

    // Upload documents endpoint
    @PostMapping("/upload-documents")
    public ResponseEntity<?> uploadDocuments(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("caseId") Long caseId,
            @RequestParam("documents") MultipartFile[] documents) {
        try {
            Integer citizenId = extractUserId(authHeader);
            if (citizenId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }

            Optional<Case> existingCase = caseRepository.findByIdAndCitizenId(caseId, citizenId);
            if (existingCase.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Case not found");
            }

            List<String> uploadedUrls = new ArrayList<>();
            List<String> errors = new ArrayList<>();

            for (MultipartFile file : documents) {
                // Validate file size (2MB max)
                if (file.getSize() > MAX_FILE_SIZE) {
                    errors.add(file.getOriginalFilename() + ": File size exceeds 2MB limit");
                    continue;
                }

                // Validate file type
                String contentType = file.getContentType();
                if (contentType == null || (!contentType.equals("application/pdf")
                        && !contentType.startsWith("image/"))) {
                    errors.add(file.getOriginalFilename() + ": Only PDF and image files allowed");
                    continue;
                }

                try {
                    String url;
                    if (contentType.equals("application/pdf")) {
                        url = cloudinaryService.uploadFile(file, "cases/" + caseId + "/documents");
                    } else {
                        url = cloudinaryService.uploadImage(file, "cases/" + caseId + "/documents");
                    }
                    uploadedUrls.add(url);
                } catch (Exception e) {
                    errors.add(file.getOriginalFilename() + ": Upload failed - " + e.getMessage());
                }
            }

            // Update case with document URLs
            Case caseEntity = existingCase.get();
            String existingUrls = caseEntity.getDocumentsUrl();
            String newUrls = String.join(",", uploadedUrls);
            if (existingUrls != null && !existingUrls.isEmpty()) {
                caseEntity.setDocumentsUrl(existingUrls + "," + newUrls);
            } else {
                caseEntity.setDocumentsUrl(newUrls);
            }
            caseRepository.save(caseEntity);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Documents uploaded");
            response.put("uploadedUrls", uploadedUrls);
            response.put("errors", errors);
            response.put("documentsUrl", caseEntity.getDocumentsUrl());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading documents: " + e.getMessage());
        }
    }

    // Update case status (mark as completed/pending)
    @PutMapping("/{caseId}/status")
    public ResponseEntity<?> updateCaseStatus(
            @PathVariable Long caseId,
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String authHeader,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            Integer citizenId = extractUserId(authHeader);
            if (citizenId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }

            Case caseEntity = caseRepository.findById(caseId).orElse(null);
            if (caseEntity == null || !caseEntity.getCitizenId().equals(citizenId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Case not found");
            }

            String newStatus = body.get("status");
            if (newStatus != null) {
                caseEntity.setStatus(newStatus);
                caseRepository.save(caseEntity);

                // Log Audit
                try {
                    String token = authHeader.substring(7);
                    String email = jwtUtil.extractEmail(token);
                    String ip = request.getRemoteAddr();
                    
                    auditLogService.logAction(
                        email,
                        "CITIZEN",
                        "Case Resolution",
                        "Case Management",
                        "Updated case " + caseEntity.getCaseNumber() + " status to " + newStatus,
                        ip
                    );
                } catch (Exception e) {
                    System.err.println("Audit log failed: " + e.getMessage());
                }
            }

            return ResponseEntity.ok(caseEntity);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating status: " + e.getMessage());
        }
    }

    @PatchMapping("/{caseId}/documents-visibility")
    public ResponseEntity<?> updateDocumentsVisibility(
            @PathVariable Long caseId,
            @RequestBody Map<String, Object> body,
            @RequestHeader("Authorization") String authHeader) {
        try {
            Integer userId = extractUserId(authHeader);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }
            String role = extractUserRole(authHeader);
            if (!"CITIZEN".equalsIgnoreCase(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only the case owner can update document visibility");
            }
            Case c = caseRepository.findById(caseId).orElse(null);
            if (c == null || !c.getCitizenId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Case not found");
            }
            Object v = body.get("documentsSharedWithProviders");
            if (v != null) {
                boolean shared = Boolean.TRUE.equals(v) || "true".equalsIgnoreCase(v.toString());
                c.setDocumentsSharedWithProviders(shared);
                caseRepository.save(c);
            }
            return ResponseEntity.ok(c);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating document visibility: " + e.getMessage());
        }
    }

    private void updateCaseFields(Case caseEntity, Integer step, Map<String, Object> data) {
        switch (step) {
            case 0: // Applicant Details
                if (data.get("applicantName") != null)
                    caseEntity.setApplicantName(data.get("applicantName").toString());
                if (data.get("email") != null)
                    caseEntity.setEmail(data.get("email").toString());
                if (data.get("mobile") != null)
                    caseEntity.setMobile(data.get("mobile").toString());
                if (data.get("aadhaar") != null)
                    caseEntity.setAadhaar(data.get("aadhaar").toString());
                break;
            case 1: // Victim Details
                if (data.get("victimName") != null)
                    caseEntity.setVictimName(data.get("victimName").toString());
                if (data.get("relation") != null)
                    caseEntity.setRelation(data.get("relation").toString());
                if (data.get("victimGender") != null)
                    caseEntity.setVictimGender(data.get("victimGender").toString());
                if (data.get("victimAge") != null)
                    caseEntity.setVictimAge(Integer.valueOf(data.get("victimAge").toString()));
                break;
            case 2: // Case Details
                if (data.get("caseTitle") != null)
                    caseEntity.setCaseTitle(data.get("caseTitle").toString());
                if (data.get("caseType") != null)
                    caseEntity.setCaseType(data.get("caseType").toString());
                break;
            case 3: // Incident Details
                if (data.get("incidentDate") != null)
                    caseEntity.setIncidentDate(LocalDate.parse(data.get("incidentDate").toString()));
                if (data.get("incidentPlace") != null)
                    caseEntity.setIncidentPlace(data.get("incidentPlace").toString());
                if (data.get("urgency") != null)
                    caseEntity.setUrgency(data.get("urgency").toString());
                break;
            case 4: // Legal Preference
                if (data.get("specialization") != null)
                    caseEntity.setSpecialization(data.get("specialization").toString());
                if (data.get("courtType") != null)
                    caseEntity.setCourtType(data.get("courtType").toString());
                if (data.get("seekingNgoHelp") != null)
                    caseEntity.setSeekingNgoHelp(data.get("seekingNgoHelp").toString());
                if (data.get("ngoType") != null)
                    caseEntity.setNgoType(data.get("ngoType").toString());
                break;
            case 5: // Case Explanation
                if (data.get("background") != null)
                    caseEntity.setBackground(data.get("background").toString());
                if (data.get("relief") != null)
                    caseEntity.setRelief(data.get("relief").toString());
                break;
            case 6: // Documents
                if (data.get("documentsUrl") != null)
                    caseEntity.setDocumentsUrl(data.get("documentsUrl").toString());
                break;
        }
    }
    // ================= PROVIDER MY CASES (LAWYER / NGO) =================
@GetMapping("/provider/mycases")
public ResponseEntity<?> getProviderMyCases(
        @RequestHeader("Authorization") String authHeader) {

    try {
        Integer userId = extractUserId(authHeader);
        String role = extractUserRole(authHeader);

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }

        if (!"LAWYER".equalsIgnoreCase(role) && !"NGO".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only lawyer or NGO can access this");
        }

        List<CaseMatch> acceptedMatches =
                caseMatchRepository.findByProviderIdAndProviderRoleAndStatus(
                        userId, role, "ACCEPTED");

        if (acceptedMatches.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<Long> caseIds = acceptedMatches.stream()
                .map(CaseMatch::getCaseId)
                .collect(Collectors.toList());

        List<Case> cases = caseRepository.findByIdIn(caseIds);

        return ResponseEntity.ok(cases);

    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching provider cases: " + e.getMessage());
    }
}

}
