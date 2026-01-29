package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "citizen_cases")
public class Case {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "citizen_id", nullable = false)
    private Integer citizenId;

    @Column(name = "case_number", unique = true)
    private String caseNumber;

    // Step 0: Applicant Details
    @Column(name = "applicant_name")
    private String applicantName;

    @Column(name = "email")
    private String email;

    @Column(name = "mobile")
    private String mobile;

    @Column(name = "aadhaar")
    private String aadhaar;

    // Step 1: Victim Details
    @Column(name = "victim_name")
    private String victimName;

    @Column(name = "relation")
    private String relation;

    @Column(name = "victim_gender")
    private String victimGender;

    @Column(name = "victim_age")
    private Integer victimAge;

    // Step 2: Case Details
    @Column(name = "case_title")
    private String caseTitle;

    @Column(name = "case_type")
    private String caseType;

    // Step 3: Incident Details
    @Column(name = "incident_date")
    private LocalDate incidentDate;

    @Column(name = "incident_place")
    private String incidentPlace;

    @Column(name = "urgency")
    private String urgency;

    // Step 4: Legal Preference
    @Column(name = "specialization")
    private String specialization;

    @Column(name = "court_type")
    private String courtType;

    @Column(name = "seeking_ngo_help")
    private String seekingNgoHelp;

    @Column(name = "ngo_type")
    private String ngoType;

    // Step 5: Case Explanation
    @Column(name = "background", columnDefinition = "TEXT")
    private String background;

    @Column(name = "relief", columnDefinition = "TEXT")
    private String relief;

    // Step 6: Documents
    @Column(name = "documents_url", columnDefinition = "TEXT")
    private String documentsUrl;

    /** When true, assigned lawyers/NGOs can see case documents when viewing case details. */
    @Column(name = "documents_shared_with_providers", nullable = false, columnDefinition = "boolean default true")
    private Boolean documentsSharedWithProviders = true;

    // Metadata
    @Column(name = "current_step")
    private Integer currentStep = 0;

    @Column(name = "is_submitted")
    private Boolean isSubmitted = false;

    @Column(name = "status")
    private String status = "DRAFT";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (caseNumber == null) {
            caseNumber = "CASE-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getCitizenId() { return citizenId; }
    public void setCitizenId(Integer citizenId) { this.citizenId = citizenId; }

    public String getCaseNumber() { return caseNumber; }
    public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }

    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getAadhaar() { return aadhaar; }
    public void setAadhaar(String aadhaar) { this.aadhaar = aadhaar; }

    public String getVictimName() { return victimName; }
    public void setVictimName(String victimName) { this.victimName = victimName; }

    public String getRelation() { return relation; }
    public void setRelation(String relation) { this.relation = relation; }

    public String getVictimGender() { return victimGender; }
    public void setVictimGender(String victimGender) { this.victimGender = victimGender; }

    public Integer getVictimAge() { return victimAge; }
    public void setVictimAge(Integer victimAge) { this.victimAge = victimAge; }

    public String getCaseTitle() { return caseTitle; }
    public void setCaseTitle(String caseTitle) { this.caseTitle = caseTitle; }

    public String getCaseType() { return caseType; }
    public void setCaseType(String caseType) { this.caseType = caseType; }

    public LocalDate getIncidentDate() { return incidentDate; }
    public void setIncidentDate(LocalDate incidentDate) { this.incidentDate = incidentDate; }

    public String getIncidentPlace() { return incidentPlace; }
    public void setIncidentPlace(String incidentPlace) { this.incidentPlace = incidentPlace; }

    public String getUrgency() { return urgency; }
    public void setUrgency(String urgency) { this.urgency = urgency; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getCourtType() { return courtType; }
    public void setCourtType(String courtType) { this.courtType = courtType; }

    public String getSeekingNgoHelp() { return seekingNgoHelp; }
    public void setSeekingNgoHelp(String seekingNgoHelp) { this.seekingNgoHelp = seekingNgoHelp; }

    public String getNgoType() { return ngoType; }
    public void setNgoType(String ngoType) { this.ngoType = ngoType; }

    public String getBackground() { return background; }
    public void setBackground(String background) { this.background = background; }

    public String getRelief() { return relief; }
    public void setRelief(String relief) { this.relief = relief; }

    public String getDocumentsUrl() { return documentsUrl; }
    public void setDocumentsUrl(String documentsUrl) { this.documentsUrl = documentsUrl; }

    public Boolean getDocumentsSharedWithProviders() { return documentsSharedWithProviders != null ? documentsSharedWithProviders : true; }
    public void setDocumentsSharedWithProviders(Boolean documentsSharedWithProviders) { this.documentsSharedWithProviders = documentsSharedWithProviders; }

    public Integer getCurrentStep() { return currentStep; }
    public void setCurrentStep(Integer currentStep) { this.currentStep = currentStep; }

    public Boolean getIsSubmitted() { return isSubmitted; }
    public void setIsSubmitted(Boolean isSubmitted) { this.isSubmitted = isSubmitted; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

