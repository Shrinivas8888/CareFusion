const express = require('express');
const router = express.Router();

const {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    approveUser,
    blockUser,
    changeUserRole
} = require('../controllers/adminUserController');

const {
    createDepartment,
    getDepartments,
    updateDepartment,
    assignDoctorToDepartment,
    assignStaffToDepartment,
    getDepartmentPerformance
} = require('../controllers/adminDepartmentController');

const {
    getDashboardOverview,
    getAppointmentStatistics,
    getRevenueByDepartment,
    getDoctorPerformance,
    getPatientGrowth,
    getSystemHealth
} = require('../controllers/adminAnalyticsController');

const {
    getAuditLogs,
    getSecurityAlerts,
    getLoginTracking,
    getHospitalConfig,
    updateHospitalConfig
} = require('../controllers/adminAuditController');

const { protect, authorize } = require('../middleware/auth');

// All routes require admin authorization
router.use(protect);
router.use((req, res, next) => {
    console.log(`🔍 Admin route accessed: ${req.method} ${req.originalUrl}`);
    next();
});
router.use(authorize('admin'));

// ========== User Management ==========
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/approve', approveUser);
router.put('/users/:id/block', blockUser);
router.put('/users/:id/role', changeUserRole);

// ========== Department Management ==========
router.post('/departments', createDepartment);
router.get('/departments', getDepartments);
router.put('/departments/:id', updateDepartment);
router.put('/departments/:id/assign-doctor', assignDoctorToDepartment);
router.put('/departments/:id/assign-staff', assignStaffToDepartment);
router.get('/departments/:id/performance', getDepartmentPerformance);

// ========== Analytics Dashboard ==========
router.get('/analytics/dashboard', getDashboardOverview);
router.get('/analytics/appointments', getAppointmentStatistics);
router.get('/analytics/revenue-by-department', getRevenueByDepartment);
router.get('/analytics/doctor-performance', getDoctorPerformance);
router.get('/analytics/patient-growth', getPatientGrowth);
router.get('/analytics/system-health', getSystemHealth);

// ========== Audit Logs ==========
router.get('/audit-logs', getAuditLogs);
router.get('/audit-logs/security-alerts', getSecurityAlerts);
router.get('/audit-logs/login-tracking', getLoginTracking);

// ========== Hospital Configuration ==========
router.get('/config', getHospitalConfig);
router.put('/config', updateHospitalConfig);

module.exports = router;
