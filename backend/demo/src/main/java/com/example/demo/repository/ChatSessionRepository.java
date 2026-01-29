package com.example.demo.repository;

import com.example.demo.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    List<ChatSession> findByCitizenId(Integer citizenId);

    List<ChatSession> findByProviderIdAndProviderRole(Integer providerId, String providerRole);

    Optional<ChatSession> findByCaseIdAndCitizenIdAndProviderIdAndProviderRole(Long caseId, Integer citizenId,
            Integer providerId, String providerRole);

    Optional<ChatSession> findByCitizenIdAndProviderIdAndProviderRoleAndCaseIdIsNull(Integer citizenId,
            Integer providerId, String providerRole);
}
