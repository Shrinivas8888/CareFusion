const nodemailer = require('nodemailer');

// Create transporter (using Gmail for now - can be changed)
const createTransporter = () => {
    // For development: Use ethereal (fake SMTP) or configure real SMTP
    if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    } else {
        // Development: Use Gmail or console log
        console.log('⚠️  Email service running in development mode');
        return nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
};

/**
 * Send email verification email
 */
exports.sendVerificationEmail = async (email, name, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;

    const mailOptions = {
        from: `"Hospital Management System" <${process.env.EMAIL_USER || 'noreply@hospital.com'}>`,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Email Verification Required</h2>
                <p>Hello ${name},</p>
                <p>Thank you for registering with our Hospital Management System. Please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                <p>Or copy and paste this link in your browser:</p>
                <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
                <p style="color: #999; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
            </div>
        `
    };

    try {
        const transporter = createTransporter();
        await transporter.sendMail(mailOptions);
        console.log('✅ Verification email sent to:', email);
        return { success: true };
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send password reset email
 */
exports.sendPasswordResetEmail = async (email, name, token) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;

    const mailOptions = {
        from: `"Hospital Management System" <${process.env.EMAIL_USER || 'noreply@hospital.com'}>`,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Password Reset Request</h2>
                <p>Hello ${name},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p>Or copy and paste this link in your browser:</p>
                <p style="color: #666; word-break: break-all;">${resetUrl}</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
                <p style="color: #999; font-size: 12px;">If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            </div>
        `
    };

    try {
        const transporter = createTransporter();
        await transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent to:', email);
        return { success: true };
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send appointment reminder email
 */
exports.sendAppointmentReminder = async (email, patientName, doctorName, appointmentDate, timeSlot) => {
    const mailOptions = {
        from: `"Hospital Management System" <${process.env.EMAIL_USER || 'noreply@hospital.com'}>`,
        to: email,
        subject: 'Appointment Reminder',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">Appointment Reminder</h2>
                <p>Hello ${patientName},</p>
                <p>This is a reminder for your upcoming appointment:</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(appointmentDate).toLocaleDateString()}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${timeSlot}</p>
                </div>
                <p>Please arrive 10 minutes before your scheduled time.</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">If you need to reschedule, please contact us or use the patient portal.</p>
            </div>
        `
    };

    try {
        const transporter = createTransporter();
        await transporter.sendMail(mailOptions);
        console.log('✅ Appointment reminder sent to:', email);
        return { success: true };
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return { success: false, error: error.message };
    }
};
