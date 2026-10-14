package com.drivelink.backend.service;

import com.drivelink.backend.model.LicenseRecord;
import com.drivelink.backend.model.RenewalRequest;
import com.drivelink.backend.model.RenewalStatus;
import com.drivelink.backend.repository.LicenseRecordRepository;
import com.drivelink.backend.repository.RenewalRepository;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class RenewalService {

    private final RenewalRepository renewalRepository;
    private final LicenseRecordRepository licenseRecordRepository;
    private final CloudinaryUploadService cloudinaryUploadService;

    public RenewalService(RenewalRepository renewalRepository,
                          LicenseRecordRepository licenseRecordRepository,
                          CloudinaryUploadService cloudinaryUploadService) {
        this.renewalRepository = renewalRepository;
        this.licenseRecordRepository = licenseRecordRepository;
        this.cloudinaryUploadService = cloudinaryUploadService;
    }

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

        // Check if there is already an active renewal
        java.util.List<RenewalRequest> existing = renewalRepository.findByApplicantIdOrderByCreatedAtDesc(applicantId);
        boolean hasActive = existing.stream().anyMatch(r -> 
            r.getStatus() != RenewalStatus.CANCELLED && 
            r.getStatus() != RenewalStatus.REJECTED &&
            r.getStatus() != RenewalStatus.APPROVED
        );
        if (hasActive) {
            throw new IllegalStateException("You already have an active renewal application in progress.");
        }

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
            request.setNicCopyPath(cloudinaryUploadService.upload(nicCopy, "drivelink/renewals"));
        }
        if (passportPhoto != null && !passportPhoto.isEmpty()) {
            request.setPhotoPath(cloudinaryUploadService.upload(passportPhoto, "drivelink/renewals"));
        }
        if (medicalReport != null && !medicalReport.isEmpty()) {
            request.setMedicalReportPath(cloudinaryUploadService.upload(medicalReport, "drivelink/renewals"));
        }

        return renewalRepository.save(request);
    }

    private void validateLicenseNumber(String licenseNumber) {
        if (licenseNumber == null || !licenseNumber.trim().toUpperCase().matches("^[A-Z][0-9]{7}$")) {
            throw new IllegalArgumentException("Existing licence number must be 1 capital letter followed by 7 digits (e.g. B1234567)");
        }
    }

    // CRUD 2: Get renewal by ID / Get by applicant
    public RenewalRequest getById(String id) {
        return renewalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Renewal request not found"));
    }

    public List<RenewalRequest> getByApplicant(String applicantId) {
        return renewalRepository.findByApplicantIdOrderByCreatedAtDesc(applicantId);
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

    // CRUD 5: Delete renewal (hard delete for cancelled only)
    public void delete(String id) {
        RenewalRequest existing = getById(id);
        if (existing.getStatus() != RenewalStatus.CANCELLED) {
            throw new RuntimeException("Only cancelled renewals can be deleted");
        }
        renewalRepository.deleteById(id);
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

        // Extend license validity by 8 years and ensure active status
        var existing = licenseRecordRepository.findByLicenseNumber(r.getLicenseNumber());
        if (existing.isPresent()) {
            LicenseRecord lr = existing.get();
            lr.setExpiresAt(LocalDate.now().plusYears(8).format(DateTimeFormatter.ISO_LOCAL_DATE));
            lr.setStatus("ACTIVE");
            if (r.getCategory() != null) lr.setCategory(r.getCategory());
            licenseRecordRepository.save(lr);
        } else {
            LicenseRecord lr = new LicenseRecord();
            lr.setApplicantId(r.getApplicantId());
            lr.setLicenseNumber(r.getLicenseNumber());
            lr.setCategory(r.getCategory());
            lr.setIssuedAt(LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE));
            lr.setExpiresAt(LocalDate.now().plusYears(8).format(DateTimeFormatter.ISO_LOCAL_DATE));
            lr.setStatus("ACTIVE");
            lr.setApplicationId(0L); // 0L indicates it was created via Renewal process (no original Application ID)
            lr.setIssuedBy("Registration Officer");
            licenseRecordRepository.save(lr);
        }

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
