package com.example.demo.repository;

import com.example.demo.entity.NGO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NGORepository extends JpaRepository<NGO, Integer> {

    // For citizen \"Find NGO\" page (verified/unverified lists)
    List<NGO> findByVerificationStatusTrue();

    List<NGO> findByVerificationStatusFalse();
    
    // Count methods for admin stats
    long countByVerificationStatusTrue();

    // For validations during registration
    boolean existsByEmail(String email);

    boolean existsByRegistrationNumber(String registrationNumber);

    // For login in AuthController (role = \"NGO\")
    NGO findByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT n FROM NGO n WHERE n.isApproved = true AND LOWER(n.ngoType) LIKE LOWER(CONCAT('%', :ngoType, '%'))")
    List<NGO> findMatches(@Param("ngoType") String ngoType);
}
