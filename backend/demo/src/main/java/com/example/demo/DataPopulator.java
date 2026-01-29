package com.example.demo;

import com.example.demo.entity.DirectoryEntry;
import com.example.demo.entity.Lawyer;
import com.example.demo.entity.NGO;
import com.example.demo.repository.DirectoryEntryRepository;
import com.example.demo.repository.LawyerRepository;
import com.example.demo.repository.NGORepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Random;

//@Component
public class DataPopulator implements CommandLineRunner {

    private final LawyerRepository lawyerRepo;
    private final NGORepository ngoRepo;
    private final DirectoryEntryRepository directoryRepo;

    public DataPopulator(LawyerRepository lawyerRepo, NGORepository ngoRepo, DirectoryEntryRepository directoryRepo) {
        this.lawyerRepo = lawyerRepo;
        this.ngoRepo = ngoRepo;
        this.directoryRepo = directoryRepo;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Cleaning up old "generic" data if necessary happens via SQL or manual
        // triggers mostly,
        // but here we can check if we need to add data.

        // Check if we have enough data (naive check)
        long lawyerCount = lawyerRepo.count();
        long ngoCount = ngoRepo.count();

        // If we have minimal data, run the populator
        if (lawyerCount > 150 && ngoCount > 150) {
            System.out.println("⚠️ Database has sufficient data (" + lawyerCount + " lawyers, " + ngoCount
                    + " NGOs). Skipping DataPopulator.");
            return;
        }

        System.out.println("🧹 Cleaning up old generic data...");
        cleanupGenericData();

        System.out.println("🚀 Populating realistic test data...");

        populateLawyers();
        populateNGOs();

        System.out.println("✅ Data Population Completed!");
    }

    private void cleanupGenericData() {
        try {
            // Delete Directory Entries first (Foreign Key constraint usually on originalId
            // but check direction)
            // Actually DirectoryEntry references originalId, so we can delete
            // DirectoryEntries where name like '% Care %'
            // But we need to be careful. Ideally we just rely on the fact that these are
            // test data.
            // Let's delete NGOs with the specific pattern we created: "% Care [0-9]"

            // Note: JPQL or Native Query would be best here but we don't have a custom
            // delete repository method exposed easily.
            // We'll iterate and delete (slower but safer for this context) or use
            // jdbcTemplate if available.
            // Since we don't have JdbcTemplate injected, we'll use the repository.

            List<NGO> oldNgos = ngoRepo.findAll().stream()
                    .filter(n -> n.getNgoName().matches(".* Care \\d+"))
                    .toList();

            for (NGO n : oldNgos) {
                // Remove corresponding directory entry
                DirectoryEntry de = directoryRepo.findByTypeAndOriginalId("NGO", n.getId());
                if (de != null)
                    directoryRepo.delete(de);
                ngoRepo.delete(n);
            }

            System.out.println("Deleted " + oldNgos.size() + " old generic NGOs.");

        } catch (Exception e) {
            System.err.println("Cleanup warning: " + e.getMessage());
        }
    }

    private void populateLawyers() {
        List<String> specs = Arrays.asList("Criminal", "Civil", "Corporate", "Family", "Property");
        List<String> firstNames = Arrays.asList("Rajesh", "Suresh", "Amit", "Priya", "Anjali", "Rohan", "Sneha",
                "Vikram", "Kavita", "Rahul", "Arjun", "Deepa", "Manish", "Meera", "Sanjay");
        List<String> lastNames = Arrays.asList("Sharma", "Verma", "Gupta", "Singh", "Patel", "Reddy", "Iyer", "Nair",
                "Das", "Joshi", "Mehta", "Malhotra", "Bhat", "Saxena", "Chopra");
        List<String> cities = Arrays.asList("Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune",
                "Ahmedabad");

        int counter = (int) lawyerRepo.count() + 1;
        Random rand = new Random();

        for (String spec : specs) {
            // Check how many we already have for this spec to avoid over-populating if
            // partially run
            long existingCount = lawyerRepo.findBySpecialization(spec).size();
            if (existingCount >= 10)
                continue;

            for (int i = 0; i < (10 - existingCount); i++) {
                String fName = firstNames.get(rand.nextInt(firstNames.size()));
                String lName = lastNames.get(rand.nextInt(lastNames.size()));
                String fullName = fName + " " + lName;
                String city = cities.get(rand.nextInt(cities.size()));

                String email = fName.toLowerCase() + "." + lName.toLowerCase() + counter + "@legal-aid.test";
                // Ensure unique email even with random naming
                if (lawyerRepo.existsByEmail(email)) {
                    email = fName.toLowerCase() + "." + lName.toLowerCase() + counter + "_" + rand.nextInt(1000)
                            + "@legal-aid.test";
                }

                String barId = "BAR/" + spec.toUpperCase().substring(0, 3) + "/" + String.format("%05d", counter);
                String aadhar = "5000" + String.format("%08d", counter);

                Lawyer lawyer = new Lawyer();
                lawyer.setFullName(fullName);
                lawyer.setEmail(email);
                lawyer.setMobileNum("98765" + String.format("%05d", counter));
                lawyer.setAadharNum(aadhar);
                lawyer.setBarCouncilId(barId);
                lawyer.setBarState(getStateForCity(city));
                lawyer.setSpecialization(spec);
                lawyer.setExperienceYears(3 + rand.nextInt(20));
                lawyer.setAddress("Chamber " + (i + 1) + ", " + spec + " Court Complex");
                lawyer.setDistrict(city + " District");
                lawyer.setCity(city);
                lawyer.setState(getStateForCity(city));
                lawyer.setPassword("Test@123");
                lawyer.setVerificationStatus(true);
                lawyer.setApproved(true);

                // Add lat/long for better realism if needed (mocked)
                lawyer.setLatitude(19.0760 + (rand.nextDouble() - 0.5) * 0.1);
                lawyer.setLongitude(72.8777 + (rand.nextDouble() - 0.5) * 0.1);

                Lawyer savedLawyer = lawyerRepo.save(lawyer);

                // Add to Directory
                DirectoryEntry entry = new DirectoryEntry();
                entry.setType("LAWYER");
                entry.setName(fullName);
                entry.setSource("BAR_COUNCIL");
                entry.setRegistrationNumber(barId);
                entry.setBarCouncilId(barId);
                entry.setSpecialization(spec);
                entry.setVerified(true);
                entry.setApproved(true);
                entry.setOriginalId(savedLawyer.getId());
                entry.setCity(city);
                entry.setState(getStateForCity(city));
                directoryRepo.save(entry);

                counter++;
            }
        }
    }

    private void populateNGOs() {
        List<String> specs = Arrays.asList("Legal Aid", "Women Rights", "Child Protection", "Senior Citizen Welfare",
                "Human Rights", "Education Support", "Child Rights", "Women Welfare", "Community Welfare",
                "Disaster Relief");

        List<String> prefixes = Arrays.asList("Asha", "Umeed", "Sankalp", "Jagruti", "Navjeevan", "Adhar", "Muskaan",
                "Prayas", "Saathi", "Sahayog", "Janseva", "Manavta", "Utkarsh", "Pragati", "Kalyan", "Samarth",
                "Shiksha", "Jeevan", "Nyaya", "Seva");
        List<String> suffixes = Arrays.asList("Foundation", "Trust", "Society", "Mission", "Kendra", "Samiti",
                "Sangathan", "Initiative", "Forum", "Alliance", "Association", "League", "Network", "Collective",
                "Outreach");
        List<String> locations = Arrays.asList("Delhi", "Mumbai", "Bangalore", "Hyderabad", "Jaipur", "Lucknow",
                "Patna", "Bhopal");

        int counter = (int) ngoRepo.count() + 1;
        Random rand = new Random();

        for (String spec : specs) {
            long existingCount = ngoRepo.findMatches(spec).size();
            // Using findMatches might be strict on 'approved=true', use a safer check if
            // needed or just trust findAll
            // Ideally filters by spec in DB

            if (existingCount >= 10)
                continue;

            // Ensure we add enough to reach 10
            int needed = 10 - (int) existingCount;
            if (needed <= 0)
                continue;

            for (int i = 0; i < needed; i++) {
                String prefix = prefixes.get(rand.nextInt(prefixes.size()));
                String suffix = suffixes.get(rand.nextInt(suffixes.size()));
                String city = locations.get(rand.nextInt(locations.size()));
                String ngoName = prefix + " " + suffix;

                // Add specialization hints occasionally
                if (rand.nextBoolean()) {
                    ngoName = prefix + " " + spec.split(" ")[0] + " " + suffix;
                }

                String email = "contact@" + prefix.toLowerCase() + suffix.toLowerCase() + counter + ".org";
                String regNo = "NGO/" + spec.substring(0, 3).toUpperCase() + "/" + String.format("%05d", counter);

                NGO ngo = new NGO();
                ngo.setNgoName(ngoName);
                ngo.setNgoType(spec);
                ngo.setRegistrationNumber(regNo);
                ngo.setContact("99887" + String.format("%05d", counter));
                ngo.setEmail(email);
                ngo.setAddress("Plot " + (i + 15) + ", Social Service Zone");
                ngo.setState(getStateForCity(city));
                ngo.setDistrict(city);
                ngo.setCity(city);
                ngo.setPincode("1100" + String.format("%02d", (counter % 90) + 10));
                ngo.setPassword("Test@123");
                ngo.setVerificationStatus(true);
                ngo.setApproved(true);

                ngo.setLatitude(28.6139 + (rand.nextDouble() - 0.5) * 0.1);
                ngo.setLongitude(77.2090 + (rand.nextDouble() - 0.5) * 0.1);

                NGO savedNgo = ngoRepo.save(ngo);

                // Add to Directory
                DirectoryEntry entry = new DirectoryEntry();
                entry.setType("NGO");
                entry.setName(ngoName);
                entry.setSource("NGO_DARPAN");
                entry.setRegistrationNumber(regNo);
                entry.setSpecialization(spec);
                entry.setVerified(true);
                entry.setApproved(true);
                entry.setOriginalId(savedNgo.getId());
                entry.setCity(city);
                entry.setState(getStateForCity(city));
                directoryRepo.save(entry);

                counter++;
            }
        }
    }

    private String getStateForCity(String city) {
        switch (city) {
            case "Mumbai":
            case "Pune":
                return "Maharashtra";
            case "Delhi":
                return "Delhi";
            case "Bangalore":
                return "Karnataka";
            case "Hyderabad":
                return "Telangana";
            case "Chennai":
                return "Tamil Nadu";
            case "Kolkata":
                return "West Bengal";
            case "Ahmedabad":
                return "Gujarat";
            case "Jaipur":
                return "Rajasthan";
            case "Lucknow":
                return "Uttar Pradesh";
            case "Patna":
                return "Bihar";
            case "Bhopal":
                return "Madhya Pradesh";
            default:
                return "India";
        }
    }
}
