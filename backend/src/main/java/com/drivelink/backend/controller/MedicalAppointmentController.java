package com.drivelink.backend.controller;

import com.drivelink.backend.service.MedicalAppointmentService;
import com.drivelink.backend.model.MedicalAppointment;
import com.drivelink.backend.service.MedicalAppointmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medical")
public class        MedicalAppointmentController {

    private final MedicalAppointmentService medicalAppointmentService;

    public MedicalAppointmentController(MedicalAppointmentService medicalAppointmentService) {
        this.medicalAppointmentService = medicalAppointmentService;
    }

    // POST /api/medical/book — applicant books a slot
    @PostMapping("/book")
    public ResponseEntity<?> book(@RequestBody MedicalAppointment appointment) {
        try {
            return ResponseEntity.ok(medicalAppointmentService.book(appointment));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/medical/appointments — all appointments (clinic/dashboard views),
    // or ?applicantId=... for one applicant's own bookings (BookMedical.tsx)
    @GetMapping("/appointments")
    public ResponseEntity<List<MedicalAppointment>> getAppointments(
            @RequestParam(required = false) String applicantId) {
        if (applicantId != null) {
            return ResponseEntity.ok(medicalAppointmentService.getByApplicant(applicantId));
        }
        return ResponseEntity.ok(medicalAppointmentService.getAll());
    }

    // GET /api/medical/{id} — single appointment
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(medicalAppointmentService.getById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/medical/{id}/reschedule — body: { scheduleId, locationId, date, time }
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<?> reschedule(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(medicalAppointmentService.reschedule(
                    id, body.get("scheduleId"), body.get("locationId"), body.get("date"), body.get("time")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/medical/{id}/cancel
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable String id) {
        try {
            return ResponseEntity.ok(medicalAppointmentService.cancel(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/medical/{id}/result — body: { officerId, result, remarks?, vision?, hearing?, bloodPressure? }
    @PutMapping("/{id}/result")
    public ResponseEntity<?> recordResult(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(medicalAppointmentService.recordResult(
                    id, body.get("officerId"), body.get("result"), body.get("remarks"),
                    body.get("vision"), body.get("hearing"), body.get("bloodPressure")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
