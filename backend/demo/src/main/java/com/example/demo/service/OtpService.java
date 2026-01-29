package com.example.demo.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class OtpService {

    private final EmailService emailService;
    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();
    private static final long OTP_EXPIRY_MS = TimeUnit.MINUTES.toMillis(10);

    public OtpService(EmailService emailService) {
        this.emailService = emailService;
    }

    public void generateAndSendOtp(String email) {
        String otp = String.format("%06d", new Random().nextInt(1000000));
        otpStorage.put(email, new OtpData(otp, System.currentTimeMillis() + OTP_EXPIRY_MS));

        emailService.sendOtpEmail(email, otp);
        System.out.println("Generated OTP for " + email + ": " + otp);
    }

    public boolean verifyOtp(String email, String otp) {
        OtpData data = otpStorage.get(email);
        if (data == null)
            return false;

        if (System.currentTimeMillis() > data.expiryTime) {
            otpStorage.remove(email);
            return false;
        }

        boolean isValid = data.otp.equals(otp);
        if (isValid) {
            otpStorage.remove(email); // One-time use
        }
        return isValid;
    }

    private static class OtpData {
        String otp;
        long expiryTime;

        OtpData(String otp, long expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }
    }
}
