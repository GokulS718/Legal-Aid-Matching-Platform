package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SchemaController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/api/schema/fix-case-id")
    public String fixCaseId() {
        try {
            // Try PostgreSQL syntax
            jdbcTemplate.execute("ALTER TABLE chat_sessions ALTER COLUMN case_id DROP NOT NULL");
            return "Success: Dropped NOT NULL constraint on case_id (PostgreSQL syntax)";
        } catch (Exception e1) {
            try {
                // Try H2 syntax (just in case local fallback is active)
                jdbcTemplate.execute("ALTER TABLE chat_sessions ALTER COLUMN case_id SET NULL");
                return "Success: Dropped NOT NULL constraint on case_id (H2 syntax)";
            } catch (Exception e2) {
                return "Error (PG): " + e1.getMessage() + " | Error (H2): " + e2.getMessage();
            }
        }
    }
}
