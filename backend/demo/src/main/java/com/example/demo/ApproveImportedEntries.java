package com.example.demo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class ApproveImportedEntries {

    @Bean
    @Order(2) // Run after DatabaseMigration
    public CommandLineRunner approveExistingImports(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                System.out.println("Approving existing imported directory entries...");

                // Check total count
                Integer total = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM directory_entries", Integer.class);
                System.out.println("DEBUG: Total directory entries found: " + total);

                Integer unapproved = jdbcTemplate
                        .queryForObject("SELECT COUNT(*) FROM directory_entries WHERE approved = false", Integer.class);
                System.out.println("DEBUG: Unapproved entries: " + unapproved);

                // Update all imported entries from BAR_COUNCIL, NGO_DARPAN, and
                // USER_REGISTRATION to be approved
                int updated = jdbcTemplate.update(
                        "UPDATE directory_entries SET approved = true " +
                                "WHERE source IN ('BAR_COUNCIL', 'NGO_DARPAN', 'USER_REGISTRATION')");

                System.out.println("✓ Approved " + updated + " directory entries (including USER_REGISTRATION)!");

            } catch (Exception e) {
                System.err.println("Failed to approve imported entries: " + e.getMessage());
                // Don't throw - let app continue
            }
        };
    }
}
