package com.drivelink.backend.controller;

import com.drivelink.backend.model.RenewalRequest;
import com.drivelink.backend.service.RenewalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/renewals")
public class RenewalController {

    private final RenewalService renewalService;

    public RenewalController(RenewalService renewalService) {
        this.renewalService = renewalService;
    }

    // POST /api/renewals — Submit a renewal request (multipart with files)
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> createWithFiles(
            @RequestParam("applicantId")     String applicantId,
            @RequestParam("licenseNumber")   String licenseNumber,
            @RequestParam("category")        String category,
            @RequestParam("fullName")        String fullName,
            @RequestParam("nic")             String nic,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "oneDayService", required = false, defaultValue = "false") boolean oneDayService,
            @RequestParam(value = "nicCopy", required = false) org.springframework.web.multipart.MultipartFile nicCopy,
            @RequestParam(value = "passportPhoto", required = false) org.springframework.web.multipart.MultipartFile passportPhoto,
            @RequestParam(value = "medicalReport", required = false) org.springframework.web.multipart.MultipartFile medicalReport
    ) {
        try {
            return ResponseEntity.ok(renewalService.createWithFiles(
                    applicantId, licenseNumber, category, fullName, nic, phone, email, address,
                    oneDayService, nicCopy, passportPhoto, medicalReport
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // POST /api/renewals/json — Submit a renewal request (JSON)
    @PostMapping(consumes = "application/json")
    public ResponseEntity<?> createJson(@RequestBody RenewalRequest request) {
        try {
            return ResponseEntity.ok(renewalService.create(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/renewals/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(renewalService.getById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/renewals/user/{applicantId}
    @GetMapping("/user/{applicantId}")
    public ResponseEntity<?> getByApplicant(@PathVariable String applicantId) {
        return ResponseEntity.ok(renewalService.getByApplicant(applicantId));
    }

    // PUT /api/renewals/{id}/edit — Edit renewal (within 24 hours)
    @PutMapping("/{id}/edit")
    public ResponseEntity<?> edit(@PathVariable String id, @RequestBody RenewalRequest updated) {
        try {
            return ResponseEntity.ok(renewalService.edit(id, updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/renewals/{id}/cancel — Cancel renewal (within 12 hours)
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable String id) {
        try {
            RenewalRequest cancelled = renewalService.cancel(id);
            return ResponseEntity.ok(Map.of("message", "Renewal request cancelled successfully", "status", "CANCELLED", "renewal", cancelled));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/renewals/{id} — Cancel/Soft-delete (within 12 hours)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            RenewalRequest cancelled = renewalService.cancel(id);
            return ResponseEntity.ok(Map.of("message", "Renewal request cancelled successfully", "status", "CANCELLED", "renewal", cancelled));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/renewals/{id}/editable — Check if within 24-hour window
    @GetMapping("/{id}/editable")
    public ResponseEntity<?> isEditable(@PathVariable String id) {
        try {
            return ResponseEntity.ok(Map.of("editable", renewalService.isEditable(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/renewals/pending — Officer: get all pending
    @GetMapping("/pending")
    public ResponseEntity<?> getPending() {
        return ResponseEntity.ok(renewalService.getPending());
    }

    // GET /api/renewals/all — Officer: get all renewals
    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(renewalService.getAll());
    }

    // PUT /api/renewals/{id}/approve
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(renewalService.approve(id, body.get("notes")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/renewals/{id}/reject
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(renewalService.reject(id, body.get("notes"), body.get("reason")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/renewals/files/{filename} — Serve uploaded renewal documents
    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<org.springframework.core.io.Resource> serveFile(@PathVariable String filename) {
        try {
            java.nio.file.Path file = java.nio.file.Paths.get("uploads/renewals/").resolve(filename).normalize();
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(file.toUri());
            if (!resource.exists()) return ResponseEntity.notFound().build();

            String contentType = "application/octet-stream";
            String lower = filename.toLowerCase();
            if (lower.endsWith(".pdf")) contentType = "application/pdf";
            else if (lower.endsWith(".png")) contentType = "image/png";
            else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) contentType = "image/jpeg";
            else if (lower.endsWith(".webp")) contentType = "image/webp";

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .body(resource);
        } catch (java.net.MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
