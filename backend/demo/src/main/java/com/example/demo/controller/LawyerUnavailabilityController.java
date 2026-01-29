package com.example.demo.controller;

import com.example.demo.dto.UnavailabilityRequest;
import com.example.demo.entity.LawyerUnavailability;
import com.example.demo.service.LawyerUnavailabilityService;
import com.example.demo.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/unavailability")
public class LawyerUnavailabilityController {

    private final LawyerUnavailabilityService unavailabilityService;
    private final JwtUtil jwtUtil;

    public LawyerUnavailabilityController(LawyerUnavailabilityService unavailabilityService, JwtUtil jwtUtil) {
        this.unavailabilityService = unavailabilityService;
        this.jwtUtil = jwtUtil;
    }

    private Integer extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return null;
        String token = authHeader.substring(7);
        try {
            return jwtUtil.extractClaim(token, claims -> claims.get("userId", Integer.class));
        } catch (Exception e) {
            return null;
        }
    }

    private String extractUserRole(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return null;
        String token = authHeader.substring(7);
        try {
            return jwtUtil.extractRole(token);
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/my-unavailability")
    public ResponseEntity<?> getMyUnavailability(@RequestHeader("Authorization") String authHeader) {
        Integer userId = extractUserId(authHeader);
        String role = extractUserRole(authHeader);
        
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }
        
        if (!"LAWYER".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only lawyers can manage unavailability");
        }

        try {
            List<LawyerUnavailability> unavailability = unavailabilityService.getLawyerUnavailability(userId);
            return ResponseEntity.ok(unavailability);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching unavailability: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createUnavailability(@RequestHeader("Authorization") String authHeader,
                                                  @RequestBody UnavailabilityRequest request) {
        Integer userId = extractUserId(authHeader);
        String role = extractUserRole(authHeader);
        
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }
        
        if (!"LAWYER".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only lawyers can manage unavailability");
        }

        try {
            // Parse date and time strings
            LocalDate date = LocalDate.parse(request.getDate(), DateTimeFormatter.ISO_LOCAL_DATE);
            LocalTime startTime = LocalTime.parse(request.getStartTime(), DateTimeFormatter.ofPattern("HH:mm"));
            LocalTime endTime = LocalTime.parse(request.getEndTime(), DateTimeFormatter.ofPattern("HH:mm"));
            
            // Combine date and time
            LocalDateTime startDateTime = LocalDateTime.of(date, startTime);
            LocalDateTime endDateTime = LocalDateTime.of(date, endTime);
            
            // Create unavailability entity
            LawyerUnavailability unavailability = new LawyerUnavailability();
            unavailability.setLawyerId(userId);
            unavailability.setStartTime(startDateTime);
            unavailability.setEndTime(endDateTime);
            unavailability.setReason(request.getReason());
            
            LawyerUnavailability saved = unavailabilityService.saveUnavailability(unavailability);
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("message", "Unavailability period added successfully");
            response.put("unavailability", saved);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating unavailability: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUnavailability(@RequestHeader("Authorization") String authHeader,
                                                   @PathVariable Long id,
                                                   @RequestBody UnavailabilityRequest request) {
        Integer userId = extractUserId(authHeader);
        String role = extractUserRole(authHeader);
        
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }
        
        if (!"LAWYER".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only lawyers can manage unavailability");
        }

        try {
            // Verify ownership
            LawyerUnavailability existing = unavailabilityService.getUnavailabilityById(id);
            if (!existing.getLawyerId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only update your own unavailability");
            }

            // Parse date and time strings
            LocalDate date = LocalDate.parse(request.getDate(), DateTimeFormatter.ISO_LOCAL_DATE);
            LocalTime startTime = LocalTime.parse(request.getStartTime(), DateTimeFormatter.ofPattern("HH:mm"));
            LocalTime endTime = LocalTime.parse(request.getEndTime(), DateTimeFormatter.ofPattern("HH:mm"));
            
            // Combine date and time
            LocalDateTime startDateTime = LocalDateTime.of(date, startTime);
            LocalDateTime endDateTime = LocalDateTime.of(date, endTime);
            
            // Update unavailability entity
            LawyerUnavailability unavailability = new LawyerUnavailability();
            unavailability.setId(id);
            unavailability.setLawyerId(userId);
            unavailability.setStartTime(startDateTime);
            unavailability.setEndTime(endDateTime);
            unavailability.setReason(request.getReason());
            
            LawyerUnavailability updated = unavailabilityService.saveUnavailability(unavailability);
            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("message", "Unavailability period updated successfully");
            response.put("unavailability", updated);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating unavailability: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUnavailability(@RequestHeader("Authorization") String authHeader,
                                                 @PathVariable Long id) {
        Integer userId = extractUserId(authHeader);
        String role = extractUserRole(authHeader);
        
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }
        
        if (!"LAWYER".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only lawyers can manage unavailability");
        }

        try {
            // Verify ownership
            LawyerUnavailability existing = unavailabilityService.getUnavailabilityById(id);
            if (!existing.getLawyerId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only delete your own unavailability");
            }
            
            unavailabilityService.deleteUnavailability(id);
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("message", "Unavailability period deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting unavailability: " + e.getMessage());
        }
    }
}
