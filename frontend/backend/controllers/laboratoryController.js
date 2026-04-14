const LabTest = require('../models/LabTest');
const Laboratory = require('../models/Laboratory');
const { createLabReportNotification } = require('./notificationController');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/lab-reports');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// @desc    Get lab test requests
// @route   GET /api/laboratory/tests
// @access  Private/Laboratory
exports.getLabTests = async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};

        const labTests = await LabTest.find(query)
            .populate('patientId', 'fullName age gender mobile')
            .populate('doctorId', 'fullName specialization')
            .sort({ requestedDate: -1 });

        res.json(labTests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update lab test status
// @route   PUT /api/laboratory/test/:id
// @access  Private/Laboratory
exports.updateLabTestStatus = async (req, res) => {
    try {
        const laboratory = await Laboratory.findOne({ userId: req.user._id });

        if (!laboratory) {
            return res.status(404).json({ message: 'Laboratory profile not found' });
        }

        const { status, notes } = req.body;

        const labTest = await LabTest.findByIdAndUpdate(
            req.params.id,
            {
                status,
                notes,
                processedBy: laboratory._id,
                ...(status === 'completed' && { completedDate: new Date() })
            },
            { new: true }
        )
            .populate('patientId', 'fullName age gender mobile')
            .populate('doctorId', 'fullName specialization');

        if (!labTest) {
            return res.status(404).json({ message: 'Lab test not found' });
        }

        res.json(labTest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Upload lab report
// @route   POST /api/laboratory/upload-report/:id
// @access  Private/Laboratory
exports.uploadReport = async (req, res) => {
    try {
        const laboratory = await Laboratory.findOne({ userId: req.user._id });

        if (!laboratory) {
            return res.status(404).json({ message: 'Laboratory profile not found' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a PDF file' });
        }

        const labTest = await LabTest.findByIdAndUpdate(
            req.params.id,
            {
                reportFile: req.file.path,
                status: 'completed',
                completedDate: new Date(),
                processedBy: laboratory._id
            },
            { new: true }
        )
            .populate('patientId', 'fullName age gender mobile')
            .populate('doctorId', 'fullName specialization');

        if (!labTest) {
            return res.status(404).json({ message: 'Lab test not found' });
        }

        await createLabReportNotification(labTest);

        res.json(labTest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// All functions already exported via exports.functionName above