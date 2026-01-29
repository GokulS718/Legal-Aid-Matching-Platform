package com.example.demo.service;

import com.example.demo.entity.Notification;
import com.example.demo.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import java.util.List;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public void createNotification(Integer recipientId, String recipientRole, String message, String type,
            Long referenceId) {
        Notification notification = new Notification(recipientId, recipientRole, message, type, referenceId);
        notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(Integer userId, String role) {
        return notificationRepository.findByRecipientIdAndRecipientRoleOrderByCreatedAtDesc(userId, role);
    }

    public long getUnreadCount(Integer userId, String role) {
        return notificationRepository.countByRecipientIdAndRecipientRoleAndIsReadFalse(userId, role);
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    public void markAllAsRead(Integer userId, String role) {
        notificationRepository.markAllAsRead(userId, role);
    }

    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }
}
