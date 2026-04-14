import { Routes, Route } from 'react-router-dom';
import Navbar from '../Shared/Navbar';
import Sidebar from '../Shared/Sidebar';
import '../Patient/PatientDashboard.css';
import { useState, useEffect } from 'react';
import { staffAPI } from '../../services/api';
import DoctorAvailability from './DoctorAvailability';
import BlockSlots from './BlockSlots';
import StaffAppointments from './StaffAppointments';

const StaffDashboard = () => {
    const sidebarLinks = [
        { to: '/staff', label: 'Dashboard' },
        { to: '/staff/doctor-availability', label: 'Doctor Availability' },
        { to: '/staff/block-slots', label: 'Block Slots' },
        { to: '/staff/queue', label: 'Daily Queue' },
        { to: '/staff/appointments', label: 'Appointments' },
    ];

    return (
        <div>
            <Navbar />
            <div className="dashboard-layout">
                <Sidebar links={sidebarLinks} />
                <main className="dashboard-main">
                    <Routes>
                        <Route index element={<StaffHome />} />
                        <Route path="doctor-availability" element={<DoctorAvailability />} />
                        <Route path="block-slots" element={<BlockSlots />} />
                        <Route path="queue" element={<DailyQueue />} />
                        <Route path="appointments" element={<StaffAppointments />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

const StaffHome = () => {
    return (
        <div>
            <h1 className="mb-lg">Staff Dashboard</h1>
            <div className="grid grid-3">
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Doctor Availability</h3>
                    <p className="text-gray-500">Set weekly schedules & slot duration</p>
                    <a href="/staff/doctor-availability" className="btn btn-primary mt-md">Manage Availability</a>
                </div>
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Block Slots</h3>
                    <p className="text-gray-500">Manage doctor leaves & emergencies</p>
                    <a href="/staff/block-slots" className="btn btn-primary mt-md">Block Slots</a>
                </div>
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Today's Queue</h3>
                    <p className="text-gray-500">Manage daily OPD queue</p>
                    <a href="/staff/queue" className="btn btn-primary mt-md">View Queue</a>
                </div>
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Appointments</h3>
                    <p className="text-gray-500">View & manage appointments</p>
                    <a href="/staff/appointments" className="btn btn-primary mt-md">View Appointments</a>
                </div>
            </div>
        </div>
    );
};

const DailyQueue = () => {
    const [queue, setQueue] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            staffAPI.getDailyQueue(),
            staffAPI.getPatients(),
            staffAPI.getDoctors()
        ])
            .then(([queueRes, patientsRes, doctorsRes]) => {
                setQueue(queueRes.data);
                setPatients(patientsRes.data);
                setDoctors(doctorsRes.data);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleAddToQueue = async (e) => {
        e.preventDefault();
        try {
            const res = await staffAPI.addToQueue({
                patientId: selectedPatient,
                doctorId: selectedDoctor
            });
            setQueue([...queue, res.data]);
            setSelectedPatient('');
            setSelectedDoctor('');
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div>
            <h1 className="mb-lg">Daily Queue Management</h1>

            <div className="card mb-lg" style={{ maxWidth: '600px' }}>
                <h3 className="mb-md">Add Patient to Queue</h3>
                <form onSubmit={handleAddToQueue} className="flex gap-md">
                    <select
                        className="input"
                        value={selectedPatient}
                        onChange={(e) => setSelectedPatient(e.target.value)}
                        required
                    >
                        <option value="">Select Patient</option>
                        {patients.map(p => (
                            <option key={p._id} value={p._id}>{p.fullName}</option>
                        ))}
                    </select>
                    <select
                        className="input"
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                    >
                        <option value="">Select Doctor (Optional)</option>
                        {doctors.map(d => (
                            <option key={d._id} value={d._id}>{d.fullName} - {d.specialization}</option>
                        ))}
                    </select>
                    <button type="submit" className="btn btn-primary">Add to Queue</button>
                </form>
            </div>

            <div className="card">
                <h3 className="mb-md">Today's Queue ({queue.length})</h3>
                {queue.length === 0 ? (
                    <p className="text-gray-500">No patients in queue</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Token</th>
                                <th>Patient</th>
                                <th>Doctor</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {queue.map((item) => (
                                <tr key={item._id}>
                                    <td><strong>#{item.tokenNumber}</strong></td>
                                    <td>{item.patientId?.fullName}</td>
                                    <td>{item.doctorId?.fullName || 'Not assigned'}</td>
                                    <td>
                                        <span className={`badge badge-${item.status === 'completed' ? 'success' :
                                            item.status === 'in-progress' ? 'info' : 'warning'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td>
                                        {item.status === 'waiting' && (
                                            <button className="btn btn-sm btn-primary">Mark In Progress</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default StaffDashboard;
