package com.drivelink.backend.repository;

import com.drivelink.backend.model.LicenseApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<LicenseApplication, Long> {

    // all application submitted by one applicant
    List<LicenseApplication> findByApplicantId(String applicantId);

    // all applications with specific sts by pending, approved, rejected
    List<LicenseApplication> findByStatus(String status);

    // check nic have already pending application
    List<LicenseApplication> findByNic(String nic);

    // find by applicant id and sts together
    List<LicenseApplication> findByApplicantIdAndStatus(
            String applicationId,
            String status);
}
