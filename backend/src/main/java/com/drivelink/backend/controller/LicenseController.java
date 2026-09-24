package com.drivelink.backend.controller;

import com.drivelink.backend.service.LicenseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/licenses")
public class LicenseController {

    private final LicenseService licenseService;

    public LicenseController(LicenseService licenseService) {
        this.licenseService = licenseService;
    }

    // POST /api/licenses/issue — Issue a license
    @PostMapping("/issue")
    public ResponseEntity<?> issueLicense(@RequestBody Map<String, String> body) {
        try {
            Long applicationId = Long.parseLong(body.get("applicationId"));
            String officerId = body.get("officerId");
            return ResponseEntity.ok(licenseService.issueLicense(applicationId, officerId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/licenses/all — View all licenses
    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(licenseService.getAll());
    }

    // GET /api/licenses/user/{applicantId}
    @GetMapping("/user/{applicantId}")
    public ResponseEntity<?> getByApplicant(@PathVariable String applicantId) {
        return ResponseEntity.ok(licenseService.getByApplicant(applicantId));
    }

    // GET /api/licenses/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(licenseService.getById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/licenses/{id}/status — Update license status
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(licenseService.updateStatus(id, body.get("status"), body.get("reason")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/licenses/{id}/revoke — Revoke a license
    @PutMapping("/{id}/revoke")
    public ResponseEntity<?> revoke(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(licenseService.revoke(id, body.get("reason")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/licenses/verify/{appId} — Verify application documents
    @PutMapping("/verify/{appId}")
    public ResponseEntity<?> verifyDocuments(@PathVariable Long appId, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(licenseService.verifyDocuments(appId, body.get("officerId"), body.get("notes")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/licenses/decide/{appId} — Approve or reject application
    @PutMapping("/decide/{appId}")
    public ResponseEntity<?> decideApplication(@PathVariable Long appId, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(licenseService.decideApplication(
                    appId, body.get("officerId"), body.get("decision"), body.get("reason")
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
