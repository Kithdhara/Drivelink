package com.drivelink.backend.controller;

import com.drivelink.backend.model.LicenseApplication;
import com.drivelink.backend.service.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    // Email and Phone regex patterns for basic validation
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\d{10}$");
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    private void validateString(String value, String fieldName, int minLength, int maxLength, Pattern pattern) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        if (value.length() < minLength || value.length() > maxLength) {
            throw new IllegalArgumentException(fieldName + " must be between " + minLength + " and " + maxLength + " characters");
        }
        if (pattern != null && !pattern.matcher(value).matches()) {
            throw new IllegalArgumentException(fieldName + " format is invalid");
        }
    }

    private void validateFile(MultipartFile file, String fieldName) {
        if (file == null || file.isEmpty()) return; // some might be optional, handled by @RequestParam
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(fieldName + " file size exceeds 5MB limit");
        }
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            throw new IllegalArgumentException(fieldName + " must be an image or PDF");
        }
    }

    // ════════════════════════════════════════════════════════════
    //  POST /api/applications  (multipart/form-data)
    //  Submit a new licence application with uploaded documents
    // ════════════════════════════════════════════════════════════
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> createApplication(
            @RequestParam("licenseClasses")  String licenseClasses,
            @RequestParam(value = "oneDayService", required = false, defaultValue = "false") boolean oneDayService,
            @RequestParam("fullName")        String fullName,
            @RequestParam("nic")             String nic,
            @RequestParam("dateOfBirth")     String dateOfBirth,
            @RequestParam("gender")          String gender,
            @RequestParam("address")         String address,
            @RequestParam("phone")           String phone,
            @RequestParam("email")           String email,
            @RequestParam("bloodGroup")      String bloodGroup,
            @RequestParam(value = "emergencyContact", required = false) String emergencyContact,
            @RequestParam("applicantId")     String applicantId,
            @RequestParam("applicantName")   String applicantName,
            @RequestParam("nicCopy")         MultipartFile nicCopy,
            @RequestParam("passportPhoto")   MultipartFile passportPhoto,
            @RequestParam(value = "medicalReport", required = false) MultipartFile medicalReport
    ) {
        try {
            validateString(fullName, "Full Name", 2, 100, null);
            validateString(nic, "NIC", 10, 12, null);
            validateString(phone, "Phone", 10, 10, PHONE_PATTERN);
            validateString(email, "Email", 5, 100, EMAIL_PATTERN);
            
            validateFile(nicCopy, "NIC Copy");
            validateFile(passportPhoto, "Passport Photo");
            if (medicalReport != null) validateFile(medicalReport, "Medical Report");

            LicenseApplication saved = applicationService.createApplication(
                    licenseClasses, oneDayService, fullName, nic, dateOfBirth, gender,
                    address, phone, email, bloodGroup, emergencyContact,
                    applicantId, applicantName,
                    nicCopy, passportPhoto, medicalReport
            );
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Internal error: " + e.getMessage());
        }
    }

    // ════════════════════════════════════════════════════════════
    //  PUT /api/applications/{id}/edit  (multipart/form-data)
    //  Applicant edits application — only within 12 hours
    // ════════════════════════════════════════════════════════════
    @PutMapping(value = "/{id}/edit", consumes = "multipart/form-data")
    public ResponseEntity<?> editApplication(
            @PathVariable Long id,
            @RequestParam(value = "fullName",         required = false) String fullName,
            @RequestParam(value = "nic",              required = false) String nic,
            @RequestParam(value = "dateOfBirth",      required = false) String dateOfBirth,
            @RequestParam(value = "gender",           required = false) String gender,
            @RequestParam(value = "address",          required = false) String address,
            @RequestParam(value = "phone",            required = false) String phone,
            @RequestParam(value = "email",            required = false) String email,
            @RequestParam(value = "bloodGroup",       required = false) String bloodGroup,
            @RequestParam(value = "emergencyContact", required = false) String emergencyContact,
            @RequestParam(value = "nicCopy",          required = false) MultipartFile nicCopy,
            @RequestParam(value = "passportPhoto",    required = false) MultipartFile passportPhoto,
            @RequestParam(value = "medicalReport",    required = false) MultipartFile medicalReport
    ) {
        try {
            if (fullName != null) validateString(fullName, "Full Name", 2, 100, null);
            if (nic != null) validateString(nic, "NIC", 10, 12, null);
            if (phone != null) validateString(phone, "Phone", 10, 10, PHONE_PATTERN);
            if (email != null) validateString(email, "Email", 5, 100, EMAIL_PATTERN);
            
            if (nicCopy != null) validateFile(nicCopy, "NIC Copy");
            if (passportPhoto != null) validateFile(passportPhoto, "Passport Photo");
            if (medicalReport != null) validateFile(medicalReport, "Medical Report");

            Optional<LicenseApplication> updated = applicationService.editApplication(
                    id, fullName, nic, dateOfBirth, gender, address, phone,
                    email, bloodGroup, emergencyContact,
                    nicCopy, passportPhoto, medicalReport
            );
            if (updated.isPresent()) return ResponseEntity.ok(updated.get());
            return ResponseEntity.status(404).body("Application not found");
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Internal error: " + e.getMessage());
        }
    }

    //  GET /api/applications/all
    //  Officer: fetch every application in the system

    @GetMapping("/all")
    public ResponseEntity<List<LicenseApplication>> getAllApplications() {
        return ResponseEntity.ok(applicationService.getAllApplications());
    }

    //  GET /api/applications/{id}

    @GetMapping("/{id}")
    public ResponseEntity<?> getApplication(@PathVariable Long id) {
        Optional<LicenseApplication> found = applicationService.getApplicationById(id);
        if (found.isPresent()) return ResponseEntity.ok(found.get());
        return ResponseEntity.status(404).body("Application not found");
    }


    //  GET /api/applications/applicant/{applicantId}

    @GetMapping("/applicant/{applicantId}")
    public ResponseEntity<List<LicenseApplication>> getByApplicant(@PathVariable String applicantId) {
        return ResponseEntity.ok(applicationService.getApplicationsByApplicant(applicantId));
    }

    //  GET /api/applications/status/{status}

    @GetMapping("/status/{status}")
    public ResponseEntity<List<LicenseApplication>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(applicationService.getApplicationsByStatus(status));
    }


    //  GET /api/applications/applicant/{applicantId}/status/{status}

    @GetMapping("/applicant/{applicantId}/status/{status}")
    public ResponseEntity<List<LicenseApplication>> getByApplicantAndStatus(
            @PathVariable String applicantId, @PathVariable String status) {
        return ResponseEntity.ok(
                applicationService.getApplicationsByApplicantAndStatus(applicantId, status));
    }


    //  PUT /api/applications/{id}
    //  Officer updates status + notes + rejection reason
    //  Body: { "status": "approved", "officerNotes": "...", "rejectionReason": "..." }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            Optional<LicenseApplication> updated = applicationService.updateStatus(
                    id,
                    body.get("status"),
                    body.get("officerNotes"),
                    body.get("rejectionReason")
            );
            if (updated.isPresent()) return ResponseEntity.ok(updated.get());
            return ResponseEntity.status(404).body("Application not found");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    //  GET /api/applications/files/{filename}
    //  Serve an uploaded document file to the browser

    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path file = Paths.get("uploads/applications/").resolve(filename).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists()) return ResponseEntity.notFound().build();

            String contentType = "application/octet-stream";
            String lower = filename.toLowerCase();
            if (lower.endsWith(".pdf")) contentType = "application/pdf";
            else if (lower.endsWith(".png")) contentType = "image/png";
            else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) contentType = "image/jpeg";
            else if (lower.endsWith(".webp")) contentType = "image/webp";
            else if (lower.endsWith(".gif")) contentType = "image/gif";
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // PUT /api/applications/{id}/cancel
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelApplication(@PathVariable Long id) {
        try {
            applicationService.cancelApplication(id);
            return ResponseEntity.ok(Map.of("message", "Application cancelled successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/applications/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteApplication(@PathVariable Long id) {
        try {
            applicationService.deleteApplication(id);
            return ResponseEntity.ok(Map.of("message", "Application deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
