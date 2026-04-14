import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle error responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't redirect on 401 for login/register - let the form show the error
        const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
        // Don't redirect on 401 for /auth/me - let AuthContext handle it (avoids flash "unauthorized" on refresh)
        const isGetMe = error.config?.url?.includes('/auth/me');

        if (error.response?.status === 401 && !isAuthRequest && !isGetMe) {
            // Only redirect if we're sure the token is invalid
            // Don't redirect on network errors or server errors (5xx)
            if (error.response?.data?.message?.toLowerCase().includes('token') ||
                error.response?.data?.message?.toLowerCase().includes('invalid') ||
                error.response?.data?.message?.toLowerCase().includes('expired')) {
                console.log('Token invalid, clearing local storage and redirecting to login');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Public API (no authentication required)
export const publicAPI = {
    getDoctors: () => api.get('/public/doctors'),
};

// Auth API
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (data) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
};

// Patient API
export const patientAPI = {
    getAppointments: () => api.get('/patient/appointments'),
    bookAppointment: (data) => api.post('/patient/appointments', data),
    getPrescriptions: () => api.get('/patient/prescriptions'),
    downloadPrescriptionPDF: (id) => api.get(`/patient/prescriptions/${id}/download`, { responseType: 'blob' }),
    getLabReports: () => api.get('/patient/lab-reports'),
    getProfile: () => api.get('/patient/profile'),
    updateProfile: (data) => api.put('/patient/profile', data),
};

// Doctor API
export const doctorAPI = {
    getAppointments: (date) => api.get('/doctor/appointments', { params: { date } }),
    getUpcomingAppointments: (days = 7) => api.get('/doctor/appointments/upcoming', { params: { days } }),
    getPatientEMR: (id) => api.get(`/doctor/patient/${id}`),
    createPrescription: (data) => api.post('/doctor/prescription', data),
    requestLabTest: (data) => api.post('/doctor/lab-request', data),
};

// Staff API
export const staffAPI = {
    getDailyQueue: (date) => api.get('/staff/queue', { params: { date } }),
    addToQueue: (data) => api.post('/staff/queue', data),
    updateQueueStatus: (id, status) => api.put(`/staff/queue/${id}`, { status }),
    getAppointments: (date) => api.get('/staff/appointments', { params: { date } }),
    bookAppointment: (data) => api.post('/staff/appointment', data),
    getPatients: () => api.get('/staff/patients'),
    getDoctors: () => api.get('/staff/doctors'),
};

// Pharmacy API
export const pharmacyAPI = {
    getPrescriptions: (status) => api.get('/pharmacy/prescriptions', { params: status ? { status } : {} }),
    updatePrescriptionStatus: (id, status) => api.put(`/pharmacy/prescriptions/${id}/status`, { status }),
    dispensePrescription: (id) => api.put(`/pharmacy/dispense/${id}`),
    getInventory: () => api.get('/pharmacy/inventory'),
    addMedicine: (data) => api.post('/pharmacy/inventory', data),
    updateInventory: (id, data) => api.put(`/pharmacy/inventory/${id}`, data),
    getSalesReport: (startDate, endDate) => api.get('/pharmacy/sales-report', { params: startDate && endDate ? { startDate, endDate } : {} }),
};

// Laboratory API
export const laboratoryAPI = {
    getLabTests: (status) => api.get('/laboratory/tests', { params: { status } }),
    updateLabTestStatus: (id, data) => api.put(`/laboratory/test/${id}`, data),
    uploadReport: (id, file) => {
        const formData = new FormData();
        formData.append('report', file);
        return api.post(`/laboratory/upload-report/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// Admin API
export const adminAPI = {
    getPendingUsers: () => api.get('/admin/pending-users'),
    approveUser: (id, status) => api.put(`/admin/approve-user/${id}`, { status }),
    createUser: (data) => api.post('/admin/create-user', data),
    getAnalytics: () => api.get('/admin/analytics'),
    getUsersByRole: (role) => api.get(`/admin/users/${role}`),
    getUserCounts: () => api.get('/admin/user-counts'),
    getUserDetails: (id) => api.get(`/admin/user/${id}`),
    blockUser: (id) => api.put(`/admin/block-user/${id}`),
    deleteUser: (id) => api.delete(`/admin/delete-user/${id}`),
};

// Availability API (Doctor Schedule Management)
export const availabilityAPI = {
    setDoctorAvailability: (data) => api.post('/availability/set-schedule', data),
    getDoctorAvailability: (doctorId) => api.get(`/availability/doctor/${doctorId}`),
    getAvailableSlots: (doctorId, date) => api.get('/availability/slots', { params: { doctorId, date } }),
    getAISuggestedSlots: (doctorId, date) => api.get('/availability/ai-slots', { params: { doctorId, date } }),
    blockSlots: (data) => api.post('/availability/block-slots', data),
    unblockSlots: (id) => api.delete(`/availability/block-slots/${id}`),
    getBlockedSlots: (doctorId) => api.get(`/availability/blocked-slots/${doctorId}`),
    getAllDoctorsAvailability: () => api.get('/availability/all-doctors'),
    // Doctor self-service: manage own availability
    blockMySlots: (data) => api.post('/availability/my-block', data),
    getMyBlockedSlots: () => api.get('/availability/my-blocked-slots'),
    unblockMySlot: (id) => api.delete(`/availability/my-blocked-slots/${id}`),
};

// Feedback API
export const feedbackAPI = {
    submitFeedback: (data) => api.post('/feedback', data),
};

// Appointment API
export const appointmentAPI = {
    bookAppointment: (data) => api.post('/appointments/book', data),
    getMyAppointments: (patientId) => api.get('/appointments/my-appointments', { params: { patientId } }),
    getDoctorSchedule: (doctorId, date) => api.get('/appointments/doctor-schedule', { params: { doctorId, date } }),
    cancelAppointment: (id) => api.put(`/appointments/cancel/${id}`),
    rescheduleAppointment: (id, data) => api.put(`/appointments/reschedule/${id}`, data),
    updateAppointmentStatus: (id, status) => api.put(`/appointments/status/${id}`, { status }),
    getAllAppointments: (params) => api.get('/appointments/all', { params }),
};

// Diagnostic Test API
export const diagnosticTestAPI = {
    searchTests: (query, limit = 10) => api.get(`/lab-tests/search`, { params: { q: query, limit } }),
    getAllTests: (page = 1, limit = 20, category = '') => api.get('/lab-tests', { params: { page, limit, category } }),
    getCategories: () => api.get('/lab-tests/categories'),
    getTestById: (id) => api.get(`/lab-tests/${id}`),
};

export default api;
