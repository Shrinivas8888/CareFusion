import { Routes, Route } from 'react-router-dom';
import Navbar from '../Shared/Navbar';
import Sidebar from '../Shared/Sidebar';
import '../Patient/PatientDashboard.css';
import { useState, useEffect } from 'react';
import { laboratoryAPI } from '../../services/api';

const LaboratoryDashboard = () => {
    const sidebarLinks = [
        { to: '/laboratory', label: 'Dashboard' },
        { to: '/laboratory/tests', label: 'Test Requests' },
    ];

    return (
        <div>
            <Navbar />
            <div className="dashboard-layout">
                <Sidebar links={sidebarLinks} />
                <main className="dashboard-main">
                    <Routes>
                        <Route index element={<LaboratoryHome />} />
                        <Route path="tests" element={<TestRequests />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

const LaboratoryHome = () => {
    const [stats, setStats] = useState({ pending: 0, completed: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            laboratoryAPI.getLabTests('pending'),
            laboratoryAPI.getLabTests('completed')
        ])
            .then(([pendingRes, completedRes]) => {
                setStats({
                    pending: pendingRes.data.length,
                    completed: completedRes.data.length
                });
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="spinner"></div>;

    return (
        <div>
            <h1 className="mb-lg">Laboratory Dashboard</h1>
            <div className="grid grid-2">
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Pending Tests</h3>
                    <p className="text-4xl font-bold">{stats.pending}</p>
                </div>
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Completed Tests</h3>
                    <p className="text-4xl font-bold">{stats.completed}</p>
                </div>
            </div>
        </div>
    );
};

const TestRequests = () => {
    const [tests, setTests] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState(null);
    const [uploadError, setUploadError] = useState('');

    const fetchTests = () => {
        setLoading(true);
        laboratoryAPI.getLabTests(filter || undefined)
            .then(res => setTests(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchTests();
    }, [filter]);

    const handleStatusUpdate = async (id, status) => {
        try {
            await laboratoryAPI.updateLabTestStatus(id, { status });
            fetchTests();
        } catch (error) {
            console.error(error);
        }
    };

    const handleUploadReport = async (id, file) => {
        if (!file || file.type !== 'application/pdf') {
            setUploadError('Please select a PDF file');
            return;
        }
        setUploadingId(id);
        setUploadError('');
        try {
            await laboratoryAPI.uploadReport(id, file);
            fetchTests();
        } catch (error) {
            setUploadError(error.response?.data?.message || 'Upload failed');
        } finally {
            setUploadingId(null);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-lg">
                <h1>Lab Test Requests</h1>
                <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 'auto' }}>
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            {uploadError && <div className="alert alert-error mb-md">{uploadError}</div>}

            {loading ? <div className="spinner"></div> : (
                <div className="card">
                    {tests.length === 0 ? (
                        <p className="text-gray-500">No tests found</p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Test Type</th>
                                    <th>Patient</th>
                                    <th>Doctor</th>
                                    <th>Requested Date</th>
                                    <th>Status</th>
                                    <th>Report</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tests.map((test) => (
                                    <tr key={test._id}>
                                        <td>{test.testType}</td>
                                        <td>{test.patientId?.fullName}</td>
                                        <td>Dr. {test.doctorId?.fullName}</td>
                                        <td>{new Date(test.requestedDate).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge badge-${test.status === 'completed' ? 'success' :
                                                    test.status === 'in-progress' ? 'info' : 'warning'
                                                }`}>
                                                {test.status}
                                            </span>
                                        </td>
                                        <td>
                                            {test.reportFile ? (
                                                <a href={`http://localhost:5000/${(test.reportFile || '').replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-info">
                                                    View PDF
                                                </a>
                                            ) : (
                                                <span className="text-gray-500">—</span>
                                            )}
                                        </td>
                                        <td>
                                            {test.status === 'pending' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(test._id, 'in-progress')}
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    Start
                                                </button>
                                            )}
                                            {(test.status === 'in-progress' || test.status === 'pending') && (
                                                <label className="btn btn-sm btn-success" style={{ marginLeft: test.status === 'in-progress' ? '0.5rem' : 0 }}>
                                                    {uploadingId === test._id ? 'Uploading...' : 'Upload PDF'}
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadReport(test._id, f); e.target.value = ''; }}
                                                        disabled={uploadingId === test._id}
                                                    />
                                                </label>
                                            )}
                                            {test.status === 'in-progress' && !test.reportFile && (
                                                <button
                                                    onClick={() => handleStatusUpdate(test._id, 'completed')}
                                                    className="btn btn-sm btn-secondary"
                                                    style={{ marginLeft: '0.5rem' }}
                                                >
                                                    Complete (no report)
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default LaboratoryDashboard;
