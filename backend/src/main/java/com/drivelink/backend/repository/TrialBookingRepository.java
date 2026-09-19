package com.drivelink.backend.repository;

import com.drivelink.backend.model.TrialBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrialBookingRepository extends JpaRepository<TrialBooking, Long> {
    List<TrialBooking> findByApplicantId(String applicantId);
    List<TrialBooking> findByApplicationId(Long applicationId);
    List<TrialBooking> findByApplicantIdAndStatus(String applicantId, String status);
    List<TrialBooking> findByStatus(String status);
}
