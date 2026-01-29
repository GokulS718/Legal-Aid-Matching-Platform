package com.example.demo.repository;

import com.example.demo.entity.Lawyer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LawyerRepository extends JpaRepository<Lawyer, Integer> {

    // already existing (KEEP THESE)
    boolean existsByEmail(String email);

    boolean existsByAadharNum(String aadharNum);

    boolean existsByBarCouncilId(String barCouncilId);

    Lawyer findByEmail(String email);

    // for verification-based filtering
    List<Lawyer> findByVerificationStatusTrue();
    
    // Count methods for admin stats
    long countByVerificationStatusTrue();

    // ✅ existing for directory search
    List<Lawyer> findByCity(String city);

    List<Lawyer> findBySpecialization(String specialization);

    List<Lawyer> findByCityAndSpecialization(String city, String specialization);

    @org.springframework.data.jpa.repository.Query("SELECT l FROM Lawyer l WHERE l.isApproved = true AND LOWER(l.specialization) LIKE LOWER(CONCAT('%', :specialization, '%'))")
    List<Lawyer> findMatches(@Param("specialization") String specialization);
}
