const crypto = require('crypto');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const LabTest = require('../models/LabTest');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Notification = require('../models/Notification');
const MedicineCatalog = require('../models/MedicineCatalog');
const { generatePrescriptionPDF } = require('../services/prescriptionPdfService');
const aiService = require('../services/aiService');

// @desc    Get doctor's appointments
// @route   GET /api/doctor/appointments
// @access  Private/Doctor
exports.getAppointments = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const { date } = req.query;
        let query = { doctorId: doctor._id };

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.appointmentDate = { $gte: startDate, $lte: endDate };
        }

        const appointments = await Appointment.find(query)
            .populate('patientId', 'fullName age gender mobile')
            .sort({ appointmentDate: 1, timeSlot: 1 });

        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get doctor's upcoming appointments (next N days)
// @route   GET /api/doctor/appointments/upcoming
// @access  Private/Doctor
exports.getUpcomingAppointments = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const days = Math.min(parseInt(req.query.days) || 7, 14);
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + days);
        end.setHours(23, 59, 59, 999);

        const appointments = await Appointment.find({
            doctorId: doctor._id,
            appointmentDate: { $gte: start, $lte: end },
            status: { $in: ['scheduled', 'in-progress'] }
        })
            .populate('patientId', 'fullName age gender mobile')
            .sort({ appointmentDate: 1, slotStartTime: 1 });

        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get patient EMR
// @route   GET /api/doctor/patient/:id
// @access  Private/Doctor
exports.getPatientEMR = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Get patient's medical history
        const prescriptions = await Prescription.find({ patientId: patient._id })
            .populate('doctorId', 'fullName specialization')
            .sort({ createdAt: -1 })
            .limit(10);

        const labTests = await LabTest.find({ patientId: patient._id })
            .sort({ requestedDate: -1 })
            .limit(10);

        const appointments = await Appointment.find({ patientId: patient._id })
            .populate('doctorId', 'fullName specialization')
            .sort({ appointmentDate: -1 })
            .limit(10);

        res.json({
            patient,
            prescriptions,
            labTests,
            appointments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create prescription (with digital signature & PDF generation)
// @route   POST /api/doctor/prescription
// @access  Private/Doctor
exports.createPrescription = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const { patientId, appointmentId, diagnosis, medicines, labTestsRequested, notes } = req.body;

        const prescription = await Prescription.create({
            patientId,
            doctorId: doctor._id,
            appointmentId,
            diagnosis,
            medicines,
            labTestsRequested,
            notes
        });

        // Add: Automatically create Laboratory test requests and notify lab department
        if (labTestsRequested && labTestsRequested.length > 0) {
            try {
                const labRequests = labTestsRequested.map(test => ({
                    patientId,
                    doctorId: doctor._id,
                    testType: test.name,
                    description: `Automatically requested via Prescription #${prescription.prescriptionId}`,
                    status: 'pending'
                }));
                const created = await LabTest.insertMany(labRequests);
                const labUsers = await User.find({ role: 'laboratory', status: 'approved' }).select('_id').lean();
                const patientForLab = await Patient.findById(patientId).select('fullName').lean();
                const pName = patientForLab?.fullName || 'Patient';
                for (const u of labUsers) {
                    await Notification.create({
                        userId: u._id,
                        type: 'lab_request',
                        title: 'New Lab Test Request (from Prescription)',
                        message: `Dr. ${doctor.fullName} requested ${labTestsRequested.map(t => t.name).join(', ')} for ${pName}.`,
                        data: { labTestId: created[0]?._id, prescriptionId: prescription._id }
                    });
                }
                console.log(`🧪 Created ${labRequests.length} Laboratory requests from prescription`);
            } catch (labError) {
                console.error('Failed to create LabTest records:', labError);
                // We don't throw here to avoid failing the prescription issuance
            }
        }

        // Increment prescribeCount for each medicine to track popularity
        if (medicines && medicines.length > 0) {
            try {
                const medicineIds = medicines
                    .filter(m => m.medicineId)
                    .map(m => m.medicineId);

                if (medicineIds.length > 0) {
                    await MedicineCatalog.updateMany(
                        { _id: { $in: medicineIds } },
                        { $inc: { prescribeCount: 1 } }
                    );
                    console.log(`📈 Incremented popularity for ${medicineIds.length} medicines`);
                }
            } catch (incError) {
                console.error('Error incrementing medicine popularity:', incError);
                // Don't fail the prescription creation if this fails
            }
        }

        // Generate digital signature (hash of prescriptionId + doctorId + timestamp)
        const signPayload = `${prescription.prescriptionId}-${doctor._id}-${Date.now()}`;
        const digitalSignature = crypto.createHash('sha256').update(signPayload).digest('hex').slice(0, 32).toUpperCase();

        prescription.digitalSignature = digitalSignature;
        prescription.signedAt = new Date();
        await prescription.save();

        // Generate PDF
        const patient = await Patient.findById(patientId);
        if (patient) {
            const { relativePath } = await generatePrescriptionPDF(prescription, doctor, patient);
            prescription.pdfPath = relativePath;
            await prescription.save();
        }

        // Update appointment status if provided
        if (appointmentId) {
            await Appointment.findByIdAndUpdate(appointmentId, { status: 'completed' });
        }

        // Notify patient: prescription available on dashboard
        const patientForNotif = await Patient.findById(patientId).select('userId').lean();
        if (patientForNotif?.userId) {
            await Notification.create({
                userId: patientForNotif.userId,
                type: 'prescription',
                title: 'New Prescription',
                message: `A new prescription from Dr. ${doctor.fullName} is available in your dashboard.`,
                data: { prescriptionId: prescription._id }
            });
        }

        const populated = await Prescription.findById(prescription._id)
            .populate('patientId', 'fullName age gender mobile')
            .populate('doctorId', 'fullName specialization department');

        res.status(201).json(populated);
    } catch (error) {
        console.error('❌ CREATE PRESCRIPTION ERROR:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        // Send meaningful error message
        const errorMessage = error.message || 'Failed to create prescription';
        res.status(500).json({
            message: 'Server error',
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// @desc    Request lab test
// @route   POST /api/doctor/lab-request
// @access  Private/Doctor
exports.requestLabTest = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const { patientId, testType, description } = req.body;

        const labTest = await LabTest.create({
            patientId,
            doctorId: doctor._id,
            testType,
            description
        });

        // Notify all laboratory users about new lab request
        const labUsers = await User.find({ role: 'laboratory', status: 'approved' }).select('_id').lean();
        const patient = await Patient.findById(patientId).select('fullName').lean();
        const patientName = patient?.fullName || 'Patient';
        for (const u of labUsers) {
            await Notification.create({
                userId: u._id,
                type: 'lab_request',
                title: 'New Lab Test Request',
                message: `Dr. ${doctor.fullName} requested ${testType} for ${patientName}.`,
                data: { labTestId: labTest._id }
            });
        }

        res.status(201).json(labTest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get doctor workload analysis (AI)
// @route   GET /api/doctor/workload
// @access  Private/Doctor
exports.getWorkloadAnalysis = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const { daysBack = 7 } = req.query;
        const workload = await aiService.getDoctorWorkloadAnalysis(doctor._id, parseInt(daysBack));
        res.json(workload);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
