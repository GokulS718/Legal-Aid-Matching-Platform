package com.example.demo.controller;

import com.example.demo.entity.Lawyer;
import com.example.demo.repository.LawyerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/temp")
public class CredentialResetController {

    private final LawyerRepository lawyerRepository;

    public CredentialResetController(LawyerRepository lawyerRepository) {
        this.lawyerRepository = lawyerRepository;
    }

    @GetMapping("/reset-lawyer")
    public ResponseEntity<String> resetLawyerPassword(
            @RequestParam("email") String email,
            @RequestParam("newPassword") String newPassword) {
        Lawyer lawyer = lawyerRepository.findByEmail(email);
        if (lawyer == null) {
            return ResponseEntity.status(404).body("Lawyer not found with email: " + email);
        }
        lawyer.setPassword(newPassword);
        lawyerRepository.save(lawyer);
        return ResponseEntity.ok("Password reset successfully for " + email + " to " + newPassword);
    }
}
