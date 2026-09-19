package com.drivelink.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "renewal_requests")
public class RenewalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String applicantId;

    @Column(nullable = false)
    private String licenseNumber;

    @Column(nullable = false)
    private String category; // A, A1, B, etc.

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String nic;

    private String phone;
    private String email;
    private String address;

    private boolean oneDayService;

    // Document paths
    private String nicCopyPath;
    private String photoPath;
    private String existingLicensePath;
    private String medicalReportPath;

    @Enumerated(EnumType.STRING)
    private RenewalStatus status = RenewalStatus.PENDING;

    private String officerNotes;
    private String rejectionReason;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getNic() { return nic; }
    public void setNic(String nic) { this.nic = nic; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public boolean isOneDayService() { return oneDayService; }
    public void setOneDayService(boolean oneDayService) { this.oneDayService = oneDayService; }

    public String getNicCopyPath() { return nicCopyPath; }
    public void setNicCopyPath(String nicCopyPath) { this.nicCopyPath = nicCopyPath; }

    public String getPhotoPath() { return photoPath; }
    public void setPhotoPath(String photoPath) { this.photoPath = photoPath; }

    public String getExistingLicensePath() { return existingLicensePath; }
    public void setExistingLicensePath(String existingLicensePath) { this.existingLicensePath = existingLicensePath; }

    public String getMedicalReportPath() { return medicalReportPath; }
    public void setMedicalReportPath(String medicalReportPath) { this.medicalReportPath = medicalReportPath; }

    public RenewalStatus getStatus() { return status; }
    public void setStatus(RenewalStatus status) { this.status = status; }

    public String getOfficerNotes() { return officerNotes; }
    public void setOfficerNotes(String officerNotes) { this.officerNotes = officerNotes; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
