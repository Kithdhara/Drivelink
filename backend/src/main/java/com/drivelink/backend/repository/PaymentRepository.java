package com.drivelink.backend.repository;

import com.drivelink.backend.model.PaymentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<PaymentRecord, Long> {
    List<PaymentRecord> findByUserIdOrderByCreatedAtDesc(String userId);
    List<PaymentRecord> findByApplicationIdAndTypeAndStatus(Long applicationId, String type, String status);
}
