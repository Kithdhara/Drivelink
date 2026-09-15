package com.drivelink.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

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

    private String medicalReportId;

    @Enumerated(EnumType.STRING)
    private RenewalStatus status = RenewalStatus.PENDING;

    private String officerNotes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime requestDate;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public String getMedicalReportId() { return medicalReportId; }
    public void setMedicalReportId(String medicalReportId) { this.medicalReportId = medicalReportId; }

    public RenewalStatus getStatus() { return status; }
    public void setStatus(RenewalStatus status) { this.status = status; }

    public String getOfficerNotes() { return officerNotes; }
    public void setOfficerNotes(String officerNotes) { this.officerNotes = officerNotes; }

    public LocalDateTime getRequestDate() { return requestDate; }
    public void setRequestDate(LocalDateTime requestDate) { this.requestDate = requestDate; }
}
