import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentAPI, doctorAPI } from '../../services/api';
import ConsultationModal from './ConsultationModal';
import './DoctorSchedule.css';

const DoctorSchedule = ({ doctorId }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [updatingId, setUpdatingId] = useState(null);
    const [consultationAppointment, setConsultationAppointment] = useState(null);

    useEffect(() => {
        if (doctorId && selectedDate) {
            fetchSchedule();
        }
    }, [doctorId, selectedDate]);

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const response = await appointmentAPI.getDoctorSchedule(doctorId, selectedDate);
            setAppointments(response.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load schedule');
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
            fetchSchedule();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const handlePrescriptionSubmit = async (prescriptionData) => {
        setLoading(true);
        setError('');
        try {
            await doctorAPI.createPrescription(prescriptionData);
            setSuccess('Prescription issued successfully!');
            setConsultationAppointment(null);
            fetchSchedule();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            console.error('Prescription error:', err);
            setError(err.response?.data?.message || 'Failed to issue prescription');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            scheduled: 'badge-primary',
            'in-progress': 'badge-warning',
            completed: 'badge-success',
            'no-show': 'badge-danger',
            reschedule_required: 'badge-danger',
            cancelled: 'badge-secondary'
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

    const getStats = () => {
        const total = appointments.length;
        const completed = appointments.filter(a => a.status === 'completed').length;
        const inProgress = appointments.filter(a => a.status === 'in-progress').length;
        const scheduled = appointments.filter(a => a.status === 'scheduled').length;
        const noShow = appointments.filter(a => a.status === 'no-show').length;
        const walkIns = appointments.filter(a => a.bookingType === 'walkin').length;

        return { total, completed, inProgress, scheduled, noShow, walkIns };
    };

    const stats = getStats();

    return (
        <div className="doctor-schedule-container">
            <div className="schedule-header">
                <div>
                    <h1>Today's Schedule</h1>
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
            ) : appointments.length > 0 ? (
                <div className="appointments-timeline">
                    {appointments.map((appointment) => (
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
                                        <Link to={`/doctor/patient/${appointment.patientId?._id}`} className="btn btn-sm btn-info" style={{ marginRight: '0.5rem' }}>View EMR</Link>
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
                                                <>
                                                    <button
                                                        onClick={() => setConsultationAppointment(appointment)}
                                                        className="btn btn-sm btn-primary"
                                                        style={{ background: '#4361ee', marginRight: '0.5rem' }}
                                                    >
                                                        🩺 Start Consultation
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                                                        className="btn btn-sm btn-success"
                                                        disabled={updatingId === appointment._id}
                                                    >
                                                        {updatingId === appointment._id ? '...' : 'Complete'}
                                                    </button>
                                                </>
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

            {/* Consultation Modal */}
            {consultationAppointment && (
                <ConsultationModal
                    appointment={consultationAppointment}
                    onClose={() => setConsultationAppointment(null)}
                    onPrescriptionSubmit={handlePrescriptionSubmit}
                />
            )}
        </div>
    );
};

export default DoctorSchedule;
