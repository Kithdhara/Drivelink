package com.drivelink.backend.strategy;

import com.drivelink.backend.model.PaymentRecord;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class CardPaymentStrategy implements PaymentStrategy {

    @Override
    public String getMethodName() {
        return "card";
    }

    @Override
    public PaymentRecord processPayment(Map<String, String> data) {
        PaymentRecord payment = new PaymentRecord();
        payment.setMethod("card");
        payment.setStatus("paid");
        return payment;
    }
}
