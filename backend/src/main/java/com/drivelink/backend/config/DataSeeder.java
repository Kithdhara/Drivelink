package com.drivelink.backend.config;

import com.drivelink.backend.model.*;
import com.drivelink.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner loadRealisticData(
            UserRepository userRepository,
            MedicalCentreRepository medicalCentreRepository,
            TimeSlotRepository timeSlotRepository,
            MedicalAppointmentRepository medicalAppointmentRepository
    ) {
        return args -> {
            org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder passwordEncoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
            // ─── 1. Realistic Sri Lankan Users ─────────────────────────
            List<RealisticUser> users = Arrays.asList(
                    new RealisticUser("citizen@demo.gov", "Amara Perera", Role.APPLICANT, "199512345678", "0771234567",
                            "No. 42 Flower Road, Colombo 07", "1995-04-18", "Female"),
                    new RealisticUser("officer@demo.gov", "Priyantha Gunasekara", Role.OFFICER, "198012345678", "0771234568",
                            "Department of Motor Traffic, Elvitigala Mawatha, Colombo 05", "1980-06-12", "Male"),
                    new RealisticUser("coordinator@demo.gov", "Sanduni Weerasinghe", Role.COORDINATOR, "198512345678", "0771234569",
                            "Regional DMT Complex, Peradeniya Road, Kandy", "1985-08-23", "Female"),
                    new RealisticUser("examiner@demo.gov", "Lalith Senanayake", Role.EXAMINER, "197512345678", "0771234570",
                            "National Examination Centre, Werahera, Boralesgamuwa", "1975-03-14", "Male"),
                    new RealisticUser("trainer@demo.gov", "Indika Rathnayake", Role.TRAINER, "198212345678", "0771234571",
                            "Department Circuit Complex, Werahera", "1982-11-09", "Male"),
                    new RealisticUser("medical@demo.gov", "Dr. Anoma Pathirana", Role.MEDICAL, "197012345678", "0771234572",
                            "National Transport Medical Institute, Nawala Road, Nugegoda", "1970-05-30", "Female"),
                    new RealisticUser("admin@demo.gov", "Chaminda Rajapakse", Role.ADMIN, "197812345673", "0771234573",
                            "Ministry of Transport, Battaramulla", "1978-02-19", "Male"),
                    new RealisticUser("kasun.fernando@mail.lk", "Kasun Fernando", Role.APPLICANT, "198823456789", "0712345678",
                            "No. 18 Lake Drive, Kandy", "1988-11-02", "Male"),
                    new RealisticUser("nimali.silva@mail.lk", "Nimali Silva", Role.APPLICANT, "199234567890", "0753456789",
                            "No. 9 Beach Road, Galle", "1992-07-21", "Female"),
                    new RealisticUser("dilani.w@mail.lk", "Dilani Wickramasinghe", Role.APPLICANT, "200156789012", "0705678901",
                            "No. 55 Temple Road, Kurunegala", "2001-09-14", "Female")
            );

            for (RealisticUser uData : users) {
                userRepository.findByEmail(uData.email).ifPresentOrElse(
                    existingUser -> {
                        if (existingUser.getPassword() != null && !existingUser.getPassword().startsWith("$2a$")) {
                            existingUser.setPassword(passwordEncoder.encode("Password123!"));
                            userRepository.save(existingUser);
                        }
                    },
                    () -> {
                        User u = new User();
                        u.setEmail(uData.email);
                        u.setName(uData.name);
                        u.setRole(uData.role);
                        u.setNic(uData.nic);
                        u.setPhone(uData.phone);
                        u.setPassword(passwordEncoder.encode("Password123!"));
                        u.setAddress(uData.address);
                        u.setDob(uData.dob);
                        u.setGender(uData.gender);
                        u.setActive(true);
                        userRepository.save(u);
                    }
                );
            }

            // ─── 2. Official NTMI Medical Centres ──────────────────────
            List<MedicalCentre> seededCentres = new ArrayList<>();
            if (medicalCentreRepository.count() == 0) {
                List<MedicalCentre> centres = Arrays.asList(
                        createCentre("NTMI National Medical Examination Centre — Nugegoda", "No. 524 Nawala Road, Nugegoda", "Nugegoda", "0112809123", 60),
                        createCentre("NTMI Driver Fitness Examination Complex — Werahera", "Department of Motor Traffic Complex, Werahera", "Werahera", "0112618001", 80),
                        createCentre("NTMI Metropolitan Medical Branch — Colombo 09", "No. 341 Baseline Road, Dematagoda, Colombo 09", "Colombo", "0112694001", 50),
                        createCentre("NTMI Central Province Regional Centre — Kandy", "No. 12 Peradeniya Road, Kandy", "Kandy", "0812234002", 40),
                        createCentre("NTMI Southern District Medical Centre — Galle", "No. 4 Light House Street, Fort, Galle", "Galle", "0912244003", 35),
                        createCentre("NTMI Western Province Regional Centre — Gampaha", "No. 88 Colombo Road, Gampaha", "Gampaha", "0332223401", 40),
                        createCentre("NTMI North Western Regional Centre — Kurunegala", "No. 15 Negombo Road, Kurunegala", "Kurunegala", "0372224501", 35)
                );
                seededCentres = medicalCentreRepository.saveAll(centres);
            } else {
                seededCentres = medicalCentreRepository.findAll();
            }

            // ─── 3. Realistic TimeSlots (Medical, Exam, Trial) ─────────
            timeSlotRepository.deleteAll();
            if (true && !seededCentres.isEmpty()) {
                List<TimeSlot> slots = new ArrayList<>();
                LocalDate today = LocalDate.now();

                // Medical Slots for next 14 days across all centres — varied by centre
                String[][] slotPatterns = {
                    // pattern: startTime, endTime, capacity, booked
                    {"08:00", "09:30", "30", "8"},   // Early morning
                    {"08:30", "10:30", "25", "5"},   // Morning
                    {"09:00", "11:00", "20", "3"},   // Mid-morning
                    {"10:00", "12:00", "35", "12"},  // Late morning
                    {"11:00", "13:00", "25", "7"},   // Midday
                    {"13:00", "14:30", "18", "4"},   // Early afternoon
                    {"13:30", "15:30", "22", "6"},   // Afternoon
                    {"14:00", "16:00", "28", "9"},   // Mid-afternoon
                    {"15:00", "17:00", "15", "2"},   // Late afternoon
                    {"16:00", "18:00", "20", "1"},   // Evening
                };
                for (int d = 1; d <= 14; d++) {
                    String slotDate = today.plusDays(d).toString();
                    int dayOfWeek = today.plusDays(d).getDayOfWeek().getValue(); // 1=Mon, 7=Sun
                    for (int ci = 0; ci < seededCentres.size(); ci++) {
                        MedicalCentre mc = seededCentres.get(ci);
                        // Each centre gets a different subset of slots based on centre index + day
                        int startPattern = ci % slotPatterns.length;
                        int numSlots = (dayOfWeek >= 6) ? 2 : (3 + (ci % 3)); // Weekends: 2 slots, Weekdays: 3-5
                        for (int s = 0; s < numSlots; s++) {
                            String[] p = slotPatterns[(startPattern + s * 2) % slotPatterns.length];
                            int cap = Integer.parseInt(p[2]) + (ci * 3); // Vary capacity per centre
                            int booked = Math.min(Integer.parseInt(p[3]) + ((d + ci) % 5), cap);
                            slots.add(createSlot("MEDICAL", mc.getId(), mc.getName(), mc.getCity(),
                                    slotDate, p[0], p[1], cap, booked));
                        }
                    }
                }

                // Theory Exam Slots
                Long defaultCentreId = seededCentres.get(0).getId();
                for (int d = 2; d <= 14; d += 2) {
                    String slotDate = today.plusDays(d).toString();
                    slots.add(createSlot("EXAM", defaultCentreId, "Colombo Computerized Examination Hall", "Colombo", slotDate, "09:00", "10:30", 40, 12));
                    slots.add(createSlot("EXAM", defaultCentreId, "Galle Computerized Examination Hall", "Galle", slotDate, "11:00", "12:30", 40, 15));
                    slots.add(createSlot("EXAM", defaultCentreId, "Gampaha Computerized Examination Hall", "Gampaha", slotDate, "14:00", "15:30", 40, 8));

                    slots.add(createSlot("EXAM", defaultCentreId, "Kandy Written Test Hall — Peradeniya", "Kandy", slotDate, "09:30", "11:00", 30, 10));
                    slots.add(createSlot("EXAM", defaultCentreId, "Gampaha Theory Examination Complex", "Gampaha", slotDate, "10:00", "11:30", 35, 9));
                }

                // Practical Trial Slots
                for (int d = 3; d <= 14; d += 2) {
                    String slotDate = today.plusDays(d).toString();
                    slots.add(createSlot("TRIAL", defaultCentreId, "Colombo Trial Yard Circuit", "Colombo", slotDate, "08:00", "10:00", 20, 6));
                    slots.add(createSlot("TRIAL", defaultCentreId, "Galle Trial Yard Circuit", "Galle", slotDate, "10:30", "12:30", 20, 8));
                    slots.add(createSlot("TRIAL", defaultCentreId, "Gampaha Trial Yard Circuit", "Gampaha", slotDate, "13:30", "15:30", 20, 4));

                    slots.add(createSlot("TRIAL", defaultCentreId, "Katukurunda Driving Circuit", "Kalutara", slotDate, "09:00", "11:00", 18, 5));
                    slots.add(createSlot("TRIAL", defaultCentreId, "Kundasale Trial Grounds", "Kandy", slotDate, "09:00", "11:00", 15, 3));
                }

                timeSlotRepository.saveAll(slots);
            }

            // ─── 4. Realistic Medical Appointments ──────────────────────
            if (medicalAppointmentRepository.count() == 0 && !seededCentres.isEmpty()) {
                MedicalCentre nugegoda = seededCentres.get(0);
                LocalDate yesterday = LocalDate.now().minusDays(2);

                MedicalAppointment apt1 = new MedicalAppointment();
                apt1.setApplicantId("kasun.fernando@mail.lk");
                apt1.setCentreId(nugegoda.getId());
                apt1.setCentreName(nugegoda.getName());
                apt1.setSlotId(1L);
                apt1.setDate(yesterday.toString());
                apt1.setTimeSlot("08:30-10:30");
                apt1.setStatus("COMPLETED");
                apt1.setResult("PASS");
                apt1.setVision("6/6 bilateral");
                apt1.setHearing("Normal");
                apt1.setBloodPressure("120/80 mmHg");
                apt1.setRemarks("Normal visual acuity, hearing normal, blood pressure stable. Medically fit for Class B driving licence.");
                apt1.setMedicalOfficerId("Dr. Anoma Pathirana");
                medicalAppointmentRepository.save(apt1);
            }
        };
    }

    private MedicalCentre createCentre(String name, String address, String city, String phone, int capacity) {
        MedicalCentre mc = new MedicalCentre();
        mc.setName(name);
        mc.setAddress(address);
        mc.setCity(city);
        mc.setPhone(phone);
        mc.setCapacity(capacity);
        return mc;
    }

    private TimeSlot createSlot(String type, Long centreId, String centreName, String city, String date, String start, String end, int capacity, int booked) {
        TimeSlot ts = new TimeSlot();
        ts.setType(type);
        ts.setCentreId(centreId);
        ts.setCentreName(centreName);
        ts.setCity(city);
        ts.setDate(date);
        ts.setStartTime(start);
        ts.setEndTime(end);
        ts.setCapacity(capacity);
        ts.setBooked(booked);
        return ts;
    }

    private static class RealisticUser {
        String email;
        String name;
        Role role;
        String nic;
        String phone;
        String address;
        String dob;
        String gender;

        public RealisticUser(String email, String name, Role role, String nic, String phone, String address, String dob, String gender) {
            this.email = email;
            this.name = name;
            this.role = role;
            this.nic = nic;
            this.phone = phone;
            this.address = address;
            this.dob = dob;
            this.gender = gender;
        }
    }
}
