const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const qrCodeService = require('../services/qrCodeService');
const emailService = require('../services/emailService');

// @desc    Generate QR code for existing prescription
// @route   POST /api/patient/prescriptions/:id/generate-qr
// @access  Private/Patient
exports.generatePrescriptionQR = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });

        const prescription = await Prescription.findOne({
            _id: req.params.id,
            patientId: patient._id
        });

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // Generate QR code
        const { qrCode, verificationCode } = await qrCodeService.generatePrescriptionQR(prescription);

        // Update prescription
        prescription.qrCode = qrCode;
        prescription.verificationCode = verificationCode;
        await prescription.save();

        res.json({
            message: 'QR code generated successfully',
            qrCode,
            shareableLink: qrCodeService.generateShareableLink(prescription.prescriptionId, verificationCode)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Share prescription via email
// @route   POST /api/patient/prescriptions/:id/share
// @access  Private/Patient
exports.sharePrescription = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const prescription = await Prescription.findOne({
            _id: req.params.id,
            patientId: patient._id
        }).populate('doctorId', 'fullName specialization');

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // Generate QR if not already generated
        if (!prescription.qrCode || !prescription.verificationCode) {
            const { qrCode, verificationCode } = await qrCodeService.generatePrescriptionQR(prescription);
            prescription.qrCode = qrCode;
            prescription.verificationCode = verificationCode;
            await prescription.save();
        }

        const shareableLink = qrCodeService.generateShareableLink(
            prescription.prescriptionId,
            prescription.verificationCode
        );

        // Send email with prescription link
        const mailOptions = {
            from: `"Hospital Management System" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Prescription Shared With You',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Prescription Shared</h2>
                    <p>${patient.fullName} has shared a prescription with you.</p>
                    <p><strong>Doctor:</strong> Dr. ${prescription.doctorId.fullName}</p>
                    <p><strong>Specialization:</strong> ${prescription.doctorId.specialization}</p>
                    <p><strong>Date:</strong> ${new Date(prescription.createdAt).toLocaleDateString()}</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${shareableLink}" 
                           style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            View Prescription
                        </a>
                    </div>
                    <p style="color: #666;">Or copy this link: ${shareableLink}</p>
                </div>
            `
        };

        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail(mailOptions);

        // Track shared emails
        if (!prescription.sharedWith) {
            prescription.sharedWith = [];
        }
        prescription.sharedWith.push({ email, sharedAt: new Date() });
        await prescription.save();

        res.json({
            message: 'Prescription shared successfully via email',
            sharedWith: email
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get patient's medical history (EMR Dashboard)
// @route   GET /api/patient/emr/history
// @access  Private/Patient
exports.getMedicalHistory = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        // Get all prescriptions
        const prescriptions = await Prescription.find({ patientId: patient._id })
            .populate('doctorId', 'fullName specialization')
            .sort({ createdAt: -1 })
            .limit(20);

        // Get all lab tests
        const LabTest = require('../models/LabTest');
        const labTests = await LabTest.find({ patientId: patient._id })
            .populate('doctorId', 'fullName')
            .sort({ createdAt: -1 })
            .limit(20);

        // Get all appointments
        const Appointment = require('../models/Appointment');
        const appointments = await Appointment.find({ patientId: patient._id })
            .populate('doctorId', 'fullName specialization')
            .sort({ appointmentDate: -1 })
            .limit(20);

        res.json({
            patient: {
                name: patient.fullName,
                age: patient.age,
                gender: patient.gender,
                bloodGroup: patient.bloodGroup,
                allergies: patient.allergies || [],
                chronicDiseases: patient.chronicDiseases || []
            },
            prescriptions,
            labTests,
            appointments,
            totalRecords: {
                prescriptions: prescriptions.length,
                labTests: labTests.length,
                appointments: appointments.length
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get health summary dashboard
// @route   GET /api/patient/emr/health-summary
// @access  Private/Patient
exports.getHealthSummary = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        // Calculate health metrics
        const summary = {
            personalInfo: {
                name: patient.fullName,
                age: patient.age,
                gender: patient.gender,
                bloodGroup: patient.bloodGroup
            },
            allergies: patient.allergies || [],
            chronicDiseases: patient.chronicDiseases || [],
            vaccinations: patient.vaccinations || [],
            insurance: patient.insuranceDetails || null,
            emergencyContacts: patient.emergencyContacts || [],
            familyMembers: patient.familyMembers?.length || 0,
            riskFactors: []
        };

        // Calculate risk factors
        if (patient.chronicDiseases?.length > 0) {
            const severeConditions = patient.chronicDiseases.filter(d => d.severity === 'severe');
            if (severeConditions.length > 0) {
                summary.riskFactors.push({
                    type: 'chronic_disease',
                    level: 'high',
                    message: `${severeConditions.length} severe chronic condition(s)`
                });
            }
        }

        if (patient.allergies?.length > 0) {
            const severeAllergies = patient.allergies.filter(a => a.severity === 'severe');
            if (severeAllergies.length > 0) {
                summary.riskFactors.push({
                    type: 'allergy',
                    level: 'high',
                    message: `${severeAllergies.length} severe allergy(ies)`
                });
            }
        }

        res.json(summary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// All functions already exported via exports.functionName above