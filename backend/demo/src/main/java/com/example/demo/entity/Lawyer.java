package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "lawyers")
public class Lawyer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @JsonProperty("fullName")
    @Column(name = "full_name", nullable = false)
    private String fullName;

    @JsonProperty("email")
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @JsonProperty("mobileNum")
    @Column(name = "mobile_number", nullable = false)
    private String mobileNum;

    @JsonProperty("aadharNum")
    @Column(name = "aadhar_number", nullable = false, unique = true)
    private String aadharNum;

    @Column(name = "aadhar_proof_url", length = 500)
    private String aadharProofUrl;

    @Column(name = "aadhar_proof_filename")
    private String aadharProofFilename;

    @JsonProperty("barCouncilId")
    @Column(name = "bar_council_id", nullable = false, unique = true)
    private String barCouncilId;

    @JsonProperty("barState")
    @Column(name = "bar_state", nullable = false)
    private String barState;

    @JsonProperty("specialization")
    @Column(name = "specialization", nullable = false)
    private String specialization;

    @Column(name = "bar_certificate_url", length = 500)
    private String barCertificateUrl;

    @Column(name = "bar_certificate_filename")
    private String barCertificateFilename;

    @JsonProperty("experience")
    @Column(name = "experience_years", nullable = false)
    private Integer experienceYears;

    @JsonProperty("address")
    @Column(name = "address", nullable = false, columnDefinition = "TEXT")
    private String address;

    @JsonProperty("district")
    @Column(name = "district", nullable = false)
    private String district;

    @JsonProperty("city")
    @Column(name = "city", nullable = false)
    private String city;

    @JsonProperty("state")
    @Column(name = "state", nullable = false)
    private String state;

    @JsonProperty("latitude")
    @Column(name = "latitude")
    private Double latitude;

    @JsonProperty("longitude")
    @Column(name = "longitude")
    private Double longitude;

    @JsonProperty("password")
    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "verification_status", nullable = false)
    private boolean verificationStatus = false; // Identity Verification (Badge)

    @JsonProperty("isApproved")
    @Column(name = "is_approved", nullable = false, columnDefinition = "boolean default false")
    private boolean isApproved = false; // Admin Approval (Visibility)

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @JsonProperty("adminStatus")
    @Column(name = "admin_status", nullable = false, columnDefinition = "varchar(255) default 'PENDING'")
    private String adminStatus = "PENDING"; // PENDING, APPROVED, REJECTED

    // GETTERS & SETTERS

    public String getAdminStatus() {
        return adminStatus;
    }

    public void setAdminStatus(String adminStatus) {
        this.adminStatus = adminStatus;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMobileNum() {
        return mobileNum;
    }

    public void setMobileNum(String mobileNum) {
        this.mobileNum = mobileNum;
    }

    public String getAadharNum() {
        return aadharNum;
    }

    public void setAadharNum(String aadharNum) {
        this.aadharNum = aadharNum;
    }

    public String getAadharProofUrl() {
        return aadharProofUrl;
    }

    public void setAadharProofUrl(String aadharProofUrl) {
        this.aadharProofUrl = aadharProofUrl;
    }

    public String getAadharProofFilename() {
        return aadharProofFilename;
    }

    public void setAadharProofFilename(String aadharProofFilename) {
        this.aadharProofFilename = aadharProofFilename;
    }

    public String getBarCouncilId() {
        return barCouncilId;
    }

    public void setBarCouncilId(String barCouncilId) {
        this.barCouncilId = barCouncilId;
    }

    public String getBarState() {
        return barState;
    }

    public void setBarState(String barState) {
        this.barState = barState;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getBarCertificateUrl() {
        return barCertificateUrl;
    }

    public void setBarCertificateUrl(String barCertificateUrl) {
        this.barCertificateUrl = barCertificateUrl;
    }

    public String getBarCertificateFilename() {
        return barCertificateFilename;
    }

    public void setBarCertificateFilename(String barCertificateFilename) {
        this.barCertificateFilename = barCertificateFilename;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public boolean isVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(boolean verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public boolean isApproved() {
        return isApproved;
    }

    public void setApproved(boolean approved) {
        isApproved = approved;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
