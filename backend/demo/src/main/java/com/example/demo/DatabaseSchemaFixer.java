package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(1) // Run before other populators
public class DatabaseSchemaFixer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("🔧 Running Database Schema Fixes...");

        try {
            // Attempt to make case_id nullable in chat_sessions table
            // This SQL is for PostgreSQL
            String sql = "ALTER TABLE chat_sessions ALTER COLUMN case_id DROP NOT NULL";
            jdbcTemplate.execute(sql);
            System.out.println("  ✅ Automatically altered chat_sessions.case_id to be nullable.");
        } catch (Exception e) {
            // Ignore if it fails (might already be nullable, or different DB dialect)
            System.out.println("  ℹ️  Could not alter table (might already be correct or different DB): " + e.getMessage());
        }
    }
}
