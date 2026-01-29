package com.example.demo.controller;

import com.example.demo.entity.Appointment;
import com.example.demo.service.AppointmentService;
import com.example.demo.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List; // Added for List
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final JwtUtil jwtUtil;

    public AppointmentController(AppointmentService appointmentService, JwtUtil jwtUtil) {
        this.appointmentService = appointmentService;
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

    private String extractUserEmail(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return null;
        String token = authHeader.substring(7);
        try {
            return jwtUtil.extractEmail(token);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping
    public ResponseEntity<?> scheduleAppointment(@RequestHeader("Authorization") String authHeader,
            @RequestBody Appointment appointment) {
        try {
            Integer userId = extractUserId(authHeader);
            String role = extractUserRole(authHeader);
            if (userId == null)
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");

            // Enforce requester ID from token
            appointment.setRequesterId(userId);
            appointment.setRequesterRole(role);

            Appointment saved = appointmentService.scheduleAppointment(appointment);
            System.out.println("DEBUG: [APPOINTMENT SAVED] ID=" + saved.getId() +
                    ", RequesterID=" + saved.getRequesterId() +
                    ", RequesterRole=" + saved.getRequesterRole() +
                    ", ProviderID=" + saved.getProviderId() +
                    ", ProviderRole=" + saved.getProviderRole() +
                    ", StartTime=" + saved.getStartTime());
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error scheduling appointment: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getMyAppointments(@RequestHeader("Authorization") String authHeader) {
        Integer userId = extractUserId(authHeader);
        String role = extractUserRole(authHeader);
        if (userId == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");

        System.out.println("DEBUG: [VERBOSE] Entering getMyAppointments for ID: " + userId + ", Role: " + role);

        // Find ALL appointments for this ID regardless of role for debugging
        List<Appointment> allForId = appointmentService.getAllAppointments().stream()
                .filter(a -> (a.getRequesterId() != null && a.getRequesterId().equals(userId)) ||
                        (a.getProviderId() != null && a.getProviderId().equals(userId)))
                .toList();
        System.out.println(
                "DEBUG: [VERBOSE] Found " + allForId.size() + " total appointments in DB associated with ID " + userId);
        for (Appointment a : allForId) {
            System.out.println("   -> Appt ID: " + a.getId() + ", ReqID: " + a.getRequesterId() + ", ReqRole: "
                    + a.getRequesterRole() + ", ProvID: " + a.getProviderId() + ", ProvRole: " + a.getProviderRole());
        }

        if ("LAWYER".equalsIgnoreCase(role) || "NGO".equalsIgnoreCase(role)) {
            // FIX: Retrieve both provider AND requester appointments for Lawyers/NGOs
            // This ensures that if a Lawyer books an appointment (acting as a citizen),
            // they see it.
            List<Appointment> appts = appointmentService.getAllAppointmentsForUser(userId);
            System.out.println(
                    "DEBUG: Returning " + appts.size() + " unified appts for user " + userId + " (Role: " + role + ")");
            return ResponseEntity.ok(appts);
        } else {
            // For CITIZEN, we can also use the unified method to be safe, or keep specific
            // logic.
            // Using unified is safer to catch any edge cases.
            List<Appointment> appts = appointmentService.getAllAppointmentsForUser(userId);
            System.out.println("DEBUG: Returning " + appts.size() + " unified appts for citizen " + userId);
            return ResponseEntity.ok(appts);
        }
    }

    @GetMapping("/debug/dump-all-names")
    public ResponseEntity<?> dumpAllDetailed() {
        System.out.println("DEBUG: [VERBOSE] Entering dumpAllDetailed (Dumping EVERY appointment in DB)");
        List<Appointment> all = appointmentService.getAllAppointments();
        System.out.println("--- DB DUMP START ---");
        for (Appointment a : all) {
            System.out.println("   ID: " + a.getId() + " | Req: " + a.getRequesterId() + " (" + a.getRequesterName()
                    + " / " + a.getRequesterRole() + ") | Prov: " + a.getProviderId() + " (" + a.getProviderName()
                    + " / " + a.getProviderRole() + ") | Status: " + a.getStatus());
        }
        System.out.println("--- DB DUMP END (Count: " + all.size() + ") ---");
        return ResponseEntity.ok(all);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate) {
        Integer userId = extractUserId(authHeader);
        String role = extractUserRole(authHeader);
        if (userId == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");

        // Ideally verify that the user owns the appointment (provider)
        // For simplicity, we assume the frontend sends valid requests, adding a check
        // would be better

        try {
            String status = statusUpdate.get("status");
            String email = extractUserEmail(authHeader);
            Appointment updated = appointmentService.updateStatus(id, status, email, role);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating status: " + e.getMessage());
        }
    }

    @GetMapping("/availability")
    public ResponseEntity<?> getAvailability(@RequestParam Integer providerId,
            @RequestParam(defaultValue = "LAWYER") String providerRole,
            @RequestParam String date,
            @RequestParam(required = false) Integer requesterId,
            @RequestParam(required = false) String requesterRole) {
        try {
            java.time.LocalDate localDate = java.time.LocalDate.parse(date);
            return ResponseEntity.ok(appointmentService.getAvailability(providerId, providerRole, localDate,
                    requesterId, requesterRole));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid request: " + e.getMessage());
        }
    }

    @GetMapping("/debug/all")
    public ResponseEntity<?> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    @GetMapping("/debug/analyze")
    public ResponseEntity<?> analyzeAppointments(@RequestHeader("Authorization") String authHeader) {
        Integer userId = extractUserId(authHeader);
        String role = extractUserRole(authHeader);

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("tokenUserId", userId);
        response.put("tokenRole", role);

        // TEST THE REPOSITORY METHOD DIRECTLY
        List<Appointment> unified = appointmentService.getAllAppointmentsForUser(userId);
        response.put("unifiedFetchCount", unified.size());

        List<Appointment> all = appointmentService.getAllAppointments();
        List<Map<String, Object>> simplifiedAppts = new java.util.ArrayList<>();

        for (Appointment a : all) {
            Map<String, Object> info = new java.util.HashMap<>();
            info.put("id", a.getId());
            info.put("reqId", a.getRequesterId());
            info.put("provId", a.getProviderId());
            info.put("startTime", a.getStartTime().toString());
            info.put("reqRole", a.getRequesterRole());
            info.put("provRole", a.getProviderRole());

            boolean idMatch = (userId != null)
                    && (userId.equals(a.getRequesterId()) || userId.equals(a.getProviderId()));
            info.put("shouldBeFoundByUnified", idMatch);
            simplifiedAppts.add(info);
        }

        response.put("dbPreview", simplifiedAppts);

        return ResponseEntity.ok(response);
    }
}
