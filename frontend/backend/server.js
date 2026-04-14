const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const createDefaultAdmin = require('./utils/createDefaultAdmin');

// Load environment variables
dotenv.config();

// Connect to MongoDB and create default admin
connectDB().then(() => {
    createDefaultAdmin();
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded reports)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/pharmacy', require('./routes/pharmacy'));
app.use('/api/laboratory', require('./routes/laboratory'));
app.use('/api/availability', require('./routes/availability'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/lab-tests', require('./routes/labTests'));
app.use('/api/diagnostic-tests', require('./routes/diagnosticTestRoutes'));
app.use('/api/public', require('./routes/public')); // Public routes (no auth required)

// Welcome route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to CareFusion Hospital Management System API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
