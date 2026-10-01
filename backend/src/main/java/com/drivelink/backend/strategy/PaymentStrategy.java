package com.drivelink.backend.strategy;

import com.drivelink.backend.model.PaymentRecord;
import java.util.Map;

public interface PaymentStrategy {
    String getMethodName();
    PaymentRecord processPayment(Map<String, String> data);
}
