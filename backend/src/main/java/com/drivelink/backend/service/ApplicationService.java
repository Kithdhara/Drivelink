package com.drivelink.backend.service;

import com.drivelink.backend.model.LicenseApplication;
import com.drivelink.backend.repository.ApplicationRepository;
import com.drivelink.backend.repository.MedicalAppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private MedicalAppointmentRepository medicalAppointmentRepository;

    @Autowired
    private CloudinaryUploadService cloudinaryUploadService;

    // ─── create new application ──────────────────────────────────────
    public LicenseApplication createApplication(
        String licenseClasses,
        boolean oneDayService,
        String fullName,
        String nic,
        String dateOfBirth,
        String gender,
        String address,
        String phone,
        String email,
        String bloodGroup,
        String emergencyContact,
        String applicantId,
        String applicantName,
        MultipartFile nicCopy,
        MultipartFile passportPhoto,
        MultipartFile medicalReport
    ) throws IOException {

        // Step 1 Check: Applicant must have booked a medical examination
        var medicals = medicalAppointmentRepository.findByApplicantIdOrderByCreatedAtDesc(applicantId);
        if (medicals.isEmpty()) {
            throw new IllegalStateException("Step 1 required: You must book a Medical Examination before submitting an application.");
        }
        boolean hasFailedMedical = medicals.stream().anyMatch(m -> "FAIL".equalsIgnoreCase(m.getResult()));
        if (hasFailedMedical) {
            throw new IllegalStateException("Your medical examination result is FAIL. You cannot apply for a driving licence.");
        }

        // Step 2 Check: Age validation
        try {
            java.time.LocalDate dob = java.time.LocalDate.parse(dateOfBirth);
            long age = java.time.temporal.ChronoUnit.YEARS.between(dob, java.time.LocalDate.now());
            if (age < 18) {
                throw new IllegalStateException("You must be at least 18 years old to apply for a driving licence.");
            }
        } catch (java.time.format.DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid Date of Birth format.");
        }

        // Duplicate Check: Check if applicant already has an active or approved application
        List<LicenseApplication> existing = applicationRepository.findByApplicantIdOrderBySubmittedAtDesc(applicantId);
        boolean hasActive = existing.stream().anyMatch(a -> 
            !"rejected".equalsIgnoreCase(a.getStatus()) && 
            !"cancelled".equalsIgnoreCase(a.getStatus()) &&
            !"license_issued".equalsIgnoreCase(a.getStatus())
        );
        if (hasActive) {
            throw new IllegalStateException("You already have an active licence application on file. If your application was rejected, you may reapply.");
        }

        String nicCopyPath       = cloudinaryUploadService.upload(nicCopy, "drivelink/applications");
        String passportPhotoPath = cloudinaryUploadService.upload(passportPhoto, "drivelink/applications");
        String medicalReportPath = (medicalReport != null && !medicalReport.isEmpty())
                ? cloudinaryUploadService.upload(medicalReport, "drivelink/applications") : null;

        LicenseApplication app = new LicenseApplication();
        app.setApplicantId(applicantId);
        app.setApplicantName(applicantName);
        app.setLicenseClasses(licenseClasses);
        app.setOneDayService(oneDayService);
        app.setFullName(fullName);
        app.setNic(nic);
        app.setDateOfBirth(dateOfBirth);
        app.setGender(gender);
        app.setAddress(address);
        app.setPhone(phone);
        app.setEmail(email);
        app.setBloodGroup(bloodGroup);
        app.setEmergencyContact(emergencyContact);
        app.setNicCopyPath(nicCopyPath);
        app.setPassportPhotoPath(passportPhotoPath);
        app.setMedicalReportPath(medicalReportPath);
        app.setStatus("pending");
        app.setSubmittedAt(LocalDateTime.now());
        app.setUpdatedAt(LocalDateTime.now());

        return applicationRepository.save(app);
    }

    // ─── edit application (allowed only within 12 hours) ──────────────
    public Optional<LicenseApplication> editApplication(
            Long id,
            String fullName,
            String nic,
            String dateOfBirth,
            String gender,
            String address,
            String phone,
            String email,
            String bloodGroup,
            String emergencyContact,
            MultipartFile nicCopy,
            MultipartFile passportPhoto,
            MultipartFile medicalReport

    ) throws IOException {

        Optional<LicenseApplication> found = applicationRepository.findById(id);
        if (found.isEmpty()) return Optional.empty();

        LicenseApplication app = found.get();

        // Enforce lock if status is already approved or processed
        if (!"pending".equalsIgnoreCase(app.getStatus()) && !"submitted".equalsIgnoreCase(app.getStatus())) {
            throw new IllegalStateException("Application is locked. Approved or completed applications cannot be edited.");
        }

        // Enforce 12-hour lock
        if (app.getSubmittedAt().isBefore(LocalDateTime.now().minusHours(12))) {
            throw new IllegalStateException("Edit window has closed. Applications can only be edited within 12 hours of submission.");
        }

        // Update personal details
        if (fullName       != null) app.setFullName(fullName);
        if (nic            != null) app.setNic(nic);
        if (dateOfBirth    != null) app.setDateOfBirth(dateOfBirth);
        if (gender         != null) app.setGender(gender);
        if (address        != null) app.setAddress(address);
        if (phone          != null) app.setPhone(phone);
        if (email          != null) app.setEmail(email);
        if (bloodGroup     != null) app.setBloodGroup(bloodGroup);
        if (emergencyContact != null) app.setEmergencyContact(emergencyContact);

        // Replace documents if new files provided
        if (nicCopy != null && !nicCopy.isEmpty())
            app.setNicCopyPath(saveFile(nicCopy, "nic"));
        if (passportPhoto != null && !passportPhoto.isEmpty())
            app.setPassportPhotoPath(saveFile(passportPhoto, "passport"));
        if (medicalReport != null && !medicalReport.isEmpty())
            app.setMedicalReportPath(saveFile(medicalReport, "medical"));

        app.setUpdatedAt(LocalDateTime.now());
        return Optional.of(applicationRepository.save(app));
    }

    // ─── read all (officer dashboard) ────────────────────────────────
    public List<LicenseApplication> getAllApplications() {
        return applicationRepository.findAll();
    }

    // ─── read by id ───────────────────────────────────────────────────
    public Optional<LicenseApplication> getApplicationById(Long id) {
        return applicationRepository.findById(id);
    }

    // ─── read by applicant ────────────────────────────────────────────
    public List<LicenseApplication> getApplicationsByApplicant(String applicantId) {
        return applicationRepository.findByApplicantIdOrderBySubmittedAtDesc(applicantId);
    }

    // ─── read by status ───────────────────────────────────────────────
    public List<LicenseApplication> getApplicationsByStatus(String status) {
        return applicationRepository.findByStatus(status);
    }

    // ─── read by applicant + status ───────────────────────────────────
    public List<LicenseApplication> getApplicationsByApplicantAndStatus(
            String applicantId, String status) {
        return applicationRepository.findByApplicantIdAndStatus(applicantId, status);
    }

    // ─── update status (officer approve / reject) ─────────────────────
    public Optional<LicenseApplication> updateStatus(
            Long id, String newStatus, String officerNotes, String rejectionReason) {

        Optional<LicenseApplication> found = applicationRepository.findById(id);
        if (found.isEmpty()) return Optional.empty();

        LicenseApplication app = found.get();
        app.setStatus(newStatus);
        if (officerNotes   != null) app.setOfficerNotes(officerNotes);
        if (rejectionReason != null) app.setRejectionReason(rejectionReason);
        app.setUpdatedAt(LocalDateTime.now());
        applicationRepository.save(app);
        return Optional.of(app);
    }

    // ─── cancel & delete ───────────────────────────────────────────────────────
    public void cancelApplication(Long id) {
        LicenseApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (!"pending".equals(app.getStatus())) {
            throw new RuntimeException("Can only cancel pending applications");
        }
        if (app.getSubmittedAt() != null &&
                ChronoUnit.HOURS.between(app.getSubmittedAt(), LocalDateTime.now()) > 12) {
            throw new RuntimeException("Cancellation window has expired (12 hours)");
        }

        app.setStatus("cancelled");
        applicationRepository.save(app);
    }

    public void deleteApplication(Long id) {
        LicenseApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        if (!"cancelled".equals(app.getStatus())) {
            throw new RuntimeException("Only cancelled applications can be deleted");
        }
        applicationRepository.deleteById(id);
    }

}
