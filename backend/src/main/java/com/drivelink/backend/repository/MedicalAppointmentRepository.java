package com.drivelink.backend.repository;

import com.drivelink.backend.model.MedicalAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalAppointmentRepository extends JpaRepository<MedicalAppointment, Long> {
    List<MedicalAppointment> findByApplicantId(String applicantId);
    List<MedicalAppointment> findByApplicantIdAndStatus(String applicantId, String status);
    List<MedicalAppointment> findByApplicantIdAndResult(String applicantId, String result);
    List<MedicalAppointment> findByStatus(String status);
}
