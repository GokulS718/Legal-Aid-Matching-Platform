package com.example.demo.controller;

import com.example.demo.entity.Lawyer;
import com.example.demo.repository.DirectoryEntryRepository;
import com.example.demo.repository.LawyerRepository;
import com.example.demo.service.CloudinaryService;
import com.example.demo.service.LawyerImportService;
import com.example.demo.service.BarCouncilImportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/lawyers")

public class LawyerController {

    private final LawyerRepository lawyerRepository;
    private final CloudinaryService cloudinaryService;
    private final LawyerImportService lawyerImportService;
    private final DirectoryEntryRepository directoryEntryRepository;
    private final BarCouncilImportService barCouncilImportService;
    private final com.example.demo.service.EmailService emailService;
    private final com.example.demo.service.AuditLogService auditLogService;
    private final com.example.demo.service.AppointmentService appointmentService;

    public LawyerController(
            LawyerRepository lawyerRepository,
            CloudinaryService cloudinaryService,
            LawyerImportService lawyerImportService,
            DirectoryEntryRepository directoryEntryRepository,
            BarCouncilImportService barCouncilImportService,
            com.example.demo.service.EmailService emailService,
            com.example.demo.service.AuditLogService auditLogService,
            com.example.demo.service.AppointmentService appointmentService) {
        this.lawyerRepository = lawyerRepository;
        this.cloudinaryService = cloudinaryService;
        this.lawyerImportService = lawyerImportService;
        this.directoryEntryRepository = directoryEntryRepository;
        this.barCouncilImportService = barCouncilImportService;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
        this.appointmentService = appointmentService;
    }

    // Citizens: see all lawyers (verified + unverified)
    @GetMapping
    public org.springframework.data.domain.Page<Lawyer> getAllLawyers(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return lawyerRepository.findAll(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Lawyer> getLawyerById(@PathVariable Integer id) {
        return lawyerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/analytics")
    public ResponseEntity<com.example.demo.dto.LawyerAnalyticsDTO> getLawyerAnalytics(@PathVariable Integer id) {
        return ResponseEntity.ok(appointmentService.getLawyerAnalytics(id));
    }

    // Get simplified lawyer list for comparison dropdown
    @GetMapping("/list")
    public ResponseEntity<List<LawyerSummaryDTO>> getLawyersList(
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String city) {
        List<Lawyer> lawyers;
        if (specialization != null && city != null) {
            lawyers = lawyerRepository.findByCityAndSpecialization(city, specialization);
        } else if (city != null) {
            lawyers = lawyerRepository.findByCity(city);
        } else if (specialization != null) {
            lawyers = lawyerRepository.findBySpecialization(specialization);
        } else {
            lawyers = lawyerRepository.findAll();
        }
        
        List<LawyerSummaryDTO> summaries = lawyers.stream()
                .map(l -> new LawyerSummaryDTO(
                        l.getId(),
                        l.getFullName(),
                        l.getSpecialization(),
                        l.getCity(),
                        l.getState(),
                        l.getExperienceYears(),
                        l.isVerificationStatus()
                ))
                .collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(summaries);
    }

    // Simple DTO for lawyer summary
    public static class LawyerSummaryDTO {
        private Integer id;
        private String fullName;
        private String specialization;
        private String city;
        private String state;
        private Integer experienceYears;
        private boolean verificationStatus;

        public LawyerSummaryDTO(Integer id, String fullName, String specialization, String city, 
                               String state, Integer experienceYears, boolean verificationStatus) {
            this.id = id;
            this.fullName = fullName;
            this.specialization = specialization;
            this.city = city;
            this.state = state;
            this.experienceYears = experienceYears;
            this.verificationStatus = verificationStatus;
        }

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getSpecialization() { return specialization; }
        public void setSpecialization(String specialization) { this.specialization = specialization; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        public Integer getExperienceYears() { return experienceYears; }
        public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
        public boolean isVerificationStatus() { return verificationStatus; }
        public void setVerificationStatus(boolean verificationStatus) { this.verificationStatus = verificationStatus; }
    }

    // Search still returns all; frontend can show badge for verificationStatus
    @GetMapping("/search")
    public List<Lawyer> searchLawyers(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String specialization) {
        if (city != null && specialization != null) {
            return lawyerRepository.findByCityAndSpecialization(city, specialization);
        }
        if (city != null) {
            return lawyerRepository.findByCity(city);
        }
        if (specialization != null) {
            return lawyerRepository.findBySpecialization(specialization);
        }
        return lawyerRepository.findAll();
    }

    @PostMapping("/add")
    public ResponseEntity<?> addLawyer(
            @RequestParam("fullName") String fullName,
            @RequestParam("email") String email,
            @RequestParam("phone") String phone,
            @RequestParam("aadhar") String aadhar,
            @RequestParam(value = "aadharProof", required = false) MultipartFile aadharProof,
            @RequestParam("barId") String rawBarId,
            @RequestParam("barState") String barState,
            @RequestParam("specialization") String specialization,
            @RequestParam(value = "barCert", required = false) MultipartFile barCert,
            @RequestParam("experience") String experience,
            @RequestParam("address") String address,
            @RequestParam("district") String district,
            @RequestParam("city") String city,
            @RequestParam("state") String state,
            @RequestParam(value = "latitude", required = false) String latitude,
            @RequestParam(value = "longitude", required = false) String longitude,
            @RequestParam("password") String password,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            String barId = rawBarId.trim().toUpperCase();
            if (lawyerRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest().body("Email already exists");
            }
            if (lawyerRepository.existsByAadharNum(aadhar)) {
                return ResponseEntity.badRequest().body("Aadhar number already exists");
            }
            if (lawyerRepository.existsByBarCouncilId(barId)) {
                return ResponseEntity.badRequest().body("Bar Council ID already exists");
            }

            Lawyer lawyer = new Lawyer();
            lawyer.setFullName(fullName);
            lawyer.setEmail(email);
            lawyer.setMobileNum(phone);
            lawyer.setAadharNum(aadhar);
            lawyer.setBarCouncilId(barId);
            lawyer.setBarState(barState);
            lawyer.setSpecialization(specialization);
            int expYears = Integer.parseInt(experience);
            lawyer.setExperienceYears(expYears);
            lawyer.setAddress(address);
            lawyer.setDistrict(district);
            lawyer.setCity(city);
            lawyer.setState(state);
            lawyer.setPassword(password);

            if (latitude != null && !latitude.isEmpty()) {
                lawyer.setLatitude(Double.parseDouble(latitude));
            }
            if (longitude != null && !longitude.isEmpty()) {
                lawyer.setLongitude(Double.parseDouble(longitude));
            }

            if (aadharProof != null && !aadharProof.isEmpty()) {
                String url = cloudinaryService.uploadFile(aadharProof, "lawyers/aadhar-proof");
                lawyer.setAadharProofUrl(url);
                lawyer.setAadharProofFilename(aadharProof.getOriginalFilename());
            }

            if (barCert != null && !barCert.isEmpty()) {
                String url = cloudinaryService.uploadFile(barCert, "lawyers/bar-certificates");
                lawyer.setBarCertificateUrl(url);
                lawyer.setBarCertificateFilename(barCert.getOriginalFilename());
            }

            // Check if verified in existing directory (from import)
            boolean verifiedInDirectory = directoryEntryRepository.existsByTypeAndBarCouncilId(
                    "LAWYER",
                    lawyer.getBarCouncilId());
            lawyer.setVerificationStatus(verifiedInDirectory);

            Lawyer savedLawyer = lawyerRepository.save(lawyer);

            // Send Welcome Email
            try {
                emailService.sendWelcomeEmail(savedLawyer.getEmail(), "LAWYER", savedLawyer.getFullName());
            } catch (Exception e) {
                System.err.println("Failed to send welcome email: " + e.getMessage());
            }

            // SYNC TO DIRECTORY
            // Check if entry exists to avoid duplicates or update existing placeholder
            com.example.demo.entity.DirectoryEntry entry = directoryEntryRepository.findByTypeAndBarCouncilId("LAWYER",
                    barId);
            if (entry == null) {
                entry = new com.example.demo.entity.DirectoryEntry();
                entry.setType("LAWYER");
                entry.setBarCouncilId(barId);
                entry.setSource("USER_REGISTRATION");
            }
            // Update fields
            entry.setName(fullName);
            entry.setSpecialization(specialization);
            entry.setExperienceYears(expYears);
            entry.setContactPhone(phone);
            entry.setContactEmail(email);
            entry.setState(state);
            entry.setDistrict(district);
            entry.setCity(city);
            entry.setLatitude(lawyer.getLatitude());
            entry.setLongitude(lawyer.getLongitude());
            entry.setOriginalId(savedLawyer.getId());
            entry.setVerified(verifiedInDirectory);
            entry.setApproved(false); // New registrations need approval

            directoryEntryRepository.save(entry);

            // Log Audit
            String ip = request.getRemoteAddr();
            auditLogService.logAction(
                email, 
                "LAWYER",
                "Created Account",
                "Lawyer Registration",
                "New lawyer registered: " + email,
                ip
            );

            return ResponseEntity.ok(savedLawyer);
        } catch (Exception e) {
             e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error saving lawyer: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLawyer(@PathVariable Integer id, jakarta.servlet.http.HttpServletRequest request) {
        if (!lawyerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        lawyerRepository.deleteById(id);

        // Log Audit
        String ip = request.getRemoteAddr();
        auditLogService.logAction(
            "admin@law.com", 
            "ADMIN",
            "Deleted Lawyer",
            "Lawyer Management",
            "Deleted lawyer ID: " + id,
            ip
        );

        return ResponseEntity.ok("Lawyer deleted successfully");
    }

    @PostMapping("/admin/import-lawyers")
    public ResponseEntity<String> importLawyersFromCSV(
            @RequestParam("file") MultipartFile file) throws Exception {

        lawyerImportService.importFromCSV(file);
        return ResponseEntity.ok("Lawyers imported successfully");
    }

    @PostMapping("/admin/import-bar-council")
    public ResponseEntity<String> importBarCouncilData() {
        try {
            barCouncilImportService.importCSV("bar_council_data.csv");
            return ResponseEntity.ok("Bar Council Data imported successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error importing Bar Council data: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/verify")
    public ResponseEntity<?> verifyLawyer(@PathVariable("id") Integer id) {
        try {
            return lawyerRepository.findById(id)
                    .map(lawyer -> {
                        lawyer.setVerificationStatus(true);
                        lawyerRepository.save(lawyer);
                        return ResponseEntity.ok("Lawyer verified successfully");
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error verifying lawyer: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveLawyer(@PathVariable("id") Integer id, jakarta.servlet.http.HttpServletRequest request) {
        try {
            return lawyerRepository.findById(id)
                    .map(lawyer -> {
                        lawyer.setApproved(true);
                        lawyer.setAdminStatus("APPROVED");
                        lawyerRepository.save(lawyer);

                        // SYNC: Set directory entry to approved
                        System.out.println(
                                "DEBUG: Syncing approval for lawyer with Bar Council ID: " + lawyer.getBarCouncilId());
                        com.example.demo.entity.DirectoryEntry entry = directoryEntryRepository
                                .findByTypeAndBarCouncilId("LAWYER", lawyer.getBarCouncilId());
                        if (entry != null) {
                            System.out.println("DEBUG: Found directory entry, setting approved=true");
                            entry.setApproved(true);
                            directoryEntryRepository.save(entry);
                            System.out.println("DEBUG: Directory entry updated successfully");
                        } else {
                            System.out.println("DEBUG: WARNING - No directory entry found for Bar Council ID: "
                                    + lawyer.getBarCouncilId());
                        }

                        // Send Approval Email
                        try {
                            emailService.sendAccountApprovedEmail(lawyer.getEmail(), "LAWYER", lawyer.getFullName());
                        } catch (Exception e) {
                            System.err.println("Failed to send approval email: " + e.getMessage());
                        }

                        // Log Audit
                        String ip = request.getRemoteAddr();
                        auditLogService.logAction(
                            "admin@law.com", // TODO: Get actual logged-in admin email from SecurityContext
                            "ADMIN",
                            "Approved Lawyer",
                            "Lawyer Management",
                            "Approved lawyer: " + lawyer.getEmail(),
                            ip
                        );

                        return ResponseEntity.ok("Lawyer approved successfully");
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error approving lawyer: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectLawyer(@PathVariable("id") Integer id, jakarta.servlet.http.HttpServletRequest request) {
        try {
            return lawyerRepository.findById(id)
                    .map(lawyer -> {
                        lawyer.setApproved(false);
                        lawyer.setAdminStatus("REJECTED");
                        lawyerRepository.save(lawyer);

                        // SYNC: Set directory entry to unapproved
                        try {
                            com.example.demo.entity.DirectoryEntry entry = directoryEntryRepository
                                .findByTypeAndBarCouncilId("LAWYER", lawyer.getBarCouncilId());
                            if (entry != null) {
                                entry.setApproved(false);
                                directoryEntryRepository.save(entry);
                            }
                        } catch(Exception ex) {
                            ex.printStackTrace();
                        }

                        // Send Rejection Email
                        try {
                            emailService.sendAccountRejectedEmail(lawyer.getEmail(), "LAWYER", lawyer.getFullName());
                        } catch (Exception e) {
                            System.err.println("Failed to send rejection email: " + e.getMessage());
                        }

                        // Log Audit
                        String ip = request.getRemoteAddr();
                        auditLogService.logAction(
                            "admin@law.com", // TODO: Get actual logged-in admin
                            "ADMIN",
                            "Rejected Lawyer",
                            "Lawyer Management",
                            "Rejected lawyer: " + lawyer.getEmail(),
                            ip
                        );

                        return ResponseEntity.ok("Lawyer application rejected");
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error rejecting lawyer: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable Integer id, @RequestBody Lawyer lawyerDetails, jakarta.servlet.http.HttpServletRequest request) {
        try {
            System.out.println("DEBUG: Updating lawyer with ID: " + id);
            System.out.println("DEBUG: Received lawyerDetails: " + lawyerDetails);
            
            return lawyerRepository.findById(id).map(lawyer -> {
                try {
                    // Update fields only if provided, otherwise keep existing values
                    // This allows partial updates
                    if (lawyerDetails.getFullName() != null && !lawyerDetails.getFullName().trim().isEmpty()) {
                        lawyer.setFullName(lawyerDetails.getFullName().trim());
                    } else if (lawyer.getFullName() == null || lawyer.getFullName().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Full name is required");
                    }
                    
                    if (lawyerDetails.getMobileNum() != null && !lawyerDetails.getMobileNum().trim().isEmpty()) {
                        lawyer.setMobileNum(lawyerDetails.getMobileNum().trim());
                    } else if (lawyer.getMobileNum() == null || lawyer.getMobileNum().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Mobile number is required");
                    }
                    
                    if (lawyerDetails.getSpecialization() != null && !lawyerDetails.getSpecialization().trim().isEmpty()) {
                        lawyer.setSpecialization(lawyerDetails.getSpecialization().trim());
                    } else if (lawyer.getSpecialization() == null || lawyer.getSpecialization().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Specialization is required");
                    }
                    
                    if (lawyerDetails.getBarState() != null && !lawyerDetails.getBarState().trim().isEmpty()) {
                        lawyer.setBarState(lawyerDetails.getBarState().trim());
                    } else if (lawyer.getBarState() == null || lawyer.getBarState().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Bar state is required");
                    }
                    
                    if (lawyerDetails.getBarCouncilId() != null && !lawyerDetails.getBarCouncilId().trim().isEmpty()) {
                        lawyer.setBarCouncilId(lawyerDetails.getBarCouncilId().trim());
                    } else if (lawyer.getBarCouncilId() == null || lawyer.getBarCouncilId().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Bar Council ID is required");
                    }
                    
                    if (lawyerDetails.getAddress() != null && !lawyerDetails.getAddress().trim().isEmpty()) {
                        lawyer.setAddress(lawyerDetails.getAddress().trim());
                    } else if (lawyer.getAddress() == null || lawyer.getAddress().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Address is required");
                    }
                    
                    if (lawyerDetails.getCity() != null && !lawyerDetails.getCity().trim().isEmpty()) {
                        lawyer.setCity(lawyerDetails.getCity().trim());
                    } else if (lawyer.getCity() == null || lawyer.getCity().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("City is required");
                    }
                    
                    if (lawyerDetails.getState() != null && !lawyerDetails.getState().trim().isEmpty()) {
                        lawyer.setState(lawyerDetails.getState().trim());
                    } else if (lawyer.getState() == null || lawyer.getState().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("State is required");
                    }
                    
                    if (lawyerDetails.getDistrict() != null && !lawyerDetails.getDistrict().trim().isEmpty()) {
                        lawyer.setDistrict(lawyerDetails.getDistrict().trim());
                    } else if (lawyer.getDistrict() == null || lawyer.getDistrict().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("District is required");
                    }
                    
                    // Handle experienceYears - use provided value or keep existing
                    // If provided, use it; otherwise keep existing value; if both are null, default to 0
                    if (lawyerDetails.getExperienceYears() != null) {
                        lawyer.setExperienceYears(lawyerDetails.getExperienceYears());
                    } else if (lawyer.getExperienceYears() == null) {
                        // If neither provided nor existing, default to 0
                        lawyer.setExperienceYears(0);
                        System.out.println("DEBUG: experienceYears was null, defaulting to 0");
                    }
                    // If lawyerDetails is null but lawyer has a value, keep existing (no action needed)
                    
                    // Update latitude and longitude if provided
                    if (lawyerDetails.getLatitude() != null) {
                        lawyer.setLatitude(lawyerDetails.getLatitude());
                    }
                    if (lawyerDetails.getLongitude() != null) {
                        lawyer.setLongitude(lawyerDetails.getLongitude());
                    }

                    System.out.println("DEBUG: Saving lawyer to database");
                    Lawyer updatedLawyer = lawyerRepository.save(lawyer);
                    System.out.println("DEBUG: Lawyer saved successfully");

                    // SYNC TO DIRECTORY
                    try {
                        com.example.demo.entity.DirectoryEntry entry = directoryEntryRepository.findByTypeAndBarCouncilId("LAWYER",
                                lawyer.getBarCouncilId());
                        if (entry != null) {
                            entry.setName(lawyer.getFullName());
                            entry.setSpecialization(lawyer.getSpecialization());
                            entry.setExperienceYears(lawyer.getExperienceYears());
                            entry.setContactPhone(lawyer.getMobileNum());
                            entry.setState(lawyer.getState());
                            entry.setDistrict(lawyer.getDistrict());
                            entry.setCity(lawyer.getCity());
                            if (lawyer.getLatitude() != null)
                                entry.setLatitude(lawyer.getLatitude());
                            if (lawyer.getLongitude() != null)
                                entry.setLongitude(lawyer.getLongitude());
                            entry.setOriginalId(updatedLawyer.getId());
                            directoryEntryRepository.save(entry);
                            System.out.println("DEBUG: Directory entry synced successfully");
                        }
                    } catch (Exception e) {
                        // Log directory sync error but don't fail the update
                        System.err.println("Error syncing to directory: " + e.getMessage());
                        e.printStackTrace();
                    }

                    // Log Audit
                    String ip = request.getRemoteAddr();
                    auditLogService.logAction(
                        lawyer.getEmail(), 
                        "LAWYER", // Or ADMIN if this is an admin update? Assuming User update for now based on endpoint
                        "Updated Profile",
                        "Lawyer Profile",
                        "Updated profile details",
                        ip
                    );

                    return ResponseEntity.ok(updatedLawyer);
                } catch (org.springframework.dao.DataIntegrityViolationException e) {
                    System.err.println("DEBUG: Data integrity violation: " + e.getMessage());
                    e.printStackTrace();
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("Database constraint violation: " + e.getMessage());
                } catch (Exception e) {
                    System.err.println("DEBUG: Error in map function: " + e.getMessage());
                    e.printStackTrace();
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("Error updating profile: " + e.getMessage());
                }
            }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Lawyer not found with id: " + id));
        } catch (org.springframework.http.converter.HttpMessageNotReadableException e) {
            System.err.println("DEBUG: JSON parsing error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid JSON format: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("DEBUG: Outer catch - Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating profile: " + e.getMessage());
        }
    }
}
