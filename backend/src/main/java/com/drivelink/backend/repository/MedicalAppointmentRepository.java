package com.drivelink.backend.repository;

import com.drivelink.backend.model.MedicalAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalAppointmentRepository extends JpaRepository<MedicalAppointment, String> {
    List<MedicalAppointment> findByApplicantId(String applicantId);
    List<MedicalAppointment> findByApplicationId(String applicationId);
}
