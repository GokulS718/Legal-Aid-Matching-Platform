package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.time.LocalTime;

public class UnavailabilityRequest {
    
    @JsonProperty("date")
    private String date; // Format: "YYYY-MM-DD"
    
    @JsonProperty("startTime")
    private String startTime; // Format: "HH:mm" (24-hour format)
    
    @JsonProperty("endTime")
    private String endTime; // Format: "HH:mm" (24-hour format)
    
    @JsonProperty("reason")
    private String reason;

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
