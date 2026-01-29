package com.example.demo.controller;

import com.example.demo.service.NotificationService;
import com.example.demo.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")

public class NotificationController {

    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;

    public NotificationController(NotificationService notificationService, JwtUtil jwtUtil) {
        this.notificationService = notificationService;
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

    @GetMapping
    public ResponseEntity<?> getNotifications(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || authHeader.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Authorization header is required");
        }
        
        Integer userId = extractUserId(authHeader);
        String role = extractUserRole(authHeader);
        
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired token. Please login again.");
        }
        
        if (role == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid token: role not found");
        }

        return ResponseEntity.ok(notificationService.getUserNotifications(userId, role));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || authHeader.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Authorization header is required");
        }
        
        Integer userId = extractUserId(authHeader);
        String role = extractUserRole(authHeader);
        
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired token. Please login again.");
        }
        
        if (role == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid token: role not found");
        }

        return ResponseEntity
                .ok(java.util.Collections.singletonMap("count", notificationService.getUnreadCount(userId, role)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@RequestHeader("Authorization") String authHeader) {
        Integer userId = extractUserId(authHeader);
        String role = extractUserRole(authHeader);
        if (userId == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");

        notificationService.markAllAsRead(userId, role);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok().build();
    }
}
