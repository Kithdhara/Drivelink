package com.drivelink.backend.service;

import com.drivelink.backend.model.LicenseApplication;
import com.drivelink.backend.model.LicenseRecord;
import com.drivelink.backend.repository.ApplicationRepository;
import com.drivelink.backend.repository.LicenseRecordRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class LicenseService {

    private final LicenseRecordRepository licenseRepo;
    private final ApplicationRepository appRepo;

    public LicenseService(LicenseRecordRepository licenseRepo, ApplicationRepository appRepo) {
        this.licenseRepo = licenseRepo;
        this.appRepo = appRepo;
    }

    // CRUD 1: Issue a license (create) — officer creates a license record after full approval
    public LicenseRecord issueLicense(Long applicationId, String officerId) {
        LicenseApplication app = appRepo.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        // Check if license already issued for this application
        if (licenseRepo.findByApplicationId(applicationId).isPresent()) {
            throw new RuntimeException("License already issued for this application");
        }

        // Application must have passed the driving trial
        if (!"trial_passed".equalsIgnoreCase(app.getStatus())) {
            throw new RuntimeException("Cannot issue licence in the 1st stage of application. Applicant must complete and pass the driving trial first (status must be trial_passed).");
        }

        // Generate license number
        String licenseNumber = generateLicenseNumber(app.getLicenseClasses());

        LicenseRecord license = new LicenseRecord();
        license.setApplicantId(app.getApplicantId());
        license.setApplicationId(applicationId);
        license.setLicenseNumber(licenseNumber);
        license.setCategory(app.getLicenseClasses());
        license.setIssuedAt(LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE));
        license.setExpiresAt(LocalDate.now().plusYears(8).format(DateTimeFormatter.ISO_LOCAL_DATE));
        license.setStatus("ACTIVE");
        license.setIssuedBy(officerId);

        // Update application status
        app.setStatus("license_issued");
        appRepo.save(app);

        return licenseRepo.save(license);
    }

    // CRUD 2: View/search all licenses
    public List<LicenseRecord> getAll() {
        return licenseRepo.findAll();
    }

    public List<LicenseRecord> getByApplicant(String applicantId) {
        return licenseRepo.findByApplicantId(applicantId);
    }

    public LicenseRecord getById(Long id) {
        return licenseRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("License not found"));
    }

    // CRUD 3: Update license status (suspend, reactivate, mark expired)
    public LicenseRecord updateStatus(Long id, String newStatus, String reason) {
        LicenseRecord license = licenseRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("License not found"));

        license.setStatus(newStatus);
        if ("REVOKED".equalsIgnoreCase(newStatus) || "SUSPENDED".equalsIgnoreCase(newStatus)) {
            license.setRevokeReason(reason);
        }

        return licenseRepo.save(license);
    }

    // CRUD 4: Revoke/delete license
    public LicenseRecord revoke(Long id, String reason) {
        LicenseRecord license = licenseRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("License not found"));

        license.setStatus("REVOKED");
        license.setRevokeReason(reason);

        return licenseRepo.save(license);
    }

    // Verify application documents (part of Thasalogithan's workflow)
    public LicenseApplication verifyDocuments(Long applicationId, String officerId, String notes) {
        LicenseApplication app = appRepo.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (!"pending".equalsIgnoreCase(app.getStatus()) && !"submitted".equalsIgnoreCase(app.getStatus())) {
            throw new RuntimeException("Application is not in a verifiable state");
        }

        app.setStatus("documents_verified");
        app.setOfficerNotes(notes);
        app.setUpdatedAt(java.time.LocalDateTime.now());

        return appRepo.save(app);
    }

    // Approve or reject application (part of Thasalogithan's workflow)
    public LicenseApplication decideApplication(Long applicationId, String officerId,
                                                 String decision, String reason) {
        LicenseApplication app = appRepo.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if ("approve".equalsIgnoreCase(decision)) {
            app.setStatus("approved");
        } else {
            app.setStatus("rejected");
            app.setRejectionReason(reason);
        }
        app.setOfficerNotes(reason);
        app.setUpdatedAt(java.time.LocalDateTime.now());

        return appRepo.save(app);
    }

    // Helper: generate a Sri Lanka style license number (1 capital letter + 7 digits)
    private String generateLicenseNumber(String category) {
        String prefix = (category != null && !category.isEmpty())
                ? category.substring(0, 1).toUpperCase() : "B";
        int number = java.util.concurrent.ThreadLocalRandom.current().nextInt(1000000, 10000000);
        return prefix + number;
    }
}
