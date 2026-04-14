const express = require('express');
const router = express.Router();
const {
    getAppointments,
    bookAppointment,
    getPrescriptions,
    getLabReports,
    getProfile,
    updateProfile,
    downloadPrescriptionPDF
} = require('../controllers/patientController');

const {
    searchDoctors,
    getAvailableSlots,
    bookEmergencyAppointment
} = require('../controllers/patientAppointmentHelpers');

const {
    generatePrescriptionQR,
    sharePrescription,
    getMedicalHistory,
    getHealthSummary
} = require('../controllers/patientPrescriptionHelpers');

const {
    rescheduleAppointment,
    cancelAppointment
} = require('../controllers/appointmentController');

const { protect, authorize } = require('../middleware/auth');

// All routes are protected and require patient role
router.use(protect);
router.use(authorize('patient'));

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Appointments
router.get('/appointments', getAppointments);
router.post('/appointments', bookAppointment);
router.put('/appointments/:id/reschedule', rescheduleAppointment);
router.put('/appointments/:id/cancel', cancelAppointment);
router.post('/appointments/emergency', bookEmergencyAppointment);

// Doctor Search & Slots
router.get('/doctors/search', searchDoctors);
router.get('/doctors/:id/available-slots', getAvailableSlots);

// Prescriptions
router.get('/prescriptions', getPrescriptions);
router.get('/prescriptions/:id/download', downloadPrescriptionPDF);
router.post('/prescriptions/:id/generate-qr', generatePrescriptionQR);
router.post('/prescriptions/:id/share', sharePrescription);

// Lab Reports
router.get('/lab-reports', getLabReports);

// EMR (Enhanced Medical Records)
router.get('/emr/history', getMedicalHistory);
router.get('/emr/health-summary', getHealthSummary);

module.exports = router;
