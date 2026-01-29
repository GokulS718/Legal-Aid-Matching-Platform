package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ngos")
public class NGO {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @JsonProperty("ngoName")
    @Column(name = "ngo_name", nullable = false)
    private String ngoName;

    @JsonProperty("ngoType")
    @Column(name = "ngo_type", nullable = false)
    private String ngoType;

    @JsonProperty("registrationNumber")
    @Column(name = "registration_number", nullable = false, unique = true)
    private String registrationNumber;

    @Column(name = "registration_certificate_url", length = 500)
    private String registrationCertificateUrl;

    @Column(name = "registration_certificate_filename")
    private String registrationCertificateFilename;

    @JsonProperty("contact")
    @Column(name = "contact", nullable = false)
    private String contact;

    @JsonProperty("email")
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @JsonProperty("address")
    @Column(name = "address", nullable = false, columnDefinition = "TEXT")
    private String address;

    @JsonProperty("state")
    @Column(name = "state", nullable = false)
    private String state;

    @JsonProperty("district")
    @Column(name = "district", nullable = false)
    private String district;

    @JsonProperty("city")
    @Column(name = "city", nullable = false)
    private String city;

    @JsonProperty("pincode")
    @Column(name = "pincode", nullable = false)
    private String pincode;

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

    public String getNgoName() {
        return ngoName;
    }

    public void setNgoName(String ngoName) {
        this.ngoName = ngoName;
    }

    public String getNgoType() {
        return ngoType;
    }

    public void setNgoType(String ngoType) {
        this.ngoType = ngoType;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getRegistrationCertificateUrl() {
        return registrationCertificateUrl;
    }

    public void setRegistrationCertificateUrl(String registrationCertificateUrl) {
        this.registrationCertificateUrl = registrationCertificateUrl;
    }

    public String getRegistrationCertificateFilename() {
        return registrationCertificateFilename;
    }

    public void setRegistrationCertificateFilename(String registrationCertificateFilename) {
        this.registrationCertificateFilename = registrationCertificateFilename;
    }

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
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

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
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
