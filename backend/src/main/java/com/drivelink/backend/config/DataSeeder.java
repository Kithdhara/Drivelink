package com.drivelink.backend.config;

import com.drivelink.backend.model.Role;
import com.drivelink.backend.model.User;
import com.drivelink.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner loadDemoData(UserRepository userRepository) {
        return args -> {
            List<DemoUser> demoUsers = Arrays.asList(
                    new DemoUser("citizen@demo.gov", "Amara Perera", Role.APPLICANT, "901234567V", "0771234567"),
                    new DemoUser("officer@demo.gov", "Priyantha Gunasekara", Role.OFFICER, "801234567V", "0771234568"),
                    new DemoUser("coordinator@demo.gov", "Sanduni Weerasinghe", Role.COORDINATOR, "851234567V", "0771234569"),
                    new DemoUser("examiner@demo.gov", "Lalith Senanayake", Role.EXAMINER, "751234567V", "0771234570"),
                    new DemoUser("trainer@demo.gov", "Indika Rathnayake", Role.TRAINER, "821234567V", "0771234571"),
                    new DemoUser("medical@demo.gov", "Dr. Anoma Pathirana", Role.MEDICAL, "701234567V", "0771234572"),
                    new DemoUser("admin@demo.gov", "System Administrator", Role.ADMIN, "951234567V", "0771234573")
            );

            for (DemoUser demo : demoUsers) {
                if (userRepository.findByEmail(demo.email).isEmpty()) {
                    User u = new User();
                    u.setEmail(demo.email);
                    u.setName(demo.name);
                    u.setRole(demo.role);
                    u.setNic(demo.nic);
                    u.setPhone(demo.phone);
                    u.setPassword("Password123!"); // Plaintext because auth is mocked in a real world it should be hashed
                    u.setAddress("Demo Address, Colombo");
                    u.setDob("1990-01-01");
                    u.setGender("Other");
                    u.setActive(true);
                    
                    userRepository.save(u);
                }
            }
        };
    }

    private static class DemoUser {
        String email;
        String name;
        Role role;
        String nic;
        String phone;

        public DemoUser(String email, String name, Role role, String nic, String phone) {
            this.email = email;
            this.name = name;
            this.role = role;
            this.nic = nic;
            this.phone = phone;
        }
    }
}
