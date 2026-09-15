package com.drivelink.backend.repository;

import com.drivelink.backend.model.TrainerBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrainerBookingRepository extends JpaRepository<TrainerBooking, Long> {
    List<TrainerBooking> findByApplicantIdOrderByCreatedAtDesc(String applicantId);
    List<TrainerBooking> findByTrialBookingId(Long trialBookingId);
    List<TrainerBooking> findByDepartmentTrainerId(String departmentTrainerId);
}
