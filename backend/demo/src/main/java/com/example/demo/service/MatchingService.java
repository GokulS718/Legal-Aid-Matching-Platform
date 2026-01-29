package com.example.demo.service;

import com.example.demo.entity.Case;
import com.example.demo.entity.Lawyer;
import com.example.demo.entity.NGO;
import com.example.demo.repository.CaseRepository;
import com.example.demo.repository.LawyerRepository;
import com.example.demo.repository.NGORepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class MatchingService {

    private final CaseRepository caseRepository;
    private final LawyerRepository lawyerRepository;
    private final NGORepository ngoRepository;
    private final NotificationService notificationService;
    private final com.example.demo.repository.CaseMatchRepository caseMatchRepository;

    public MatchingService(CaseRepository caseRepository, LawyerRepository lawyerRepository,
            NGORepository ngoRepository, NotificationService notificationService,
            com.example.demo.repository.CaseMatchRepository caseMatchRepository) {
        this.caseRepository = caseRepository;
        this.lawyerRepository = lawyerRepository;
        this.ngoRepository = ngoRepository;
        this.notificationService = notificationService;
        this.caseMatchRepository = caseMatchRepository;
    }

    public Map<String, Object> findMatchesForCase(Long caseId) {
        Optional<Case> caseOpt = caseRepository.findById(caseId);
        if (caseOpt.isEmpty()) {
            throw new RuntimeException("Case not found");
        }

        Case caseEntity = caseOpt.get();
        String specialization = caseEntity.getSpecialization();
        String ngoType = caseEntity.getNgoType();
        String location = caseEntity.getIncidentPlace();

        Map<String, Object> matches = new HashMap<>();
        int matchCount = 0;

        if (specialization != null && !specialization.isEmpty()) {
            List<Lawyer> matchedLawyers = lawyerRepository.findMatches(specialization);
            matches.put("lawyers", matchedLawyers);

            for (Lawyer lawyer : matchedLawyers) {
                saveMatchIfNotExists(caseId, lawyer.getId(), "LAWYER", 1.0); // Simple scoring
            }
            matchCount += matchedLawyers.size();
        }

        if (ngoType != null && !ngoType.isEmpty()) {
            List<NGO> matchedNgos = ngoRepository.findMatches(ngoType);
            matches.put("ngos", matchedNgos);

            for (NGO ngo : matchedNgos) {
                saveMatchIfNotExists(caseId, ngo.getId(), "NGO", 1.0);
            }
            matchCount += matchedNgos.size();
        }

        // Notify Citizen if matches found
        if (matchCount > 0) {
            notificationService.createNotification(
                    caseEntity.getCitizenId(),
                    "CITIZEN",
                    "Found " + matchCount + " matches for your case: "
                            + (caseEntity.getCaseTitle() != null ? caseEntity.getCaseTitle()
                                    : caseEntity.getCaseNumber()),
                    "MATCH",
                    caseEntity.getId());
        }

        return matches;
    }

    private void saveMatchIfNotExists(Long caseId, Integer providerId, String role, Double score) {
        if (caseMatchRepository.findByCaseIdAndProviderIdAndProviderRole(caseId, providerId, role).isEmpty()) {
            com.example.demo.entity.CaseMatch match = new com.example.demo.entity.CaseMatch(caseId, providerId, role,
                    score);
            caseMatchRepository.save(match);
        }
    }
}
