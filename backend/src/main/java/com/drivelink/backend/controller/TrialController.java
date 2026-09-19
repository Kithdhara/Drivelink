package com.drivelink.backend.controller;

import com.drivelink.backend.model.TrainerBooking;
import com.drivelink.backend.model.TrialBooking;
import com.drivelink.backend.service.TrialService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/trials")
public class TrialController {

    private final TrialService trialService;

    public TrialController(TrialService trialService) {
        this.trialService = trialService;
    }

    // POST /api/trials/book — Book a trial
    @PostMapping("/book")
    public ResponseEntity<?> book(@RequestBody TrialBooking booking) {
        try {
            return ResponseEntity.ok(trialService.book(booking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/trials/user/{applicantId}
    @GetMapping("/user/{applicantId}")
    public ResponseEntity<?> getByApplicant(@PathVariable String applicantId) {
        return ResponseEntity.ok(trialService.getByApplicant(applicantId));
    }

    // GET /api/trials/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(trialService.getById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/trials/{id}/reschedule
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<?> reschedule(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        try {
            return ResponseEntity.ok(trialService.reschedule(id, body.get("slotId")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /api/trials/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancel(@PathVariable Long id) {
        try {
            trialService.cancel(id);
            return ResponseEntity.ok(Map.of("message", "Trial booking cancelled successfully", "status", "CANCELLED"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/trials/{id}/result — Trial officer records result
    @PutMapping("/{id}/result")
    public ResponseEntity<?> recordResult(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(trialService.recordResult(
                    id, body.get("examinerId"), body.get("result"), body.get("remarks")
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // POST /api/trials/{id}/trainer — Book a trainer (optional)
    @PostMapping("/{id}/trainer")
    public ResponseEntity<?> bookTrainer(@PathVariable Long id, @RequestBody TrainerBooking trainerBooking) {
        try {
            trainerBooking.setTrialBookingId(id);
            return ResponseEntity.ok(trialService.bookTrainer(trainerBooking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/trials/trainers/{applicantId}
    @GetMapping("/trainers/{applicantId}")
    public ResponseEntity<?> getTrainers(@PathVariable String applicantId) {
        return ResponseEntity.ok(trialService.getTrainersByApplicant(applicantId));
    }

    // GET /api/trials/all
    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(trialService.getAll());
    }
}
