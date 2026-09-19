package com.drivelink.backend.service;

import com.drivelink.backend.model.ExamBooking;
import com.drivelink.backend.model.LicenseApplication;
import com.drivelink.backend.model.TimeSlot;
import com.drivelink.backend.repository.ApplicationRepository;
import com.drivelink.backend.repository.ExamBookingRepository;
import com.drivelink.backend.repository.TimeSlotRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class ExamService {

    private final ExamBookingRepository examRepo;
    private final TimeSlotRepository slotRepo;
    private final ApplicationRepository appRepo;

    public ExamService(ExamBookingRepository examRepo, TimeSlotRepository slotRepo, ApplicationRepository appRepo) {
        this.examRepo = examRepo;
        this.slotRepo = slotRepo;
        this.appRepo = appRepo;
    }

    // CRUD 1: Book an exam
    public ExamBooking book(ExamBooking booking) {
        // Verify the application exists and is verified by officer
        LicenseApplication app = appRepo.findById(booking.getApplicationId())
                .orElseThrow(() -> new RuntimeException("Application not found"));

        String status = app.getStatus().toLowerCase();
        if (!status.equals("approved") && !status.equals("documents_verified") && !status.equals("medical_passed") && !status.equals("exam_failed")) {
            throw new RuntimeException("Application must be approved by registration officer before booking exam. Current status: " + app.getStatus());
        }

        // Check for existing active booking
        List<ExamBooking> existing = examRepo.findByApplicantIdAndStatus(booking.getApplicantId(), "BOOKED");
        if (!existing.isEmpty()) {
            throw new RuntimeException("You already have an active exam booking");
        }

        // Check slot availability
        TimeSlot slot = slotRepo.findById(booking.getSlotId())
                .orElseThrow(() -> new RuntimeException("Time slot not found"));
        if (slot.getBooked() >= slot.getCapacity()) {
            throw new RuntimeException("This time slot is fully booked");
        }

        // Calculate attempt number
        List<ExamBooking> prevAttempts = examRepo.findByApplicationId(booking.getApplicationId());
        booking.setAttempt(prevAttempts.size() + 1);

        // Book the slot
        booking.setStatus("BOOKED");
        booking.setDate(slot.getDate());
        booking.setTimeSlot(slot.getStartTime() + "-" + slot.getEndTime());
        booking.setCentreId(slot.getCentreId());
        booking.setCentreName(slot.getCentreName());

        slot.setBooked(slot.getBooked() + 1);
        slotRepo.save(slot);

        // Update application status to reflect exam booking
        app.setStatus("exam_booked");
        appRepo.save(app);

        return examRepo.save(booking);
    }

    // CRUD 2: Get exams for an applicant
    public List<ExamBooking> getByApplicant(String applicantId) {
        return examRepo.findByApplicantId(applicantId);
    }

    // CRUD 3: Edit/reschedule exam (within 12 hours)
    public ExamBooking reschedule(Long id, Long newSlotId) {
        ExamBooking exam = examRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Exam booking not found"));

        if (!"BOOKED".equals(exam.getStatus())) {
            throw new RuntimeException("Can only reschedule BOOKED exams");
        }
        if (exam.getCreatedAt() != null &&
                ChronoUnit.HOURS.between(exam.getCreatedAt(), LocalDateTime.now()) > 12) {
            throw new RuntimeException("Rescheduling window has expired (12 hours)");
        }

        // Release old slot
        TimeSlot oldSlot = slotRepo.findById(exam.getSlotId()).orElse(null);
        if (oldSlot != null) {
            oldSlot.setBooked(Math.max(0, oldSlot.getBooked() - 1));
            slotRepo.save(oldSlot);
        }

        // Book new slot
        TimeSlot newSlot = slotRepo.findById(newSlotId)
                .orElseThrow(() -> new RuntimeException("New time slot not found"));
        if (newSlot.getBooked() >= newSlot.getCapacity()) {
            throw new RuntimeException("New time slot is fully booked");
        }
        newSlot.setBooked(newSlot.getBooked() + 1);
        slotRepo.save(newSlot);

        exam.setSlotId(newSlotId);
        exam.setDate(newSlot.getDate());
        exam.setTimeSlot(newSlot.getStartTime() + "-" + newSlot.getEndTime());
        exam.setCentreId(newSlot.getCentreId());
        exam.setCentreName(newSlot.getCentreName());

        return examRepo.save(exam);
    }

    // CRUD 4: Cancel exam (within 12 hours)
    public void cancel(Long id) {
        ExamBooking exam = examRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Exam booking not found"));

        if (!"BOOKED".equals(exam.getStatus())) {
            throw new RuntimeException("Can only cancel BOOKED exams");
        }
        if (exam.getCreatedAt() != null &&
                ChronoUnit.HOURS.between(exam.getCreatedAt(), LocalDateTime.now()) > 12) {
            throw new RuntimeException("Cancellation window has expired (12 hours)");
        }

        TimeSlot slot = slotRepo.findById(exam.getSlotId()).orElse(null);
        if (slot != null) {
            slot.setBooked(Math.max(0, slot.getBooked() - 1));
            slotRepo.save(slot);
        }

        exam.setStatus("CANCELLED");
        examRepo.save(exam);
    }

    // Examiner: record result (MCQ 40 questions, 1 hour, computerized)
    public ExamBooking recordResult(Long id, String examinerId, String result, Integer score, String remarks) {
        ExamBooking exam = examRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Exam booking not found"));

        exam.setStatus("COMPLETED");
        exam.setResult(result); // PASS or FAIL
        exam.setExaminerId(examinerId);
        exam.setScore(score);
        exam.setRemarks(remarks != null ? remarks : "MCQ: 40 questions, 1 hour computerized test. Score: " + score + "/40");

        // Sync application status
        if ("PASS".equalsIgnoreCase(result)) {
            LicenseApplication app = appRepo.findById(exam.getApplicationId()).orElse(null);
            if (app != null) {
                app.setStatus("exam_passed");
                appRepo.save(app);
            }
        } else if ("FAIL".equalsIgnoreCase(result)) {
            LicenseApplication app = appRepo.findById(exam.getApplicationId()).orElse(null);
            if (app != null) {
                app.setStatus("exam_failed");
                appRepo.save(app);
            }
        }

        return examRepo.save(exam);
    }

    // Get all exams (coordinator/examiner dashboard)
    public List<ExamBooking> getAll() {
        return examRepo.findAll();
    }

    public ExamBooking getById(Long id) {
        return examRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Exam booking not found"));
    }

    // Get the latest passed exam for an applicant (needed for trial booking)
    public ExamBooking getLatestPassedExam(String applicantId) {
        List<ExamBooking> passed = examRepo.findByApplicantIdAndResult(applicantId, "PASS");
        if (passed.isEmpty()) return null;
        // Return the most recent one
        return passed.get(passed.size() - 1);
    }
}
