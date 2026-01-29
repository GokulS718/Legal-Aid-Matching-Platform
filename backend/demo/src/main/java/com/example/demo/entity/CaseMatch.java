package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "case_matches", indexes = {
        @Index(name = "idx_match_case_id", columnList = "case_id"),
        @Index(name = "idx_match_provider", columnList = "provider_id, provider_role")
})
public class CaseMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_id", nullable = false)
    private Long caseId;

    @Column(name = "provider_id", nullable = false)
    private Integer providerId;

    @Column(name = "provider_role", nullable = false)
    private String providerRole; // LAWYER, NGO

    @Column(name = "match_score")
    private Double matchScore; // Compatibility score

    @Column(name = "status")
    private String status = "SUGGESTED"; // SUGGESTED, CONTACTED, ACCEPTED, CANCELLED

    @Column(name = "appointment_id")
    private Long appointmentId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public CaseMatch() {
    }

    public CaseMatch(Long caseId, Integer providerId, String providerRole, Double matchScore) {
        this.caseId = caseId;
        this.providerId = providerId;
        this.providerRole = providerRole;
        this.matchScore = matchScore;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCaseId() {
        return caseId;
    }

    public void setCaseId(Long caseId) {
        this.caseId = caseId;
    }

    public Integer getProviderId() {
        return providerId;
    }

    public void setProviderId(Integer providerId) {
        this.providerId = providerId;
    }

    public String getProviderRole() {
        return providerRole;
    }

    public void setProviderRole(String providerRole) {
        this.providerRole = providerRole;
    }

    public Double getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(Double matchScore) {
        this.matchScore = matchScore;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }
}
