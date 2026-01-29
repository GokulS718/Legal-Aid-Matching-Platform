package com.example.demo.service;

import com.example.demo.entity.LawyerUnavailability;
import com.example.demo.repository.LawyerUnavailabilityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LawyerUnavailabilityService {

    private final LawyerUnavailabilityRepository unavailabilityRepository;

    public LawyerUnavailabilityService(LawyerUnavailabilityRepository unavailabilityRepository) {
        this.unavailabilityRepository = unavailabilityRepository;
    }

    public List<LawyerUnavailability> getLawyerUnavailability(Integer lawyerId) {
        return unavailabilityRepository.findByLawyerIdOrderByStartTimeAsc(lawyerId);
    }

    public LawyerUnavailability getUnavailabilityById(Long id) {
        return unavailabilityRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Unavailability record not found"));
    }

    public LawyerUnavailability saveUnavailability(LawyerUnavailability unavailability) {
        // Validate time range
        if (unavailability.getStartTime().isAfter(unavailability.getEndTime()) || 
            unavailability.getStartTime().equals(unavailability.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }
        
        // Check for overlapping unavailability periods
        List<LawyerUnavailability> overlapping = unavailabilityRepository
            .findByLawyerIdAndStartTimeLessThanAndEndTimeGreaterThan(
                unavailability.getLawyerId(),
                unavailability.getEndTime(),
                unavailability.getStartTime());
        
        // Exclude the current record if updating
        if (unavailability.getId() != null) {
            overlapping.removeIf(u -> u.getId().equals(unavailability.getId()));
        }
        
        if (!overlapping.isEmpty()) {
            throw new IllegalArgumentException("This time period overlaps with an existing unavailability period");
        }
        
        return unavailabilityRepository.save(unavailability);
    }

    public void deleteUnavailability(Long id) {
        unavailabilityRepository.deleteById(id);
    }

    @Transactional
    public void deleteAllUnavailability(Integer lawyerId) {
        unavailabilityRepository.deleteByLawyerId(lawyerId);
    }

    public boolean isUnavailable(Integer lawyerId, LocalDateTime startTime, LocalDateTime endTime) {
        List<LawyerUnavailability> overlapping = unavailabilityRepository
            .findByLawyerIdAndStartTimeLessThanAndEndTimeGreaterThan(
                lawyerId, endTime, startTime);
        return !overlapping.isEmpty();
    }
}
