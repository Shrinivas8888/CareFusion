const express = require('express');
const router = express.Router();
const { login, getMe, register, forgotPassword, resetPassword, verifyEmail } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.get('/me', protect, getMe);

// Password Reset
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Email Verification
router.get('/verify-email/:token', verifyEmail);

module.exports = router;
