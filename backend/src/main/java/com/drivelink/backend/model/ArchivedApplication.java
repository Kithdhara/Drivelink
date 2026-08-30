package com.drivelink.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "archived_applications")
public class ArchivedApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long originalApplicationId;
    private String applicantId;
    private String applicantName;
    private String licenseClasses;
    private boolean oneDayService;

    private String fullName;
    private String nic;
    private String dateOfBirth;
    private String gender;
    private String address;
    private String phone;
    private String email;
    private String bloodGroup;
    private String emergencyContact;

    private String nicCopyPath;
    private String passportPhotoPath;
    private String medicalReportPath;

    private String statusBeforeArchive;
    private Long associatedTicketId;
    private String archivedByOfficerId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime archivedAt;

    public ArchivedApplication() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOriginalApplicationId() { return originalApplicationId; }
    public void setOriginalApplicationId(Long originalApplicationId) { this.originalApplicationId = originalApplicationId; }

    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }

    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }

    public String getLicenseClasses() { return licenseClasses; }
    public void setLicenseClasses(String licenseClasses) { this.licenseClasses = licenseClasses; }

    public boolean isOneDayService() { return oneDayService; }
    public void setOneDayService(boolean oneDayService) { this.oneDayService = oneDayService; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getNic() { return nic; }
    public void setNic(String nic) { this.nic = nic; }

    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }

    public String getNicCopyPath() { return nicCopyPath; }
    public void setNicCopyPath(String nicCopyPath) { this.nicCopyPath = nicCopyPath; }

    public String getPassportPhotoPath() { return passportPhotoPath; }
    public void setPassportPhotoPath(String passportPhotoPath) { this.passportPhotoPath = passportPhotoPath; }

    public String getMedicalReportPath() { return medicalReportPath; }
    public void setMedicalReportPath(String medicalReportPath) { this.medicalReportPath = medicalReportPath; }

    public String getStatusBeforeArchive() { return statusBeforeArchive; }
    public void setStatusBeforeArchive(String statusBeforeArchive) { this.statusBeforeArchive = statusBeforeArchive; }

    public Long getAssociatedTicketId() { return associatedTicketId; }
    public void setAssociatedTicketId(Long associatedTicketId) { this.associatedTicketId = associatedTicketId; }

    public String getArchivedByOfficerId() { return archivedByOfficerId; }
    public void setArchivedByOfficerId(String archivedByOfficerId) { this.archivedByOfficerId = archivedByOfficerId; }

    public LocalDateTime getArchivedAt() { return archivedAt; }
    public void setArchivedAt(LocalDateTime archivedAt) { this.archivedAt = archivedAt; }
}
