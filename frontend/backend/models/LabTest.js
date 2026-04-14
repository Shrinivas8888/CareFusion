const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
    testId: {
        type: String,
        unique: true,
        default: () => `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    },
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
    testName: {
        type: String,
        required: true
    },
    testCategory: {
        type: String,
        enum: ['blood', 'urine', 'imaging', 'pathology', 'radiology', 'other'],
        default: 'other'
    },
    priority: {
        type: String,
        enum: ['routine', 'urgent', 'stat'], // STAT = immediate
        default: 'routine'
    },
    status: {
        type: String,
        enum: ['requested', 'sample-collected', 'in-progress', 'completed', 'delivered', 'cancelled'],
        default: 'requested'
    },
    // Sample Collection
    sampleCollectedAt: Date,
    sampleCollectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sampleType: String, // blood, urine, tissue, etc.

    // Technician Assignment
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Lab technician
    },
    assignedAt: Date,

    // Testing Timeline
    testingStartedAt: Date,
    testingCompletedAt: Date,
    deliveredAt: Date,

    // Turnaround Time (in hours)
    expectedTAT: Number,
    actualTAT: Number,

    // Results
    results: [{
        parameter: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        },
        unit: String,
        referenceRange: {
            min: String,
            max: String,
            normalRange: String
        },
        isAbnormal: {
            type: Boolean,
            default: false
        },
        flag: {
            type: String,
            enum: ['normal', 'low', 'high', 'critical'],
            default: 'normal'
        }
    }],

    // Report Files
    reportPDF: String, // Path to PDF file
    images: [{
        type: {
            type: String,
            enum: ['xray', 'mri', 'ct-scan', 'ultrasound', 'other']
        },
        url: String,
        description: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Clinical Notes
    clinicalNotes: String, // Doctor's notes/instructions
    technicianNotes: String, // Lab technician's observations
    finalRemarks: String,

    // Verification
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Senior lab technician or pathologist
    },
    verifiedAt: Date,

    // Notifications
    notificationsSent: {
        doctor: {
            sent: Boolean,
            sentAt: Date
        },
        patient: {
            sent: Boolean,
            sentAt: Date
        }
    },

    // Historical Comparison
    previousResults: [{
        testDate: Date,
        parameter: String,
        value: String,
        testId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LabTest'
        }
    }]
}, {
    timestamps: true
});

// Calculate actual TAT when status changes to completed
labTestSchema.pre('save', function (next) {
    if (this.status === 'completed' && this.testingCompletedAt && this.createdAt) {
        const diffMs = this.testingCompletedAt - this.createdAt;
        this.actualTAT = Math.round(diffMs / (1000 * 60 * 60)); // Convert to hours
    }

    // Auto-flag abnormal results
    if (this.results && this.results.length > 0) {
        this.results.forEach(result => {
            if (result.referenceRange && result.referenceRange.min && result.referenceRange.max) {
                const value = parseFloat(result.value);
                const min = parseFloat(result.referenceRange.min);
                const max = parseFloat(result.referenceRange.max);

                if (!isNaN(value) && !isNaN(min) && !isNaN(max)) {
                    if (value < min) {
                        result.isAbnormal = true;
                        result.flag = 'low';
                    } else if (value > max) {
                        result.isAbnormal = true;
                        result.flag = 'high';
                    } else {
                        result.isAbnormal = false;
                        result.flag = 'normal';
                    }
                }
            }
        });
    }

    next();
});

labTestSchema.index({ testId: 1 });
labTestSchema.index({ status: 1 });
labTestSchema.index({ priority: 1 });

module.exports = mongoose.model('LabTest', labTestSchema);
