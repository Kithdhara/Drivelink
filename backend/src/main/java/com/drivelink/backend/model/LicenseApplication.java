package com.drivelink.backend.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "license_application")
public class LicenseApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column (nullable = false)
    private String applicantId;

    @Column (nullable = false)
    private String applicantName;

    // step 1 : category
    // A, A1, B, B1, C, C1, D, G, CE
    @Column(nullable = false)
    private String applicantEmail;

    private boolean oneDayService;

    // step 2 : personal details
    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String NIC;

    @Column(nullable = false)
    private String dateOfBirth;

    @Column(nullable = false)
    private String gender;

    @Column(nullable = false)
    private String address;

    @Column (nullable = false)
    private String Phone;

    @Column(nullable = false)
    private String email;

    @Column (nullable = false)
    private String bloodGroup;

    @Column (nullable = true)
    private String emergencyContact;

    // step 3 : documents
    @Column (nullable = false)
    private String nicCopyPath;

    @Column (nullable = false)
    private String passportPhotoPath;

    @Column (nullable = false)
    private String medicalReportPath;

    // status : by reg officer
    @Column(nullable = false)
    private String status;

    @Column(nullable = true)
    private String officerNotes;

    // submitted time
    @Column(nullable = false)
    private LocalDateTime submittedAt;

    private LocalDateTime updatedAt;

    // getters

    public long getId() {
        return id;
    }

    public String getApplicantId() {
        return applicantId;
    }

    public String getApplicantName() {
        return applicantName;
    }

    public String getApplicantEmail() {
        return applicantEmail;
    }

    public boolean isOneDayService() {
        return oneDayService;
    }

    public String getFullName() {
        return fullName;
    }

    public String getNIC() {
        return NIC;
    }

    public String getDateOfBirth() {
        return dateOfBirth;
    }

    public String getGender() {
        return gender;
    }

    public String getAddress() {
        return address;
    }

    public String getPhone() {
        return Phone;
    }

    public String getEmail() {
        return email;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public String getNicCopyPath() {
        return nicCopyPath;
    }

    public String getPassportPhotoPath() {
        return passportPhotoPath;
    }

    public String getMedicalReportPath() {
        return medicalReportPath;
    }

    public String getStatus() {
        return status;
    }

    public String getOfficerNotes() {
        return officerNotes;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // setters

    public void setId(long id) {
        this.id = id;
    }

    public void setApplicantId(String applicantId) {
        this.applicantId = applicantId;
    }

    public void setApplicantName(String applicantName) {
        this.applicantName = applicantName;
    }

    public void setApplicantEmail(String applicantEmail) {
        this.applicantEmail = applicantEmail;
    }

    public void setOneDayService(boolean oneDayService) {
        this.oneDayService = oneDayService;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public void setNIC(String NIC) {
        this.NIC = NIC;
    }

    public void setDateOfBirth(String dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setPhone(String phone) {
        Phone = phone;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public void setEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public void setNicCopyPath(String nicCopyPath) {
        this.nicCopyPath = nicCopyPath;
    }

    public void setPassportPhotoPath(String passportPhotoPath) {
        this.passportPhotoPath = passportPhotoPath;
    }

    public void setMedicalReportPath(String medicalReportPath) {
        this.medicalReportPath = medicalReportPath;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setOfficerNotes(String officerNotes) {
        this.officerNotes = officerNotes;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
