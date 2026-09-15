package com.drivelink.backend.controller;

import com.drivelink.backend.model.RenewalRequest;
import com.drivelink.backend.service.RenewalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/renewals")
public class RenewalController {

    private final RenewalService renewalService;

    public RenewalController(RenewalService renewalService) {
        this.renewalService = renewalService;
    }

    // POST /api/renewals — Submit a renewal request
    @PostMapping
    public ResponseEntity<?> create(@RequestBody RenewalRequest request) {
        try {
            return ResponseEntity.ok(renewalService.create(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/renewals/{id} — Get a specific renewal by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(renewalService.getById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/renewals/user/{applicantId} — Get all renewals for a citizen
    @GetMapping("/user/{applicantId}")
    public ResponseEntity<List<RenewalRequest>> getByApplicant(@PathVariable String applicantId) {
        return ResponseEntity.ok(renewalService.getByApplicant(applicantId));
    }

    // GET /api/renewals/pending — Get all pending renewals (for Officer dashboard)
    @GetMapping("/pending")
    public ResponseEntity<List<RenewalRequest>> getPending() {
        return ResponseEntity.ok(renewalService.getPending());
    }

    // PUT /api/renewals/{id}/approve — Officer approves renewal
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(renewalService.approve(id, body.get("notes")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/renewals/{id}/reject — Officer rejects renewal
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(renewalService.reject(id, body.get("notes")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /api/renewals/{id} — Delete a renewal request
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            renewalService.delete(id);
            return ResponseEntity.ok("Deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
