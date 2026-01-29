package com.example.demo.repository;

import com.example.demo.entity.LawyerUnavailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LawyerUnavailabilityRepository extends JpaRepository<LawyerUnavailability, Long> {
    
    List<LawyerUnavailability> findByLawyerId(Integer lawyerId);
    
    List<LawyerUnavailability> findByLawyerIdOrderByStartTimeAsc(Integer lawyerId);
    
    // Find unavailability periods that overlap with a given time range
    List<LawyerUnavailability> findByLawyerIdAndStartTimeLessThanAndEndTimeGreaterThan(
        Integer lawyerId, LocalDateTime endTime, LocalDateTime startTime);
    
    // Find unavailability periods for a specific date range
    List<LawyerUnavailability> findByLawyerIdAndStartTimeBetweenOrLawyerIdAndEndTimeBetween(
        Integer lawyerId, LocalDateTime start1, LocalDateTime end1,
        Integer lawyerId2, LocalDateTime start2, LocalDateTime end2);
    
    void deleteByLawyerId(Integer lawyerId);
}
