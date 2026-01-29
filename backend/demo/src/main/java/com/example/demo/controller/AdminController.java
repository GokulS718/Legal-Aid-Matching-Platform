package com.example.demo.controller;

import com.example.demo.entity.Case;
import com.example.demo.entity.Lawyer;
import com.example.demo.entity.NGO;
import com.example.demo.repository.CaseRepository;
import com.example.demo.repository.CitizenRepository;
import com.example.demo.repository.LawyerRepository;
import com.example.demo.repository.NGORepository;
import com.example.demo.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final CaseRepository caseRepository;
    private final CitizenRepository citizenRepository;
    private final LawyerRepository lawyerRepository;
    private final NGORepository ngoRepository;
    private final JwtUtil jwtUtil;

    public AdminController(
            CaseRepository caseRepository,
            CitizenRepository citizenRepository,
            LawyerRepository lawyerRepository,
            NGORepository ngoRepository,
            JwtUtil jwtUtil) {
        this.caseRepository = caseRepository;
        this.citizenRepository = citizenRepository;
        this.lawyerRepository = lawyerRepository;
        this.ngoRepository = ngoRepository;
        this.jwtUtil = jwtUtil;
    }

    // Extract userId from JWT token
    private Integer extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        try {
            return jwtUtil.extractClaim(token, claims -> claims.get("userId", Integer.class));
        } catch (Exception e) {
            return null;
        }
    }

    // Extract role from JWT token
    private String extractUserRole(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        try {
            return jwtUtil.extractRole(token);
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(@RequestHeader("Authorization") String authHeader) {
        try {
            Integer userId = extractUserId(authHeader);
            String role = extractUserRole(authHeader);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }

            if (!"ADMIN".equalsIgnoreCase(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Admin role required.");
            }

            // Get counts efficiently using count() method
            long totalCases = caseRepository.count();
            long totalCitizens = citizenRepository.count();
            long totalLawyers = lawyerRepository.count();
            long totalNGOs = ngoRepository.count();
            
            // Get verified counts using efficient count queries
            long verifiedLawyers = lawyerRepository.countByVerificationStatusTrue();
            long verifiedNGOs = ngoRepository.countByVerificationStatusTrue();

            // Debug logging
            System.out.println("DEBUG: [AdminController] Stats calculated:");
            System.out.println("  - Total Cases: " + totalCases);
            System.out.println("  - Total Citizens: " + totalCitizens);
            System.out.println("  - Total Lawyers: " + totalLawyers);
            System.out.println("  - Total NGOs: " + totalNGOs);
            System.out.println("  - Verified Lawyers: " + verifiedLawyers);
            System.out.println("  - Verified NGOs: " + verifiedNGOs);

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalCases", totalCases);
            stats.put("totalCitizens", totalCitizens);
            stats.put("lawyers", totalLawyers);
            stats.put("ngos", totalNGOs);
            stats.put("verifiedLawyers", verifiedLawyers);
            stats.put("verifiedNGOs", verifiedNGOs);

            System.out.println("DEBUG: [AdminController] Returning stats: " + stats);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching stats: " + e.getMessage());
        }
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(@RequestHeader("Authorization") String authHeader) {
        try {
            Integer userId = extractUserId(authHeader);
            String role = extractUserRole(authHeader);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }

            if (!"ADMIN".equalsIgnoreCase(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Admin role required.");
            }

            Map<String, Object> analytics = new HashMap<>();

            // Get all data
            List<Case> allCases = caseRepository.findAll();
            List<Lawyer> allLawyers = lawyerRepository.findAll();
            List<NGO> allNGOs = ngoRepository.findAll();

            // Cases by Specialization
            Map<String, Long> casesBySpecialization = allCases.stream()
                    .filter(c -> c.getSpecialization() != null && !c.getSpecialization().isEmpty())
                    .collect(Collectors.groupingBy(
                            Case::getSpecialization,
                            Collectors.counting()
                    ));
            analytics.put("casesBySpecialization", casesBySpecialization);

            // Cases by Type
            Map<String, Long> casesByType = allCases.stream()
                    .filter(c -> c.getCaseType() != null && !c.getCaseType().isEmpty())
                    .collect(Collectors.groupingBy(
                            Case::getCaseType,
                            Collectors.counting()
                    ));
            analytics.put("casesByType", casesByType);

            // Cases by Status
            Map<String, Long> casesByStatus = allCases.stream()
                    .filter(c -> c.getStatus() != null)
                    .collect(Collectors.groupingBy(
                            Case::getStatus,
                            Collectors.counting()
                    ));
            analytics.put("casesByStatus", casesByStatus);

            // Cases by Urgency
            Map<String, Long> casesByUrgency = allCases.stream()
                    .filter(c -> c.getUrgency() != null && !c.getUrgency().isEmpty())
                    .collect(Collectors.groupingBy(
                            Case::getUrgency,
                            Collectors.counting()
                    ));
            analytics.put("casesByUrgency", casesByUrgency);

            // Cases by Victim Gender
            Map<String, Long> casesByGender = allCases.stream()
                    .filter(c -> c.getVictimGender() != null && !c.getVictimGender().isEmpty())
                    .collect(Collectors.groupingBy(
                            Case::getVictimGender,
                            Collectors.counting()
                    ));
            analytics.put("casesByGender", casesByGender);

            // Cases by Victim Age Groups
            Map<String, Long> casesByAgeGroup = allCases.stream()
                    .filter(c -> c.getVictimAge() != null)
                    .collect(Collectors.groupingBy(
                            c -> {
                                int age = c.getVictimAge();
                                if (age < 18) return "Under 18";
                                else if (age < 30) return "18-29";
                                else if (age < 45) return "30-44";
                                else if (age < 60) return "45-59";
                                else return "60+";
                            },
                            Collectors.counting()
                    ));
            analytics.put("casesByAgeGroup", casesByAgeGroup);

            // Cases by Court Type
            Map<String, Long> casesByCourtType = allCases.stream()
                    .filter(c -> c.getCourtType() != null && !c.getCourtType().isEmpty())
                    .collect(Collectors.groupingBy(
                            Case::getCourtType,
                            Collectors.counting()
                    ));
            analytics.put("casesByCourtType", casesByCourtType);

            // Cases Seeking NGO Help
            Map<String, Long> casesSeekingNGO = allCases.stream()
                    .filter(c -> c.getSeekingNgoHelp() != null && !c.getSeekingNgoHelp().isEmpty())
                    .collect(Collectors.groupingBy(
                            Case::getSeekingNgoHelp,
                            Collectors.counting()
                    ));
            analytics.put("casesSeekingNGO", casesSeekingNGO);

            // Lawyers by Specialization
            Map<String, Long> lawyersBySpecialization = allLawyers.stream()
                    .filter(l -> l.getSpecialization() != null && !l.getSpecialization().isEmpty())
                    .collect(Collectors.groupingBy(
                            Lawyer::getSpecialization,
                            Collectors.counting()
                    ));
            analytics.put("lawyersBySpecialization", lawyersBySpecialization);

            // Lawyers by State
            Map<String, Long> lawyersByState = allLawyers.stream()
                    .filter(l -> l.getState() != null && !l.getState().isEmpty())
                    .collect(Collectors.groupingBy(
                            Lawyer::getState,
                            Collectors.counting()
                    ));
            analytics.put("lawyersByState", lawyersByState);

            // Lawyers by Verification Status
            Map<String, Long> lawyersByVerification = allLawyers.stream()
                    .collect(Collectors.groupingBy(
                            l -> l.isVerificationStatus() ? "Verified" : "Unverified",
                            Collectors.counting()
                    ));
            analytics.put("lawyersByVerification", lawyersByVerification);

            // Lawyers by City (Top 10)
            Map<String, Long> lawyersByCity = allLawyers.stream()
                    .filter(l -> l.getCity() != null && !l.getCity().isEmpty())
                    .collect(Collectors.groupingBy(
                            Lawyer::getCity,
                            Collectors.counting()
                    ));
            // Sort and get top 10
            Map<String, Long> topCitiesLawyers = lawyersByCity.entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .limit(10)
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            Map.Entry::getValue,
                            (e1, e2) -> e1,
                            LinkedHashMap::new
                    ));
            analytics.put("lawyersByCity", topCitiesLawyers);

            // Lawyers by District (Top 10)
            Map<String, Long> lawyersByDistrict = allLawyers.stream()
                    .filter(l -> l.getDistrict() != null && !l.getDistrict().isEmpty())
                    .collect(Collectors.groupingBy(
                            Lawyer::getDistrict,
                            Collectors.counting()
                    ));
            Map<String, Long> topDistrictsLawyers = lawyersByDistrict.entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .limit(10)
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            Map.Entry::getValue,
                            (e1, e2) -> e1,
                            LinkedHashMap::new
                    ));
            analytics.put("lawyersByDistrict", topDistrictsLawyers);

            // Lawyers by Experience Years (Grouped)
            Map<String, Long> lawyersByExperience = allLawyers.stream()
                    .filter(l -> l.getExperienceYears() != null)
                    .collect(Collectors.groupingBy(
                            l -> {
                                int exp = l.getExperienceYears();
                                if (exp < 2) return "0-2 years";
                                else if (exp < 5) return "2-5 years";
                                else if (exp < 10) return "5-10 years";
                                else if (exp < 20) return "10-20 years";
                                else return "20+ years";
                            },
                            Collectors.counting()
                    ));
            analytics.put("lawyersByExperience", lawyersByExperience);

            // NGOs by Type
            Map<String, Long> ngosByType = allNGOs.stream()
                    .filter(n -> n.getNgoType() != null && !n.getNgoType().isEmpty())
                    .collect(Collectors.groupingBy(
                            NGO::getNgoType,
                            Collectors.counting()
                    ));
            analytics.put("ngosByType", ngosByType);

            // NGOs by State
            Map<String, Long> ngosByState = allNGOs.stream()
                    .filter(n -> n.getState() != null && !n.getState().isEmpty())
                    .collect(Collectors.groupingBy(
                            NGO::getState,
                            Collectors.counting()
                    ));
            analytics.put("ngosByState", ngosByState);

            // NGOs by Verification Status
            Map<String, Long> ngosByVerification = allNGOs.stream()
                    .collect(Collectors.groupingBy(
                            n -> n.isVerificationStatus() ? "Verified" : "Unverified",
                            Collectors.counting()
                    ));
            analytics.put("ngosByVerification", ngosByVerification);

            // NGOs by City (Top 10)
            Map<String, Long> ngosByCity = allNGOs.stream()
                    .filter(n -> n.getCity() != null && !n.getCity().isEmpty())
                    .collect(Collectors.groupingBy(
                            NGO::getCity,
                            Collectors.counting()
                    ));
            Map<String, Long> topCitiesNGOs = ngosByCity.entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .limit(10)
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            Map.Entry::getValue,
                            (e1, e2) -> e1,
                            LinkedHashMap::new
                    ));
            analytics.put("ngosByCity", topCitiesNGOs);

            // NGOs by District (Top 10)
            Map<String, Long> ngosByDistrict = allNGOs.stream()
                    .filter(n -> n.getDistrict() != null && !n.getDistrict().isEmpty())
                    .collect(Collectors.groupingBy(
                            NGO::getDistrict,
                            Collectors.counting()
                    ));
            Map<String, Long> topDistrictsNGOs = ngosByDistrict.entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .limit(10)
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            Map.Entry::getValue,
                            (e1, e2) -> e1,
                            LinkedHashMap::new
                    ));
            analytics.put("ngosByDistrict", topDistrictsNGOs);

            // Time-based analytics - Cases created over last 30 days
            Map<String, Long> casesOverTime = new LinkedHashMap<>();
            LocalDate today = LocalDate.now();
            for (int i = 29; i >= 0; i--) {
                LocalDate date = today.minusDays(i);
                String dateStr = date.format(DateTimeFormatter.ISO_LOCAL_DATE);
                long count = allCases.stream()
                        .filter(c -> c.getCreatedAt() != null)
                        .filter(c -> {
                            LocalDate caseDate = c.getCreatedAt().toLocalDate();
                            return caseDate.equals(date);
                        })
                        .count();
                casesOverTime.put(dateStr, count);
            }
            analytics.put("casesOverTime", casesOverTime);

            // Time-based analytics - Lawyers registered over last 30 days
            Map<String, Long> lawyersOverTime = new LinkedHashMap<>();
            for (int i = 29; i >= 0; i--) {
                LocalDate date = today.minusDays(i);
                String dateStr = date.format(DateTimeFormatter.ISO_LOCAL_DATE);
                long count = allLawyers.stream()
                        .filter(l -> l.getCreatedAt() != null)
                        .filter(l -> {
                            LocalDate lawyerDate = l.getCreatedAt().toLocalDate();
                            return lawyerDate.equals(date);
                        })
                        .count();
                lawyersOverTime.put(dateStr, count);
            }
            analytics.put("lawyersOverTime", lawyersOverTime);

            // Time-based analytics - NGOs registered over last 30 days
            Map<String, Long> ngosOverTime = new LinkedHashMap<>();
            for (int i = 29; i >= 0; i--) {
                LocalDate date = today.minusDays(i);
                String dateStr = date.format(DateTimeFormatter.ISO_LOCAL_DATE);
                long count = allNGOs.stream()
                        .filter(n -> n.getCreatedAt() != null)
                        .filter(n -> {
                            LocalDate ngoDate = n.getCreatedAt().toLocalDate();
                            return ngoDate.equals(date);
                        })
                        .count();
                ngosOverTime.put(dateStr, count);
            }
            analytics.put("ngosOverTime", ngosOverTime);

            // Weekly trends (last 4 weeks)
            Map<String, Map<String, Long>> weeklyTrends = new LinkedHashMap<>();
            for (int week = 3; week >= 0; week--) {
                LocalDate weekStart = today.minusDays(week * 7 + 6);
                LocalDate weekEnd = today.minusDays(week * 7);
                String weekLabel = "Week " + (4 - week) + " (" + weekStart.format(DateTimeFormatter.ofPattern("MMM dd")) + ")";
                
                Map<String, Long> weekData = new HashMap<>();
                weekData.put("Cases", allCases.stream()
                        .filter(c -> c.getCreatedAt() != null)
                        .filter(c -> {
                            LocalDate caseDate = c.getCreatedAt().toLocalDate();
                            return !caseDate.isBefore(weekStart) && !caseDate.isAfter(weekEnd);
                        })
                        .count());
                weekData.put("Lawyers", allLawyers.stream()
                        .filter(l -> l.getCreatedAt() != null)
                        .filter(l -> {
                            LocalDate lawyerDate = l.getCreatedAt().toLocalDate();
                            return !lawyerDate.isBefore(weekStart) && !lawyerDate.isAfter(weekEnd);
                        })
                        .count());
                weekData.put("NGOs", allNGOs.stream()
                        .filter(n -> n.getCreatedAt() != null)
                        .filter(n -> {
                            LocalDate ngoDate = n.getCreatedAt().toLocalDate();
                            return !ngoDate.isBefore(weekStart) && !ngoDate.isAfter(weekEnd);
                        })
                        .count());
                weeklyTrends.put(weekLabel, weekData);
            }
            analytics.put("weeklyTrends", weeklyTrends);

            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching analytics: " + e.getMessage());
        }
    }

    // Get all cases with filtering and pagination for admin
    @GetMapping("/cases")
    public ResponseEntity<?> getAllCases(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String caseType,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String urgency,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Integer userId = extractUserId(authHeader);
            String role = extractUserRole(authHeader);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }

            if (!"ADMIN".equalsIgnoreCase(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Admin role required.");
            }

            // Get all cases
            List<Case> allCases = caseRepository.findAll();

            // Apply filters
            List<Case> filteredCases = allCases.stream()
                    .filter(c -> status == null || status.isEmpty() || 
                            (c.getStatus() != null && c.getStatus().equalsIgnoreCase(status)))
                    .filter(c -> caseType == null || caseType.isEmpty() || 
                            (c.getCaseType() != null && c.getCaseType().equalsIgnoreCase(caseType)))
                    .filter(c -> specialization == null || specialization.isEmpty() || 
                            (c.getSpecialization() != null && c.getSpecialization().equalsIgnoreCase(specialization)))
                    .filter(c -> urgency == null || urgency.isEmpty() || 
                            (c.getUrgency() != null && c.getUrgency().equalsIgnoreCase(urgency)))
                    .filter(c -> {
                        if (search == null || search.isEmpty()) return true;
                        String searchLower = search.toLowerCase();
                        return (c.getCaseNumber() != null && c.getCaseNumber().toLowerCase().contains(searchLower)) ||
                               (c.getCaseTitle() != null && c.getCaseTitle().toLowerCase().contains(searchLower)) ||
                               (c.getApplicantName() != null && c.getApplicantName().toLowerCase().contains(searchLower)) ||
                               (c.getVictimName() != null && c.getVictimName().toLowerCase().contains(searchLower));
                    })
                    .filter(c -> {
                        if (startDate == null || startDate.isEmpty()) return true;
                        try {
                            LocalDate start = LocalDate.parse(startDate);
                            return c.getCreatedAt() != null && !c.getCreatedAt().toLocalDate().isBefore(start);
                        } catch (Exception e) {
                            return true;
                        }
                    })
                    .filter(c -> {
                        if (endDate == null || endDate.isEmpty()) return true;
                        try {
                            LocalDate end = LocalDate.parse(endDate);
                            return c.getCreatedAt() != null && !c.getCreatedAt().toLocalDate().isAfter(end);
                        } catch (Exception e) {
                            return true;
                        }
                    })
                    .sorted((a, b) -> {
                        // Sort by updated date descending (newest first)
                        if (a.getUpdatedAt() == null && b.getUpdatedAt() == null) return 0;
                        if (a.getUpdatedAt() == null) return 1;
                        if (b.getUpdatedAt() == null) return -1;
                        return b.getUpdatedAt().compareTo(a.getUpdatedAt());
                    })
                    .collect(Collectors.toList());

            // Pagination
            int total = filteredCases.size();
            int start = page * size;
            int end = Math.min(start + size, total);
            List<Case> paginatedCases = start < total ? filteredCases.subList(start, end) : new ArrayList<>();

            // Get citizen names for each case
            Map<String, Object> result = new HashMap<>();
            result.put("cases", paginatedCases.stream().map(c -> {
                Map<String, Object> caseData = new HashMap<>();
                caseData.put("id", c.getId());
                caseData.put("caseNumber", c.getCaseNumber());
                caseData.put("caseTitle", c.getCaseTitle());
                caseData.put("caseType", c.getCaseType());
                caseData.put("status", c.getStatus());
                caseData.put("urgency", c.getUrgency());
                caseData.put("specialization", c.getSpecialization());
                caseData.put("applicantName", c.getApplicantName());
                caseData.put("victimName", c.getVictimName());
                caseData.put("incidentDate", c.getIncidentDate());
                caseData.put("incidentPlace", c.getIncidentPlace());
                caseData.put("isSubmitted", c.getIsSubmitted());
                caseData.put("createdAt", c.getCreatedAt());
                caseData.put("updatedAt", c.getUpdatedAt());
                caseData.put("citizenId", c.getCitizenId());
                
                // Get citizen name
                citizenRepository.findById(c.getCitizenId()).ifPresent(citizen -> {
                    caseData.put("citizenName", citizen.getFullName());
                    caseData.put("citizenEmail", citizen.getEmail());
                    caseData.put("citizenMobile", citizen.getMobileNum());
                });
                
                return caseData;
            }).collect(Collectors.toList()));
            
            result.put("total", total);
            result.put("page", page);
            result.put("size", size);
            result.put("totalPages", (int) Math.ceil((double) total / size));

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching cases: " + e.getMessage());
        }
    }
}
