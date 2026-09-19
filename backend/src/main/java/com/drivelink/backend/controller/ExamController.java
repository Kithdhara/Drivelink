package com.drivelink.backend.controller;

import com.drivelink.backend.model.ExamBooking;
import com.drivelink.backend.service.ExamService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/exams")
public class ExamController {

    private final ExamService examService;

    public ExamController(ExamService examService) {
        this.examService = examService;
    }

    // POST /api/exams/book — Book an exam
    @PostMapping("/book")
    public ResponseEntity<?> book(@RequestBody ExamBooking booking) {
        try {
            return ResponseEntity.ok(examService.book(booking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/exams/user/{applicantId}
    @GetMapping("/user/{applicantId}")
    public ResponseEntity<?> getByApplicant(@PathVariable String applicantId) {
        return ResponseEntity.ok(examService.getByApplicant(applicantId));
    }

    // GET /api/exams/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(examService.getById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/exams/{id}/reschedule
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<?> reschedule(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        try {
            return ResponseEntity.ok(examService.reschedule(id, body.get("slotId")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /api/exams/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancel(@PathVariable Long id) {
        try {
            examService.cancel(id);
            return ResponseEntity.ok(Map.of("message", "Exam booking cancelled successfully", "status", "CANCELLED"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/exams/{id}/result — Examiner records result
    @PutMapping("/{id}/result")
    public ResponseEntity<?> recordResult(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            Integer score = body.get("score") != null ? Integer.parseInt(body.get("score")) : null;
            return ResponseEntity.ok(examService.recordResult(
                    id, body.get("examinerId"), body.get("result"), score, body.get("remarks")
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/exams/all
    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(examService.getAll());
    }
}
