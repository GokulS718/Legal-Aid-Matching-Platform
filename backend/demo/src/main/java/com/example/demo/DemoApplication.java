package com.example.demo;

import com.example.demo.service.NGODarpanImportService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    @Bean
    CommandLineRunner seedNgoDirectory(NGODarpanImportService ngoImportService,
            com.example.demo.repository.LawyerRepository lawyerRepository,
            com.example.demo.repository.AppointmentRepository appointmentRepository) {
        return args -> {
            // run only once; you can comment this line later if needed
            ngoImportService.importCSV("ngo_darpan_extended.csv");

            // Appointment seeding removed to preserve data persistence

        };
    }
}
