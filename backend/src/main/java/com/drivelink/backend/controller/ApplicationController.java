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

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

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
            LicenseApplication saved = applicationService.createApplication(
                    licenseClasses, oneDayService, fullName, nic, dateOfBirth, gender,
                    address, phone, email, bloodGroup, emergencyContact,
                    applicantId, applicantName,
                    nicCopy, passportPhoto, medicalReport
            );
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
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
            Optional<LicenseApplication> updated = applicationService.editApplication(
                    id, fullName, nic, dateOfBirth, gender, address, phone,
                    email, bloodGroup, emergencyContact,
                    nicCopy, passportPhoto, medicalReport
            );
            if (updated.isPresent()) return ResponseEntity.ok(updated.get());
            return ResponseEntity.status(404).body("Application not found");
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
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

    //  DELETE /api/applications/{id}

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteApplication(@PathVariable Long id) {
        boolean deleted = applicationService.deleteApplication(id);
        if (deleted) return ResponseEntity.ok("Application deleted successfully");
        return ResponseEntity.status(404).body("Application not found");
    }
}
