package com.drivelink.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "support_tickets")
public class SupportTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String ticketNumber; // e.g. TKT-2026-XXXX

    @Column(nullable = false)
    private String applicantId;

    @Column(nullable = false)
    private String applicantName;

    @Column(nullable = false)
    private String applicantEmail;

    @Column(nullable = false)
    private Long applicationId; // Locked application ID

    // Requested corrections
    private String requestedFullName;
    private String requestedNic;
    private String requestedDateOfBirth;
    private String requestedGender;
    private String requestedAddress;
    private String requestedPhone;
    private String requestedEmail;
    private String requestedBloodGroup;
    private String requestedEmergencyContact;

    @Column(length = 1500)
    private String reason; // Justification reason for correction

    // Proof documents uploaded by citizen
    private String nicCopyPath;
    private String birthCertificatePath;
    private String additionalDocPath;

    // Status: OPEN, PENDING_REVIEW, RESOLVED, REJECTED
    @Column(nullable = false)
    private String status = "PENDING_REVIEW";

    // Officer resolution details
    private String officerId;
    private String officerName;

    @Column(length = 1500)
    private String officerNotes;

    private Long newApplicationId; // ID of fresh created application on override

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime resolvedAt;

    public SupportTicket() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTicketNumber() { return ticketNumber; }
    public void setTicketNumber(String ticketNumber) { this.ticketNumber = ticketNumber; }

    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }

    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }

    public String getApplicantEmail() { return applicantEmail; }
    public void setApplicantEmail(String applicantEmail) { this.applicantEmail = applicantEmail; }

    public Long getApplicationId() { return applicationId; }
    public void setApplicationId(Long applicationId) { this.applicationId = applicationId; }

    public String getRequestedFullName() { return requestedFullName; }
    public void setRequestedFullName(String requestedFullName) { this.requestedFullName = requestedFullName; }

    public String getRequestedNic() { return requestedNic; }
    public void setRequestedNic(String requestedNic) { this.requestedNic = requestedNic; }

    public String getRequestedDateOfBirth() { return requestedDateOfBirth; }
    public void setRequestedDateOfBirth(String requestedDateOfBirth) { this.requestedDateOfBirth = requestedDateOfBirth; }

    public String getRequestedGender() { return requestedGender; }
    public void setRequestedGender(String requestedGender) { this.requestedGender = requestedGender; }

    public String getRequestedAddress() { return requestedAddress; }
    public void setRequestedAddress(String requestedAddress) { this.requestedAddress = requestedAddress; }

    public String getRequestedPhone() { return requestedPhone; }
    public void setRequestedPhone(String requestedPhone) { this.requestedPhone = requestedPhone; }

    public String getRequestedEmail() { return requestedEmail; }
    public void setRequestedEmail(String requestedEmail) { this.requestedEmail = requestedEmail; }

    public String getRequestedBloodGroup() { return requestedBloodGroup; }
    public void setRequestedBloodGroup(String requestedBloodGroup) { this.requestedBloodGroup = requestedBloodGroup; }

    public String getRequestedEmergencyContact() { return requestedEmergencyContact; }
    public void setRequestedEmergencyContact(String requestedEmergencyContact) { this.requestedEmergencyContact = requestedEmergencyContact; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getNicCopyPath() { return nicCopyPath; }
    public void setNicCopyPath(String nicCopyPath) { this.nicCopyPath = nicCopyPath; }

    public String getBirthCertificatePath() { return birthCertificatePath; }
    public void setBirthCertificatePath(String birthCertificatePath) { this.birthCertificatePath = birthCertificatePath; }

    public String getAdditionalDocPath() { return additionalDocPath; }
    public void setAdditionalDocPath(String additionalDocPath) { this.additionalDocPath = additionalDocPath; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getOfficerId() { return officerId; }
    public void setOfficerId(String officerId) { this.officerId = officerId; }

    public String getOfficerName() { return officerName; }
    public void setOfficerName(String officerName) { this.officerName = officerName; }

    public String getOfficerNotes() { return officerNotes; }
    public void setOfficerNotes(String officerNotes) { this.officerNotes = officerNotes; }

    public Long getNewApplicationId() { return newApplicationId; }
    public void setNewApplicationId(Long newApplicationId) { this.newApplicationId = newApplicationId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
