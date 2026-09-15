package com.drivelink.backend.service;

import com.drivelink.backend.model.RenewalRequest;
import com.drivelink.backend.model.RenewalStatus;
import com.drivelink.backend.repository.RenewalRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RenewalService {

    private final RenewalRepository renewalRepository;

    public RenewalService(RenewalRepository renewalRepository) {
        this.renewalRepository = renewalRepository;
    }

    public RenewalRequest create(RenewalRequest request) {
        request.setStatus(RenewalStatus.PENDING);
        return renewalRepository.save(request);
    }

    public RenewalRequest getById(String id) {
        return renewalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Renewal request not found"));
    }

    public List<RenewalRequest> getByApplicant(String applicantId) {
        return renewalRepository.findByApplicantId(applicantId);
    }

    public List<RenewalRequest> getPending() {
        return renewalRepository.findByStatus(RenewalStatus.PENDING);
    }

    public RenewalRequest approve(String id, String notes) {
        RenewalRequest r = getById(id);
        r.setStatus(RenewalStatus.APPROVED);
        r.setOfficerNotes(notes);
        return renewalRepository.save(r);
    }

    public RenewalRequest reject(String id, String notes) {
        RenewalRequest r = getById(id);
        r.setStatus(RenewalStatus.REJECTED);
        r.setOfficerNotes(notes);
        return renewalRepository.save(r);
    }

    public void delete(String id) {
        renewalRepository.deleteById(id);
    }
}
