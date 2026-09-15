package com.drivelink.backend.repository;

import com.drivelink.backend.model.RenewalRequest;
import com.drivelink.backend.model.RenewalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RenewalRepository extends JpaRepository<RenewalRequest, String> {
    List<RenewalRequest> findByApplicantId(String applicantId);
    List<RenewalRequest> findByStatus(RenewalStatus status);
}
