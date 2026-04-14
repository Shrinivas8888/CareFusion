import { Routes, Route } from 'react-router-dom';
import Navbar from '../Shared/Navbar';
import Sidebar from '../Shared/Sidebar';
import './PatientDashboard.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientAPI, appointmentAPI, feedbackAPI } from '../../services/api';
import BookAppointment from './BookAppointment';
import MyAppointments from './MyAppointments';

const PatientDashboard = () => {
    const { user } = useAuth();
    // Backend returns: { id, email, role, profile: { _id, ...patientData } }
    const patientId = user?.profile?._id || user?.id;

    const sidebarLinks = [
        { to: '/patient', label: 'Dashboard', exact: true },
        { to: '/patient/book', label: 'Book Appointment' },
        { to: '/patient/appointments', label: 'My Appointments' },
        { to: '/patient/prescriptions', label: 'Prescriptions' },
        { to: '/patient/lab-reports', label: 'Lab Reports' },
        { to: '/patient/feedback', label: 'Feedback' },
        { to: '/patient/profile', label: 'My Profile' },
    ];

    return (
        <div>
            <Navbar />
            <div className="dashboard-layout">
                <Sidebar links={sidebarLinks} />
                <main className="dashboard-main">
                    <Routes>
                        <Route index element={<PatientHome patientId={patientId} />} />
                        <Route path="book" element={<BookAppointment patientId={patientId} />} />
                        <Route path="appointments" element={<MyAppointments patientId={patientId} />} />
                        <Route path="prescriptions" element={<Prescriptions />} />
                        <Route path="lab-reports" element={<LabReports />} />
                        <Route path="feedback" element={<Feedback />} />
                        <Route path="profile" element={<Profile patientId={patientId} />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

const PatientHome = ({ patientId }) => {
    const [stats, setStats] = useState({ appointments: 0, upcoming: 0, prescriptions: 0, labReports: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [appointments, prescriptions, labReports] = await Promise.all([
                    patientId ? appointmentAPI.getMyAppointments(patientId) : Promise.resolve({ data: [] }),
                    patientAPI.getPrescriptions(),
                    patientAPI.getLabReports(),
                ]);

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const upcoming = appointments.data.filter(apt =>
                    new Date(apt.appointmentDate) >= today && apt.status === 'scheduled'
                ).length;

                setStats({
                    appointments: appointments.data.length,
                    upcoming,
                    prescriptions: prescriptions.data.length,
                    labReports: labReports.data.length,
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [patientId]);

    if (loading) return <div className="spinner"></div>;

    return (
        <div>
            <h1 className="mb-lg">Patient Dashboard</h1>
            <div className="grid grid-3">
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Total Appointments</h3>
                    <p className="text-4xl font-bold">{stats.appointments}</p>
                </div>
                <div className="card" style={{ backgroundColor: '#dbeafe', borderColor: '#3b82f6' }}>
                    <h3 className="text-gray-600 mb-sm">Upcoming</h3>
                    <p className="text-4xl font-bold">{stats.upcoming}</p>
                </div>
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Prescriptions</h3>
                    <p className="text-4xl font-bold">{stats.prescriptions}</p>
                </div>
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Lab Reports</h3>
                    <p className="text-4xl font-bold">{stats.labReports}</p>
                </div>
            </div>
        </div>
    );
};

const Prescriptions = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        patientAPI.getPrescriptions()
            .then(res => setPrescriptions(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleDownloadPDF = async (id) => {
        try {
            const res = await patientAPI.downloadPrescriptionPDF(id);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Prescription-${id}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert(err.response?.data?.message || 'Download failed');
        }
    };

    const getPharmacyStatusBadge = (status) => {
        const map = { pending: 'warning', ready: 'info', out_of_stock: 'danger', dispensed: 'success' };
        return map[status] || 'secondary';
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div>
            <h1 className="mb-lg">My Prescriptions</h1>
            {prescriptions.length === 0 ? (
                <p className="text-gray-500">No prescriptions found.</p>
            ) : (
                <div className="grid">
                    {prescriptions.map((rx) => (
                        <div key={rx._id} className="card">
                            <div className="flex justify-between items-center mb-md">
                                <div>
                                    <h3>Dr. {rx.doctorId?.fullName}</h3>
                                    <p className="text-sm text-gray-500">{rx.doctorId?.specialization} • {rx.prescriptionId || ''}</p>
                                </div>
                                <span className={`badge badge-${getPharmacyStatusBadge(rx.status)}`}>
                                    Pharmacy: {rx.status?.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="mb-sm"><strong>Diagnosis:</strong> {rx.diagnosis}</p>
                            <div>
                                <strong>Medicines:</strong>
                                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                    {rx.medicines?.map((med, idx) => (
                                        <li key={idx}>{med.name} - {med.dosage}, {med.frequency} for {med.duration}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex justify-between items-center mt-md">
                                <p className="text-sm text-gray-500">
                                    Date: {new Date(rx.createdAt).toLocaleDateString()}
                                </p>
                                <button onClick={() => handleDownloadPDF(rx._id)} className="btn btn-sm btn-primary">
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const LabReports = () => {
    const [labReports, setLabReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        patientAPI.getLabReports()
            .then(res => setLabReports(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="spinner"></div>;

    return (
        <div>
            <h1 className="mb-lg">Lab Reports</h1>
            {labReports.length === 0 ? (
                <p className="text-gray-500">No lab reports found.</p>
            ) : (
                <div className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Test Type</th>
                                <th>Doctor</th>
                                <th>Requested Date</th>
                                <th>Status</th>
                                <th>Report</th>
                            </tr>
                        </thead>
                        <tbody>
                            {labReports.map((report) => (
                                <tr key={report._id}>
                                    <td>{report.testType}</td>
                                    <td>Dr. {report.doctorId?.fullName}</td>
                                    <td>{new Date(report.requestedDate).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`badge badge-${report.status === 'completed' ? 'success' : 'warning'}`}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td>
                                        {report.reportFile ? (
                                            <a href={`http://localhost:5000/${(report.reportFile || '').replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                                                View / Download PDF
                                            </a>
                                        ) : (
                                            <span className="text-sm text-gray-500">Pending</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const Profile = ({ patientId }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        patientAPI.getProfile()
            .then(res => { setProfile(res.data); setFormData(res.data); })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        try {
            const res = await patientAPI.updateProfile(formData);
            setProfile(res.data);
            setEditing(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        }
    };

    if (loading) return <div className="spinner"></div>;
    if (!profile) return <p>Profile not found</p>;

    return (
        <div>
            <h1 className="mb-lg">My Profile</h1>
            <div className="card" style={{ maxWidth: '600px' }}>
                {!editing ? (
                    <>
                        <p><strong>Name:</strong> {profile.fullName}</p>
                        <p><strong>Age:</strong> {profile.age || '—'}</p>
                        <p><strong>Gender:</strong> {profile.gender || '—'}</p>
                        <p><strong>Mobile:</strong> {profile.mobile || '—'}</p>
                        <p><strong>Address:</strong> {profile.address || '—'}</p>
                        <p><strong>Blood Group:</strong> {profile.bloodGroup || '—'}</p>
                        <button onClick={() => setEditing(true)} className="btn btn-primary mt-md">Edit Profile</button>
                    </>
                ) : (
                    <>
                        <div className="form-group mb-md">
                            <label>Full Name</label>
                            <input className="input" value={formData.fullName || ''} onChange={(e) => setFormData(f => ({ ...f, fullName: e.target.value }))} />
                        </div>
                        <div className="form-group mb-md">
                            <label>Age</label>
                            <input type="number" className="input" value={formData.age || ''} onChange={(e) => setFormData(f => ({ ...f, age: parseInt(e.target.value) || undefined }))} />
                        </div>
                        <div className="form-group mb-md">
                            <label>Gender</label>
                            <select className="input" value={formData.gender || ''} onChange={(e) => setFormData(f => ({ ...f, gender: e.target.value }))}>
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group mb-md">
                            <label>Mobile</label>
                            <input className="input" value={formData.mobile || ''} onChange={(e) => setFormData(f => ({ ...f, mobile: e.target.value }))} />
                        </div>
                        <div className="form-group mb-md">
                            <label>Address</label>
                            <textarea className="input" value={formData.address || ''} onChange={(e) => setFormData(f => ({ ...f, address: e.target.value }))} rows={2} />
                        </div>
                        <button onClick={handleSave} className="btn btn-success" style={{ marginRight: '0.5rem' }}>Save</button>
                        <button onClick={() => { setEditing(false); setFormData(profile); }} className="btn btn-secondary">Cancel</button>
                    </>
                )}
            </div>
        </div>
    );
};

const Feedback = () => {
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        patientAPI.getAppointments()
            .then(res => {
                const completed = (res.data || []).filter(a => a.status === 'completed');
                setAppointments(completed);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAppointment) { alert('Select an appointment'); return; }
        setSubmitting(true);
        try {
            await feedbackAPI.submitFeedback({ appointmentId: selectedAppointment, rating, comment });
            setSuccess('Thank you for your feedback!');
            setSelectedAppointment('');
            setComment('');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit');
        } finally {
            setSubmitting(false);
        }
    };

    const alreadyFeedback = []; // Backend prevents duplicate - we could track locally if needed

    if (loading) return <div className="spinner"></div>;

    return (
        <div>
            <h1 className="mb-lg">Give Feedback</h1>
            <p className="text-gray-600 mb-lg">Rate your experience for completed appointments (1-5 stars).</p>
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '500px' }}>
                <div className="form-group mb-md">
                    <label>Select Completed Appointment *</label>
                    <select className="input" value={selectedAppointment} onChange={(e) => setSelectedAppointment(e.target.value)} required>
                        <option value="">-- Select --</option>
                        {appointments.map((a) => (
                            <option key={a._id} value={a._id}>
                                Dr. {a.doctorId?.fullName} - {new Date(a.appointmentDate).toLocaleDateString()}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group mb-md">
                    <label>Rating (1-5) *</label>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '1.5rem' }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <button key={n} type="button" onClick={() => setRating(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>
                                {n <= rating ? '⭐' : '☆'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="form-group mb-md">
                    <label>Comment (optional)</label>
                    <textarea className="input" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Share your experience..." />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting || appointments.length === 0}>
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
            </form>
            {appointments.length === 0 && <p className="text-gray-500 mt-md">No completed appointments to rate yet.</p>}
        </div>
    );
};

export default PatientDashboard;
