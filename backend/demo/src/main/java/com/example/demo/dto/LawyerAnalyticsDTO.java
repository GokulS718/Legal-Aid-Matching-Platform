package com.example.demo.dto;

import java.util.List;
import java.util.Map;

public class LawyerAnalyticsDTO {
    private long totalAppointments;
    private long confirmedAppointments;
    private long pendingAppointments;

    private long allTimeAppointments;
    private long allTimeConfirmedAppointments;
    private long allTimePendingAppointments;
    
    private double confirmationRate; // Percentage
    
    // Map of Month Name -> Total Appointments
    private Map<String, Long> monthlyTotal;
    // Map of Month Name -> Confirmed Appointments
    private Map<String, Long> monthlyConfirmed;
    // Map of Month Name -> Pending Appointments
    private Map<String, Long> monthlyPending;
    // Map of Month Name -> Rejected Appointments
    private Map<String, Long> monthlyRejected;
    
    // Breakdown by type (Online, In-Person)
    private Map<String, Long> appointmentTypeBreakdown;
    
    private List<AppointmentDTO> upcomingAppointments;
    
    // We can reuse AppointmentDTO or create a simpler inner class for upcoming
    public static class AppointmentDTO {
        private Long id;
        private String clientName;
        private String date; // Formatted date string
        private String time; // Formatted time string
        private String status;
        private String type;
        private String description;
        
        public AppointmentDTO(Long id, String clientName, String date, String time, String status, String type, String description) {
            this.id = id;
            this.clientName = clientName;
            this.date = date;
            this.time = time;
            this.status = status;
            this.type = type;
            this.description = description;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getClientName() { return clientName; }
        public void setClientName(String clientName) { this.clientName = clientName; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public String getTime() { return time; }
        public void setTime(String time) { this.time = time; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public long getTotalAppointments() {
        return totalAppointments;
    }

    public void setTotalAppointments(long totalAppointments) {
        this.totalAppointments = totalAppointments;
    }

    public long getConfirmedAppointments() {
        return confirmedAppointments;
    }

    public void setConfirmedAppointments(long confirmedAppointments) {
        this.confirmedAppointments = confirmedAppointments;
    }

    public long getAllTimeAppointments() {
        return allTimeAppointments;
    }

    public void setAllTimeAppointments(long allTimeAppointments) {
        this.allTimeAppointments = allTimeAppointments;
    }

    public double getConfirmationRate() {
        return confirmationRate;
    }

    public void setConfirmationRate(double confirmationRate) {
        this.confirmationRate = confirmationRate;
    }

    public Map<String, Long> getMonthlyTotal() {
        return monthlyTotal;
    }

    public void setMonthlyTotal(Map<String, Long> monthlyTotal) {
        this.monthlyTotal = monthlyTotal;
    }

    public Map<String, Long> getMonthlyConfirmed() {
        return monthlyConfirmed;
    }

    public void setMonthlyConfirmed(Map<String, Long> monthlyConfirmed) {
        this.monthlyConfirmed = monthlyConfirmed;
    }

    public Map<String, Long> getAppointmentTypeBreakdown() {
        return appointmentTypeBreakdown;
    }

    public void setAppointmentTypeBreakdown(Map<String, Long> appointmentTypeBreakdown) {
        this.appointmentTypeBreakdown = appointmentTypeBreakdown;
    }

    public List<AppointmentDTO> getUpcomingAppointments() {
        return upcomingAppointments;
    }

    public void setUpcomingAppointments(List<AppointmentDTO> upcomingAppointments) {
        this.upcomingAppointments = upcomingAppointments;
    }

    public long getPendingAppointments() {
        return pendingAppointments;
    }

    public void setPendingAppointments(long pendingAppointments) {
        this.pendingAppointments = pendingAppointments;
    }

    public long getAllTimeConfirmedAppointments() {
        return allTimeConfirmedAppointments;
    }

    public void setAllTimeConfirmedAppointments(long allTimeConfirmedAppointments) {
        this.allTimeConfirmedAppointments = allTimeConfirmedAppointments;
    }

    public long getAllTimePendingAppointments() {
        return allTimePendingAppointments;
    }

    public void setAllTimePendingAppointments(long allTimePendingAppointments) {
        this.allTimePendingAppointments = allTimePendingAppointments;
    }

    public Map<String, Long> getMonthlyPending() {
        return monthlyPending;
    }

    public void setMonthlyPending(Map<String, Long> monthlyPending) {
        this.monthlyPending = monthlyPending;
    }

    private long rejectedAppointments;
    private long allTimeRejectedAppointments;

    public long getRejectedAppointments() { return rejectedAppointments; }
    public void setRejectedAppointments(long rejectedAppointments) { this.rejectedAppointments = rejectedAppointments; }

    public long getAllTimeRejectedAppointments() { return allTimeRejectedAppointments; }
    public void setAllTimeRejectedAppointments(long allTimeRejectedAppointments) { this.allTimeRejectedAppointments = allTimeRejectedAppointments; }

    public Map<String, Long> getMonthlyRejected() { return monthlyRejected; }
    public void setMonthlyRejected(Map<String, Long> monthlyRejected) { this.monthlyRejected = monthlyRejected; }

    private List<InteractionDTO> recentInteractions;

    public static class InteractionDTO {
        private Long id;
        private String clientName;
        private String lastMessage;
        private String timestamp;
        private String type;

        public InteractionDTO(Long id, String clientName, String lastMessage, String timestamp, String type) {
            this.id = id;
            this.clientName = clientName;
            this.lastMessage = lastMessage;
            this.timestamp = timestamp;
            this.type = type;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getClientName() { return clientName; }
        public void setClientName(String clientName) { this.clientName = clientName; }
        public String getLastMessage() { return lastMessage; }
        public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }

    public List<InteractionDTO> getRecentInteractions() {
        return recentInteractions;
    }

    public void setRecentInteractions(List<InteractionDTO> recentInteractions) {
        this.recentInteractions = recentInteractions;
    }
}
