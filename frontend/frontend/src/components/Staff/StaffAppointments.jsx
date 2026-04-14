import { useState, useEffect } from 'react';
import { appointmentAPI } from '../../services/api';
import '../Doctor/DoctorSchedule.css';

const StaffAppointments = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [updatingId, setUpdatingId] = useState(null);
    const [filterDoctor, setFilterDoctor] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        if (selectedDate) {
            fetchAppointments();
        }
    }, [selectedDate]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            // Fetch all appointments for the selected date
            const response = await appointmentAPI.getAllAppointments({ date: selectedDate });
            setAppointments(response.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (appointmentId, newStatus) => {
        setUpdatingId(appointmentId);
        setError('');
        try {
            await appointmentAPI.updateAppointmentStatus(appointmentId, newStatus);
            setSuccess(`Status updated to ${newStatus}`);
            fetchAppointments();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            scheduled: 'badge-primary',
            'in-progress': 'badge-warning',
            completed: 'badge-success',
            'no-show': 'badge-danger'
        };
        return badges[status] || 'badge-secondary';
    };

    const getBookingTypeBadge = (type) => {
        return type === 'walkin' ? 'badge-walkin' : 'badge-appointment';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getFilteredAppointments = () => {
        return appointments.filter(apt => {
            const doctorMatch = filterDoctor === 'all' || apt.doctorId?._id === filterDoctor;
            const statusMatch = filterStatus === 'all' || apt.status === filterStatus;
            return doctorMatch && statusMatch;
        });
    };

    const getStats = () => {
        const filtered = getFilteredAppointments();
        const total = filtered.length;
        const completed = filtered.filter(a => a.status === 'completed').length;
        const inProgress = filtered.filter(a => a.status === 'in-progress').length;
        const scheduled = filtered.filter(a => a.status === 'scheduled').length;
        const noShow = filtered.filter(a => a.status === 'no-show').length;
        const walkIns = filtered.filter(a => a.bookingType === 'walkin').length;

        return { total, completed, inProgress, scheduled, noShow, walkIns };
    };

    const stats = getStats();
    const filteredAppointments = getFilteredAppointments();

    // Get unique doctors for filter
    const doctors = [...new Map(appointments.map(a => [a.doctorId?._id, a.doctorId])).values()].filter(Boolean);

    return (
        <div className="doctor-schedule-container">
            <div className="schedule-header">
                <div>
                    <h1>Appointment Management</h1>
                    <p className="subtitle">{formatDate(selectedDate)}</p>
                </div>
                <div className="date-selector">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="date-input"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="filters-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                    <label htmlFor="doctorFilter" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                        Filter by Doctor
                    </label>
                    <select
                        id="doctorFilter"
                        value={filterDoctor}
                        onChange={(e) => setFilterDoctor(e.target.value)}
                        className="input"
                        style={{ width: '100%' }}
                    >
                        <option value="all">All Doctors</option>
                        {doctors.map(doctor => (
                            <option key={doctor._id} value={doctor._id}>
                                Dr. {doctor.fullName} - {doctor.specialization}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label htmlFor="statusFilter" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                        Filter by Status
                    </label>
                    <select
                        id="statusFilter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="input"
                        style={{ width: '100%' }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="no-show">No Show</option>
                    </select>
                </div>
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            {/* Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total</div>
                </div>
                <div className="stat-card scheduled">
                    <div className="stat-value">{stats.scheduled}</div>
                    <div className="stat-label">Scheduled</div>
                </div>
                <div className="stat-card in-progress">
                    <div className="stat-value">{stats.inProgress}</div>
                    <div className="stat-label">In Progress</div>
                </div>
                <div className="stat-card completed">
                    <div className="stat-value">{stats.completed}</div>
                    <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card no-show">
                    <div className="stat-value">{stats.noShow}</div>
                    <div className="stat-label">No Show</div>
                </div>
                <div className="stat-card walkins">
                    <div className="stat-value">{stats.walkIns}</div>
                    <div className="stat-label">Walk-ins</div>
                </div>
            </div>

            {/* Appointments List */}
            {loading ? (
                <div className="spinner"></div>
            ) : filteredAppointments.length > 0 ? (
                <div className="appointments-timeline">
                    {filteredAppointments.map((appointment) => (
                        <div key={appointment._id} className={`timeline-item ${appointment.status}`}>
                            <div className="timeline-time">
                                <div className="time-slot">
                                    {appointment.slotStartTime}
                                </div>
                                <div className="time-duration">
                                    {appointment.slotStartTime} - {appointment.slotEndTime}
                                </div>
                            </div>

                            <div className="timeline-content">
                                <div className="appointment-info">
                                    <div className="patient-header">
                                        <h3>{appointment.patientId?.fullName || 'Patient'}</h3>
                                        <div className="badges">
                                            <span className={`badge ${getBookingTypeBadge(appointment.bookingType)}`}>
                                                {appointment.bookingType === 'walkin'
                                                    ? `Walk-in #${appointment.tokenNumber}`
                                                    : 'Appointment'}
                                            </span>
                                            <span className={`badge ${getStatusBadge(appointment.status)}`}>
                                                {appointment.status.replace('-', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="patient-details">
                                        <div className="detail-item">
                                            <span className="icon">👨‍⚕️</span>
                                            <span>Dr. {appointment.doctorId?.fullName || 'Unknown'}</span>
                                        </div>
                                        {appointment.patientId?.mobile && (
                                            <div className="detail-item">
                                                <span className="icon">📞</span>
                                                <span>{appointment.patientId.mobile}</span>
                                            </div>
                                        )}
                                        {appointment.patientId?.age && (
                                            <div className="detail-item">
                                                <span className="icon">🎂</span>
                                                <span>{appointment.patientId.age} years</span>
                                            </div>
                                        )}
                                        {appointment.patientId?.gender && (
                                            <div className="detail-item">
                                                <span className="icon">👤</span>
                                                <span>{appointment.patientId.gender}</span>
                                            </div>
                                        )}
                                        <div className="detail-item">
                                            <span className="icon">💰</span>
                                            <span>₹{appointment.consultationCharge}</span>
                                        </div>
                                    </div>

                                    {/* Status Action Buttons */}
                                    {appointment.status !== 'completed' && appointment.status !== 'no-show' && (
                                        <div className="action-buttons">
                                            {appointment.status === 'scheduled' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(appointment._id, 'in-progress')}
                                                    className="btn btn-sm btn-primary"
                                                    disabled={updatingId === appointment._id}
                                                >
                                                    {updatingId === appointment._id ? '...' : 'Start'}
                                                </button>
                                            )}
                                            {appointment.status === 'in-progress' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                                                    className="btn btn-sm btn-success"
                                                    disabled={updatingId === appointment._id}
                                                >
                                                    {updatingId === appointment._id ? '...' : 'Complete'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleStatusUpdate(appointment._id, 'no-show')}
                                                className="btn btn-sm btn-danger"
                                                disabled={updatingId === appointment._id}
                                            >
                                                {updatingId === appointment._id ? '...' : 'No Show'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <h3>No Appointments</h3>
                    <p>No appointments scheduled for this date.</p>
                </div>
            )}
        </div>
    );
};

export default StaffAppointments;
