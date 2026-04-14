const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String // Keep for backward compatibility
    },
    slotStartTime: {
        type: String, // Format: "10:00" (24-hour)
        required: true
    },
    slotEndTime: {
        type: String, // Format: "10:15" (24-hour)
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'no-show', 'in-progress', 'reschedule_required'],
        default: 'scheduled'
    },
    bookingType: {
        type: String,
        enum: ['appointment', 'walkin'],
        default: 'appointment'
    },
    tokenNumber: {
        type: Number // For walk-in patients
    },
    consultationCharge: {
        type: Number,
        required: true
    },
    visitType: {
        type: String,
        enum: ['OPD', 'Online'],
        default: 'OPD'
    },
    notes: {
        type: String
    },
    bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Can be patient or staff
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, slotStartTime: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
