package com.drivelink.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "trainer_bookings")
public class TrainerBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String applicantId;

    @Column(nullable = false)
    private Long trialBookingId;

    @Column(nullable = false)
    private String trainerType; // DEPARTMENT, PRIVATE

    private String trainerName;
    private String trainerPhone;

    private int sessions = 0;
    private String notes;

    @Column(nullable = false)
    private String status; // ACTIVE, COMPLETED, CANCELLED

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }

    public Long getTrialBookingId() { return trialBookingId; }
    public void setTrialBookingId(Long trialBookingId) { this.trialBookingId = trialBookingId; }

    public String getTrainerType() { return trainerType; }
    public void setTrainerType(String trainerType) { this.trainerType = trainerType; }

    public String getTrainerName() { return trainerName; }
    public void setTrainerName(String trainerName) { this.trainerName = trainerName; }

    public String getTrainerPhone() { return trainerPhone; }
    public void setTrainerPhone(String trainerPhone) { this.trainerPhone = trainerPhone; }

    public int getSessions() { return sessions; }
    public void setSessions(int sessions) { this.sessions = sessions; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
