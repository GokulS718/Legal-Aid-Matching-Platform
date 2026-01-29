package com.example.demo.repository;

import com.example.demo.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    Page<AuditLog> findByTimestampBetweenOrderByTimestampDesc(java.time.LocalDateTime start, java.time.LocalDateTime end, Pageable pageable);
}
