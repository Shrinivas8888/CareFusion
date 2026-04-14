const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['patient', 'doctor', 'staff', 'pharmacy', 'laboratory', 'admin']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'blocked'],
        default: 'approved' // Default approved since admin creates all accounts
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Admin who created this user
    },
    isDefaultAdmin: {
        type: Boolean,
        default: false
    },
    // Email Verification
    isEmailVerified: {
        type: Boolean,
        default: function () {
            return this.role !== 'patient'; // Auto-verify non-patients
        }
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    // Password Reset
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
