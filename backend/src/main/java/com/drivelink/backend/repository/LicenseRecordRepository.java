package com.drivelink.backend.repository;

import com.drivelink.backend.model.LicenseRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LicenseRecordRepository extends JpaRepository<LicenseRecord, Long> {
    List<LicenseRecord> findByApplicantId(String applicantId);
    Optional<LicenseRecord> findByApplicationId(Long applicationId);
    Optional<LicenseRecord> findByLicenseNumber(String licenseNumber);
    List<LicenseRecord> findByStatus(String status);
}
