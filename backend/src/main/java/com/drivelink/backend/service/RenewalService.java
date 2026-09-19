package com.drivelink.backend.service;

import com.drivelink.backend.model.RenewalRequest;
import com.drivelink.backend.model.RenewalStatus;
import com.drivelink.backend.repository.RenewalRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class RenewalService {

    private final RenewalRepository renewalRepository;

    public RenewalService(RenewalRepository renewalRepository) {
        this.renewalRepository = renewalRepository;
    }

    private final String UPLOAD_DIR = "uploads/renewals/";

    // CRUD 1: Submit a renewal request
    public RenewalRequest create(RenewalRequest request) {
        validateLicenseNumber(request.getLicenseNumber());
        request.setStatus(RenewalStatus.PENDING);
        return renewalRepository.save(request);
    }

    public RenewalRequest createWithFiles(
            String applicantId,
            String licenseNumber,
            String category,
            String fullName,
            String nic,
            String phone,
            String email,
            String address,
            boolean oneDayService,
            org.springframework.web.multipart.MultipartFile nicCopy,
            org.springframework.web.multipart.MultipartFile passportPhoto,
            org.springframework.web.multipart.MultipartFile medicalReport
    ) throws java.io.IOException {
        validateLicenseNumber(licenseNumber);

        RenewalRequest request = new RenewalRequest();
        request.setApplicantId(applicantId);
        request.setLicenseNumber(licenseNumber.trim().toUpperCase());
        request.setCategory(category);
        request.setFullName(fullName);
        request.setNic(nic);
        request.setPhone(phone);
        request.setEmail(email);
        request.setAddress(address);
        request.setOneDayService(oneDayService);
        request.setStatus(RenewalStatus.PENDING);

        if (nicCopy != null && !nicCopy.isEmpty()) {
            request.setNicCopyPath(saveFile(nicCopy, "nic"));
        }
        if (passportPhoto != null && !passportPhoto.isEmpty()) {
            request.setPhotoPath(saveFile(passportPhoto, "photo"));
        }
        if (medicalReport != null && !medicalReport.isEmpty()) {
            request.setMedicalReportPath(saveFile(medicalReport, "medical"));
        }

        return renewalRepository.save(request);
    }

    private void validateLicenseNumber(String licenseNumber) {
        if (licenseNumber == null || !licenseNumber.trim().toUpperCase().matches("^[A-Z][0-9]{7}$")) {
            throw new IllegalArgumentException("Existing licence number must be 1 capital letter followed by 7 digits (e.g. B1234567)");
        }
    }

    private String saveFile(org.springframework.web.multipart.MultipartFile file, String prefix) throws java.io.IOException {
        java.nio.file.Path uploadPath = java.nio.file.Paths.get(UPLOAD_DIR);
        if (!java.nio.file.Files.exists(uploadPath)) {
            java.nio.file.Files.createDirectories(uploadPath);
        }
        String originalName = file.getOriginalFilename();
        String extension = originalName != null && originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf(".")) : ".bin";
        String newFileName = prefix + "_" + java.util.UUID.randomUUID() + extension;
        java.nio.file.Path filePath = uploadPath.resolve(newFileName);
        java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        return UPLOAD_DIR + newFileName;
    }

    // CRUD 2: Get renewal by ID / Get by applicant
    public RenewalRequest getById(String id) {
        return renewalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Renewal request not found"));
    }

    public List<RenewalRequest> getByApplicant(String applicantId) {
        return renewalRepository.findByApplicantId(applicantId);
    }

    // CRUD 3: Edit renewal (within 12 hours only)
    public RenewalRequest edit(String id, RenewalRequest updated) {
        RenewalRequest existing = getById(id);

        // Check 12-hour window
        if (existing.getCreatedAt() != null &&
                ChronoUnit.HOURS.between(existing.getCreatedAt(), LocalDateTime.now()) > 12) {
            throw new RuntimeException("Edit window has expired (12 hours after submission)");
        }

        // Only editable when PENDING
        if (existing.getStatus() != RenewalStatus.PENDING) {
            throw new RuntimeException("Can only edit PENDING renewal requests");
        }

        // Update allowed fields
        if (updated.getLicenseNumber() != null) existing.setLicenseNumber(updated.getLicenseNumber());
        if (updated.getCategory() != null) existing.setCategory(updated.getCategory());
        if (updated.getFullName() != null) existing.setFullName(updated.getFullName());
        if (updated.getNic() != null) existing.setNic(updated.getNic());
        if (updated.getPhone() != null) existing.setPhone(updated.getPhone());
        if (updated.getEmail() != null) existing.setEmail(updated.getEmail());
        if (updated.getAddress() != null) existing.setAddress(updated.getAddress());
        existing.setOneDayService(updated.isOneDayService());

        return renewalRepository.save(existing);
    }

    // CRUD 4: Cancel renewal (within 12 hours only, soft-cancel)
    public RenewalRequest cancel(String id) {
        RenewalRequest existing = getById(id);

        if (existing.getCreatedAt() != null &&
                ChronoUnit.HOURS.between(existing.getCreatedAt(), LocalDateTime.now()) > 12) {
            throw new RuntimeException("Cancellation window has expired (12 hours after submission)");
        }

        if (existing.getStatus() != RenewalStatus.PENDING) {
            throw new RuntimeException("Can only cancel PENDING renewal requests");
        }

        existing.setStatus(RenewalStatus.CANCELLED);
        return renewalRepository.save(existing);
    }

    // CRUD 5: Delete renewal (within 12 hours only)
    public void delete(String id) {
        cancel(id);
    }

    // Officer: get all pending renewals
    public List<RenewalRequest> getPending() {
        return renewalRepository.findByStatus(RenewalStatus.PENDING);
    }

    // Officer: get all renewals
    public List<RenewalRequest> getAll() {
        return renewalRepository.findAll();
    }

    // Officer: approve renewal
    public RenewalRequest approve(String id, String notes) {
        RenewalRequest r = getById(id);
        r.setStatus(RenewalStatus.APPROVED);
        r.setOfficerNotes(notes);
        return renewalRepository.save(r);
    }

    // Officer: reject renewal
    public RenewalRequest reject(String id, String notes, String reason) {
        RenewalRequest r = getById(id);
        r.setStatus(RenewalStatus.REJECTED);
        r.setOfficerNotes(notes);
        r.setRejectionReason(reason);
        return renewalRepository.save(r);
    }

    // Check if within 12-hour edit window
    public boolean isEditable(String id) {
        RenewalRequest r = getById(id);
        if (r.getStatus() != RenewalStatus.PENDING) return false;
        if (r.getCreatedAt() == null) return true;
        return ChronoUnit.HOURS.between(r.getCreatedAt(), LocalDateTime.now()) <= 12;
    }
}
