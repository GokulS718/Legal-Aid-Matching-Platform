package com.example.demo.controller;

import com.example.demo.entity.Lawyer;
import com.example.demo.entity.NGO;
import com.example.demo.entity.DirectoryEntry;
import com.example.demo.entity.Appointment;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.DirectoryEntryRepository;
import com.example.demo.repository.LawyerRepository;
import com.example.demo.repository.NGORepository;
import com.example.demo.repository.NotificationRepository; // Add import
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/temp")
public class CredentialHelperController {

    private final LawyerRepository lawyerRepository;
    private final NGORepository ngoRepository;
    private final DirectoryEntryRepository directoryEntryRepository;
    private final AppointmentRepository appointmentRepository;
    private final NotificationRepository notificationRepository; // Add field

    public CredentialHelperController(LawyerRepository lawyerRepository,
            NGORepository ngoRepository,
            DirectoryEntryRepository directoryEntryRepository,
            AppointmentRepository appointmentRepository,
            NotificationRepository notificationRepository) { // Add param
        this.lawyerRepository = lawyerRepository;
        this.ngoRepository = ngoRepository;
        this.directoryEntryRepository = directoryEntryRepository;
        this.appointmentRepository = appointmentRepository;
        this.notificationRepository = notificationRepository; // Initialize
    }

    @GetMapping("/find-lawyer-by-name")
    public ResponseEntity<?> findLawyerByName(@RequestParam("name") String name) {
        return ResponseEntity.ok(lawyerRepository.findAll().stream()
                .filter(l -> l.getFullName().toLowerCase().contains(name.toLowerCase()))
                .collect(java.util.stream.Collectors.toList()));
    }

    @GetMapping("/find-lawyer")
    public ResponseEntity<?> findLawyerByPartialEmail(@RequestParam String emailPart) {
        List<Lawyer> lawyers = lawyerRepository.findAll();
        List<Lawyer> matches = lawyers.stream()
                .filter(l -> l.getEmail().toLowerCase().contains(emailPart.toLowerCase()))
                .collect(Collectors.toList());

        if (matches.isEmpty()) {
            return ResponseEntity.status(404).body("No lawyer found matching: " + emailPart);
        }

        // Return email and password for debugging (TESTING ONLY)
        List<String> results = matches.stream()
                .map(l -> "Email: " + l.getEmail() + " | Password: " + l.getPassword())
                .collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    @GetMapping("/sync-directory-ids")
    public ResponseEntity<String> syncDirectoryIds() {
        List<DirectoryEntry> entries = directoryEntryRepository.findAll();
        int count = 0;
        for (DirectoryEntry entry : entries) {
            if (entry.getOriginalId() == null) {
                if ("LAWYER".equalsIgnoreCase(entry.getType())) {
                    Lawyer l = lawyerRepository.findByEmail(entry.getContactEmail());
                    if (l != null) {
                        entry.setOriginalId(l.getId());
                        directoryEntryRepository.save(entry);
                        count++;
                    }
                } else if ("NGO".equalsIgnoreCase(entry.getType())) {
                    NGO n = ngoRepository.findByEmail(entry.getContactEmail());
                    if (n != null) {
                        entry.setOriginalId(n.getId());
                        directoryEntryRepository.save(entry);
                        count++;
                    }
                }
            }
        }
        return ResponseEntity.ok("Synced " + count + " entries.");
    }

    @GetMapping("/directory-entries")
    public ResponseEntity<List<DirectoryEntry>> getDirectoryEntries() {
        return ResponseEntity.ok(directoryEntryRepository.findAll());
    }

    @GetMapping("/deep-sync")
    public ResponseEntity<String> deepSync() {
        int deCount = 0;
        int apptCount = 0;

        // 1. Sync ALL DirectoryEntries (including duplicates)
        List<DirectoryEntry> entries = directoryEntryRepository.findAll();
        List<Lawyer> lawyers = lawyerRepository.findAll();
        List<NGO> ngos = ngoRepository.findAll();

        for (DirectoryEntry entry : entries) {
            if ("LAWYER".equalsIgnoreCase(entry.getType())) {
                lawyers.stream()
                        .filter(l -> l.getEmail().equalsIgnoreCase(entry.getContactEmail()))
                        .findFirst()
                        .ifPresent(l -> {
                            if (entry.getOriginalId() == null || !entry.getOriginalId().equals(l.getId())) {
                                entry.setOriginalId(l.getId());
                                directoryEntryRepository.save(entry);
                            }
                        });
            } else if ("NGO".equalsIgnoreCase(entry.getType())) {
                ngos.stream()
                        .filter(n -> n.getEmail().equalsIgnoreCase(entry.getContactEmail()))
                        .findFirst()
                        .ifPresent(n -> {
                            if (entry.getOriginalId() == null || !entry.getOriginalId().equals(n.getId())) {
                                entry.setOriginalId(n.getId());
                                directoryEntryRepository.save(entry);
                            }
                        });
            }
        }

        // Refresh entries list for migration step
        List<DirectoryEntry> updatedEntries = directoryEntryRepository.findAll();

        // 2. Migrate Appointments booked with DirectoryEntry ID instead of real ID
        List<Appointment> appts = appointmentRepository.findAll();
        for (Appointment appt : appts) {
            Integer currentPId = appt.getProviderId();
            String pRole = appt.getProviderRole();

            // 2. Migrate Appointments booked with DirectoryEntry ID instead of real ID
            for (DirectoryEntry de : updatedEntries) {
                if (de.getId().equals(currentPId) && de.getType().equalsIgnoreCase(pRole)) {
                    if (de.getOriginalId() != null && !de.getOriginalId().equals(currentPId)) {
                        appt.setProviderId(de.getOriginalId());
                        appointmentRepository.save(appt);
                        apptCount++;
                    }
                    break;
                }
            }
        }

        return ResponseEntity
                .ok("Deep sync complete. Verified directory entries and migrated " + apptCount + " appointments.");
    }

    @GetMapping("/directory-by-email")
    public ResponseEntity<List<DirectoryEntry>> findDirectoryByEmail(@RequestParam("email") String email) {
        return ResponseEntity.ok(directoryEntryRepository.findAllByContactEmail(email));
    }

    @GetMapping("/lawyers")
    public ResponseEntity<List<Lawyer>> listLawyers() {
        return ResponseEntity.ok(lawyerRepository.findAll());
    }

    @GetMapping("/appointments")
    public ResponseEntity<List<Appointment>> listAppointments() {
        return ResponseEntity.ok(appointmentRepository.findAll());
    }

    @GetMapping("/debug-raju")
    public ResponseEntity<String> debugRaju() {
        StringBuilder sb = new StringBuilder();

        // 1. Analyze ID 24
        sb.append("--- ANALYZING ID 24 ---\n");
        lawyerRepository.findById(24).ifPresentOrElse(
                l -> sb.append("Lawyer Found with ID 24: ").append(l.getFullName()).append(" (Email: ")
                        .append(l.getEmail()).append(")\n"),
                () -> sb.append("NO Lawyer found with ID 24.\n"));
        directoryEntryRepository.findById(24).ifPresentOrElse(
                d -> sb.append("DirectoryEntry Found with ID 24: ").append(d.getName()).append(" (Type: ")
                        .append(d.getType()).append(", OriginalId: ").append(d.getOriginalId()).append(")\n"),
                () -> sb.append("NO DirectoryEntry found with ID 24.\n"));

        // 2. Find ALL Lawyers named Raju
        sb.append("\n--- ALL LAYWERS NAMED RAJU ---\n");
        List<Lawyer> lawyers = lawyerRepository.findAll();
        lawyers.stream()
                .filter(l -> l.getFullName().toLowerCase().contains("raju"))
                .forEach(l -> sb.append("Lawyer: ID=").append(l.getId())
                        .append(", Name=").append(l.getFullName())
                        .append(", Email=").append(l.getEmail())
                        .append(", BarId=").append(l.getBarCouncilId())
                        .append("\n"));

        // 3. Find Directory Entry for Raju(s)
        sb.append("\n--- DIRECTORY ENTRIES FOR RAJU ---\n");
        directoryEntryRepository.findAll().stream()
                .filter(d -> d.getName().toLowerCase().contains("raju"))
                .forEach(d -> sb.append("DirectoryEntry: ID=").append(d.getId())
                        .append(", Name=").append(d.getName())
                        .append(", Type=").append(d.getType())
                        .append(", OriginalId=").append(d.getOriginalId())
                        .append("\n"));

        // 4. Appointments Summary
        sb.append("\n--- APPOINTMENTS FOR ID 24 ---\n");
        List<Appointment> allAppts = appointmentRepository.findAll();
        allAppts.stream().filter(a -> a.getProviderId() == 24)
                .forEach(a -> sb.append("Appt ID=").append(a.getId())
                        .append(", ProviderId=").append(a.getProviderId())
                        .append(", Status=").append(a.getStatus())
                        .append("\n"));

        // 5. Notifications for ID 24
        sb.append("\n--- NOTIFICATIONS FOR ID 24 ---\n");
        notificationRepository.findByRecipientIdAndRecipientRoleOrderByCreatedAtDesc(24, "LAWYER")
                .forEach(n -> sb.append("Notif ID=").append(n.getId())
                        .append(", Msg=").append(n.getMessage())
                        .append(", Type=").append(n.getType())
                        .append(", RefId=").append(n.getReferenceId())
                        .append(", Read=").append(n.isRead())
                        .append("\n"));

        return ResponseEntity.ok(sb.toString());
    }
}
