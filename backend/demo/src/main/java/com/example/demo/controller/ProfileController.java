package com.example.demo.controller;

import com.example.demo.entity.Citizen;
import com.example.demo.entity.Admin;
import com.example.demo.repository.CitizenRepository;
import com.example.demo.repository.AdminRepository;
import com.example.demo.service.CloudinaryService;
import com.example.demo.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")

public class ProfileController {

    @Autowired
    private CitizenRepository citizenRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private com.example.demo.service.AuditLogService auditLogService;

    @GetMapping("/me")
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        try {
            // Get token from Authorization header
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Authorization token required");
            }

            String token = authHeader.substring(7);

            // Validate token is not expired
            if (jwtUtil.isTokenExpired(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Token has expired. Please login again.");
            }

            // Extract email from token
            String email = jwtUtil.extractEmail(token);
            if (email == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid token");
            }

            // Extract role from token
            String role = jwtUtil.extractRole(token);
            System.out.println("DEBUG ROLE FROM TOKEN = " + role);

            if (role == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Invalid role");
            }

            Map<String, Object> profileData = new HashMap<>();

            if ("CITIZEN".equals(role)) {
                Citizen citizen = citizenRepository.findByEmail(email);
                if (citizen == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body("Citizen profile not found");
                }

                profileData.put("id", citizen.getId());
                profileData.put("fullName", citizen.getFullName());
                profileData.put("shortName", citizen.getFullName() != null && citizen.getFullName().contains(" ")
                        ? citizen.getFullName().split(" ")[0] + " " + citizen.getFullName().split(" ")[citizen.getFullName().split(" ").length - 1]
                        : citizen.getFullName());
                profileData.put("aadhaar", citizen.getAadharNum());
                profileData.put("email", citizen.getEmail());
                profileData.put("mobile", citizen.getMobileNum());
                profileData.put("dob", citizen.getDateOfBirth() != null ? citizen.getDateOfBirth().toString() : null);
                profileData.put("state", citizen.getState());
                profileData.put("district", citizen.getDistrict());
                profileData.put("city", citizen.getCity());
                profileData.put("address", citizen.getAddress());
                profileData.put("role", "CITIZEN");
                profileData.put("photoUrl", citizen.getProfilePhotoUrl());
            } else if ("ADMIN".equals(role)) {
                // Use case-insensitive email lookup for admin
                Admin admin = adminRepository.findByEmailIgnoreCase(email);
                if (admin == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body("Admin profile not found");
                }

                profileData.put("id", admin.getId());
                profileData.put("fullName", admin.getFullName());
                profileData.put("shortName", admin.getFullName() != null && admin.getFullName().contains(" ")
                        ? admin.getFullName().split(" ")[0] + " " + admin.getFullName().split(" ")[admin.getFullName().split(" ").length - 1]
                        : admin.getFullName());
                profileData.put("aadhaar", admin.getAadharNum());
                profileData.put("email", admin.getEmail());
                profileData.put("mobile", admin.getMobileNum());
                profileData.put("dob", admin.getDateOfBirth() != null ? admin.getDateOfBirth().toString() : null);
                profileData.put("state", admin.getState());
                profileData.put("district", admin.getDistrict());
                profileData.put("city", admin.getCity());
                profileData.put("address", admin.getAddress());
                profileData.put("role", "ADMIN");
                profileData.put("photoUrl", admin.getProfilePhotoUrl());
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("This endpoint is for citizens and admins only");
            }

            return ResponseEntity.ok(profileData);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching profile: " + e.getMessage());
        }
    }

    @PutMapping(value = "/me", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<?> updateProfile(
            HttpServletRequest request,
            @RequestParam(value = "fullName", required = false) String fullName,
            @RequestParam(value = "aadhaar", required = false) String aadhaar,
            @RequestParam(value = "mobile", required = false) String mobile,
            @RequestParam(value = "dob", required = false) String dob,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "district", required = false) String district,
            @RequestParam(value = "city", required = false) String city,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "profilePhoto", required = false) MultipartFile profilePhoto) {
        try {
            // Get token from Authorization header
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Authorization token required");
            }

            String token = authHeader.substring(7);

            // Validate token is not expired
            if (jwtUtil.isTokenExpired(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Token has expired. Please login again.");
            }

            // Extract email from token
            String email = jwtUtil.extractEmail(token);
            if (email == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid token");
            }

            // Extract role from token
            String role = jwtUtil.extractRole(token);
            if (role == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Invalid role");
            }

            Map<String, Object> profileData = new HashMap<>();

            if ("CITIZEN".equals(role)) {
                Citizen citizen = citizenRepository.findByEmail(email);
                if (citizen == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body("Citizen profile not found");
                }

                if (fullName != null && !fullName.trim().isEmpty()) {
                    citizen.setFullName(fullName.trim());
                }

                if (aadhaar != null && !aadhaar.trim().isEmpty()) {
                    String aadhaarTrimmed = aadhaar.trim();
                    if (!citizen.getAadharNum().equals(aadhaarTrimmed)) {
                        boolean aadhaarExists = citizenRepository.existsByAadharNum(aadhaarTrimmed);
                        if (aadhaarExists) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("Aadhaar number already exists");
                        }
                    }
                    citizen.setAadharNum(aadhaarTrimmed);
                }

                if (mobile != null && !mobile.trim().isEmpty()) {
                    citizen.setMobileNum(mobile.trim());
                }

                if (dob != null && !dob.trim().isEmpty()) {
                    try {
                        java.time.LocalDate dobDate = java.time.LocalDate.parse(dob.trim());
                        citizen.setDateOfBirth(dobDate);
                    } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("Invalid date format. Use YYYY-MM-DD");
                    }
                }

                if (state != null && !state.trim().isEmpty()) {
                    citizen.setState(state.trim());
                }

                if (district != null && !district.trim().isEmpty()) {
                    citizen.setDistrict(district.trim());
                }

                if (city != null && !city.trim().isEmpty()) {
                    citizen.setCity(city.trim());
                }

                if (address != null && !address.trim().isEmpty()) {
                    citizen.setAddress(address.trim());
                }

                if (profilePhoto != null && !profilePhoto.isEmpty()) {
                    try {
                        String photoUrl = cloudinaryService.uploadImage(profilePhoto, "citizens/profile-photos");
                        citizen.setProfilePhotoUrl(photoUrl);
                    } catch (IOException e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body("Failed to upload profile photo: " + e.getMessage());
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(e.getMessage());
                    }
                }

                Citizen updatedCitizen = citizenRepository.save(citizen);

                profileData.put("id", updatedCitizen.getId());
                profileData.put("fullName", updatedCitizen.getFullName());
                profileData.put("shortName", updatedCitizen.getFullName() != null && updatedCitizen.getFullName().contains(" ")
                        ? updatedCitizen.getFullName().split(" ")[0] + " " + updatedCitizen.getFullName().split(" ")[updatedCitizen.getFullName().split(" ").length - 1]
                        : updatedCitizen.getFullName());
                profileData.put("aadhaar", updatedCitizen.getAadharNum());
                profileData.put("email", updatedCitizen.getEmail());
                profileData.put("mobile", updatedCitizen.getMobileNum());
                profileData.put("dob", updatedCitizen.getDateOfBirth() != null ? updatedCitizen.getDateOfBirth().toString() : null);
                profileData.put("state", updatedCitizen.getState());
                profileData.put("district", updatedCitizen.getDistrict());
                profileData.put("city", updatedCitizen.getCity());
                profileData.put("address", updatedCitizen.getAddress());
                profileData.put("role", "CITIZEN");
                profileData.put("photoUrl", updatedCitizen.getProfilePhotoUrl());
            } else if ("ADMIN".equals(role)) {
                // Use case-insensitive email lookup for admin
                Admin admin = adminRepository.findByEmailIgnoreCase(email);
                if (admin == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body("Admin profile not found");
                }

                if (fullName != null && !fullName.trim().isEmpty()) {
                    admin.setFullName(fullName.trim());
                }

                if (aadhaar != null && !aadhaar.trim().isEmpty()) {
                    String aadhaarTrimmed = aadhaar.trim();
                    if (!admin.getAadharNum().equals(aadhaarTrimmed)) {
                        boolean aadhaarExists = adminRepository.existsByAadharNum(aadhaarTrimmed);
                        if (aadhaarExists) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("Aadhaar number already exists");
                        }
                    }
                    admin.setAadharNum(aadhaarTrimmed);
                }

                if (mobile != null && !mobile.trim().isEmpty()) {
                    admin.setMobileNum(mobile.trim());
                }

                if (dob != null && !dob.trim().isEmpty()) {
                    try {
                        java.time.LocalDate dobDate = java.time.LocalDate.parse(dob.trim());
                        admin.setDateOfBirth(dobDate);
                    } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("Invalid date format. Use YYYY-MM-DD");
                    }
                }

                if (state != null && !state.trim().isEmpty()) {
                    admin.setState(state.trim());
                }

                if (district != null && !district.trim().isEmpty()) {
                    admin.setDistrict(district.trim());
                }

                if (city != null && !city.trim().isEmpty()) {
                    admin.setCity(city.trim());
                }

                if (address != null && !address.trim().isEmpty()) {
                    admin.setAddress(address.trim());
                }

                if (profilePhoto != null && !profilePhoto.isEmpty()) {
                    try {
                        String photoUrl = cloudinaryService.uploadImage(profilePhoto, "admins/profile-photos");
                        admin.setProfilePhotoUrl(photoUrl);
                    } catch (IOException e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body("Failed to upload profile photo: " + e.getMessage());
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(e.getMessage());
                    }
                }

                Admin updatedAdmin = adminRepository.save(admin);

                profileData.put("id", updatedAdmin.getId());
                profileData.put("fullName", updatedAdmin.getFullName());
                profileData.put("shortName", updatedAdmin.getFullName() != null && updatedAdmin.getFullName().contains(" ")
                        ? updatedAdmin.getFullName().split(" ")[0] + " " + updatedAdmin.getFullName().split(" ")[updatedAdmin.getFullName().split(" ").length - 1]
                        : updatedAdmin.getFullName());
                profileData.put("aadhaar", updatedAdmin.getAadharNum());
                profileData.put("email", updatedAdmin.getEmail());
                profileData.put("mobile", updatedAdmin.getMobileNum());
                profileData.put("dob", updatedAdmin.getDateOfBirth() != null ? updatedAdmin.getDateOfBirth().toString() : null);
                profileData.put("state", updatedAdmin.getState());
                profileData.put("district", updatedAdmin.getDistrict());
                profileData.put("city", updatedAdmin.getCity());
                profileData.put("address", updatedAdmin.getAddress());
                profileData.put("role", "ADMIN");
                profileData.put("photoUrl", updatedAdmin.getProfilePhotoUrl());
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("This endpoint is for citizens and admins only");
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Profile updated successfully");
            response.put("data", profileData);



            // Log Audit
            String ip = request.getRemoteAddr();
            String userEmail = email; // captured from token
            String userRole = role; // captured from token
            
            auditLogService.logAction(
                userEmail, 
                userRole,
                "Updated Profile",
                "User Profile",
                "Updated profile details for role: " + userRole,
                ip
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating profile: " + e.getMessage());
        }
    }
}
