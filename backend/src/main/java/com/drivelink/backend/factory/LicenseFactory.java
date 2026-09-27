package com.drivelink.backend.factory;

import com.drivelink.backend.model.LicenseRecord;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Component
public class LicenseFactory {
    
    public LicenseRecord createLicense(Long applicationId, String applicantId, String category) {
        LicenseRecord license = new LicenseRecord();
        license.setApplicationId(applicationId);
        license.setApplicantId(applicantId);
        license.setCategory(category);
        
        // Generate a random 8-character license number for the demo
        String licenseNumber = "B" + UUID.randomUUID().toString().substring(0, 7).toUpperCase();
        license.setLicenseNumber(licenseNumber);
        
        LocalDate now = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE;
        license.setIssuedAt(now.format(formatter));
        license.setExpiresAt(now.plusYears(8).format(formatter));
        license.setStatus("active");
        
        return license;
    }
}
