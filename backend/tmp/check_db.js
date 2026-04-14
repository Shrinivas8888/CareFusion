const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const LabTest = require('../models/LabTest');

dotenv.config({ path: path.join(__dirname, '../.env') });

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        const latestTests = await LabTest.find({ reportPDF: { $ne: null } })
            .sort({ updatedAt: -1 })
            .limit(20)
            .lean();
            
        console.log('--- LATEST LAB TESTS WITH DOCUMENTS ---');
        latestTests.forEach(t => {
            const ext = path.extname(t.reportPDF).toLowerCase();
            console.log(`[${ext}] ID: ${t._id} | Test: ${t.testName} | Path: ${t.reportPDF}`);
        });
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
