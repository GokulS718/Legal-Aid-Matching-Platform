package com.example.demo.repository;

import com.example.demo.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientIdAndRecipientRoleOrderByCreatedAtDesc(Integer recipientId, String recipientRole);

    long countByRecipientIdAndRecipientRoleAndIsReadFalse(Integer recipientId, String recipientRole);

    @Transactional
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipientId = :recipientId AND n.recipientRole = :recipientRole AND n.isRead = false")
    void markAllAsRead(Integer recipientId, String recipientRole);
}
