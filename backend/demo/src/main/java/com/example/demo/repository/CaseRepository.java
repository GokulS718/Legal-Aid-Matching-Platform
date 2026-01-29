package com.example.demo.repository;

import com.example.demo.entity.Case;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CaseRepository extends JpaRepository<Case, Long> {
    
    List<Case> findByCitizenIdOrderByUpdatedAtDesc(Integer citizenId);

    List<Case> findByIdIn(List<Long> ids);
    
    Optional<Case> findFirstByCitizenIdAndIsSubmittedFalseOrderByUpdatedAtDesc(Integer citizenId);
    
    List<Case> findByCitizenIdAndIsSubmittedTrue(Integer citizenId);
    
    Optional<Case> findByIdAndCitizenId(Long id, Integer citizenId);
}

