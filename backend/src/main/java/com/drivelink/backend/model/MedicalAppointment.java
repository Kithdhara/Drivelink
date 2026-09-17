package com.drivelink.backend.model;

import jakarta.persistence.*;

/**
 * Medical Test Booking module - Weerasinghe W.P.D.V (IT25100817)
 *
 * Mirrors the MedicalAppointment interface in frontend/src/types.ts exactly:
 *
 *   export interface MedicalAppointment {
 *     id: string;
 *     applicationId: string;
 *     applicantId: string;
 *     scheduleId: string;
 *     locationId: string;
 *     date: string;
 *     time: string;
 *     status: BookingStatus;              // 'booked' | 'completed' | 'cancelled' | 'no_show'
 *     result?: 'pass' | 'fail';
 *     remarks?: string;
 *     officerId?: string;
 *     vision?: string;
 *     hearing?: string;
 *     bloodPressure?: string;
 *   }
 *
 * status/result are plain Strings (not Java enums) on purpose - an enum would
 * serialise as "BOOKED" instead of "booked" and silently break every
 * `m.status === 'booked'` check on the frontend.
 */
@Entity
@Table(name = "medical_appointments")
public class MedicalAppointment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String applicationId;

    @Column(nullable = false)
    private String applicantId;

    @Column(nullable = false)
    private String scheduleId;

    @Column(nullable = false)
    private String locationId;

    @Column(nullable = false)
    private String date;

    @Column(nullable = false)
    private String time;

    // "booked" | "completed" | "cancelled" | "no_show"
    @Column(nullable = false)
    private String status = "booked";

    // "pass" | "fail" - null until the medical officer records a result
    private String result;

    private String remarks;

    private String officerId;

    private String vision;

    private String hearing;

    private String bloodPressure;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }

    public String getScheduleId() { return scheduleId; }
    public void setScheduleId(String scheduleId) { this.scheduleId = scheduleId; }

    public String getLocationId() { return locationId; }
    public void setLocationId(String locationId) { this.locationId = locationId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getOfficerId() { return officerId; }
    public void setOfficerId(String officerId) { this.officerId = officerId; }

    public String getVision() { return vision; }
    public void setVision(String vision) { this.vision = vision; }

    public String getHearing() { return hearing; }
    public void setHearing(String hearing) { this.hearing = hearing; }

    public String getBloodPressure() { return bloodPressure; }
    public void setBloodPressure(String bloodPressure) { this.bloodPressure = bloodPressure; }
}
