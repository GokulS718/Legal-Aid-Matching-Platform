package com.example.demo.repository;

import com.example.demo.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findBySessionIdOrderByTimestampAsc(Long sessionId);

    List<ChatMessage> findBySessionIdAndSenderIdNotAndIsReadFalse(Long sessionId, Integer senderId);
    
    Optional<ChatMessage> findByIdAndIsDeletedFalse(Long id);
}
