import { useState, useEffect } from 'react';
import { availabilityAPI, appointmentAPI } from '../../services/api';
import './BookAppointment.css';

const BookAppointment = ({ patientId }) => {
    const [step, setStep] = useState(1);
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Group doctors by department
    const [departments, setDepartments] = useState([]);

    const consultationCharge = 500; // Default charge for appointments

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const response = await availabilityAPI.getAllDoctorsAvailability();
            const doctorsData = response.data.filter(d => d.hasSchedule);
            setDoctors(doctorsData);

            // Extract unique departments
            const uniqueDepts = [...new Set(doctorsData.map(d => d.department))];
            setDepartments(uniqueDepts);
        } catch (err) {
            console.error(err);
            setError('Failed to load doctors');
        }
    };

    const fetchAvailableSlots = async () => {
        if (!selectedDoctor || !selectedDate) return;

        setLoading(true);
        try {
            const response = await availabilityAPI.getAvailableSlots(selectedDoctor._id, selectedDate);
            setAvailableSlots(response.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load available slots');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (step === 3 && selectedDoctor && selectedDate) {
            fetchAvailableSlots();
        }
    }, [step, selectedDoctor, selectedDate]);

    const handleDoctorSelect = (doctor) => {
        setSelectedDoctor(doctor);
        setStep(2);
    };

    const handleDateSelect = () => {
        if (selectedDate) {
            setStep(3);
        }
    };

    const handleSlotSelect = (slot) => {
        setSelectedSlot(slot);
        setStep(4);
    };

    const handleConfirmBooking = async () => {
        setLoading(true);
        setError('');

        // Debug: Log what we're about to send
        console.log('Patient ID:', patientId);
        console.log('Selected Doctor ID:', selectedDoctor._id);
        console.log('Selected Date:', selectedDate);
        console.log('Selected Slot:', selectedSlot);

        // Validate patientId before sending
        if (!patientId) {
            setError('Patient ID not found. Please log out and log in again.');
            setLoading(false);
            return;
        }

        try {
            const bookingData = {
                doctorId: selectedDoctor._id,
                patientId,
                appointmentDate: selectedDate,
                slotStartTime: selectedSlot.startTime,
                slotEndTime: selectedSlot.endTime,
                bookingType: 'appointment',
                consultationCharge,
                visitType: 'OPD'
            };

            console.log('Booking data being sent:', bookingData);

            await appointmentAPI.bookAppointment(bookingData);
            setSuccess(true);
        } catch (err) {
            console.error('Booking error:', err);
            console.error('Error response:', err.response?.data);
            setError(err.response?.data?.message || 'Failed to book appointment');
        } finally {
            setLoading(false);
        }
    };

    const resetBooking = () => {
        setStep(1);
        setSelectedDoctor(null);
        setSelectedDate('');
        setSelectedSlot(null);
        setAvailableSlots([]);
        setSuccess(false);
        setError('');
    };

    const filterDoctorsByDepartment = (dept) => {
        return doctors.filter(d => d.department === dept);
    };

    if (success) {
        return (
            <div className="success-container">
                <div className="success-icon">✓</div>
                <h2>Appointment Booked Successfully!</h2>
                <div className="success-details">
                    <p><strong>Doctor:</strong> {selectedDoctor.fullName}</p>
                    <p><strong>Specialization:</strong> {selectedDoctor.specialization}</p>
                    <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p><strong>Time:</strong> {selectedSlot.startTime} - {selectedSlot.endTime}</p>
                    <p><strong>Charge:</strong> ₹{consultationCharge}</p>
                </div>
                <div className="success-actions">
                    <button onClick={resetBooking} className="btn btn-primary">
                        Book Another Appointment
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="book-appointment-container">
            <h1>Book Appointment</h1>

            {/* Progress Stepper */}
            <div className="stepper">
                <div className={`step ${step >= 1 ? 'active' : ''}`}>
                    <div className="step-number">1</div>
                    <div className="step-label">Select Doctor</div>
                </div>
                <div className={`step ${step >= 2 ? 'active' : ''}`}>
                    <div className="step-number">2</div>
                    <div className="step-label">Select Date</div>
                </div>
                <div className={`step ${step >= 3 ? 'active' : ''}`}>
                    <div className="step-number">3</div>
                    <div className="step-label">Select Slot</div>
                </div>
                <div className={`step ${step >= 4 ? 'active' : ''}`}>
                    <div className="step-number">4</div>
                    <div className="step-label">Confirm</div>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Step 1: Select Doctor */}
            {step === 1 && (
                <div className="step-content">
                    <h2>Select a Department and Doctor</h2>
                    {departments.map(dept => (
                        <div key={dept} className="department-section">
                            <h3 className="department-name">{dept}</h3>
                            <div className="doctors-grid">
                                {filterDoctorsByDepartment(dept).map(doctor => (
                                    <div
                                        key={doctor._id}
                                        className="doctor-card"
                                        onClick={() => handleDoctorSelect(doctor)}
                                    >
                                        <div className="doctor-icon">👨‍⚕️</div>
                                        <h4>{doctor.fullName}</h4>
                                        <p className="specialization">{doctor.specialization}</p>
                                        <button className="btn btn-sm btn-primary">Select</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Step 2: Select Date */}
            {step === 2 && (
                <div className="step-content">
                    <div className="selected-doctor-summary">
                        <h3>Selected Doctor: {selectedDoctor.fullName}</h3>
                        <p>{selectedDoctor.specialization} - {selectedDoctor.department}</p>
                        <button onClick={() => setStep(1)} className="btn btn-sm btn-secondary">Change Doctor</button>
                    </div>

                    <h2>Select Appointment Date</h2>
                    <div className="date-picker-container">
                        <input
                            type="date"
                            className="date-picker"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className="step-actions">
                        <button onClick={() => setStep(1)} className="btn btn-secondary">Back</button>
                        <button
                            onClick={handleDateSelect}
                            className="btn btn-primary"
                            disabled={!selectedDate}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Select Slot */}
            {step === 3 && (
                <div className="step-content">
                    <div className="selected-summary">
                        <p><strong>Doctor:</strong> {selectedDoctor.fullName}</p>
                        <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
                    </div>

                    <h2>Select Time Slot</h2>
                    {loading ? (
                        <div className="spinner"></div>
                    ) : availableSlots.length > 0 ? (
                        <div className="slots-grid">
                            {availableSlots.map((slot, index) => (
                                <div
                                    key={index}
                                    className={`slot-card ${!slot.isAvailable ? 'booked' : ''}`}
                                    onClick={() => slot.isAvailable && handleSlotSelect(slot)}
                                >
                                    <div className="slot-time">
                                        {slot.startTime} - {slot.endTime}
                                    </div>
                                    <div className="slot-status">
                                        {slot.isAvailable ? (
                                            <span className="status-available">Available</span>
                                        ) : (
                                            <span className="status-booked">Booked</span>
                                        )}
                                    </div>
                                    {slot.isAvailable && (
                                        <div className="slot-capacity">
                                            {slot.maxCapacity - slot.bookedCount} / {slot.maxCapacity} slots
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-slots">No available slots for this date. Please select another date.</p>
                    )}

                    <div className="step-actions">
                        <button onClick={() => setStep(2)} className="btn btn-secondary">Back</button>
                    </div>
                </div>
            )}

            {/* Step 4: Confirm Booking */}
            {step === 4 && (
                <div className="step-content">
                    <h2>Confirm Appointment</h2>
                    <div className="confirmation-card">
                        <div className="confirmation-row">
                            <span className="label">Doctor:</span>
                            <span className="value">{selectedDoctor.fullName}</span>
                        </div>
                        <div className="confirmation-row">
                            <span className="label">Specialization:</span>
                            <span className="value">{selectedDoctor.specialization}</span>
                        </div>
                        <div className="confirmation-row">
                            <span className="label">Date:</span>
                            <span className="value">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="confirmation-row">
                            <span className="label">Time:</span>
                            <span className="value">{selectedSlot.startTime} - {selectedSlot.endTime}</span>
                        </div>
                        <div className="confirmation-row total">
                            <span className="label">Consultation Charge:</span>
                            <span className="value">₹{consultationCharge}</span>
                        </div>
                    </div>

                    <div className="step-actions">
                        <button onClick={() => setStep(3)} className="btn btn-secondary">Back</button>
                        <button
                            onClick={handleConfirmBooking}
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Booking...' : 'Confirm Booking'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookAppointment;
