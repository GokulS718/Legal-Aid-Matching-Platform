package com.example.demo.service;

import com.example.demo.entity.AuditLog;
import com.example.demo.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Async
    public void logAction(String email, String role, String action, String module, String details, String ipAddress) {
        try {
            AuditLog log = new AuditLog(email, role, action, module, details, ipAddress);
            auditLogRepository.save(log);
        } catch (Exception e) {
            // Silently fail logging to avoid impacting main business logic
            System.err.println("Failed to save audit log: " + e.getMessage());
        }
    }

    public Page<AuditLog> getAllLogs(java.time.LocalDate startDate, java.time.LocalDate endDate, Pageable pageable) {
        if (startDate != null && endDate != null) {
            return auditLogRepository.findByTimestampBetweenOrderByTimestampDesc(
                startDate.atStartOfDay(),
                endDate.atTime(23, 59, 59),
                pageable
            );
        }
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }
}
