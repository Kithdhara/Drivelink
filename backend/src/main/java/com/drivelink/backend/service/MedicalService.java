package com.drivelink.backend.service;

import com.drivelink.backend.model.MedicalAppointment;
import com.drivelink.backend.model.TimeSlot;
import com.drivelink.backend.repository.MedicalAppointmentRepository;
import com.drivelink.backend.repository.TimeSlotRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class MedicalService {

    private final MedicalAppointmentRepository medicalRepo;
    private final TimeSlotRepository slotRepo;

    public MedicalService(MedicalAppointmentRepository medicalRepo, TimeSlotRepository slotRepo) {
        this.medicalRepo = medicalRepo;
        this.slotRepo = slotRepo;
    }

    // CRUD 1: Book a medical appointment
    public MedicalAppointment book(MedicalAppointment appointment) {
        // Check if applicant already has an active booking
        List<MedicalAppointment> existing = medicalRepo.findByApplicantIdAndStatus(
                appointment.getApplicantId(), "BOOKED");
        if (!existing.isEmpty()) {
            throw new RuntimeException("You already have an active medical appointment. Cancel or complete it first.");
        }

        // Check slot availability
        TimeSlot slot = slotRepo.findById(appointment.getSlotId())
                .orElseThrow(() -> new RuntimeException("Time slot not found"));
        if (slot.getBooked() >= slot.getCapacity()) {
            throw new RuntimeException("This time slot is fully booked");
        }

        // Book the slot
        appointment.setStatus("BOOKED");
        appointment.setDate(slot.getDate());
        appointment.setTimeSlot(slot.getStartTime() + "-" + slot.getEndTime());
        appointment.setCentreId(slot.getCentreId());
        appointment.setCentreName(slot.getCentreName());

        slot.setBooked(slot.getBooked() + 1);
        slotRepo.save(slot);

        return medicalRepo.save(appointment);
    }

    // CRUD 2: Get appointments for an applicant
    public List<MedicalAppointment> getByApplicant(String applicantId) {
        return medicalRepo.findByApplicantId(applicantId);
    }

    // CRUD 3: Edit/reschedule appointment (within 12 hours of booking)
    public MedicalAppointment reschedule(Long id, Long newSlotId) {
        MedicalAppointment apt = medicalRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!"BOOKED".equals(apt.getStatus())) {
            throw new RuntimeException("Can only reschedule BOOKED appointments");
        }
        if (apt.getCreatedAt() != null &&
                ChronoUnit.HOURS.between(apt.getCreatedAt(), LocalDateTime.now()) > 12) {
            throw new RuntimeException("Rescheduling window has expired (12 hours)");
        }

        // Release old slot
        TimeSlot oldSlot = slotRepo.findById(apt.getSlotId()).orElse(null);
        if (oldSlot != null) {
            oldSlot.setBooked(Math.max(0, oldSlot.getBooked() - 1));
            slotRepo.save(oldSlot);
        }

        // Book new slot
        TimeSlot newSlot = slotRepo.findById(newSlotId)
                .orElseThrow(() -> new RuntimeException("New time slot not found"));
        if (newSlot.getBooked() >= newSlot.getCapacity()) {
            throw new RuntimeException("New time slot is fully booked");
        }
        newSlot.setBooked(newSlot.getBooked() + 1);
        slotRepo.save(newSlot);

        apt.setSlotId(newSlotId);
        apt.setDate(newSlot.getDate());
        apt.setTimeSlot(newSlot.getStartTime() + "-" + newSlot.getEndTime());
        apt.setCentreId(newSlot.getCentreId());
        apt.setCentreName(newSlot.getCentreName());

        return medicalRepo.save(apt);
    }

    // CRUD 4: Cancel appointment (within 12 hours of booking)
    public void cancel(Long id) {
        MedicalAppointment apt = medicalRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!"BOOKED".equals(apt.getStatus())) {
            throw new RuntimeException("Can only cancel BOOKED appointments");
        }
        if (apt.getCreatedAt() != null &&
                ChronoUnit.HOURS.between(apt.getCreatedAt(), LocalDateTime.now()) > 12) {
            throw new RuntimeException("Cancellation window has expired (12 hours)");
        }

        // Release slot
        TimeSlot slot = slotRepo.findById(apt.getSlotId()).orElse(null);
        if (slot != null) {
            slot.setBooked(Math.max(0, slot.getBooked() - 1));
            slotRepo.save(slot);
        }

        apt.setStatus("CANCELLED");
        medicalRepo.save(apt);
    }

    // Medical staff: record result
    public MedicalAppointment recordResult(Long id, String officerId, String result,
                                           String remarks, String vision, String hearing, String bloodPressure) {
        MedicalAppointment apt = medicalRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        apt.setStatus("COMPLETED");
        apt.setResult(result); // PASS or FAIL
        apt.setMedicalOfficerId(officerId);
        apt.setRemarks(remarks);
        apt.setVision(vision);
        apt.setHearing(hearing);
        apt.setBloodPressure(bloodPressure);

        return medicalRepo.save(apt);
    }

    // Staff: get all appointments
    public List<MedicalAppointment> getAll() {
        return medicalRepo.findAll();
    }

    // Check if applicant has passed medical
    public boolean hasPassedMedical(String applicantId) {
        List<MedicalAppointment> passed = medicalRepo.findByApplicantIdAndResult(applicantId, "PASS");
        return !passed.isEmpty();
    }

    public MedicalAppointment getById(Long id) {
        return medicalRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }
}
