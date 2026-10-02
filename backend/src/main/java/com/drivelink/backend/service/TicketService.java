package com.drivelink.backend.service;

import com.drivelink.backend.model.*;
import com.drivelink.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class TicketService {

    private final SupportTicketRepository ticketRepo;
    private final ApplicationRepository appRepo;
    private final ArchivedApplicationRepository archiveRepo;
    private final AuditLogRepository auditRepo;
    private final ExamBookingRepository examRepo;
    private final TrialBookingRepository trialRepo;
    private final LicenseRecordRepository licenseRepo;

    private static final String UPLOAD_DIR = "uploads/tickets/";

    public TicketService(
            SupportTicketRepository ticketRepo,
            ApplicationRepository appRepo,
            ArchivedApplicationRepository archiveRepo,
            AuditLogRepository auditRepo,
            ExamBookingRepository examRepo,
            TrialBookingRepository trialRepo,
            LicenseRecordRepository licenseRepo
    ) {
        this.ticketRepo = ticketRepo;
        this.appRepo = appRepo;
        this.archiveRepo = archiveRepo;
        this.auditRepo = auditRepo;
        this.examRepo = examRepo;
        this.trialRepo = trialRepo;
        this.licenseRepo = licenseRepo;

        // Ensure directory exists
        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
        } catch (IOException e) {
            System.err.println("Could not create ticket uploads dir: " + e.getMessage());
        }
    }

    private String saveFile(MultipartFile file, String prefix) {
        if (file == null || file.isEmpty()) return null;
        try {
            String originalFilename = file.getOriginalFilename();
            String ext = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                ext = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = prefix + "_" + UUID.randomUUID() + ext;
            Path target = Paths.get(UPLOAD_DIR).resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store ticket proof document: " + e.getMessage(), e);
        }
    }

    // ─── Citizen raises Support Ticket for Post-12-Hour Profile Override ───
    public SupportTicket createTicket(
            Long applicationId,
            String applicantId,
            String applicantName,
            String applicantEmail,
            String requestedFullName,
            String requestedNic,
            String requestedDateOfBirth,
            String requestedGender,
            String requestedAddress,
            String requestedPhone,
            String requestedEmail,
            String requestedBloodGroup,
            String requestedEmergencyContact,
            String reason,
            MultipartFile nicCopy,
            MultipartFile birthCertificate,
            MultipartFile additionalDoc
    ) {
        LicenseApplication app = appRepo.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Target application #" + applicationId + " not found."));

        if (!app.getApplicantId().equals(applicantId)) {
            throw new IllegalArgumentException("You are not authorized to create a ticket for this application.");
        }

        // Rule 1: Self-Edit Lock Check
        // The citizen can only raise an Administrative Override ticket if the 12-hour self-edit window has expired
        // OR the application has already been reviewed/locked by an officer.
        boolean isPast12Hours = app.getSubmittedAt().isBefore(LocalDateTime.now().minusHours(12));
        boolean isOfficerLocked = !"pending".equalsIgnoreCase(app.getStatus()) && !"submitted".equalsIgnoreCase(app.getStatus());

        if (!isPast12Hours && !isOfficerLocked) {
            // Self-service edit window is still active!
            // Citizen should use self-service edit, but we can accept ticket if they have a special reason
            System.out.println("Notice: Ticket created while within self-service window for app #" + applicationId);
        }

        SupportTicket ticket = new SupportTicket();
        ticket.setTicketNumber("TKT-" + LocalDateTime.now().getYear() + "-" + (10000 + new Random().nextInt(90000)));
        ticket.setApplicantId(applicantId);
        ticket.setApplicantName(applicantName != null ? applicantName : app.getApplicantName());
        ticket.setApplicantEmail(applicantEmail != null ? applicantEmail : app.getEmail());
        ticket.setApplicationId(applicationId);

        ticket.setRequestedFullName(requestedFullName);
        ticket.setRequestedNic(requestedNic);
        ticket.setRequestedDateOfBirth(requestedDateOfBirth);
        ticket.setRequestedGender(requestedGender);
        ticket.setRequestedAddress(requestedAddress);
        ticket.setRequestedPhone(requestedPhone);
        ticket.setRequestedEmail(requestedEmail);
        ticket.setRequestedBloodGroup(requestedBloodGroup);
        ticket.setRequestedEmergencyContact(requestedEmergencyContact);
        ticket.setReason(reason);

        // Upload proof documents
        if (nicCopy != null && !nicCopy.isEmpty()) {
            ticket.setNicCopyPath(saveFile(nicCopy, "ticket_nic"));
        }
        if (birthCertificate != null && !birthCertificate.isEmpty()) {
            ticket.setBirthCertificatePath(saveFile(birthCertificate, "ticket_birth_cert"));
        }
        if (additionalDoc != null && !additionalDoc.isEmpty()) {
            ticket.setAdditionalDocPath(saveFile(additionalDoc, "ticket_proof"));
        }

        ticket.setStatus("PENDING_REVIEW");
        return ticketRepo.save(ticket);
    }

    // ─── Officer Administrative Override Workflow (DELETE & CREATE) ───
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> executeAdministrativeOverride(
            Long ticketId,
            String officerId,
            String officerName,
            String officerNotes,
            String clientIp
    ) {
        SupportTicket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Support ticket #" + ticketId + " not found."));

        if ("RESOLVED".equalsIgnoreCase(ticket.getStatus())) {
            throw new IllegalStateException("Ticket #" + ticket.getTicketNumber() + " has already been resolved.");
        }

        Long oldAppId = ticket.getApplicationId();
        LicenseApplication oldApp = appRepo.findById(oldAppId)
                .orElseThrow(() -> new IllegalArgumentException("Referenced application #" + oldAppId + " no longer exists."));

        // STEP 1: Archive old locked erroneous record before deletion (Full Audit Compliance)
        ArchivedApplication archive = new ArchivedApplication();
        archive.setOriginalApplicationId(oldApp.getId());
        archive.setApplicantId(oldApp.getApplicantId());
        archive.setApplicantName(oldApp.getApplicantName());
        archive.setLicenseClasses(oldApp.getLicenseClasses());
        archive.setOneDayService(oldApp.isOneDayService());
        archive.setFullName(oldApp.getFullName());
        archive.setNic(oldApp.getNic());
        archive.setDateOfBirth(oldApp.getDateOfBirth());
        archive.setGender(oldApp.getGender());
        archive.setAddress(oldApp.getAddress());
        archive.setPhone(oldApp.getPhone());
        archive.setEmail(oldApp.getEmail());
        archive.setBloodGroup(oldApp.getBloodGroup());
        archive.setEmergencyContact(oldApp.getEmergencyContact());
        archive.setNicCopyPath(oldApp.getNicCopyPath());
        archive.setPassportPhotoPath(oldApp.getPassportPhotoPath());
        archive.setMedicalReportPath(oldApp.getMedicalReportPath());
        archive.setStatusBeforeArchive(oldApp.getStatus());
        archive.setAssociatedTicketId(ticket.getId());
        archive.setArchivedByOfficerId(officerId);
        archiveRepo.save(archive);

        // STEP 2: CREATE Function — Insert fresh applicant record with verified details
        LicenseApplication freshApp = new LicenseApplication();
        freshApp.setApplicantId(oldApp.getApplicantId());
        freshApp.setApplicantName(ticket.getRequestedFullName() != null && !ticket.getRequestedFullName().isBlank()
                ? ticket.getRequestedFullName() : oldApp.getApplicantName());
        freshApp.setFullName(ticket.getRequestedFullName() != null && !ticket.getRequestedFullName().isBlank()
                ? ticket.getRequestedFullName() : oldApp.getFullName());
        freshApp.setNic(ticket.getRequestedNic() != null && !ticket.getRequestedNic().isBlank()
                ? ticket.getRequestedNic() : oldApp.getNic());
        freshApp.setDateOfBirth(ticket.getRequestedDateOfBirth() != null && !ticket.getRequestedDateOfBirth().isBlank()
                ? ticket.getRequestedDateOfBirth() : oldApp.getDateOfBirth());
        freshApp.setGender(ticket.getRequestedGender() != null && !ticket.getRequestedGender().isBlank()
                ? ticket.getRequestedGender() : oldApp.getGender());
        freshApp.setAddress(ticket.getRequestedAddress() != null && !ticket.getRequestedAddress().isBlank()
                ? ticket.getRequestedAddress() : oldApp.getAddress());
        freshApp.setPhone(ticket.getRequestedPhone() != null && !ticket.getRequestedPhone().isBlank()
                ? ticket.getRequestedPhone() : oldApp.getPhone());
        freshApp.setEmail(ticket.getRequestedEmail() != null && !ticket.getRequestedEmail().isBlank()
                ? ticket.getRequestedEmail() : oldApp.getEmail());
        freshApp.setBloodGroup(ticket.getRequestedBloodGroup() != null && !ticket.getRequestedBloodGroup().isBlank()
                ? ticket.getRequestedBloodGroup() : oldApp.getBloodGroup());
        freshApp.setEmergencyContact(ticket.getRequestedEmergencyContact() != null && !ticket.getRequestedEmergencyContact().isBlank()
                ? ticket.getRequestedEmergencyContact() : oldApp.getEmergencyContact());

        freshApp.setLicenseClasses(oldApp.getLicenseClasses());
        freshApp.setOneDayService(oldApp.isOneDayService());

        // Retain or update verified document paths
        freshApp.setNicCopyPath(ticket.getNicCopyPath() != null ? ticket.getNicCopyPath() : oldApp.getNicCopyPath());
        freshApp.setPassportPhotoPath(oldApp.getPassportPhotoPath());
        freshApp.setMedicalReportPath(oldApp.getMedicalReportPath());

        // Retain existing workflow status (e.g. approved, exam_passed, etc.)
        freshApp.setStatus(oldApp.getStatus());
        freshApp.setOfficerNotes("Profile data override applied via Ticket " + ticket.getTicketNumber() +
                " by Officer " + officerName + ". Notes: " + (officerNotes != null ? officerNotes : "Verified."));
        freshApp.setSubmittedAt(oldApp.getSubmittedAt());
        freshApp.setUpdatedAt(LocalDateTime.now());

        LicenseApplication savedFreshApp = appRepo.save(freshApp);
        Long newAppId = savedFreshApp.getId();

        // STEP 3: Re-link any existing credentials / examination / trial references
        List<ExamBooking> exams = examRepo.findByApplicationId(oldAppId);
        for (ExamBooking e : exams) {
            e.setApplicationId(newAppId);
            examRepo.save(e);
        }

        List<TrialBooking> trials = trialRepo.findByApplicationId(oldAppId);
        for (TrialBooking t : trials) {
            t.setApplicationId(newAppId);
            trialRepo.save(t);
        }

        licenseRepo.findByApplicationId(oldAppId).ifPresent(l -> {
            l.setApplicationId(newAppId);
            licenseRepo.save(l);
        });

        // STEP 4: DELETE Function — Safely remove the erroneous locked record
        appRepo.delete(oldApp);

        // STEP 5: Audit Trail & Ticket Resolution
        ticket.setStatus("RESOLVED");
        ticket.setOfficerId(officerId);
        ticket.setOfficerName(officerName);
        ticket.setOfficerNotes(officerNotes);
        ticket.setNewApplicationId(newAppId);
        ticket.setResolvedAt(LocalDateTime.now());
        ticketRepo.save(ticket);

        String auditDetails = String.format(
                "Officer %s executed administrative override for Ticket %s: Safely deleted erroneous Application #%d (Archived #%d) and created fresh Application #%d. Corrected NIC: %s, Name: %s.",
                officerName, ticket.getTicketNumber(), oldAppId, archive.getId(), newAppId, savedFreshApp.getNic(), savedFreshApp.getFullName()
        );

        AuditLog audit = new AuditLog(
                officerId,
                officerName,
                "ADMIN_OVERRIDE_DELETE_CREATE",
                ticket.getId(),
                oldAppId,
                newAppId,
                auditDetails,
                clientIp
        );
        auditRepo.save(audit);

        // STEP 6: Automated Notification Placeholder (Email / SMS)
        String notificationMessage = String.format(
                "Dear %s, your Support Ticket %s has been APPROVED. Your profile particulars have been corrected by Officer %s. New Application File: #%d.",
                savedFreshApp.getFullName(), ticket.getTicketNumber(), officerName, newAppId
        );
        System.out.println("[NOTIFICATION SERVICE DISPATCH] " + notificationMessage);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Administrative override completed successfully.");
        response.put("ticketNumber", ticket.getTicketNumber());
        response.put("oldApplicationId", oldAppId);
        response.put("newApplicationId", newAppId);
        response.put("freshApplication", savedFreshApp);
        response.put("notificationDispatched", notificationMessage);
        return response;
    }

    // ─── Officer rejects Support Ticket ───
    @Transactional
    public SupportTicket rejectTicket(Long ticketId, String officerId, String officerName, String reason, String clientIp) {
        SupportTicket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Support ticket #" + ticketId + " not found."));

        ticket.setStatus("REJECTED");
        ticket.setOfficerId(officerId);
        ticket.setOfficerName(officerName);
        ticket.setOfficerNotes(reason);
        ticket.setResolvedAt(LocalDateTime.now());
        SupportTicket saved = ticketRepo.save(ticket);

        AuditLog audit = new AuditLog(
                officerId,
                officerName,
                "TICKET_REJECTED",
                ticket.getId(),
                ticket.getApplicationId(),
                null,
                "Ticket " + ticket.getTicketNumber() + " rejected by Officer " + officerName + ". Reason: " + reason,
                clientIp
        );
        auditRepo.save(audit);

        System.out.println("[NOTIFICATION SERVICE DISPATCH] Dear " + ticket.getApplicantName() +
                ", your ticket " + ticket.getTicketNumber() + " was rejected. Reason: " + reason);

        return saved;
    }

    public List<SupportTicket> getTicketsByApplicant(String applicantId) {
        return ticketRepo.findByApplicantIdOrderByCreatedAtDesc(applicantId);
    }

    public List<SupportTicket> getAllTickets() {
        return ticketRepo.findAllByOrderByCreatedAtDesc();
    }

    public List<SupportTicket> getOpenTickets() {
        return ticketRepo.findByStatusOrderByCreatedAtDesc("PENDING_REVIEW");
    }

    public Optional<SupportTicket> getTicketById(Long id) {
        return ticketRepo.findById(id);
    }

    public List<AuditLog> getAllAuditLogs() {
        return auditRepo.findAllByOrderByTimestampDesc();
    }
}
