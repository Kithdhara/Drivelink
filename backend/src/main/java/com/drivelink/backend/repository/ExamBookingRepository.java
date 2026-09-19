package com.drivelink.backend.repository;

import com.drivelink.backend.model.ExamBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamBookingRepository extends JpaRepository<ExamBooking, Long> {
    List<ExamBooking> findByApplicantId(String applicantId);
    List<ExamBooking> findByApplicationId(Long applicationId);
    List<ExamBooking> findByApplicantIdAndStatus(String applicantId, String status);
    List<ExamBooking> findByApplicantIdAndResult(String applicantId, String result);
    List<ExamBooking> findByStatus(String status);
}
