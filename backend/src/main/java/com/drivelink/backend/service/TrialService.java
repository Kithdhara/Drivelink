package com.drivelink.backend.service;

import com.drivelink.backend.model.ExamBooking;
import com.drivelink.backend.model.LicenseApplication;
import com.drivelink.backend.model.TimeSlot;
import com.drivelink.backend.model.TrainerBooking;
import com.drivelink.backend.model.TrialBooking;
import com.drivelink.backend.repository.ApplicationRepository;
import com.drivelink.backend.repository.ExamBookingRepository;
import com.drivelink.backend.repository.TimeSlotRepository;
import com.drivelink.backend.repository.TrainerBookingRepository;
import com.drivelink.backend.repository.TrialBookingRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class TrialService {

    private final TrialBookingRepository trialRepo;
    private final TimeSlotRepository slotRepo;
    private final ExamBookingRepository examRepo;
    private final TrainerBookingRepository trainerRepo;
    private final ApplicationRepository appRepo;

    public TrialService(TrialBookingRepository trialRepo, TimeSlotRepository slotRepo,
                        ExamBookingRepository examRepo, TrainerBookingRepository trainerRepo,
                        ApplicationRepository appRepo) {
        this.trialRepo = trialRepo;
        this.slotRepo = slotRepo;
        this.examRepo = examRepo;
        this.trainerRepo = trainerRepo;
        this.appRepo = appRepo;
    }

    // CRUD 1: Book a trial (requires exam pass)
    public TrialBooking book(TrialBooking booking) {
        // Verify exam was passed
        List<ExamBooking> passedExams = examRepo.findByApplicantIdAndResult(booking.getApplicantId(), "PASS");
        if (passedExams.isEmpty()) {
            throw new RuntimeException("You must pass the driving exam before booking a trial");
        }

        ExamBooking latestExam = passedExams.get(passedExams.size() - 1);
        String examDateStr = latestExam.getDate();
        LocalDate examDate = LocalDate.parse(examDateStr, DateTimeFormatter.ISO_LOCAL_DATE);

        // Check for existing active booking
        List<TrialBooking> existing = trialRepo.findByApplicantIdAndStatus(booking.getApplicantId(), "BOOKED");
        if (!existing.isEmpty()) {
            throw new RuntimeException("You already have an active trial booking");
        }

        // Check slot availability
        TimeSlot slot = slotRepo.findById(booking.getSlotId())
                .orElseThrow(() -> new RuntimeException("Time slot not found"));
        if (slot.getBooked() >= slot.getCapacity()) {
            throw new RuntimeException("This time slot is fully booked");
        }

        LocalDate slotDate = LocalDate.parse(slot.getDate(), DateTimeFormatter.ISO_LOCAL_DATE);
        if (slotDate.isBefore(examDate)) {
            throw new RuntimeException("Trial slot cannot be scheduled before your exam pass date (" + examDateStr + ")");
        }

        // Calculate attempt
        List<TrialBooking> prevAttempts = trialRepo.findByApplicationId(booking.getApplicationId());
        booking.setAttempt(prevAttempts.size() + 1);

        // Set booking details
        booking.setStatus("BOOKED");
        booking.setDate(slot.getDate());
        booking.setTimeSlot(slot.getStartTime() + "-" + slot.getEndTime());
        booking.setCentreId(slot.getCentreId());
        booking.setCentreName(slot.getCentreName());
        booking.setExamBookingId(latestExam.getId());
        booking.setExamPassDate(examDateStr);
        if (booking.getTrainerType() == null || booking.getTrainerType().isEmpty()) {
            booking.setTrainerType("NONE");
        }

        slot.setBooked(slot.getBooked() + 1);
        slotRepo.save(slot);

        // Update application status to reflect trial booking
        appRepo.findById(booking.getApplicationId()).ifPresent(app -> {
            app.setStatus("trial_booked");
            appRepo.save(app);
        });

        return trialRepo.save(booking);
    }

    // CRUD 2: Get trials for an applicant
    public List<TrialBooking> getByApplicant(String applicantId) {
        return trialRepo.findByApplicantId(applicantId);
    }

    // CRUD 3: Edit/reschedule trial (within 12 hours)
    public TrialBooking reschedule(Long id, Long newSlotId) {
        TrialBooking trial = trialRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Trial booking not found"));

        if (!"BOOKED".equals(trial.getStatus())) {
            throw new RuntimeException("Can only reschedule BOOKED trials");
        }
        if (trial.getCreatedAt() != null &&
                ChronoUnit.HOURS.between(trial.getCreatedAt(), LocalDateTime.now()) > 12) {
            throw new RuntimeException("Rescheduling window has expired (12 hours)");
        }

        TimeSlot oldSlot = slotRepo.findById(trial.getSlotId()).orElse(null);
        if (oldSlot != null) {
            oldSlot.setBooked(Math.max(0, oldSlot.getBooked() - 1));
            slotRepo.save(oldSlot);
        }

        TimeSlot newSlot = slotRepo.findById(newSlotId)
                .orElseThrow(() -> new RuntimeException("New time slot not found"));
        if (newSlot.getBooked() >= newSlot.getCapacity()) {
            throw new RuntimeException("New time slot is fully booked");
        }
        newSlot.setBooked(newSlot.getBooked() + 1);
        slotRepo.save(newSlot);

        trial.setSlotId(newSlotId);
        trial.setDate(newSlot.getDate());
        trial.setTimeSlot(newSlot.getStartTime() + "-" + newSlot.getEndTime());
        trial.setCentreId(newSlot.getCentreId());
        trial.setCentreName(newSlot.getCentreName());

        return trialRepo.save(trial);
    }

    // CRUD 4: Cancel trial (within 12 hours)
    public void cancel(Long id) {
        TrialBooking trial = trialRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Trial booking not found"));

        if (!"BOOKED".equals(trial.getStatus())) {
            throw new RuntimeException("Can only cancel BOOKED trials");
        }
        if (trial.getCreatedAt() != null &&
                ChronoUnit.HOURS.between(trial.getCreatedAt(), LocalDateTime.now()) > 12) {
            throw new RuntimeException("Cancellation window has expired (12 hours)");
        }

        TimeSlot slot = slotRepo.findById(trial.getSlotId()).orElse(null);
        if (slot != null) {
            slot.setBooked(Math.max(0, slot.getBooked() - 1));
            slotRepo.save(slot);
        }

        trial.setStatus("CANCELLED");
        trialRepo.save(trial);
    }

    // Trial officer: record result
    public TrialBooking recordResult(Long id, String examinerId, String result, String remarks) {
        TrialBooking trial = trialRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Trial booking not found"));

        trial.setStatus("COMPLETED");
        trial.setResult(result);
        trial.setExaminerId(examinerId);
        trial.setRemarks(remarks);

        TrialBooking saved = trialRepo.save(trial);

        // Sync application status
        if ("PASS".equalsIgnoreCase(result)) {
            appRepo.findById(trial.getApplicationId()).ifPresent(app -> {
                app.setStatus("trial_passed");
                appRepo.save(app);
            });
        } else if ("FAIL".equalsIgnoreCase(result)) {
            appRepo.findById(trial.getApplicationId()).ifPresent(app -> {
                app.setStatus("trial_failed");
                appRepo.save(app);
            });
        }

        return saved;
    }

    // Book a trainer (linked to trial)
    public TrainerBooking bookTrainer(TrainerBooking trainerBooking) {
        trainerBooking.setStatus("ACTIVE");
        TrainerBooking saved = trainerRepo.save(trainerBooking);

        // Update trial record's trainer fields
        if (trainerBooking.getTrialBookingId() != null) {
            trialRepo.findById(trainerBooking.getTrialBookingId()).ifPresent(trial -> {
                trial.setTrainerType(trainerBooking.getTrainerType());
                if ("PRIVATE".equalsIgnoreCase(trainerBooking.getTrainerType())) {
                    trial.setPrivateTrainerName(trainerBooking.getTrainerName());
                } else {
                    trial.setTrainerId(trainerBooking.getTrainerName());
                }
                trialRepo.save(trial);
            });
        }

        return saved;
    }

    public List<TrainerBooking> getTrainersByApplicant(String applicantId) {
        return trainerRepo.findByApplicantId(applicantId);
    }

    public List<TrialBooking> getAll() {
        return trialRepo.findAll();
    }

    public TrialBooking getById(Long id) {
        return trialRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Trial booking not found"));
    }
}
