const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const slotService = require('../services/slotService');

// @desc    Book an appointment (slot-based)
// @route   POST /api/appointments/book
// @access  Private (Patient or Staff)
exports.bookAppointment = async (req, res) => {
    try {
        const {
            doctorId,
            patientId,
            appointmentDate,
            slotStartTime,
            slotEndTime,
            bookingType = 'appointment',
            consultationCharge,
            visitType = 'OPD',
            notes
        } = req.body;

        // Validate required fields
        if (!doctorId || !patientId || !appointmentDate || !slotStartTime || !slotEndTime || !consultationCharge) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if slot is available
        const isAvailable = await slotService.isSlotAvailable(
            doctorId,
            new Date(appointmentDate),
            slotStartTime,
            slotEndTime
        );

        if (!isAvailable) {
            return res.status(400).json({ message: 'Selected slot is not available' });
        }

        // Create appointment
        const appointmentData = {
            doctorId,
            patientId,
            appointmentDate: new Date(appointmentDate),
            slotStartTime,
            slotEndTime,
            bookingType,
            consultationCharge,
            visitType,
            notes,
            bookedBy: req.user._id,
            status: 'scheduled'
        };

        // If walk-in, assign token number
        if (bookingType === 'walkin') {
            const tokenNumber = await slotService.getNextTokenNumber(doctorId, new Date(appointmentDate));
            appointmentData.tokenNumber = tokenNumber;
        }

        const appointment = await Appointment.create(appointmentData);

        // Populate doctor and patient details
        await appointment.populate([
            { path: 'doctorId', select: 'fullName specialization department' },
            { path: 'patientId', select: 'fullName mobile userId' }
        ]);

        // Send confirmation notification to patient
        const patient = await Patient.findById(patientId).select('userId').lean();
        if (patient?.userId) {
            const doctor = await Doctor.findById(doctorId).select('fullName specialization').lean();
            const doctorName = doctor?.fullName || 'Doctor';
            await Notification.create({
                userId: patient.userId,
                type: 'appointment',
                title: 'Appointment Booked',
                message: `Your appointment with Dr. ${doctorName} on ${new Date(appointmentDate).toLocaleDateString()} at ${slotStartTime} has been confirmed.`,
                data: { appointmentId: appointment._id }
            });
        }

        res.status(201).json({
            message: 'Appointment booked successfully',
            appointment
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get patient's appointments
// @route   GET /api/appointments/my-appointments
// @access  Private/Patient
exports.getMyAppointments = async (req, res) => {
    try {
        const { patientId } = req.query;

        if (!patientId) {
            return res.status(400).json({ message: 'Patient ID required' });
        }

        const appointments = await Appointment.find({ patientId })
            .populate('doctorId', 'fullName specialization department')
            .sort({ appointmentDate: -1, slotStartTime: -1 });

        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get doctor's schedule for a specific date
// @route   GET /api/appointments/doctor-schedule
// @access  Private/Doctor/Staff
exports.getDoctorSchedule = async (req, res) => {
    try {
        const { doctorId, date } = req.query;

        if (!doctorId || !date) {
            return res.status(400).json({ message: 'Doctor ID and date required' });
        }

        const appointments = await Appointment.find({
            doctorId,
            appointmentDate: {
                $gte: new Date(date).setHours(0, 0, 0, 0),
                $lt: new Date(date).setHours(23, 59, 59, 999)
            },
            status: { $ne: 'cancelled' }
        })
            .populate('patientId', 'fullName mobile age gender')
            .sort({ slotStartTime: 1 });

        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/cancel/:id
// @access  Private (Patient or Staff)
exports.cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (appointment.status === 'completed') {
            return res.status(400).json({ message: 'Cannot cancel completed appointment' });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        res.json({ message: 'Appointment cancelled successfully', appointment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update appointment status (for doctors)
// @route   PUT /api/appointments/status/:id
// @access  Private/Doctor/Staff
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['scheduled', 'in-progress', 'completed', 'no-show'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('patientId', 'fullName mobile');

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        res.json({ message: 'Status updated successfully', appointment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all appointments (for admin/staff)
// @route   GET /api/appointments/all
// @access  Private/Admin/Staff
exports.getAllAppointments = async (req, res) => {
    try {
        const { status, date, doctorId } = req.query;

        let query = {};

        if (status) query.status = status;
        if (doctorId) query.doctorId = doctorId;
        if (date) {
            query.appointmentDate = {
                $gte: new Date(date).setHours(0, 0, 0, 0),
                $lt: new Date(date).setHours(23, 59, 59, 999)
            };
        }

        const appointments = await Appointment.find(query)
            .populate('doctorId', 'fullName specialization department')
            .populate('patientId', 'fullName mobile')
            .sort({ appointmentDate: -1, slotStartTime: 1 });

        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Reschedule appointment
// @route   PUT /api/appointments/reschedule/:id
// @access  Private (Patient or Staff)
exports.rescheduleAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { newDate, newSlotStartTime, newSlotEndTime } = req.body;

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (appointment.status !== 'scheduled') {
            return res.status(400).json({ message: 'Can only reschedule scheduled appointments' });
        }

        // Check if new slot is available
        const isAvailable = await slotService.isSlotAvailable(
            appointment.doctorId,
            new Date(newDate),
            newSlotStartTime,
            newSlotEndTime
        );

        if (!isAvailable) {
            return res.status(400).json({ message: 'New slot is not available' });
        }

        // Update appointment
        appointment.appointmentDate = new Date(newDate);
        appointment.slotStartTime = newSlotStartTime;
        appointment.slotEndTime = newSlotEndTime;
        await appointment.save();

        res.json({ message: 'Appointment rescheduled successfully', appointment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = exports;
