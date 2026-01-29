package com.example.demo.repository;

import com.example.demo.entity.CaseMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CaseMatchRepository extends JpaRepository<CaseMatch, Long> {
    List<CaseMatch> findByCaseId(Long caseId);

    List<CaseMatch> findByCaseIdAndStatus(Long caseId, String status);

    Optional<CaseMatch> findByCaseIdAndProviderIdAndProviderRole(Long caseId, Integer providerId, String providerRole);

    List<CaseMatch> findByProviderIdAndProviderRoleAndStatus(Integer providerId, String providerRole, String status);
}
