package com.drivelink.backend.controller;

import com.drivelink.backend.model.MedicalAppointment;
import com.drivelink.backend.service.MedicalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/medical")
public class MedicalController {

    private final MedicalService medicalService;

    public MedicalController(MedicalService medicalService) {
        this.medicalService = medicalService;
    }

    // POST /api/medical/book — Book a medical appointment
    @PostMapping("/book")
    public ResponseEntity<?> book(@RequestBody MedicalAppointment appointment) {
        try {
            return ResponseEntity.ok(medicalService.book(appointment));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/medical/user/{applicantId} — Get all appointments for an applicant
    @GetMapping("/user/{applicantId}")
    public ResponseEntity<?> getByApplicant(@PathVariable String applicantId) {
        return ResponseEntity.ok(medicalService.getByApplicant(applicantId));
    }

    // GET /api/medical/{id} — Get a specific appointment
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(medicalService.getById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/medical/{id}/reschedule — Reschedule (within 24 hours)
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<?> reschedule(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        try {
            return ResponseEntity.ok(medicalService.reschedule(id, body.get("slotId")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /api/medical/{id} — Cancel (within 24 hours)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancel(@PathVariable Long id) {
        try {
            medicalService.cancel(id);
            return ResponseEntity.ok(Map.of("message", "Appointment cancelled successfully", "status", "CANCELLED"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/medical/{id}/result — Medical staff records result
    @PutMapping("/{id}/result")
    public ResponseEntity<?> recordResult(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(medicalService.recordResult(
                    id, body.get("officerId"), body.get("result"),
                    body.get("remarks"), body.get("vision"),
                    body.get("hearing"), body.get("bloodPressure")
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/medical/all — Staff: get all appointments
    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(medicalService.getAll());
    }

    // GET /api/medical/check/{applicantId} — Check if applicant has passed medical
    @GetMapping("/check/{applicantId}")
    public ResponseEntity<?> checkPassed(@PathVariable String applicantId) {
        return ResponseEntity.ok(Map.of("passed", medicalService.hasPassedMedical(applicantId)));
    }
}
