const express = require('express');
const router = express.Router();
const {
    bookAppointment,
    getMyAppointments,
    getDoctorSchedule,
    cancelAppointment,
    updateAppointmentStatus,
    getAllAppointments,
    rescheduleAppointment
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Book appointment (patient or staff)
router.post('/book', bookAppointment);

// Get patient's appointments
router.get('/my-appointments', getMyAppointments);

// Get doctor's schedule
router.get('/doctor-schedule', authorize('doctor', 'staff', 'admin'), getDoctorSchedule);

// Cancel appointment
router.put('/cancel/:id', cancelAppointment);

// Reschedule appointment
router.put('/reschedule/:id', rescheduleAppointment);

// Update appointment status (doctor or staff)
router.put('/status/:id', authorize('doctor', 'staff', 'admin'), updateAppointmentStatus);

// Get all appointments (admin/staff)
router.get('/all', authorize('staff', 'admin'), getAllAppointments);

module.exports = router;
