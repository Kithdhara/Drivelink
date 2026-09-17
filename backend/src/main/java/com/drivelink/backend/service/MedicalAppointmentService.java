package com.drivelink.backend.service;

import com.drivelink.backend.model.MedicalAppointment;
import com.drivelink.backend.repository.MedicalAppointmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Medical Test Booking module - Weerasinghe W.P.D.V (IT25100817)
 *
 * Mirrors the rules from the mock bookMedical/cancelMedical/rescheduleMedical/
 * recordMedical functions in frontend/src/lib/store.tsx.
 *
 * NOTE: the mock also checks schedule.booked < schedule.capacity before
 * allowing a booking, and decrements it on cancel. There's no Schedule/Location
 * entity in the backend yet (that data still only exists in the frontend mock,
 * likely owned by whoever builds the Driving Exam Booking / Locations module),
 * so that capacity check can't be enforced server-side yet. The duplicate-
 * booking check below (same applicationId already has a "booked" appointment)
 * IS enforced, since that only depends on this module's own table.
 */
@Service
public class MedicalAppointmentService {

    private final MedicalAppointmentRepository repository;

    public MedicalAppointmentService(MedicalAppointmentRepository repository) {
        this.repository = repository;
    }

    public MedicalAppointment book(MedicalAppointment appointment) {
        boolean alreadyBooked = repository.findByApplicationId(appointment.getApplicationId()).stream()
                .anyMatch(m -> "booked".equals(m.getStatus()));
        if (alreadyBooked) {
            throw new RuntimeException("You already have a medical appointment. Reschedule or cancel it first.");
        }
        appointment.setStatus("booked");
        return repository.save(appointment);
    }

    public List<MedicalAppointment> getAll() {
        return repository.findAll();
    }

    public List<MedicalAppointment> getByApplicant(String applicantId) {
        return repository.findByApplicantId(applicantId);
    }

    public MedicalAppointment getById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medical appointment not found"));
    }

    public MedicalAppointment reschedule(String id, String scheduleId, String locationId, String date, String time) {
        MedicalAppointment appt = getById(id);
        appt.setScheduleId(scheduleId);
        appt.setLocationId(locationId);
        appt.setDate(date);
        appt.setTime(time);
        appt.setStatus("booked");
        return repository.save(appt);
    }

    public MedicalAppointment cancel(String id) {
        MedicalAppointment appt = getById(id);
        appt.setStatus("cancelled");
        return repository.save(appt);
    }

    public MedicalAppointment recordResult(String id, String officerId, String result, String remarks,
                                            String vision, String hearing, String bloodPressure) {
        MedicalAppointment appt = getById(id);
        appt.setStatus("completed");
        appt.setResult(result);
        appt.setOfficerId(officerId);
        appt.setRemarks(remarks);
        appt.setVision(vision);
        appt.setHearing(hearing);
        appt.setBloodPressure(bloodPressure);
        return repository.save(appt);
    }
}
