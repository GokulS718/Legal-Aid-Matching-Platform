package com.example.demo;

import com.example.demo.entity.Case;
import com.example.demo.entity.Citizen;
import com.example.demo.repository.CaseRepository;
import com.example.demo.repository.CitizenRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Component
@Order(3) // Run after CitizenDataPopulator
public class CaseDataPopulator implements CommandLineRunner {

    private final CaseRepository caseRepository;
    private final CitizenRepository citizenRepository;
    private final Random random = new Random();

    // Case types
    private final List<String> caseTypes = Arrays.asList(
            "Criminal", "Civil", "Family", "Property", "Employment", "Consumer",
            "Domestic Violence", "Land Dispute", "Contract", "Tort", "Constitutional"
    );

    // Case titles based on type
    private final List<String> criminalTitles = Arrays.asList(
            "Theft Case", "Assault Case", "Fraud Case", "Harassment Case", "Property Damage Case"
    );
    private final List<String> civilTitles = Arrays.asList(
            "Property Dispute", "Contract Breach", "Land Ownership", "Rental Dispute", "Inheritance Dispute"
    );
    private final List<String> familyTitles = Arrays.asList(
            "Divorce Case", "Child Custody", "Maintenance Case", "Domestic Violence", "Property Division"
    );

    // Specializations
    private final List<String> specializations = Arrays.asList(
            "Criminal", "Civil", "Family", "Property", "Corporate", "Constitutional", "Employment"
    );

    // Court types
    private final List<String> courtTypes = Arrays.asList(
            "District Court", "High Court", "Supreme Court", "Family Court", "Consumer Court"
    );

    // Urgency levels
    private final List<String> urgencyLevels = Arrays.asList(
            "LOW", "MEDIUM", "HIGH", "URGENT"
    );

    // Relations
    private final List<String> relations = Arrays.asList(
            "Self", "Spouse", "Child", "Parent", "Sibling", "Relative", "Friend"
    );

    // Genders
    private final List<String> genders = Arrays.asList(
            "Male", "Female", "Other"
    );

    // Status options
    private final List<String> statuses = Arrays.asList(
            "DRAFT", "SUBMITTED", "UNDER_REVIEW", "MATCHED", "IN_PROGRESS", "CLOSED"
    );

    // Victim names (for cases where victim is not self)
    private final List<String> victimFirstNames = Arrays.asList(
            "Rohan", "Priya", "Arjun", "Sneha", "Vikram", "Anjali", "Rahul", "Kavita",
            "Suresh", "Meera", "Arjun", "Divya", "Kiran", "Pooja", "Nikhil", "Shreya"
    );

    private final List<String> victimLastNames = Arrays.asList(
            "Kumar", "Sharma", "Patel", "Singh", "Reddy", "Verma", "Gupta", "Mehta"
    );

    // Incident places
    private final List<String> incidentPlaces = Arrays.asList(
            "Residential Area", "Workplace", "Public Place", "Market", "School",
            "Hospital", "Government Office", "Private Property", "Road", "Park"
    );

    public CaseDataPopulator(CaseRepository caseRepository, CitizenRepository citizenRepository) {
        this.caseRepository = caseRepository;
        this.citizenRepository = citizenRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        List<Citizen> citizens = citizenRepository.findAll();
        
        if (citizens.isEmpty()) {
            System.out.println("⚠️ No citizens found. Please populate citizens first.");
            return;
        }

        System.out.println("📋 Populating cases for " + citizens.size() + " citizens...");
        
        int casesCreated = 0;
        int casesSkipped = 0;
        
        for (Citizen citizen : citizens) {
            try {
                // Check if citizen already has a case
                List<Case> existingCases = caseRepository.findByCitizenIdOrderByUpdatedAtDesc(citizen.getId());
                if (!existingCases.isEmpty()) {
                    casesSkipped++;
                    continue;
                }

                // Create one case for this citizen
                Case caseEntity = createCaseForCitizen(citizen);
                caseRepository.save(caseEntity);
                casesCreated++;
                
                if (casesCreated % 10 == 0) {
                    System.out.println("  ✓ Created " + casesCreated + " cases...");
                }
            } catch (Exception e) {
                System.err.println("  ✗ Failed to create case for citizen " + citizen.getId() + ": " + e.getMessage());
            }
        }
        
        System.out.println("✅ Successfully created " + casesCreated + " cases!");
        if (casesSkipped > 0) {
            System.out.println("ℹ️  Skipped " + casesSkipped + " citizens (already have cases)");
        }
    }

    private Case createCaseForCitizen(Citizen citizen) {
        Case caseEntity = new Case();
        
        // Link to citizen
        caseEntity.setCitizenId(citizen.getId());
        
        // Step 0: Applicant Details (from citizen)
        caseEntity.setApplicantName(citizen.getFullName());
        caseEntity.setEmail(citizen.getEmail());
        caseEntity.setMobile(citizen.getMobileNum());
        caseEntity.setAadhaar(citizen.getAadharNum());
        
        // Step 1: Victim Details
        String relation = relations.get(random.nextInt(relations.size()));
        caseEntity.setRelation(relation);
        
        if ("Self".equals(relation)) {
            caseEntity.setVictimName(citizen.getFullName());
            caseEntity.setVictimGender(genders.get(random.nextInt(genders.size())));
            // Estimate age from date of birth
            if (citizen.getDateOfBirth() != null) {
                int age = LocalDate.now().getYear() - citizen.getDateOfBirth().getYear();
                caseEntity.setVictimAge(Math.max(18, Math.min(80, age)));
            } else {
                caseEntity.setVictimAge(25 + random.nextInt(50));
            }
        } else {
            String victimFirstName = victimFirstNames.get(random.nextInt(victimFirstNames.size()));
            String victimLastName = victimLastNames.get(random.nextInt(victimLastNames.size()));
            caseEntity.setVictimName(victimFirstName + " " + victimLastName);
            caseEntity.setVictimGender(genders.get(random.nextInt(genders.size())));
            caseEntity.setVictimAge(18 + random.nextInt(62)); // Age between 18 and 80
        }
        
        // Step 2: Case Details
        String caseType = caseTypes.get(random.nextInt(caseTypes.size()));
        caseEntity.setCaseType(caseType);
        
        // Generate appropriate case title based on type
        String caseTitle = generateCaseTitle(caseType);
        caseEntity.setCaseTitle(caseTitle);
        
        // Step 3: Incident Details
        // Incident date between 1 month and 2 years ago
        LocalDate incidentDate = LocalDate.now().minusMonths(1 + random.nextInt(24));
        caseEntity.setIncidentDate(incidentDate);
        
        String incidentPlace = incidentPlaces.get(random.nextInt(incidentPlaces.size()));
        caseEntity.setIncidentPlace(incidentPlace + ", " + citizen.getCity());
        
        String urgency = urgencyLevels.get(random.nextInt(urgencyLevels.size()));
        caseEntity.setUrgency(urgency);
        
        // Step 4: Legal Preference
        String specialization = specializations.get(random.nextInt(specializations.size()));
        caseEntity.setSpecialization(specialization);
        
        String courtType = courtTypes.get(random.nextInt(courtTypes.size()));
        caseEntity.setCourtType(courtType);
        
        // Randomly decide if seeking NGO help
        boolean seekingNgoHelp = random.nextBoolean();
        caseEntity.setSeekingNgoHelp(seekingNgoHelp ? "YES" : "NO");
        
        if (seekingNgoHelp) {
            List<String> ngoTypes = Arrays.asList(
                    "Legal Aid", "Women Rights", "Child Protection", "Human Rights",
                    "Senior Citizen Welfare", "Education Support"
            );
            caseEntity.setNgoType(ngoTypes.get(random.nextInt(ngoTypes.size())));
        }
        
        // Step 5: Case Explanation
        String background = generateBackground(caseType, caseTitle);
        caseEntity.setBackground(background);
        
        String relief = generateRelief(caseType);
        caseEntity.setRelief(relief);
        
        // Step 6: Documents (optional, can be null)
        caseEntity.setDocumentsUrl(null);
        
        // Metadata
        // Randomly set status (most should be SUBMITTED for realistic data)
        String status = statuses.get(random.nextInt(statuses.size()));
        caseEntity.setStatus(status);
        
        // If status is SUBMITTED or beyond, mark as submitted
        if (!"DRAFT".equals(status)) {
            caseEntity.setIsSubmitted(true);
            caseEntity.setCurrentStep(6); // All steps completed
        } else {
            caseEntity.setIsSubmitted(false);
            caseEntity.setCurrentStep(3 + random.nextInt(4)); // Random step between 3-6
        }
        
        // Set timestamps (will be set by @PrePersist, but we can set explicitly)
        caseEntity.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(30)));
        caseEntity.setUpdatedAt(LocalDateTime.now().minusDays(random.nextInt(7)));
        
        return caseEntity;
    }

    private String generateCaseTitle(String caseType) {
        switch (caseType) {
            case "Criminal":
                return criminalTitles.get(random.nextInt(criminalTitles.size()));
            case "Civil":
                return civilTitles.get(random.nextInt(civilTitles.size()));
            case "Family":
                return familyTitles.get(random.nextInt(familyTitles.size()));
            default:
                return caseType + " Matter - " + (1000 + random.nextInt(9000));
        }
    }

    private String generateBackground(String caseType, String caseTitle) {
        StringBuilder background = new StringBuilder();
        
        switch (caseType) {
            case "Criminal":
                background.append("The incident occurred when ").append(caseTitle.toLowerCase())
                        .append(". The victim was subjected to unlawful actions that require legal intervention. ");
                background.append("The matter involves violation of legal rights and needs immediate attention. ");
                background.append("All relevant facts and circumstances have been documented.");
                break;
            case "Civil":
                background.append("This case involves a civil dispute regarding ").append(caseTitle.toLowerCase())
                        .append(". The matter has been ongoing and requires legal resolution. ");
                background.append("Multiple attempts at amicable settlement have been unsuccessful. ");
                background.append("Legal intervention is necessary to protect the rights and interests involved.");
                break;
            case "Family":
                background.append("This is a family matter concerning ").append(caseTitle.toLowerCase())
                        .append(". The situation has caused significant distress and requires legal assistance. ");
                background.append("The matter involves family relationships and needs careful legal handling. ");
                background.append("All parties involved seek a fair and just resolution.");
                break;
            default:
                background.append("This case involves a legal matter related to ").append(caseType.toLowerCase())
                        .append(" law. The situation requires professional legal assistance and guidance. ");
                background.append("The applicant seeks proper legal representation to resolve this matter.");
        }
        
        return background.toString();
    }

    private String generateRelief(String caseType) {
        StringBuilder relief = new StringBuilder();
        
        switch (caseType) {
            case "Criminal":
                relief.append("Seeking justice and appropriate legal action against the accused. ");
                relief.append("Request for compensation for damages suffered. ");
                relief.append("Protection and security for the victim and family.");
                break;
            case "Civil":
                relief.append("Seeking resolution of the dispute through legal means. ");
                relief.append("Request for compensation or restitution as applicable. ");
                relief.append("Protection of legal rights and interests.");
                break;
            case "Family":
                relief.append("Seeking fair resolution of family matters. ");
                relief.append("Protection of rights of all family members involved. ");
                relief.append("Legal support for maintaining family harmony where possible.");
                break;
            default:
                relief.append("Seeking appropriate legal remedy for the matter. ");
                relief.append("Protection of legal rights and interests. ");
                relief.append("Fair and just resolution through legal process.");
        }
        
        return relief.toString();
    }
}
