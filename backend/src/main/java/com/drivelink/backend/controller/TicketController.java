package com.drivelink.backend.controller;

import com.drivelink.backend.model.AuditLog;
import com.drivelink.backend.model.SupportTicket;
import com.drivelink.backend.service.TicketService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    // ─── POST /api/tickets (Citizen raises ticket with proof files) ───
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> createTicket(
            @RequestParam("applicationId") Long applicationId,
            @RequestParam("applicantId") String applicantId,
            @RequestParam("applicantName") String applicantName,
            @RequestParam("applicantEmail") String applicantEmail,
            @RequestParam(value = "requestedFullName", required = false) String requestedFullName,
            @RequestParam(value = "requestedNic", required = false) String requestedNic,
            @RequestParam(value = "requestedDateOfBirth", required = false) String requestedDateOfBirth,
            @RequestParam(value = "requestedGender", required = false) String requestedGender,
            @RequestParam(value = "requestedAddress", required = false) String requestedAddress,
            @RequestParam(value = "requestedPhone", required = false) String requestedPhone,
            @RequestParam(value = "requestedEmail", required = false) String requestedEmail,
            @RequestParam(value = "requestedBloodGroup", required = false) String requestedBloodGroup,
            @RequestParam(value = "requestedEmergencyContact", required = false) String requestedEmergencyContact,
            @RequestParam("reason") String reason,
            @RequestParam(value = "nicCopy", required = false) MultipartFile nicCopy,
            @RequestParam(value = "birthCertificate", required = false) MultipartFile birthCertificate,
            @RequestParam(value = "additionalDoc", required = false) MultipartFile additionalDoc
    ) {
        try {
            SupportTicket created = ticketService.createTicket(
                    applicationId,
                    applicantId,
                    applicantName,
                    applicantEmail,
                    requestedFullName,
                    requestedNic,
                    requestedDateOfBirth,
                    requestedGender,
                    requestedAddress,
                    requestedPhone,
                    requestedEmail,
                    requestedBloodGroup,
                    requestedEmergencyContact,
                    reason,
                    nicCopy,
                    birthCertificate,
                    additionalDoc
            );
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create support ticket: " + e.getMessage()));
        }
    }

    // ─── GET /api/tickets/applicant/{applicantId} ───
    @GetMapping("/applicant/{applicantId}")
    public ResponseEntity<List<SupportTicket>> getByApplicant(@PathVariable String applicantId) {
        return ResponseEntity.ok(ticketService.getTicketsByApplicant(applicantId));
    }

    // ─── GET /api/tickets/{id} ───
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ticketService.getTicketById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── GET /api/tickets (Officer views all tickets, optional status filter) ───
    @GetMapping
    public ResponseEntity<List<SupportTicket>> getAllTickets(@RequestParam(value = "status", required = false) String status) {
        if ("open".equalsIgnoreCase(status) || "pending".equalsIgnoreCase(status)) {
            return ResponseEntity.ok(ticketService.getOpenTickets());
        }
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    // ─── POST /api/tickets/{id}/override (Officer executes DELETE & CREATE override) ───
    @PostMapping("/{id}/override")
    public ResponseEntity<?> executeOverride(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            HttpServletRequest request
    ) {
        try {
            String officerId = body.get("officerId");
            String officerName = body.get("officerName");
            String notes = body.get("officerNotes");
            String clientIp = request.getRemoteAddr();

            Map<String, Object> result = ticketService.executeAdministrativeOverride(
                    id,
                    officerId,
                    officerName,
                    notes,
                    clientIp
            );
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Administrative override failed: " + e.getMessage()));
        }
    }

    // ─── POST /api/tickets/{id}/reject (Officer rejects ticket) ───
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectTicket(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            HttpServletRequest request
    ) {
        try {
            String officerId = body.get("officerId");
            String officerName = body.get("officerName");
            String reason = body.get("reason");
            String clientIp = request.getRemoteAddr();

            SupportTicket ticket = ticketService.rejectTicket(id, officerId, officerName, reason, clientIp);
            return ResponseEntity.ok(ticket);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Rejection failed: " + e.getMessage()));
        }
    }

    // ─── GET /api/tickets/audit (Audit trail) ───
    @GetMapping("/audit")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(ticketService.getAllAuditLogs());
    }

    // ─── GET /api/tickets/files/{filename} (Serve uploaded proof documents) ───
    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> serveProofFile(@PathVariable String filename) {
        try {
            Path file = Paths.get("uploads/tickets/").resolve(filename).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = "application/octet-stream";
            String lower = filename.toLowerCase();
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) contentType = "image/jpeg";
            else if (lower.endsWith(".png")) contentType = "image/png";
            else if (lower.endsWith(".pdf")) contentType = "application/pdf";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
