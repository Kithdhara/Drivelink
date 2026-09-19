package com.drivelink.backend.repository;

import com.drivelink.backend.model.ArchivedApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArchivedApplicationRepository extends JpaRepository<ArchivedApplication, Long> {
    List<ArchivedApplication> findByApplicantId(String applicantId);
    List<ArchivedApplication> findByAssociatedTicketId(Long ticketId);
}
