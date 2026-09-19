package com.drivelink.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "medical_appointments")
public class MedicalAppointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String applicantId;

    @Column(nullable = false)
    private Long centreId;

    @Column(nullable = false)
    private String centreName;

    @Column(nullable = false)
    private Long slotId;

    @Column(nullable = false)
    private String date; // yyyy-MM-dd

    @Column(nullable = false)
    private String timeSlot; // e.g. "09:00-10:00"

    @Column(nullable = false)
    private String status; // BOOKED, COMPLETED, CANCELLED

    private String result; // PASS, FAIL (null if not yet completed)

    private String remarks;

    private String medicalReportPath; // file path for uploaded report

    // Medical details recorded by staff
    private String vision;
    private String hearing;
    private String bloodPressure;
    private String medicalOfficerId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }

    public Long getCentreId() { return centreId; }
    public void setCentreId(Long centreId) { this.centreId = centreId; }

    public String getCentreName() { return centreName; }
    public void setCentreName(String centreName) { this.centreName = centreName; }

    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTimeSlot() { return timeSlot; }
    public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getMedicalReportPath() { return medicalReportPath; }
    public void setMedicalReportPath(String medicalReportPath) { this.medicalReportPath = medicalReportPath; }

    public String getVision() { return vision; }
    public void setVision(String vision) { this.vision = vision; }

    public String getHearing() { return hearing; }
    public void setHearing(String hearing) { this.hearing = hearing; }

    public String getBloodPressure() { return bloodPressure; }
    public void setBloodPressure(String bloodPressure) { this.bloodPressure = bloodPressure; }

    public String getMedicalOfficerId() { return medicalOfficerId; }
    public void setMedicalOfficerId(String medicalOfficerId) { this.medicalOfficerId = medicalOfficerId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
