import { Routes, Route, Link, useParams } from 'react-router-dom';
import Navbar from '../Shared/Navbar';
import Sidebar from '../Shared/Sidebar';
import '../Patient/PatientDashboard.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorAPI, appointmentAPI, availabilityAPI } from '../../services/api';
import DoctorSchedule from './DoctorSchedule';
import DoctorAvailabilityManage from './DoctorAvailabilityManage';

const DoctorDashboard = () => {
    const { user } = useAuth();
    const doctorId = user?.profile?._id || user?.id;

    const sidebarLinks = [
        { to: '/doctor', label: 'Dashboard' },
        { to: '/doctor/schedule', label: 'My Schedule' },
        { to: '/doctor/availability', label: 'Manage Availability' },
        { to: '/doctor/prescriptions', label: 'Create Prescription' },
        { to: '/doctor/lab-requests', label: 'Request Lab Test' },
    ];

    return (
        <div>
            <Navbar />
            <div className="dashboard-layout">
                <Sidebar links={sidebarLinks} />
                <main className="dashboard-main">
                    <Routes>
                        <Route index element={<DoctorHome doctorId={doctorId} />} />
                        <Route path="schedule" element={<DoctorSchedule doctorId={doctorId} />} />
                        <Route path="availability" element={<DoctorAvailabilityManage />} />
                        <Route path="prescriptions" element={<CreatePrescription doctorId={doctorId} />} />
                        <Route path="lab-requests" element={<LabRequests doctorId={doctorId} />} />
                        <Route path="patient/:id" element={<PatientEMR />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

const DoctorHome = ({ doctorId }) => {
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            if (!doctorId) {
                setLoading(false);
                return;
            }
            try {
                const today = new Date().toISOString().split('T')[0];
                const [todayRes, upcomingRes] = await Promise.all([
                    doctorAPI.getAppointments(today),
                    doctorAPI.getUpcomingAppointments(7)
                ]);
                setTodayAppointments(todayRes.data || []);
                setUpcomingAppointments(upcomingRes.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [doctorId]);

    if (loading) return <div className="spinner"></div>;

    const todayStats = {
        total: todayAppointments.length,
        scheduled: todayAppointments.filter(a => a.status === 'scheduled').length,
        inProgress: todayAppointments.filter(a => a.status === 'in-progress').length,
        completed: todayAppointments.filter(a => a.status === 'completed').length,
    };
    const upcomingOnly = upcomingAppointments.filter(a => {
        const d = new Date(a.appointmentDate).toISOString().split('T')[0];
        return d !== new Date().toISOString().split('T')[0];
    });

    const getStatusBadge = (status) => {
        const map = { scheduled: 'info', 'in-progress': 'warning', completed: 'success', reschedule_required: 'danger', cancelled: 'secondary', 'no-show': 'secondary' };
        return `badge-${map[status] || 'secondary'}`;
    };

    return (
        <div>
            <h1 className="mb-lg">Doctor Dashboard</h1>
            <div className="grid grid-3">
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Today&apos;s Appointments</h3>
                    <p className="text-4xl font-bold">{todayStats.total}</p>
                </div>
                <div className="card" style={{ backgroundColor: '#dbeafe', borderColor: '#3b82f6' }}>
                    <h3 className="text-gray-600 mb-sm">Pending</h3>
                    <p className="text-4xl font-bold">{todayStats.scheduled}</p>
                </div>
                <div className="card" style={{ backgroundColor: '#d1fae5', borderColor: '#10b981' }}>
                    <h3 className="text-gray-600 mb-sm">Completed</h3>
                    <p className="text-4xl font-bold">{todayStats.completed}</p>
                </div>
            </div>

            {todayAppointments.length > 0 && (
                <div className="card mt-lg">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Daily Appointment Schedule (Today)</h3>
                        <Link to="/doctor/schedule" className="btn btn-primary">View Full Schedule</Link>
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Patient</th>
                                <th>Contact</th>
                                <th>Type</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todayAppointments.slice(0, 5).map((apt) => (
                                <tr key={apt._id}>
                                    <td><strong>{apt.slotStartTime || apt.timeSlot}</strong></td>
                                    <td>{apt.patientId?.fullName}</td>
                                    <td>{apt.patientId?.mobile}</td>
                                    <td>
                                        <span className={`badge ${apt.bookingType === 'walkin' ? 'badge-info' : 'badge-primary'}`}>
                                            {apt.bookingType === 'walkin' ? `Walk-in #${apt.tokenNumber}` : 'Appointment'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(apt.status)}`}>
                                            {apt.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {todayAppointments.length > 5 && (
                        <p className="text-sm text-gray-500" style={{ marginTop: '1rem', textAlign: 'center' }}>
                            Showing 5 of {todayAppointments.length} appointments
                        </p>
                    )}
                </div>
            )}

            {upcomingOnly.length > 0 && (
                <div className="card mt-lg">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Upcoming Consultations (Next 7 Days)</h3>
                        <Link to="/doctor/schedule" className="btn btn-secondary">My Schedule</Link>
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Patient</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {upcomingOnly.slice(0, 8).map((apt) => (
                                <tr key={apt._id}>
                                    <td>{new Date(apt.appointmentDate).toLocaleDateString()}</td>
                                    <td><strong>{apt.slotStartTime}</strong></td>
                                    <td>{apt.patientId?.fullName}</td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(apt.status)}`}>
                                            {apt.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {upcomingOnly.length > 8 && (
                        <p className="text-sm text-gray-500" style={{ marginTop: '1rem', textAlign: 'center' }}>
                            Showing 8 of {upcomingOnly.length} upcoming
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

const PatientEMR = () => {
    const { id } = useParams();
    const [emr, setEmr] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            doctorAPI.getPatientEMR(id)
                .then(res => setEmr(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <div className="spinner"></div>;
    if (!emr) return <p>Patient not found</p>;

    const { patient, prescriptions, labTests, appointments } = emr;

    return (
        <div>
            <Link to="/doctor/schedule" className="btn btn-secondary mb-lg">← Back to Schedule</Link>
            <h1 className="mb-lg">Patient EMR - {patient?.fullName}</h1>
            <div className="card mb-lg">
                <h3>Demographics</h3>
                <p><strong>Age:</strong> {patient?.age} | <strong>Gender:</strong> {patient?.gender} | <strong>Blood:</strong> {patient?.bloodGroup || '—'} | <strong>Contact:</strong> {patient?.mobile}</p>
                <p><strong>Address:</strong> {patient?.address || '—'}</p>
            </div>
            <div className="grid grid-2">
                <div className="card">
                    <h3>Previous Prescriptions ({prescriptions?.length || 0})</h3>
                    <p className="text-gray-600 text-sm mb-sm">Medical history — prescriptions issued</p>
                    {prescriptions?.length > 0 ? prescriptions.map((rx) => (
                        <div key={rx._id} className="mb-md" style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                            <p><strong>{new Date(rx.createdAt).toLocaleDateString()}</strong> - {rx.diagnosis}</p>
                            <p className="text-sm">{rx.medicines?.map(m => m.name).join(', ')}</p>
                        </div>
                    )) : <p className="text-gray-500">No prescriptions</p>}
                </div>
                <div className="card">
                    <h3>Lab Reports ({labTests?.length || 0})</h3>
                    <p className="text-gray-600 text-sm mb-sm">Lab reports and test results</p>
                    {labTests?.length > 0 ? labTests.map((t) => (
                        <div key={t._id} className="mb-md" style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                            <p><strong>{t.testType}</strong> - {t.status} ({new Date(t.requestedDate).toLocaleDateString()})</p>
                        </div>
                    )) : <p className="text-gray-500">No lab tests</p>}
                </div>
            </div>
            <div className="card mt-lg">
                <h3>Medical History (Appointment History)</h3>
                <p className="text-gray-600 text-sm mb-sm">Past and upcoming visits</p>
                {appointments?.length > 0 ? (
                    <table className="table">
                        <thead><tr><th>Date</th><th>Doctor</th><th>Status</th></tr></thead>
                        <tbody>
                            {appointments.map((a) => (
                                <tr key={a._id}>
                                    <td>{new Date(a.appointmentDate).toLocaleDateString()}</td>
                                    <td>Dr. {a.doctorId?.fullName}</td>
                                    <td><span className={`badge badge-${a.status === 'completed' ? 'success' : a.status === 'reschedule_required' ? 'danger' : 'info'}`}>{a.status?.replace('_', ' ')}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-gray-500">No appointments</p>}
            </div>
        </div>
    );
};

const CreatePrescription = ({ doctorId }) => {
    const [formData, setFormData] = useState({ patientId: '', appointmentId: '', diagnosis: '', notes: '', medicines: [{ name: '', dosage: '', duration: '', instructions: '' }] });
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (doctorId) {
            const today = new Date().toISOString().split('T')[0];
            appointmentAPI.getDoctorSchedule(doctorId, today).then(r => setAppointments(r.data || [])).catch(() => { });
        }
    }, [doctorId]);

    const addMedicine = () => setFormData(f => ({ ...f, medicines: [...f.medicines, { name: '', dosage: '', duration: '', instructions: '' }] }));
    const updateMedicine = (i, field, val) => {
        const m = [...formData.medicines]; m[i] = { ...m[i], [field]: val }; setFormData(f => ({ ...f, medicines: m }));
    };
    const removeMedicine = (i) => setFormData(f => ({ ...f, medicines: f.medicines.filter((_, idx) => idx !== i) }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.patientId || !formData.diagnosis || formData.medicines.some(m => !m.name || !m.dosage || !m.duration)) {
            alert('Please fill required fields');
            return;
        }
        setLoading(true);
        try {
            console.log('📝 Creating prescription...', {
                patientId: formData.patientId,
                appointmentId: formData.appointmentId,
                diagnosis: formData.diagnosis,
                medicinesCount: formData.medicines.length
            });

            await doctorAPI.createPrescription({
                patientId: formData.patientId,
                appointmentId: formData.appointmentId || undefined,
                diagnosis: formData.diagnosis,
                notes: formData.notes,
                medicines: formData.medicines.filter(m => m.name),
                labTestsRequested: [] // Required by backend, even if empty
            });

            console.log('✅ Prescription created successfully!');
            setSuccess('Prescription created & sent to pharmacy!');
            setFormData({ patientId: '', appointmentId: '', diagnosis: '', notes: '', medicines: [{ name: '', dosage: '', duration: '', instructions: '' }] });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('❌ Prescription creation failed:', {
                status: err.response?.status,
                statusText: err.response?.statusText,
                message: err.response?.data?.message,
                fullError: err.response?.data
            });
            const errorMsg = err.response?.data?.message || err.message || 'Failed to create prescription';
            alert(`Error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const allApts = [...new Map(appointments.map(a => [a.patientId?._id || a.patientId, a])).values()];

    return (
        <div>
            <h1 className="mb-lg">Create E-Prescription</h1>
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '700px' }}>
                <div className="form-group mb-md">
                    <label>Select Patient (from appointments)</label>
                    <select className="input" value={formData.patientId} onChange={(e) => setFormData(f => ({ ...f, patientId: e.target.value, appointmentId: allApts.find(a => (a.patientId?._id || a.patientId) === e.target.value)?._id || '' }))} required>
                        <option value="">-- Select --</option>
                        {allApts.map((a) => (
                            <option key={a._id} value={a.patientId?._id || a.patientId}>
                                {a.patientId?.fullName} - {new Date(a.appointmentDate).toLocaleDateString()}
                            </option>
                        ))}
                    </select>
                </div>
                {formData.patientId && (
                    <div className="form-group mb-md">
                        <label>Appointment (optional)</label>
                        <select className="input" value={formData.appointmentId} onChange={(e) => setFormData(f => ({ ...f, appointmentId: e.target.value }))}>
                            <option value="">-- None --</option>
                            {appointments.filter(a => (a.patientId?._id || a.patientId) === formData.patientId).map((a) => (
                                <option key={a._id} value={a._id}>{new Date(a.appointmentDate).toLocaleString()}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="form-group mb-md">
                    <label>Diagnosis *</label>
                    <input className="input" value={formData.diagnosis} onChange={(e) => setFormData(f => ({ ...f, diagnosis: e.target.value }))} required />
                </div>
                {formData.medicines.map((med, i) => (
                    <div key={i} className="card mb-md" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <strong>Medicine {i + 1}</strong>
                            {formData.medicines.length > 1 && <button type="button" onClick={() => removeMedicine(i)} className="btn btn-sm btn-danger">Remove</button>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <input className="input" placeholder="Name *" value={med.name} onChange={(e) => updateMedicine(i, 'name', e.target.value)} required />
                            <input className="input" placeholder="Dosage *" value={med.dosage} onChange={(e) => updateMedicine(i, 'dosage', e.target.value)} required />
                            <input className="input" placeholder="Duration *" value={med.duration} onChange={(e) => updateMedicine(i, 'duration', e.target.value)} required />
                            <input className="input" placeholder="Instructions" value={med.instructions} onChange={(e) => updateMedicine(i, 'instructions', e.target.value)} />
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addMedicine} className="btn btn-secondary mb-md">+ Add Medicine</button>
                <div className="form-group mb-md">
                    <label>Notes</label>
                    <textarea className="input" value={formData.notes} onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))} rows={2} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Digitally Sign & Create Prescription (PDF generated automatically, sent to Patient Dashboard & Pharmacy)'}</button>
            </form>
        </div>
    );
};

const LabRequests = ({ doctorId }) => {
    const [formData, setFormData] = useState({ patientId: '', testType: '', description: '' });
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (doctorId) {
            const today = new Date().toISOString().split('T')[0];
            appointmentAPI.getDoctorSchedule(doctorId, today).then(r => setAppointments(r.data || [])).catch(() => { });
        }
    }, [doctorId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.patientId || !formData.testType) {
            alert('Patient and Test Type required');
            return;
        }
        setLoading(true);
        try {
            await doctorAPI.requestLabTest(formData);
            setSuccess('Lab test requested. Lab will be notified.');
            setFormData({ patientId: '', testType: '', description: '' });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed');
        } finally {
            setLoading(false);
        }
    };

    const uniquePatients = [...new Map(appointments.map(a => [a.patientId?._id || a.patientId, a.patientId])).entries()];

    return (
        <div>
            <h1 className="mb-lg">Request Lab Test</h1>
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '600px' }}>
                <div className="form-group mb-md">
                    <label>Patient *</label>
                    <select className="input" value={formData.patientId} onChange={(e) => setFormData(f => ({ ...f, patientId: e.target.value }))} required>
                        <option value="">-- Select --</option>
                        {uniquePatients.map(([id, p]) => (
                            <option key={id} value={id}>{p?.fullName}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group mb-md">
                    <label>Test Type *</label>
                    <input className="input" placeholder="e.g., CBC, X-Ray, Lipid Profile" value={formData.testType} onChange={(e) => setFormData(f => ({ ...f, testType: e.target.value }))} required />
                </div>
                <div className="form-group mb-md">
                    <label>Description / Notes</label>
                    <textarea className="input" value={formData.description} onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))} rows={2} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Requesting...' : 'Request Lab Test'}</button>
            </form>
        </div>
    );
};

export default DoctorDashboard;
