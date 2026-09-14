package com.drivelink.backend.model;

import java.time.LocalDateTime;

public class TraineeRecordDTO {
    private Long trainerBookingId;
    private String applicantId;
    private String applicantName;
    private String applicantNic;
    private String applicantPhone;
    private String licenseClasses;
    private int sessions;
    private String notes;
    private String status;
    private LocalDateTime createdAt;

    public TraineeRecordDTO(Long trainerBookingId, String applicantId, String applicantName, String applicantNic, String applicantPhone, String licenseClasses, int sessions, String notes, String status, LocalDateTime createdAt) {
        this.trainerBookingId = trainerBookingId;
        this.applicantId = applicantId;
        this.applicantName = applicantName;
        this.applicantNic = applicantNic;
        this.applicantPhone = applicantPhone;
        this.licenseClasses = licenseClasses;
        this.sessions = sessions;
        this.notes = notes;
        this.status = status;
        this.createdAt = createdAt;
    }

    // Getters and setters
    public Long getTrainerBookingId() { return trainerBookingId; }
    public void setTrainerBookingId(Long trainerBookingId) { this.trainerBookingId = trainerBookingId; }

    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }

    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }

    public String getApplicantNic() { return applicantNic; }
    public void setApplicantNic(String applicantNic) { this.applicantNic = applicantNic; }

    public String getApplicantPhone() { return applicantPhone; }
    public void setApplicantPhone(String applicantPhone) { this.applicantPhone = applicantPhone; }

    public String getLicenseClasses() { return licenseClasses; }
    public void setLicenseClasses(String licenseClasses) { this.licenseClasses = licenseClasses; }

    public int getSessions() { return sessions; }
    public void setSessions(int sessions) { this.sessions = sessions; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
