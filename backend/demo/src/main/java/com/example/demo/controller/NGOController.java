package com.example.demo.controller;

import com.example.demo.entity.NGO;
import com.example.demo.repository.DirectoryEntryRepository;
import com.example.demo.repository.NGORepository;
import com.example.demo.service.CloudinaryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/ngos")

public class NGOController {

    private final NGORepository repo;
    private final CloudinaryService cloudinaryService;
    private final DirectoryEntryRepository directoryEntryRepository;
    private final com.example.demo.service.EmailService emailService;
    private final com.example.demo.service.AuditLogService auditLogService;
    private final com.example.demo.service.AppointmentService appointmentService;

    public NGOController(NGORepository repo,
            CloudinaryService cloudinaryService,
            DirectoryEntryRepository directoryEntryRepository,
            com.example.demo.service.EmailService emailService,
            com.example.demo.service.AuditLogService auditLogService,
            com.example.demo.service.AppointmentService appointmentService) {
        this.repo = repo;
        this.cloudinaryService = cloudinaryService;
        this.directoryEntryRepository = directoryEntryRepository;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
        this.appointmentService = appointmentService;
    }

    // Citizens: see all NGOs (verified + unverified)
    @GetMapping
    public org.springframework.data.domain.Page<NGO> getAll(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return repo.findAll(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NGO> getNGOById(@PathVariable Integer id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/analytics")
    public ResponseEntity<com.example.demo.dto.LawyerAnalyticsDTO> getNGOAnalytics(@PathVariable Integer id) {
        // Reusing LawyerAnalyticsDTO as it fits the structure exactly
        return ResponseEntity.ok(appointmentService.getNGOAnalytics(id));
    }

    // Get simplified NGO list for comparison dropdown
    @GetMapping("/list")
    public ResponseEntity<List<NGOSummaryDTO>> getNGOsList(
            @RequestParam(required = false) String ngoType,
            @RequestParam(required = false) String city) {
        List<NGO> ngos;
        if (ngoType != null && city != null) {
            // Filter by type and city
            ngos = repo.findAll().stream()
                    .filter(n -> n.getNgoType() != null && n.getNgoType().equalsIgnoreCase(ngoType) &&
                            n.getCity() != null && n.getCity().equalsIgnoreCase(city))
                    .collect(java.util.stream.Collectors.toList());
        } else if (city != null) {
            // Filter by city only
            ngos = repo.findAll().stream()
                    .filter(n -> n.getCity() != null && n.getCity().equalsIgnoreCase(city))
                    .collect(java.util.stream.Collectors.toList());
        } else if (ngoType != null) {
            // Filter by type only
            ngos = repo.findMatches(ngoType);
        } else {
            ngos = repo.findAll();
        }
        
        List<NGOSummaryDTO> summaries = ngos.stream()
                .map(n -> new NGOSummaryDTO(
                        n.getId(),
                        n.getNgoName(),
                        n.getNgoType(),
                        n.getCity(),
                        n.getState(),
                        n.isVerificationStatus()
                ))
                .collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(summaries);
    }

    // Simple DTO for NGO summary
    public static class NGOSummaryDTO {
        private Integer id;
        private String ngoName;
        private String ngoType;
        private String city;
        private String state;
        private boolean verificationStatus;

        public NGOSummaryDTO(Integer id, String ngoName, String ngoType, String city, 
                               String state, boolean verificationStatus) {
            this.id = id;
            this.ngoName = ngoName;
            this.ngoType = ngoType;
            this.city = city;
            this.state = state;
            this.verificationStatus = verificationStatus;
        }

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getNgoName() { return ngoName; }
        public void setNgoName(String ngoName) { this.ngoName = ngoName; }
        public String getNgoType() { return ngoType; }
        public void setNgoType(String ngoType) { this.ngoType = ngoType; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        public boolean isVerificationStatus() { return verificationStatus; }
        public void setVerificationStatus(boolean verificationStatus) { this.verificationStatus = verificationStatus; }
    }

    @PostMapping("/add")
    public ResponseEntity<?> addNGO(
            @RequestParam("ngoName") String ngoName,
            @RequestParam("ngoType") String ngoType,
            @RequestParam("registrationNumber") String rawRegistrationNumber,
            @RequestParam(value = "registrationCertificate", required = false) MultipartFile registrationCertificate,
            @RequestParam("contact") String contact,
            @RequestParam("email") String email,
            @RequestParam("address") String address,
            @RequestParam("state") String state,
            @RequestParam("district") String district,
            @RequestParam("city") String city,
            @RequestParam("pincode") String pincode,
            @RequestParam(value = "latitude", required = false) String latitude,
            @RequestParam(value = "longitude", required = false) String longitude,
            @RequestParam("password") String password,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            String registrationNumber = rawRegistrationNumber.trim().toUpperCase();
            if (repo.existsByEmail(email)) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body("Email already exists");
            }

            if (repo.existsByRegistrationNumber(registrationNumber)) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body("Registration Number already exists");
            }

            NGO ngo = new NGO();
            ngo.setNgoName(ngoName);
            ngo.setNgoType(ngoType);
            ngo.setRegistrationNumber(registrationNumber);
            ngo.setContact(contact);
            ngo.setEmail(email);
            ngo.setAddress(address);
            ngo.setState(state);
            ngo.setDistrict(district);
            ngo.setCity(city);
            ngo.setPincode(pincode);

            if (latitude != null && !latitude.trim().isEmpty()) {
                try {
                    ngo.setLatitude(Double.parseDouble(latitude));
                } catch (NumberFormatException e) {
                    return ResponseEntity
                            .status(HttpStatus.BAD_REQUEST)
                            .body("Invalid latitude value. Must be a number.");
                }
            }

            if (longitude != null && !longitude.trim().isEmpty()) {
                try {
                    ngo.setLongitude(Double.parseDouble(longitude));
                } catch (NumberFormatException e) {
                    return ResponseEntity
                            .status(HttpStatus.BAD_REQUEST)
                            .body("Invalid longitude value. Must be a number.");
                }
            }

            ngo.setPassword(password);

            if (registrationCertificate != null && !registrationCertificate.isEmpty()) {
                try {
                    String registrationCertUrl = cloudinaryService.uploadFile(registrationCertificate,
                            "ngos/registration-certificates");
                    ngo.setRegistrationCertificateUrl(registrationCertUrl);
                    ngo.setRegistrationCertificateFilename(
                            registrationCertificate.getOriginalFilename());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity
                            .status(HttpStatus.BAD_REQUEST)
                            .body("Registration Certificate: " + e.getMessage());
                } catch (IOException e) {
                    return ResponseEntity
                            .status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("Failed to upload Registration Certificate to Cloudinary: " + e.getMessage());
                }
            }

            // verification against directory_entries
            boolean verified = directoryEntryRepository.existsByTypeAndRegistrationNumber(
                    "NGO",
                    registrationNumber);
            ngo.setVerificationStatus(verified);

            NGO saved = repo.save(ngo);

            // Send Welcome Email
            try {
                emailService.sendWelcomeEmail(saved.getEmail(), "NGO", saved.getNgoName());
            } catch (Exception e) {
                System.err.println("Failed to send welcome email: " + e.getMessage());
            }

            // SYNC TO DIRECTORY
            com.example.demo.entity.DirectoryEntry entry = directoryEntryRepository
                    .findByTypeAndRegistrationNumber("NGO", registrationNumber);
            if (entry == null) {
                entry = new com.example.demo.entity.DirectoryEntry();
                entry.setType("NGO");
                entry.setRegistrationNumber(registrationNumber);
                entry.setSource("USER_REGISTRATION");
            }
            entry.setName(ngoName);
            entry.setContactPhone(contact);
            entry.setContactEmail(email);
            entry.setState(state);
            entry.setDistrict(district);
            entry.setCity(city);
            if (ngo.getLatitude() != null)
                entry.setLatitude(ngo.getLatitude());
            if (ngo.getLongitude() != null)
                entry.setLongitude(ngo.getLongitude());
            entry.setOriginalId(saved.getId());
            entry.setVerified(verified);
            entry.setApproved(false); // New registrations need approval
            entry.setSpecialization(ngoType); // SYNC SPECIALIZATION
            directoryEntryRepository.save(entry);

            // Log Audit
            String ip = request.getRemoteAddr();
            auditLogService.logAction(
                email, 
                "NGO",
                "Created Account",
                "NGO Registration",
                "New NGO registered: " + email,
                ip
            );

            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error saving NGO: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNGO(@PathVariable Integer id, jakarta.servlet.http.HttpServletRequest request) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repo.deleteById(id);

        // Log Audit
        String ip = request.getRemoteAddr();
        auditLogService.logAction(
            "admin@law.com", 
            "ADMIN",
            "Deleted NGO",
            "NGO Management",
            "Deleted NGO ID: " + id,
            ip
        );

        return ResponseEntity.ok("NGO deleted successfully");
    }

    @PutMapping("/{id}/verify")
    public ResponseEntity<?> verifyNGO(@PathVariable("id") Integer id) {
        return repo.findById(id)
                .map(ngo -> {
                    ngo.setVerificationStatus(true);
                    repo.save(ngo);
                    return ResponseEntity.ok("NGO verified successfully");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveNGO(@PathVariable("id") Integer id, jakarta.servlet.http.HttpServletRequest request) {
        return repo.findById(id)
                .map(ngo -> {
                    ngo.setApproved(true);
                    ngo.setAdminStatus("APPROVED");
                    repo.save(ngo);

                    // SYNC: Set directory entry to approved
                    System.out.println(
                            "DEBUG: Syncing approval for NGO with Registration Number: " + ngo.getRegistrationNumber());
                    com.example.demo.entity.DirectoryEntry entry = directoryEntryRepository
                            .findByTypeAndRegistrationNumber("NGO", ngo.getRegistrationNumber());
                    if (entry != null) {
                        System.out.println("DEBUG: Found directory entry, setting approved=true");
                        entry.setApproved(true);
                        directoryEntryRepository.save(entry);
                        System.out.println("DEBUG: Directory entry updated successfully");
                    } else {
                        System.out.println("DEBUG: WARNING - No directory entry found for Registration Number: "
                                + ngo.getRegistrationNumber());
                    }

                    // Send Approval Email
                    try {
                        emailService.sendAccountApprovedEmail(ngo.getEmail(), "NGO", ngo.getNgoName());
                    } catch (Exception e) {
                        System.err.println("Failed to send approval email: " + e.getMessage());
                    }

                    // Log Audit
                    String ip = request.getRemoteAddr();
                    auditLogService.logAction(
                        "admin@law.com", 
                        "ADMIN",
                        "Approved NGO",
                        "NGO Management",
                        "Approved NGO: " + ngo.getEmail(),
                        ip
                    );

                    return ResponseEntity.ok("NGO approved successfully");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectNGO(@PathVariable("id") Integer id, jakarta.servlet.http.HttpServletRequest request) {
        return repo.findById(id)
                .map(ngo -> {
                    ngo.setApproved(false);
                    ngo.setAdminStatus("REJECTED");
                    repo.save(ngo);

                    // SYNC: Set directory entry to unapproved
                    try {
                        com.example.demo.entity.DirectoryEntry entry = directoryEntryRepository
                                .findByTypeAndRegistrationNumber("NGO", ngo.getRegistrationNumber());
                        if (entry != null) {
                            entry.setApproved(false);
                            directoryEntryRepository.save(entry);
                        }
                    } catch(Exception ex) {
                        ex.printStackTrace();
                    }

                    // Send Rejection Email
                    try {
                        emailService.sendAccountRejectedEmail(ngo.getEmail(), "NGO", ngo.getNgoName());
                    } catch (Exception e) {
                        System.err.println("Failed to send rejection email: " + e.getMessage());
                    }

                    // Log Audit
                    String ip = request.getRemoteAddr();
                    auditLogService.logAction(
                        "admin@law.com", 
                        "ADMIN",
                        "Rejected NGO",
                        "NGO Management",
                        "Rejected NGO: " + ngo.getEmail(),
                        ip
                    );

                    return ResponseEntity.ok("NGO application rejected");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable Integer id, @RequestBody NGO ngoDetails, jakarta.servlet.http.HttpServletRequest request) {
        return repo.findById(id).map(ngo -> {
            ngo.setNgoName(ngoDetails.getNgoName());
            ngo.setNgoType(ngoDetails.getNgoType());
            ngo.setRegistrationNumber(ngoDetails.getRegistrationNumber());
            ngo.setContact(ngoDetails.getContact());
            ngo.setAddress(ngoDetails.getAddress());
            ngo.setState(ngoDetails.getState());
            ngo.setDistrict(ngoDetails.getDistrict());
            ngo.setCity(ngoDetails.getCity());
            ngo.setPincode(ngoDetails.getPincode());
            if (ngoDetails.getLatitude() != null)
                ngo.setLatitude(ngoDetails.getLatitude());
            if (ngoDetails.getLongitude() != null)
                ngo.setLongitude(ngoDetails.getLongitude());

            NGO updatedNgo = repo.save(ngo);

            // SYNC TO DIRECTORY
            com.example.demo.entity.DirectoryEntry entry = directoryEntryRepository
                    .findByTypeAndRegistrationNumber("NGO", ngo.getRegistrationNumber());
            if (entry != null) {
                entry.setName(ngo.getNgoName());
                entry.setContactPhone(ngo.getContact());
                entry.setState(ngo.getState());
                entry.setDistrict(ngo.getDistrict());
                entry.setCity(ngo.getCity());
                if (ngo.getLatitude() != null)
                    entry.setLatitude(ngo.getLatitude());
                if (ngo.getLongitude() != null)
                    entry.setLongitude(ngo.getLongitude());
                entry.setOriginalId(updatedNgo.getId());
                entry.setSpecialization(ngo.getNgoType()); // SYNC SPECIALIZATION
                directoryEntryRepository.save(entry);
            }

            // Log Audit
            String ip = request.getRemoteAddr();
            auditLogService.logAction(
                ngo.getEmail(), 
                "NGO",
                "Updated Profile",
                "NGO Profile",
                "Updated profile details",
                ip
            );

            return ResponseEntity.ok(updatedNgo);
        }).orElse(ResponseEntity.notFound().build());
    }
}
