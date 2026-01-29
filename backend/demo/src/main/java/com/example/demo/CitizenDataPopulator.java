package com.example.demo;

import com.example.demo.entity.Citizen;
import com.example.demo.repository.CitizenRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Component
@Order(2) // Run after DatabaseMigration
public class CitizenDataPopulator implements CommandLineRunner {

    private final CitizenRepository citizenRepository;
    private final Random random = new Random();

    // Indian names for realistic data
    private final List<String> firstNames = Arrays.asList(
            "Rajesh", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Rahul", "Kavita",
            "Suresh", "Meera", "Arjun", "Divya", "Kiran", "Pooja", "Nikhil", "Shreya",
            "Manoj", "Riya", "Deepak", "Neha", "Anil", "Swati", "Ravi", "Anita",
            "Sunil", "Radha", "Vishal", "Kiran", "Ajay", "Suman", "Pankaj", "Lakshmi"
    );

    private final List<String> lastNames = Arrays.asList(
            "Kumar", "Sharma", "Patel", "Singh", "Reddy", "Verma", "Gupta", "Mehta",
            "Joshi", "Malhotra", "Agarwal", "Kapoor", "Chopra", "Bansal", "Saxena", "Tiwari",
            "Yadav", "Mishra", "Pandey", "Shah", "Desai", "Nair", "Iyer", "Rao"
    );

    private final List<String> states = Arrays.asList(
            "Maharashtra", "Gujarat", "Karnataka", "Tamil Nadu", "Delhi", "West Bengal",
            "Rajasthan", "Punjab", "Haryana", "Uttar Pradesh", "Bihar", "Madhya Pradesh",
            "Andhra Pradesh", "Telangana", "Kerala", "Odisha"
    );

    private final List<String> cities = Arrays.asList(
            "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune",
            "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore",
            "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad"
    );

    private final List<String> districts = Arrays.asList(
            "Mumbai", "Delhi", "Bangalore Urban", "Hyderabad", "Chennai", "Kolkata",
            "Pune", "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur Nagar",
            "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara"
    );

    public CitizenDataPopulator(CitizenRepository citizenRepository) {
        this.citizenRepository = citizenRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        long citizenCount = citizenRepository.count();
        
        // Only populate if we have less than 50 citizens
        if (citizenCount >= 50) {
            System.out.println("⚠️ Database has sufficient citizens (" + citizenCount + "). Skipping CitizenDataPopulator.");
            return;
        }

        System.out.println("👥 Populating sample citizen data...");
        
        int citizensToCreate = 50 - (int) citizenCount;
        if (citizensToCreate > 0) {
            for (int i = 0; i < citizensToCreate; i++) {
                try {
                    Citizen citizen = createRandomCitizen(i);
                    citizenRepository.save(citizen);
                    if ((i + 1) % 10 == 0) {
                        System.out.println("  ✓ Created " + (i + 1) + " citizens...");
                    }
                } catch (Exception e) {
                    System.err.println("  ✗ Failed to create citizen " + (i + 1) + ": " + e.getMessage());
                }
            }
            System.out.println("✅ Successfully populated " + citizensToCreate + " sample citizens!");
        }
    }

    private Citizen createRandomCitizen(int index) {
        Citizen citizen = new Citizen();
        
        // Generate random name
        String firstName = firstNames.get(random.nextInt(firstNames.size()));
        String lastName = lastNames.get(random.nextInt(lastNames.size()));
        citizen.setFullName(firstName + " " + lastName);
        
        // Generate unique email
        String email = firstName.toLowerCase() + "." + lastName.toLowerCase() + (index + 1) + "@example.com";
        // Ensure email is unique by checking if it exists
        int emailSuffix = 1;
        while (citizenRepository.existsByEmail(email)) {
            email = firstName.toLowerCase() + "." + lastName.toLowerCase() + (index + 1) + emailSuffix + "@example.com";
            emailSuffix++;
        }
        citizen.setEmail(email);
        
        // Generate unique Aadhar number (12 digits)
        String aadharNum;
        do {
            aadharNum = generateAadharNumber();
        } while (citizenRepository.existsByAadharNum(aadharNum));
        citizen.setAadharNum(aadharNum);
        
        // Generate mobile number (10 digits, starting with 6-9)
        String mobileNum = generateMobileNumber();
        citizen.setMobileNum(mobileNum);
        
        // Generate date of birth (between 18 and 80 years old)
        LocalDate dob = generateDateOfBirth();
        citizen.setDateOfBirth(dob);
        
        // Set password (plain text for now - matches existing pattern in DataPopulator)
        citizen.setPassword("Password123");
        
        // Generate location
        String state = states.get(random.nextInt(states.size()));
        citizen.setState(state);
        
        String city = cities.get(random.nextInt(cities.size()));
        citizen.setCity(city);
        
        String district = districts.get(random.nextInt(districts.size()));
        citizen.setDistrict(district);
        
        // Generate address
        String[] streetNames = {"Main Street", "Park Avenue", "Gandhi Road", "Nehru Nagar", 
                               "Indira Colony", "Rajiv Chowk", "MG Road", "Station Road"};
        int houseNumber = random.nextInt(999) + 1;
        String streetName = streetNames[random.nextInt(streetNames.length)];
        citizen.setAddress(houseNumber + ", " + streetName + ", " + city + " - " + (100000 + random.nextInt(900000)));
        
        // Set enabled to true
        citizen.setEnabled(true);
        
        // Profile photo URL (optional, can be null)
        citizen.setProfilePhotoUrl(null);
        
        return citizen;
    }

    private String generateAadharNumber() {
        // Generate 12-digit Aadhar number
        StringBuilder aadhar = new StringBuilder();
        for (int i = 0; i < 12; i++) {
            aadhar.append(random.nextInt(10));
        }
        return aadhar.toString();
    }

    private String generateMobileNumber() {
        // Generate 10-digit mobile number starting with 6, 7, 8, or 9
        StringBuilder mobile = new StringBuilder();
        mobile.append(6 + random.nextInt(4)); // First digit: 6, 7, 8, or 9
        for (int i = 0; i < 9; i++) {
            mobile.append(random.nextInt(10));
        }
        return mobile.toString();
    }

    private LocalDate generateDateOfBirth() {
        // Generate date between 18 and 80 years ago
        int age = 18 + random.nextInt(63); // Age between 18 and 80
        int currentYear = LocalDate.now().getYear();
        int birthYear = currentYear - age;
        int month = 1 + random.nextInt(12);
        int day = 1 + random.nextInt(28); // Use 28 to avoid month-end issues
        
        return LocalDate.of(birthYear, month, day);
    }
}
