package com.drivelink.backend.service;

import com.drivelink.backend.model.LicenseApplication;
import com.drivelink.backend.repository.ApplicationRepository;
import com.drivelink.backend.repository.MedicalAppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private MedicalAppointmentRepository medicalAppointmentRepository;

    // uploaded file saves on computer
    // folder creates automatically if it doesnt exist
    private final String UPLOAD_DIR = "uploads/applications/";

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
        var medicals = medicalAppointmentRepository.findByApplicantId(applicantId);
        if (medicals.isEmpty()) {
            throw new IllegalStateException("Step 1 required: You must book a Medical Examination before submitting an application.");
        }
        boolean hasFailedMedical = medicals.stream().anyMatch(m -> "FAIL".equalsIgnoreCase(m.getResult()));
        if (hasFailedMedical) {
            throw new IllegalStateException("Your medical examination result is FAIL. You cannot apply for a driving licence.");
        }

        // Duplicate Check: Check if applicant already has an active or approved application
        List<LicenseApplication> existing = applicationRepository.findByApplicantId(applicantId);
        boolean hasActive = existing.stream().anyMatch(a -> !"rejected".equalsIgnoreCase(a.getStatus()));
        if (hasActive) {
            throw new IllegalStateException("You already have an active licence application on file. If your application was rejected, you may reapply.");
        }

        String nicCopyPath      = saveFile(nicCopy, "nic");
        String passportPhotoPath = saveFile(passportPhoto, "passport");
        String medicalReportPath = (medicalReport != null && !medicalReport.isEmpty())
                ? saveFile(medicalReport, "medical") : null;

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
        return applicationRepository.findByApplicantId(applicantId);
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

    // ─── delete ───────────────────────────────────────────────────────
    public boolean deleteApplication(Long id) {
        if (applicationRepository.existsById(id)) {
            applicationRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // ─── helper: save file to disk ────────────────────────────────────
    private String saveFile(MultipartFile file, String prefix) throws IOException {
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

        String originalName = file.getOriginalFilename();
        String extension    = originalName != null && originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf(".")) : ".bin";
        String newFileName  = prefix + "_" + UUID.randomUUID() + extension;

        Path filePath = uploadPath.resolve(newFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return UPLOAD_DIR + newFileName;
    }
}
