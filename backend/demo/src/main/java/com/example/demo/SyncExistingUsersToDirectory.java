package com.example.demo;

import com.example.demo.entity.DirectoryEntry;
import com.example.demo.entity.Lawyer;
import com.example.demo.entity.NGO;
import com.example.demo.repository.DirectoryEntryRepository;
import com.example.demo.repository.LawyerRepository;
import com.example.demo.repository.NGORepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.util.List;

@Configuration
public class SyncExistingUsersToDirectory {

    @Bean
    @Order(3) // Run after ApproveImportedEntries
    public CommandLineRunner syncUsers(
            LawyerRepository lawyerRepository,
            NGORepository ngoRepository,
            DirectoryEntryRepository directoryEntryRepository) {
        return args -> {
            try {
                System.out.println("Syncing existing lawyers and NGOs to directory...");

                int lawyersSynced = 0;
                int ngosSynced = 0;

                // Sync all lawyers
                List<Lawyer> lawyers = lawyerRepository.findAll();
                for (Lawyer lawyer : lawyers) {
                    // Check if any directory entry exists for this lawyer (avoid duplicates)
                    boolean entryExists = directoryEntryRepository.existsByTypeAndBarCouncilId("LAWYER",
                            lawyer.getBarCouncilId());
                    if (!entryExists) {
                        // Create new directory entry
                        DirectoryEntry entry = new DirectoryEntry();
                        entry.setType("LAWYER");
                        entry.setBarCouncilId(lawyer.getBarCouncilId());
                        entry.setSource("USER_REGISTRATION");
                        entry.setName(lawyer.getFullName());
                        entry.setSpecialization(lawyer.getSpecialization());
                        entry.setExperienceYears(lawyer.getExperienceYears());
                        entry.setContactPhone(lawyer.getMobileNum());
                        entry.setContactEmail(lawyer.getEmail());
                        entry.setState(lawyer.getState());
                        entry.setDistrict(lawyer.getDistrict());
                        entry.setCity(lawyer.getCity());
                        entry.setLatitude(lawyer.getLatitude());
                        entry.setLongitude(lawyer.getLongitude());
                        entry.setVerified(lawyer.isVerificationStatus());
                        entry.setApproved(lawyer.isApproved());
                        entry.setOriginalId(lawyer.getId()); // FIX: Set correct originalId
                        directoryEntryRepository.save(entry);
                        lawyersSynced++;
                    }
                }

                // Sync all NGOs
                List<NGO> ngos = ngoRepository.findAll();
                for (NGO ngo : ngos) {
                    // Check if any directory entry exists for this NGO (avoid duplicates)
                    boolean entryExists = directoryEntryRepository.existsByTypeAndRegistrationNumber("NGO",
                            ngo.getRegistrationNumber());
                    if (!entryExists) {
                        // Create new directory entry
                        DirectoryEntry entry = new DirectoryEntry();
                        entry.setType("NGO");
                        entry.setRegistrationNumber(ngo.getRegistrationNumber());
                        entry.setSource("USER_REGISTRATION");
                        entry.setName(ngo.getNgoName());
                        entry.setSpecialization(ngo.getNgoType());
                        entry.setContactPhone(ngo.getContact());
                        entry.setContactEmail(ngo.getEmail());
                        entry.setState(ngo.getState());
                        entry.setDistrict(ngo.getDistrict());
                        entry.setCity(ngo.getCity());
                        entry.setLatitude(ngo.getLatitude());
                        entry.setLongitude(ngo.getLongitude());
                        entry.setVerified(ngo.isVerificationStatus());
                        entry.setApproved(ngo.isApproved());
                        entry.setOriginalId(ngo.getId()); // FIX: Set correct originalId
                        directoryEntryRepository.save(entry);
                        ngosSynced++;
                    }
                }

                System.out.println("✓ Synced " + lawyersSynced + " lawyers and " + ngosSynced + " NGOs to directory!");

            } catch (Exception e) {
                System.err.println("Failed to sync users: " + e.getMessage());
                e.printStackTrace();
            }
        };
    }
}
