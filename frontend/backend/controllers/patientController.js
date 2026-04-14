const path = require('path');
const fs = require('fs');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const LabTest = require('../models/LabTest');
const Patient = require('../models/Patient');

// @desc    Get patient appointments
// @route   GET /api/patient/appointments
// @access  Private/Patient
exports.getAppointments = async (req, res) => {
    try {
        // Find patient profile
        const patient = await Patient.findOne({ userId: req.user._id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const appointments = await Appointment.find({ patientId: patient._id })
            .populate('doctorId', 'fullName specialization department')
            .sort({ appointmentDate: -1 });

        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Book appointment
// @route   POST /api/patient/appointments
// @access  Private/Patient
exports.bookAppointment = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const { doctorId, appointmentDate, timeSlot, notes } = req.body;

        const appointment = await Appointment.create({
            patientId: patient._id,
            doctorId,
            appointmentDate,
            timeSlot,
            notes,
            bookedBy: req.user._id
        });

        res.status(201).json(appointment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get patient prescriptions
// @route   GET /api/patient/prescriptions
// @access  Private/Patient
exports.getPrescriptions = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const prescriptions = await Prescription.find({ patientId: patient._id })
            .populate('doctorId', 'fullName specialization')
            .sort({ createdAt: -1 });

        res.json(prescriptions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get patient lab reports
// @route   GET /api/patient/lab-reports
// @access  Private/Patient
exports.getLabReports = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const labTests = await LabTest.find({ patientId: patient._id })
            .populate('doctorId', 'fullName specialization')
            .sort({ requestedDate: -1 });

        res.json(labTests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get patient profile
// @route   GET /api/patient/profile
// @access  Private/Patient
exports.getProfile = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        res.json(patient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update patient profile
// @route   PUT /api/patient/profile
// @access  Private/Patient
exports.updateProfile = async (req, res) => {
    try {
        const patient = await Patient.findOneAndUpdate(
            { userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        res.json(patient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Download prescription PDF
// @route   GET /api/patient/prescriptions/:id/download
// @access  Private/Patient
exports.downloadPrescriptionPDF = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const prescription = await Prescription.findOne({
            _id: req.params.id,
            patientId: patient._id
        });

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found or access denied' });
        }

        if (!prescription.pdfPath) {
            return res.status(404).json({ message: 'PDF not yet generated for this prescription' });
        }

        const filepath = path.join(__dirname, '../uploads', prescription.pdfPath);
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ message: 'PDF file not found' });
        }

        const filename = `Prescription-${prescription.prescriptionId}.pdf`;
        res.download(filepath, filename, (err) => {
            if (err && !res.headersSent) {
                res.status(500).json({ message: 'Download failed' });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
