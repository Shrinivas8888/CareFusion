const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Staff = require('../models/Staff');
const Pharmacy = require('../models/Pharmacy');
const Laboratory = require('../models/Laboratory');
const emailService = require('../services/emailService');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if user is blocked
        if (user.status === 'blocked') {
            return res.status(403).json({ message: 'Your account has been blocked. Please contact admin.', code: 'BLOCKED' });
        }

        // Check if user is rejected
        if (user.status === 'rejected') {
            return res.status(403).json({ message: 'Your registration was rejected. Please contact admin for assistance.', code: 'REJECTED' });
        }

        // Check if user is pending approval
        if (user.status !== 'approved') {
            return res.status(403).json({ message: 'Your account is pending admin approval. You will be notified once approved.', code: 'PENDING' });
        }

        // Get role-specific profile
        let profile = null;
        switch (user.role) {
            case 'patient':
                profile = await Patient.findOne({ userId: user._id });
                break;
            case 'doctor':
                profile = await Doctor.findOne({ userId: user._id });
                break;
            case 'staff':
                profile = await Staff.findOne({ userId: user._id });
                break;
            case 'pharmacy':
                profile = await Pharmacy.findOne({ userId: user._id });
                break;
            case 'laboratory':
                profile = await Laboratory.findOne({ userId: user._id });
                break;
        }

        res.json({
            token: generateToken(user._id),
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                profile
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        // Get role-specific profile
        let profile = null;
        switch (req.user.role) {
            case 'patient':
                profile = await Patient.findOne({ userId: req.user._id });
                break;
            case 'doctor':
                profile = await Doctor.findOne({ userId: req.user._id });
                break;
            case 'staff':
                profile = await Staff.findOne({ userId: req.user._id });
                break;
            case 'pharmacy':
                profile = await Pharmacy.findOne({ userId: req.user._id });
                break;
            case 'laboratory':
                profile = await Laboratory.findOne({ userId: req.user._id });
                break;
        }

        res.json({
            user: {
                id: req.user._id,
                email: req.user.email,
                role: req.user.role,
                profile
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Register new user (self-registration for non-admin roles)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    let createdUser = null;

    try {
        const { email, password, role, profileData } = req.body;

        // Validate required fields
        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Email, password, and role are required' });
        }

        // Prevent admin registration through this endpoint
        if (role === 'admin') {
            return res.status(403).json({ message: 'Admin accounts can only be created by existing admins' });
        }

        // Validate role-specific required fields
        const validationError = validateProfileData(role, profileData);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create user account (auto-approve patients, pending for others)
        createdUser = await User.create({
            email,
            password,
            role,
            status: role === 'patient' ? 'approved' : 'pending'  // Auto-approve patients only
        });

        // Create role-specific profile
        let profile = null;
        const profileDataWithUser = { ...profileData, userId: createdUser._id };

        switch (role) {
            case 'patient':
                profile = await Patient.create(profileDataWithUser);
                break;
            case 'doctor':
                profile = await Doctor.create(profileDataWithUser);
                break;
            case 'staff':
                profile = await Staff.create(profileDataWithUser);
                break;
            case 'pharmacy':
                profile = await Pharmacy.create(profileDataWithUser);
                break;
            case 'laboratory':
                profile = await Laboratory.create(profileDataWithUser);
                break;
        }

        // Send email verification for patients
        if (role === 'patient') {
            const verificationToken = crypto.randomBytes(32).toString('hex');
            createdUser.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
            createdUser.emailVerificationExpires = Date.now() + 24 * 3600000; // 24 hours
            await createdUser.save();

            // Send verification email
            await emailService.sendVerificationEmail(
                email,
                profileData.fullName || 'Patient',
                verificationToken
            );
        }

        // Different success messages based on role
        const message = role === 'patient'
            ? 'Registration successful! Please check your email to verify your account.'
            : 'Registration successful! Your account is pending approval.';

        res.status(201).json({
            message,
            user: {
                id: createdUser._id,
                email: createdUser.email,
                role: createdUser.role,
                status: createdUser.status
            }
        });
    } catch (error) {
        console.error('Registration error:', error);

        // Rollback: Delete user if profile creation failed
        if (createdUser) {
            await User.findByIdAndDelete(createdUser._id);
        }

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                message: 'Validation error: ' + messages.join(', ')
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                message: `${field} already exists`
            });
        }

        res.status(500).json({
            message: 'Registration failed. Please try again.',
            error: error.message
        });
    }
};

// Helper function to validate profile data
function validateProfileData(role, profileData) {
    if (!profileData) {
        return 'Profile data is required';
    }

    switch (role) {
        case 'patient':
            if (!profileData.fullName) return 'Full name is required';
            break;
        case 'doctor':
            if (!profileData.fullName) return 'Full name is required';
            // Other fields are optional during registration
            break;
        case 'staff':
            if (!profileData.name) return 'Name is required';
            // Other fields are optional during registration
            break;
        case 'pharmacy':
            if (!profileData.pharmacistName) return 'Pharmacist name is required';
            // Other fields are optional during registration
            break;
        case 'laboratory':
            if (!profileData.name) return 'Name is required';
            // Other fields are optional during registration
            break;
    }

    return null;
}

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            // Don't reveal if user exists for security
            return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Hash token and save to user
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Get user profile for name
        let profile = null;
        if (user.role === 'patient') {
            profile = await Patient.findOne({ userId: user._id });
        } else if (user.role === 'doctor') {
            profile = await Doctor.findOne({ userId: user._id });
        } else if (user.role === 'staff') {
            profile = await Staff.findOne({ userId: user._id });
        } else if (user.role === 'pharmacy') {
            profile = await Pharmacy.findOne({ userId: user._id });
        } else if (user.role === 'laboratory') {
            profile = await Laboratory.findOne({ userId: user._id });
        }

        const name = profile?.fullName || profile?.name || profile?.pharmacistName || 'User';

        // Send email
        await emailService.sendPasswordResetEmail(user.email, name, resetToken);

        res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Error sending reset email. Please try again later.' });
    }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Hash the token from URL
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid token
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Update password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password has been reset successfully. You can now login with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Error resetting password. Please try again.' });
    }
};

// @desc    Verify email with token
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // Hash the token from URL
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid token
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        // Verify email
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully! You can now login.' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Error verifying email. Please try again.' });
    }
};
