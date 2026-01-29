package com.example.demo.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otpCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("advocare503@gmail.com");
            helper.setTo(toEmail);
            helper.setSubject("Password Reset OTP - AdvoCare");

            String htmlContent = "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "<meta charset='UTF-8'>" +
                    "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                    "<style>" +
                    "  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }"
                    +
                    "  .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }" +
                    "  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }"
                    +
                    "  .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }" +
                    "  .content { padding: 40px 30px; }" +
                    "  .greeting { color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }" +
                    "  .otp-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); }"
                    +
                    "  .otp-label { color: #ffffff; font-size: 14px; font-weight: 500; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }"
                    +
                    "  .otp-code { color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 15px 0; }"
                    +
                    "  .expiry-notice { color: #ffffff; font-size: 13px; margin-top: 15px; opacity: 0.9; }" +
                    "  .info-box { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px; }"
                    +
                    "  .info-box p { margin: 0; color: #555555; font-size: 14px; line-height: 1.6; }" +
                    "  .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }"
                    +
                    "  .footer p { color: #6c757d; font-size: 12px; margin: 5px 0; line-height: 1.5; }" +
                    "  .brand-name { color: #667eea; font-weight: 600; }" +
                    "</style>" +
                    "</head>" +
                    "<body>" +
                    "  <div class='email-container'>" +
                    "    <div class='header'>" +
                    "      <h1>🔐 Password Reset</h1>" +
                    "    </div>" +
                    "    <div class='content'>" +
                    "      <div class='greeting'>" +
                    "        <p>Dear User,</p>" +
                    "        <p>You have requested to reset your password for your <span class='brand-name'>AdvoCare</span> account.</p>"
                    +
                    "      </div>" +
                    "      <div class='otp-box'>" +
                    "        <div class='otp-label'>Your OTP Code</div>" +
                    "        <div class='otp-code'>" + otpCode + "</div>" +
                    "        <div class='expiry-notice'>⏰ This code will expire in 10 minutes</div>" +
                    "      </div>" +
                    "      <div class='info-box'>" +
                    "        <p><strong>⚠️ Security Notice:</strong> If you did not request this password reset, please ignore this email. Your account remains secure.</p>"
                    +
                    "      </div>" +
                    "    </div>" +
                    "    <div class='footer'>" +
                    "      <p><strong>Best regards,</strong></p>" +
                    "      <p>The AdvoCare Team</p>" +
                    "      <p style='margin-top: 20px; font-size: 11px; color: #adb5bd;'>This is an automated email. Please do not reply to this message.</p>"
                    +
                    "    </div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("OTP email sent successfully to: " + toEmail);
        } catch (MessagingException e) {
            System.err.println("Error sending email: " + e.getMessage());
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage());
        }
    }

    public void sendWelcomeEmail(String toEmail, String role, String name) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("advocare503@gmail.com");
            helper.setTo(toEmail);
            helper.setSubject("Welcome to AdvoCare - Registration Successful");

            // Format role name for display
            String roleDisplay = role;
            String roleIcon = "👤";
            if (role.equalsIgnoreCase("CITIZEN")) {
                roleDisplay = "Citizen";
                roleIcon = "👥";
            } else if (role.equalsIgnoreCase("LAWYER")) {
                roleDisplay = "Lawyer";
                roleIcon = "⚖️";
            } else if (role.equalsIgnoreCase("NGO")) {
                roleDisplay = "NGO";
                roleIcon = "🤝";
            } else if (role.equalsIgnoreCase("ADMIN")) {
                roleDisplay = "Admin";
                roleIcon = "👨‍💼";
            }

            String userName = (name != null && !name.isEmpty()) ? name : "User";

            // Build role-specific steps
            String roleSpecificSteps = "";
            if (role.equalsIgnoreCase("LAWYER")) {
                roleSpecificSteps = "<li style='margin-bottom: 12px;'><strong>Your account is pending verification.</strong> Once verified, you will be able to receive case requests from citizens.</li>"
                        +
                        "<li style='margin-bottom: 12px;'><strong>Upload your documents</strong> for faster verification and approval.</li>";
            } else if (role.equalsIgnoreCase("NGO")) {
                roleSpecificSteps = "<li style='margin-bottom: 12px;'><strong>Your account is pending verification.</strong> Once verified, you will be able to assist citizens with legal aid.</li>"
                        +
                        "<li style='margin-bottom: 12px;'><strong>Upload your registration certificate</strong> for verification.</li>";
            } else if (role.equalsIgnoreCase("CITIZEN")) {
                roleSpecificSteps = "<li style='margin-bottom: 12px;'><strong>Browse verified lawyers and NGOs</strong> in your area.</li>"
                        +
                        "<li style='margin-bottom: 12px;'><strong>Submit your legal cases</strong> and get matched with the right legal professionals.</li>";
            }

            String htmlContent = "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "<meta charset='UTF-8'>" +
                    "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                    "<style>" +
                    "  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }"
                    +
                    "  .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }" +
                    "  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 20px; text-align: center; }"
                    +
                    "  .header h1 { color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; }" +
                    "  .header .subtitle { color: #ffffff; margin-top: 10px; font-size: 16px; opacity: 0.95; }" +
                    "  .content { padding: 40px 30px; }" +
                    "  .welcome-section { text-align: center; margin-bottom: 30px; }" +
                    "  .welcome-icon { font-size: 64px; margin-bottom: 15px; }" +
                    "  .greeting { color: #333333; font-size: 18px; line-height: 1.6; margin-bottom: 10px; font-weight: 600; }"
                    +
                    "  .welcome-text { color: #555555; font-size: 15px; line-height: 1.7; }" +
                    "  .details-card { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #dee2e6; }"
                    +
                    "  .details-card h2 { color: #667eea; font-size: 20px; margin: 0 0 20px 0; text-align: center; font-weight: 600; }"
                    +
                    "  .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #dee2e6; }"
                    +
                    "  .detail-row:last-child { border-bottom: none; }" +
                    "  .detail-label { color: #6c757d; font-weight: 600; font-size: 14px; }" +
                    "  .detail-value { color: #333333; font-weight: 500; font-size: 14px; }" +
                    "  .role-badge { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; }"
                    +
                    "  .steps-section { margin: 35px 0; }" +
                    "  .steps-section h2 { color: #667eea; font-size: 20px; margin-bottom: 20px; font-weight: 600; }" +
                    "  .steps-list { list-style: none; padding: 0; margin: 0; }" +
                    "  .steps-list li { padding: 15px; background-color: #f8f9fa; border-left: 4px solid #667eea; margin-bottom: 12px; border-radius: 4px; color: #333333; font-size: 14px; line-height: 1.6; }"
                    +
                    "  .security-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 30px 0; border-radius: 4px; }"
                    +
                    "  .security-box p { margin: 0; color: #856404; font-size: 14px; line-height: 1.6; }" +
                    "  .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }"
                    +
                    "  .footer p { color: #6c757d; font-size: 14px; margin: 8px 0; line-height: 1.6; }" +
                    "  .brand-name { color: #667eea; font-weight: 700; }" +
                    "</style>" +
                    "</head>" +
                    "<body>" +
                    "  <div class='email-container'>" +
                    "    <div class='header'>" +
                    "      <h1>🎉 Welcome to AdvoCare!</h1>" +
                    "      <div class='subtitle'>Your Legal Aid Matching Platform</div>" +
                    "    </div>" +
                    "    <div class='content'>" +
                    "      <div class='welcome-section'>" +
                    "        <div class='welcome-icon'>" + roleIcon + "</div>" +
                    "        <div class='greeting'>Hello, " + userName + "!</div>" +
                    "        <div class='welcome-text'>We are delighted to inform you that your registration has been successfully completed.</div>"
                    +
                    "      </div>" +
                    "      <div class='details-card'>" +
                    "        <h2>📋 Registration Details</h2>" +
                    "        <div class='detail-row'>" +
                    "          <span class='detail-label'>Email Address:</span>" +
                    "          <span class='detail-value'>" + toEmail + "</span>" +
                    "        </div>" +
                    "        <div class='detail-row'>" +
                    "          <span class='detail-label'>Account Role:</span>" +
                    "          <span class='detail-value'><span class='role-badge'>" + roleIcon + " " + roleDisplay
                    + "</span></span>" +
                    "        </div>" +
                    "      </div>" +
                    "      <div class='steps-section'>" +
                    "        <h2>🚀 Next Steps</h2>" +
                    "        <ul class='steps-list'>" +
                    "          <li><strong>Log in to your account</strong> using your registered email address.</li>" +
                    "          <li><strong>Keep your password secure</strong> and do not share it with anyone.</li>" +
                    "          <li><strong>Use 'Forgot Password'</strong> feature if you forget your password.</li>" +
                    roleSpecificSteps +
                    "        </ul>" +
                    "      </div>" +
                    "      <div class='security-box'>" +
                    "        <p><strong>🔒 Security Reminder:</strong> For your security, we never send passwords via email. If you forget your password, please use the password reset feature on our platform.</p>"
                    +
                    "      </div>" +
                    "      <div style='text-align: center; margin: 30px 0; color: #555555; font-size: 15px; line-height: 1.7;'>"
                    +
                    "        <p>Thank you for choosing <span class='brand-name'>AdvoCare</span>. We look forward to serving you!</p>"
                    +
                    "        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>"
                    +
                    "      </div>" +
                    "    </div>" +
                    "    <div class='footer'>" +
                    "      <p><strong>Best regards,</strong></p>" +
                    "      <p>The AdvoCare Team</p>" +
                    "      <p style='margin-top: 20px; font-size: 11px; color: #adb5bd;'>This is an automated email. Please do not reply to this message.</p>"
                    +
                    "    </div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("Welcome email sent successfully to: " + toEmail);
        } catch (MessagingException e) {
            System.err.println("Error sending welcome email: " + e.getMessage());
            // Don't throw exception - registration should succeed even if email fails
            e.printStackTrace();
        }
    }

    public void sendAppointmentNotificationEmail(String providerEmail, String providerName, String providerRole,
            String citizenName, String citizenEmail, String appointmentDate, String appointmentTime,
            String appointmentType, String description) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("advocare503@gmail.com");
            helper.setTo(providerEmail);
            helper.setSubject("New Appointment Booking - AdvoCare");

            // Format role name for display
            String roleDisplay = providerRole;
            if (providerRole.equalsIgnoreCase("LAWYER")) {
                roleDisplay = "Lawyer";
            } else if (providerRole.equalsIgnoreCase("NGO")) {
                roleDisplay = "NGO";
            }

            String descriptionHtml = "";
            if (description != null && !description.trim().isEmpty()) {
                descriptionHtml = "<div class='detail-row'>" +
                        "<span class='detail-label'>Description:</span>" +
                        "<span class='detail-value'>" + description + "</span>" +
                        "</div>";
            }

            String htmlContent = "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "<meta charset='UTF-8'>" +
                    "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                    "<style>" +
                    "  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }"
                    +
                    "  .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }" +
                    "  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }"
                    +
                    "  .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }" +
                    "  .header .subtitle { color: #ffffff; margin-top: 10px; font-size: 14px; opacity: 0.95; }" +
                    "  .content { padding: 40px 30px; }" +
                    "  .greeting { color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 25px; }" +
                    "  .greeting strong { color: #667eea; }" +
                    "  .appointment-card { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border: 1px solid #dee2e6; }"
                    +
                    "  .appointment-card h2 { color: #667eea; font-size: 20px; margin: 0 0 20px 0; text-align: center; font-weight: 600; }"
                    +
                    "  .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #dee2e6; align-items: flex-start; }"
                    +
                    "  .detail-row:last-child { border-bottom: none; }" +
                    "  .detail-label { color: #6c757d; font-weight: 600; font-size: 14px; min-width: 100px; }" +
                    "  .detail-value { color: #333333; font-weight: 500; font-size: 14px; text-align: right; flex: 1; }"
                    +
                    "  .client-card { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border: 1px solid #90caf9; }"
                    +
                    "  .client-card h2 { color: #1976d2; font-size: 20px; margin: 0 0 20px 0; text-align: center; font-weight: 600; }"
                    +
                    "  .client-card .detail-row { border-bottom-color: #90caf9; }" +
                    "  .client-card .detail-label { color: #1565c0; }" +
                    "  .client-card .detail-value { color: #0d47a1; }" +
                    "  .steps-section { margin: 30px 0; }" +
                    "  .steps-section h2 { color: #667eea; font-size: 20px; margin-bottom: 20px; font-weight: 600; }" +
                    "  .steps-list { list-style: none; padding: 0; margin: 0; }" +
                    "  .steps-list li { padding: 15px; background-color: #f8f9fa; border-left: 4px solid #667eea; margin-bottom: 12px; border-radius: 4px; color: #333333; font-size: 14px; line-height: 1.6; }"
                    +
                    "  .icon-badge { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 8px; }"
                    +
                    "  .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }"
                    +
                    "  .footer p { color: #6c757d; font-size: 14px; margin: 8px 0; line-height: 1.6; }" +
                    "  .brand-name { color: #667eea; font-weight: 700; }" +
                    "</style>" +
                    "</head>" +
                    "<body>" +
                    "  <div class='email-container'>" +
                    "    <div class='header'>" +
                    "      <h1>📅 New Appointment Booking</h1>" +
                    "      <div class='subtitle'>You have a new appointment request</div>" +
                    "    </div>" +
                    "    <div class='content'>" +
                    "      <div class='greeting'>" +
                    "        <p>Dear <strong>" + providerName + "</strong>,</p>" +
                    "        <p>You have received a new appointment booking through <span class='brand-name'>AdvoCare</span>.</p>"
                    +
                    "      </div>" +
                    "      <div class='appointment-card'>" +
                    "        <h2>📋 Appointment Details</h2>" +
                    "        <div class='detail-row'>" +
                    "          <span class='detail-label'>📅 Date:</span>" +
                    "          <span class='detail-value'>" + appointmentDate + "</span>" +
                    "        </div>" +
                    "        <div class='detail-row'>" +
                    "          <span class='detail-label'>🕐 Time:</span>" +
                    "          <span class='detail-value'>" + appointmentTime + "</span>" +
                    "        </div>" +
                    "        <div class='detail-row'>" +
                    "          <span class='detail-label'>📝 Type:</span>" +
                    "          <span class='detail-value'>" + appointmentType + "</span>" +
                    "        </div>" +
                    descriptionHtml +
                    "      </div>" +
                    "      <div class='client-card'>" +
                    "        <h2>👤 Client Information</h2>" +
                    "        <div class='detail-row'>" +
                    "          <span class='detail-label'>Name:</span>" +
                    "          <span class='detail-value'>" + citizenName + "</span>" +
                    "        </div>" +
                    "        <div class='detail-row'>" +
                    "          <span class='detail-label'>Email:</span>" +
                    "          <span class='detail-value'>" + citizenEmail + "</span>" +
                    "        </div>" +
                    "      </div>" +
                    "      <div class='steps-section'>" +
                    "        <h2>🚀 Next Steps</h2>" +
                    "        <ul class='steps-list'>" +
                    "          <li><strong>Log in to your dashboard</strong> to view full appointment details.</li>" +
                    "          <li><strong>Confirm, reschedule, or cancel</strong> this appointment from your dashboard.</li>"
                    +
                    "          <li><strong>Contact the client</strong> using their email address provided above if needed.</li>"
                    +
                    "        </ul>" +
                    "      </div>" +
                    "      <div style='text-align: center; margin: 30px 0; color: #555555; font-size: 15px; line-height: 1.7;'>"
                    +
                    "        <p>Thank you for being a part of <span class='brand-name'>AdvoCare</span>!</p>" +
                    "      </div>" +
                    "    </div>" +
                    "    <div class='footer'>" +
                    "      <p><strong>Best regards,</strong></p>" +
                    "      <p>The AdvoCare Team</p>" +
                    "      <p style='margin-top: 20px; font-size: 11px; color: #adb5bd;'>This is an automated email. Please do not reply to this message.</p>"
                    +
                    "    </div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("Appointment notification email sent successfully to: " + providerEmail);
        } catch (MessagingException e) {
            System.err.println("Error sending appointment notification email: " + e.getMessage());
            // Don't throw exception - appointment should succeed even if email fails
            e.printStackTrace();
        }
    }
    public void sendAccountApprovedEmail(String toEmail, String role, String name) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("advocare503@gmail.com");
            helper.setTo(toEmail);
            helper.setSubject("Account Approved - AdvoCare");

            String roleDisplay = role;
            String roleIcon = "✅";
            if (role.equalsIgnoreCase("LAWYER")) {
                roleDisplay = "Lawyer";
                roleIcon = "⚖️";
            } else if (role.equalsIgnoreCase("NGO")) {
                roleDisplay = "NGO";
                roleIcon = "🤝";
            }

            String userName = (name != null && !name.isEmpty()) ? name : "User";

            String htmlContent = "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "<meta charset='UTF-8'>" +
                    "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                    "<style>" +
                    "  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }" +
                    "  .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }" +
                    "  .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 50px 20px; text-align: center; }" +
                    "  .header h1 { color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; }" +
                    "  .content { padding: 40px 30px; }" +
                    "  .icon-large { font-size: 64px; text-align: center; margin-bottom: 20px; display: block; }" +
                    "  .greeting { color: #333333; font-size: 18px; line-height: 1.6; margin-bottom: 20px; font-weight: 600; text-align: center; }" +
                    "  .message-text { color: #555555; font-size: 16px; line-height: 1.7; text-align: center; margin-bottom: 30px; }" +
                    "  .action-button { display: block; width: 200px; margin: 0 auto; padding: 15px 0; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; text-align: center; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); transition: transform 0.2s; }" +
                    "  .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }" +
                    "  .footer p { color: #6c757d; font-size: 12px; margin: 5px 0; line-height: 1.5; }" +
                    "  .brand-name { color: #10B981; font-weight: 700; }" +
                    "</style>" +
                    "</head>" +
                    "<body>" +
                    "  <div class='email-container'>" +
                    "    <div class='header'>" +
                    "      <h1>🎉 Account Approved!</h1>" +
                    "    </div>" +
                    "    <div class='content'>" +
                    "      <span class='icon-large'>" + roleIcon + "</span>" +
                    "      <div class='greeting'>Hello, " + userName + "!</div>" +
                    "      <p class='message-text'>" +
                    "        Congratulations! Your <strong>" + roleDisplay + "</strong> account has been successfully verified and approved by our administrators.<br><br>" +
                    "        You now have full access to all features of the AdvoCare platform. You can start accepting requests and helping citizens." +
                    "      </p>" +
                    "      <a href='http://localhost:5173/login' class='action-button'>Login Now</a>" +
                    "    </div>" +
                    "    <div class='footer'>" +
                    "      <p><strong>Best regards,</strong></p>" +
                    "      <p>The AdvoCare Team</p>" +
                    "      <p style='margin-top: 20px; font-size: 11px; color: #adb5bd;'>This is an automated email. Please do not reply to this message.</p>" +
                    "    </div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("Account approved email sent successfully to: " + toEmail);
        } catch (MessagingException e) {
            System.err.println("Error sending account approved email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendAccountRejectedEmail(String toEmail, String role, String name) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("advocare503@gmail.com");
            helper.setTo(toEmail);
            helper.setSubject("Account Application Update - AdvoCare");

            String roleDisplay = role;
            if (role.equalsIgnoreCase("LAWYER")) {
                roleDisplay = "Lawyer";
            } else if (role.equalsIgnoreCase("NGO")) {
                roleDisplay = "NGO";
            }

            String userName = (name != null && !name.isEmpty()) ? name : "User";

            String htmlContent = "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "<meta charset='UTF-8'>" +
                    "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                    "<style>" +
                    "  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }" +
                    "  .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }" +
                    "  .header { background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%); padding: 50px 20px; text-align: center; }" +
                    "  .header h1 { color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; }" +
                    "  .content { padding: 40px 30px; }" +
                    "  .icon-large { font-size: 64px; text-align: center; margin-bottom: 20px; display: block; }" +
                    "  .greeting { color: #333333; font-size: 18px; line-height: 1.6; margin-bottom: 20px; font-weight: 600; text-align: center; }" +
                    "  .message-text { color: #555555; font-size: 16px; line-height: 1.7; text-align: center; margin-bottom: 30px; }" +
                    "  .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }" +
                    "  .footer p { color: #6c757d; font-size: 12px; margin: 5px 0; line-height: 1.5; }" +
                    "  .brand-name { color: #EF4444; font-weight: 700; }" +
                    "</style>" +
                    "</head>" +
                    "<body>" +
                    "  <div class='email-container'>" +
                    "    <div class='header'>" +
                    "      <h1>Action Required</h1>" +
                    "    </div>" +
                    "    <div class='content'>" +
                    "      <span class='icon-large'>⚠️</span>" +
                    "      <div class='greeting'>Hello, " + userName + "</div>" +
                    "      <p class='message-text'>" +
                    "        We reviewed your application for a <strong>" + roleDisplay + "</strong> account on AdvoCare.<br><br>" +
                    "        Unfortunately, we could not approve your account at this time. This may be due to incomplete documentation or verification issues.<br><br>" +
                    "        Please contact our support team for more details or to resubmit your application." +
                    "      </p>" +
                    "    </div>" +
                    "    <div class='footer'>" +
                    "      <p><strong>Best regards,</strong></p>" +
                    "      <p>The AdvoCare Team</p>" +
                    "      <p style='margin-top: 20px; font-size: 11px; color: #adb5bd;'>This is an automated email. Please do not reply to this message.</p>" +
                    "    </div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("Account rejection email sent successfully to: " + toEmail);
        } catch (MessagingException e) {
            System.err.println("Error sending account rejection email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendCaseCancellationEmail(String providerEmail, String providerName, String providerRole,
            String citizenName, String caseNumber, String caseTitle, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("advocare503@gmail.com");
            helper.setTo(providerEmail);
            helper.setSubject("Case Assignment Cancelled - AdvoCare");

            // Format role name for display
            String roleDisplay = providerRole;
            String roleIcon = "⚖️";
            if (providerRole.equalsIgnoreCase("LAWYER")) {
                roleDisplay = "Lawyer";
                roleIcon = "⚖️";
            } else if (providerRole.equalsIgnoreCase("NGO")) {
                roleDisplay = "NGO";
                roleIcon = "🤝";
            }

            String reasonHtml = "";
            if (reason != null && !reason.trim().isEmpty()) {
                reasonHtml = "<div class='reason-box'>" +
                        "<h3 style='color: #EF4444; font-size: 18px; margin-bottom: 10px;'>Reason for Cancellation:</h3>" +
                        "<p style='color: #555555; font-size: 15px; line-height: 1.7; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #EF4444; border-radius: 4px;'>" +
                        reason + "</p>" +
                        "</div>";
            }

            String htmlContent = "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "<meta charset='UTF-8'>" +
                    "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                    "<style>" +
                    "  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }" +
                    "  .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }" +
                    "  .header { background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%); padding: 40px 20px; text-align: center; }" +
                    "  .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }" +
                    "  .header .subtitle { color: #ffffff; margin-top: 10px; font-size: 14px; opacity: 0.95; }" +
                    "  .content { padding: 40px 30px; }" +
                    "  .greeting { color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 25px; }" +
                    "  .greeting strong { color: #EF4444; }" +
                    "  .case-card { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border: 1px solid #dee2e6; }" +
                    "  .case-card h2 { color: #EF4444; font-size: 20px; margin: 0 0 20px 0; text-align: center; font-weight: 600; }" +
                    "  .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #dee2e6; align-items: flex-start; }" +
                    "  .detail-row:last-child { border-bottom: none; }" +
                    "  .detail-label { color: #6c757d; font-weight: 600; font-size: 14px; min-width: 100px; }" +
                    "  .detail-value { color: #333333; font-weight: 500; font-size: 14px; text-align: right; flex: 1; }" +
                    "  .reason-box { margin: 25px 0; }" +
                    "  .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }" +
                    "  .footer p { color: #6c757d; font-size: 14px; margin: 8px 0; line-height: 1.6; }" +
                    "  .brand-name { color: #EF4444; font-weight: 700; }" +
                    "</style>" +
                    "</head>" +
                    "<body>" +
                    "  <div class='email-container'>" +
                    "    <div class='header'>" +
                    "      <h1>❌ Case Assignment Cancelled</h1>" +
                    "      <div class='subtitle'>Your assignment has been cancelled</div>" +
                    "    </div>" +
                    "    <div class='content'>" +
                    "      <div class='greeting'>" +
                    "        <p>Dear <strong>" + providerName + "</strong>,</p>" +
                    "        <p>We regret to inform you that your case assignment has been cancelled through <span class='brand-name'>AdvoCare</span>.</p>" +
                    "      </div>" +
                    "      <div class='case-card'>" +
                    "        <h2>📋 Case Details</h2>" +
                    "        <div class='detail-row'>" +
                    "          <span class='detail-label'>Case Number:</span>" +
                    "          <span class='detail-value'>" + caseNumber + "</span>" +
                    "        </div>" +
                    "        <div class='detail-row'>" +
                    "          <span class='detail-label'>Case Title:</span>" +
                    "          <span class='detail-value'>" + caseTitle + "</span>" +
                    "        </div>" +
                    "        <div class='detail-row'>" +
                    "          <span class='detail-label'>Client:</span>" +
                    "          <span class='detail-value'>" + citizenName + "</span>" +
                    "        </div>" +
                    "      </div>" +
                    reasonHtml +
                    "      <div style='text-align: center; margin: 30px 0; color: #555555; font-size: 15px; line-height: 1.7;'>" +
                    "        <p>If you have any questions about this cancellation, please contact our support team.</p>" +
                    "        <p>Thank you for being a part of <span class='brand-name'>AdvoCare</span>!</p>" +
                    "      </div>" +
                    "    </div>" +
                    "    <div class='footer'>" +
                    "      <p><strong>Best regards,</strong></p>" +
                    "      <p>The AdvoCare Team</p>" +
                    "      <p style='margin-top: 20px; font-size: 11px; color: #adb5bd;'>This is an automated email. Please do not reply to this message.</p>" +
                    "    </div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("Case cancellation email sent successfully to: " + providerEmail);
        } catch (MessagingException e) {
            System.err.println("Error sending case cancellation email: " + e.getMessage());
            // Don't throw exception - cancellation should succeed even if email fails
            e.printStackTrace();
        }
    }
}
