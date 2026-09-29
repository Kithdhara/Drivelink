package com.drivelink.backend.service;

import com.drivelink.backend.model.PaymentRecord;
import com.drivelink.backend.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.drivelink.backend.strategy.PaymentStrategy;

@Service
public class PaymentService {
    
    private final PaymentRepository paymentRepository;
    private final List<PaymentStrategy> paymentStrategies;
    
    public PaymentService(PaymentRepository paymentRepository, List<PaymentStrategy> paymentStrategies) {
        this.paymentRepository = paymentRepository;
        this.paymentStrategies = paymentStrategies;
    }
    
    public PaymentRecord createPayment(Map<String, String> data) {
        PaymentRecord payment = new PaymentRecord();
        payment.setUserId(data.get("userId"));

        Long appId = null;
        if (data.containsKey("applicationId") && data.get("applicationId") != null && !data.get("applicationId").isEmpty()) {
            try {
                appId = Long.parseLong(data.get("applicationId"));
                payment.setApplicationId(appId);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Invalid application ID format.");
            }
        }

        String type = data.get("type");
        payment.setType(type);

        // Idempotency: block duplicate payments for the same application + type
        if (appId != null && type != null) {
            List<PaymentRecord> existing = paymentRepository.findByApplicationIdAndTypeAndStatus(appId, type, "paid");
            if (!existing.isEmpty()) {
                throw new IllegalStateException("A payment of type '" + type + "' has already been made for this application. Duplicate payments are not allowed.");
            }
        }

        
        try {
            String rawAmount = data.get("amount");
            if (rawAmount == null || rawAmount.isBlank())
                throw new IllegalArgumentException("Amount is required.");
            double amount = Double.parseDouble(rawAmount);
            if (amount <= 0) throw new IllegalArgumentException("Amount must be positive.");
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Amount must be a valid number.");
        }
        
        String method = data.get("method");
        if (method == null || method.isBlank()) {
            throw new IllegalArgumentException("Payment method is required.");
        }
        
        PaymentStrategy strategy = paymentStrategies.stream()
                .filter(s -> s.getMethodName().equalsIgnoreCase(method))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported payment method: " + method));
                
        PaymentRecord partialPayment = strategy.processPayment(data);
        
        payment.setMethod(partialPayment.getMethod());
        payment.setStatus(partialPayment.getStatus());
        payment.setAmount(Double.parseDouble(data.get("amount")));

        return paymentRepository.save(payment);
    }
    
    public List<PaymentRecord> getPaymentsByUser(String userId) {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public Optional<PaymentRecord> getPaymentById(Long id) {
        return paymentRepository.findById(id);
    }
}
