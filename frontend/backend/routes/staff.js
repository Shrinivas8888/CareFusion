const express = require('express');
const router = express.Router();
const {
    getDailyQueue,
    addToQueue,
    updateQueueStatus,
    getAppointments,
    bookAppointment,
    getPatients,
    getDoctors
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and require staff role
router.use(protect);
router.use(authorize('staff'));

router.get('/queue', getDailyQueue);
router.post('/queue', addToQueue);
router.put('/queue/:id', updateQueueStatus);
router.get('/appointments', getAppointments);
router.post('/appointment', bookAppointment);
router.get('/patients', getPatients);
router.get('/doctors', getDoctors);

module.exports = router;
