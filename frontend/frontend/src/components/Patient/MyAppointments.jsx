import { useState, useEffect } from 'react';
import { appointmentAPI } from '../../services/api';
import './MyAppointments.css';

const MyAppointments = ({ patientId }) => {
    const [appointments, setAppointments] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (patientId) {
            fetchAppointments();
        }
    }, [patientId]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await appointmentAPI.getMyAppointments(patientId);
            setAppointments(response.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAppointment = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) {
            return;
        }

        try {
            await appointmentAPI.cancelAppointment(id);
            setSuccess('Appointment cancelled successfully');
            fetchAppointments();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to cancel appointment');
        }
    };

    const getFilteredAppointments = () => {
        if (filterStatus === 'all') return appointments;

        if (filterStatus === 'upcoming') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return appointments.filter(apt =>
                new Date(apt.appointmentDate) >= today &&
                apt.status === 'scheduled'
            );
        }

        if (filterStatus === 'past') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return appointments.filter(apt =>
                new Date(apt.appointmentDate) < today ||
                ['completed', 'no-show'].includes(apt.status)
            );
        }

        return appointments.filter(apt => apt.status === filterStatus);
    };

    const getStatusBadge = (status) => {
        const badges = {
            scheduled: 'badge-primary',
            'in-progress': 'badge-warning',
            completed: 'badge-success',
            cancelled: 'badge-danger',
            'no-show': 'badge-secondary'
        };
        return badges[status] || 'badge-secondary';
    };

    const getStatusText = (status) => {
        return status.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (time) => {
        return time;
    };

    const canCancel = (appointment) => {
        const aptDate = new Date(appointment.appointmentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return appointment.status === 'scheduled' && aptDate >= today;
    };

    const filteredAppointments = getFilteredAppointments();

    return (
        <div className="my-appointments-container">
            <h1>My Appointments</h1>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={`tab ${filterStatus === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('all')}
                >
                    All
                </button>
                <button
                    className={`tab ${filterStatus === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('upcoming')}
                >
                    Upcoming
                </button>
                <button
                    className={`tab ${filterStatus === 'past' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('past')}
                >
                    Past
                </button>
                <button
                    className={`tab ${filterStatus === 'cancelled' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('cancelled')}
                >
                    Cancelled
                </button>
            </div>

            {/* Appointments List */}
            {loading ? (
                <div className="spinner"></div>
            ) : filteredAppointments.length > 0 ? (
                <div className="appointments-list">
                    {filteredAppointments.map(appointment => (
                        <div key={appointment._id} className="appointment-card">
                            <div className="appointment-header">
                                <div>
                                    <h3>{appointment.doctorId?.fullName}</h3>
                                    <p className="specialization">
                                        {appointment.doctorId?.specialization} - {appointment.doctorId?.department}
                                    </p>
                                </div>
                                <span className={`badge ${getStatusBadge(appointment.status)}`}>
                                    {getStatusText(appointment.status)}
                                </span>
                            </div>

                            <div className="appointment-details">
                                <div className="detail-row">
                                    <span className="icon">📅</span>
                                    <span>{formatDate(appointment.appointmentDate)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="icon">🕐</span>
                                    <span>{formatTime(appointment.slotStartTime)} - {formatTime(appointment.slotEndTime)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="icon">🏥</span>
                                    <span>{appointment.visitType}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="icon">💰</span>
                                    <span>₹{appointment.consultationCharge}</span>
                                </div>
                                {appointment.bookingType === 'walkin' && (
                                    <div className="detail-row">
                                        <span className="icon">🎫</span>
                                        <span>Token #{appointment.tokenNumber}</span>
                                    </div>
                                )}
                            </div>

                            {canCancel(appointment) && (
                                <div className="appointment-actions">
                                    <button
                                        onClick={() => handleCancelAppointment(appointment._id)}
                                        className="btn btn-sm btn-danger"
                                    >
                                        Cancel Appointment
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No Appointments Found</h3>
                    <p>You don't have any {filterStatus !== 'all' ? filterStatus : ''} appointments.</p>
                </div>
            )}
        </div>
    );
};

export default MyAppointments;
