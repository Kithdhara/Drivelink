package com.drivelink.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "exam_bookings")
public class ExamBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String applicantId;

    @Column(nullable = false)
    private Long applicationId; // FK to license_application

    @Column(nullable = false)
    private Long centreId;

    @Column(nullable = false)
    private String centreName;

    @Column(nullable = false)
    private Long slotId;

    @Column(nullable = false)
    private String date; // yyyy-MM-dd

    @Column(nullable = false)
    private String timeSlot;

    @Column(nullable = false)
    private String status; // BOOKED, COMPLETED, CANCELLED

    private String result; // PASS, FAIL

    private Integer score; // out of 40

    private String remarks; // MCQ 40 questions, 1 hour, computerized

    private String examinerId;

    @Column(nullable = false)
    private int attempt = 1;

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

    public Long getApplicationId() { return applicationId; }
    public void setApplicationId(Long applicationId) { this.applicationId = applicationId; }

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

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getExaminerId() { return examinerId; }
    public void setExaminerId(String examinerId) { this.examinerId = examinerId; }

    public int getAttempt() { return attempt; }
    public void setAttempt(int attempt) { this.attempt = attempt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
