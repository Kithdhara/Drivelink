package com.drivelink.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String officerId;
    private String officerName;

    @Column(nullable = false)
    private String action; // e.g. ADMIN_OVERRIDE_DELETE_CREATE, TICKET_REJECTED

    private Long ticketId;
    private Long oldApplicationId;
    private Long newApplicationId;

    @Column(length = 2500)
    private String details;

    private String ipAddress;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime timestamp;

    public AuditLog() {}

    public AuditLog(String officerId, String officerName, String action, Long ticketId,
                    Long oldApplicationId, Long newApplicationId, String details, String ipAddress) {
        this.officerId = officerId;
        this.officerName = officerName;
        this.action = action;
        this.ticketId = ticketId;
        this.oldApplicationId = oldApplicationId;
        this.newApplicationId = newApplicationId;
        this.details = details;
        this.ipAddress = ipAddress;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOfficerId() { return officerId; }
    public void setOfficerId(String officerId) { this.officerId = officerId; }

    public String getOfficerName() { return officerName; }
    public void setOfficerName(String officerName) { this.officerName = officerName; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public Long getTicketId() { return ticketId; }
    public void setTicketId(Long ticketId) { this.ticketId = ticketId; }

    public Long getOldApplicationId() { return oldApplicationId; }
    public void setOldApplicationId(Long oldApplicationId) { this.oldApplicationId = oldApplicationId; }

    public Long getNewApplicationId() { return newApplicationId; }
    public void setNewApplicationId(Long newApplicationId) { this.newApplicationId = newApplicationId; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
