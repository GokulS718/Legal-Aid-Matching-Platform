package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.demo.entity.Admin;

public interface AdminRepository extends JpaRepository<Admin, Integer> {
    boolean existsByEmail(String email);
    boolean existsByAadharNum(String aadharNum);
    Admin findByEmail(String email);
    
    // Case-insensitive email lookup
    @Query("SELECT a FROM Admin a WHERE LOWER(a.email) = LOWER(:email)")
    Admin findByEmailIgnoreCase(@Param("email") String email);
}
