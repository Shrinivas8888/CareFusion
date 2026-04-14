import { Routes, Route } from 'react-router-dom';
import Navbar from '../Shared/Navbar';
import Sidebar from '../Shared/Sidebar';
import UserProfileModal from './UserProfileModal';
import '../Patient/PatientDashboard.css';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminDashboard = () => {
    const sidebarLinks = [
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/pending', label: 'Pending Approvals' },
        { to: '/admin/create-user', label: 'Create User' },
        { to: '/admin/users', label: 'Manage Users' },
        { to: '/admin/analytics', label: 'Analytics' },
    ];

    return (
        <div>
            <Navbar />
            <div className="dashboard-layout">
                <Sidebar links={sidebarLinks} />
                <main className="dashboard-main">
                    <Routes>
                        <Route index element={<AdminHome />} />
                        <Route path="pending" element={<PendingUsers />} />
                        <Route path="create-user" element={<CreateUser />} />
                        <Route path="users" element={<ManageUsers />} />
                        <Route path="analytics" element={<Analytics />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

const AdminHome = () => {
    const [analytics, setAnalytics] = useState(null);
    const [userCounts, setUserCounts] = useState(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            adminAPI.getAnalytics(),
            adminAPI.getPendingUsers(),
            adminAPI.getUserCounts()
        ])
            .then(([analyticsRes, pendingRes, countsRes]) => {
                setAnalytics(analyticsRes.data);
                setPendingCount(pendingRes.data.length);
                setUserCounts(countsRes.data);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="spinner"></div>;

    return (
        <div>
            <h1 className="mb-lg">Admin Dashboard</h1>
            {pendingCount > 0 && (
                <div className="alert alert-warning mb-lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>⚠️ You have {pendingCount} pending user approval{pendingCount > 1 ? 's' : ''}</span>
                    <a href="/admin/pending" className="btn btn-sm btn-warning">Review Now</a>
                </div>
            )}

            <h2 className="mb-md">User Statistics</h2>
            <div className="grid grid-4 mb-lg">
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Total Patients</h3>
                    <p className="text-4xl font-bold">{userCounts?.patient?.total || 0}</p>
                    <p className="text-sm text-gray-500 mt-sm">All approved</p>
                </div>
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Doctors</h3>
                    <p className="text-4xl font-bold">{userCounts?.doctor?.total || 0}</p>
                    {userCounts?.doctor?.pending > 0 && (
                        <p className="text-sm text-warning mt-sm">⚠️ {userCounts.doctor.pending} pending</p>
                    )}
                </div>
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Staff</h3>
                    <p className="text-4xl font-bold">{userCounts?.staff?.total || 0}</p>
                    {userCounts?.staff?.pending > 0 && (
                        <p className="text-sm text-warning mt-sm">⚠️ {userCounts.staff.pending} pending</p>
                    )}
                </div>
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Pharmacy</h3>
                    <p className="text-4xl font-bold">{userCounts?.pharmacy?.total || 0}</p>
                    {userCounts?.pharmacy?.pending > 0 && (
                        <p className="text-sm text-warning mt-sm">⚠️ {userCounts.pharmacy.pending} pending</p>
                    )}
                </div>
            </div>

            <div className="grid grid-4 mb-lg">
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Laboratory</h3>
                    <p className="text-4xl font-bold">{userCounts?.laboratory?.total || 0}</p>
                    {userCounts?.laboratory?.pending > 0 && (
                        <p className="text-sm text-warning mt-sm">⚠️ {userCounts.laboratory.pending} pending</p>
                    )}
                </div>
            </div>

            <h2 className="mb-md">Appointment Statistics</h2>
            <div className="grid grid-4">
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Total Appointments</h3>
                    <p className="text-4xl font-bold">{analytics?.totalAppointments || 0}</p>
                </div>
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Today's Appointments</h3>
                    <p className="text-4xl font-bold">{analytics?.todayAppointments || 0}</p>
                </div>
            </div>
        </div>
    );
};

const PendingUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        adminAPI.getPendingUsers()
            .then(res => setUsers(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleApproval = async (userId, status) => {
        setActionLoading(userId);
        try {
            await adminAPI.approveUser(userId, status);
            setUsers(users.filter(u => u._id !== userId));
        } catch (error) {
            console.error(error);
            alert('Failed to update user status');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div>
            <h1 className="mb-lg">Pending User Approvals</h1>
            {users.length === 0 ? (
                <div className="card">
                    <p className="text-gray-500">No pending user approvals</p>
                </div>
            ) : (
                <div className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Registered</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className="badge badge-info">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleApproval(user._id, 'approved')}
                                                className="btn btn-sm btn-success"
                                                disabled={actionLoading === user._id}
                                            >
                                                {actionLoading === user._id ? '...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={() => handleApproval(user._id, 'rejected')}
                                                className="btn btn-sm btn-danger"
                                                disabled={actionLoading === user._id}
                                            >
                                                {actionLoading === user._id ? '...' : 'Reject'}
                                            </button>
                                        </div>
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

const CreateUser = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'patient',
        profileData: {}
    });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // Build profile data based on role
            const profileData = {
                fullName: formData.fullName,
                contactNumber: formData.contactNumber,
                ...(formData.role === 'patient' && {
                    age: formData.age,
                    gender: formData.gender,
                    mobile: formData.contactNumber,
                    address: formData.address,
                }),
                ...(formData.role === 'doctor' && {
                    specialization: formData.specialization,
                    department: formData.department,
                    qualification: formData.qualification,
                    experience: formData.experience,
                }),
                ...(formData.role === 'staff' && {
                    name: formData.fullName,
                    roleType: formData.roleType,
                    department: formData.department,
                    shiftTime: formData.shiftTime,
                }),
                ...(formData.role === 'pharmacy' && {
                    pharmacistName: formData.fullName,
                    contactNumber: formData.contactNumber,
                    licenseNumber: formData.licenseNumber,
                    shiftTiming: formData.shiftTiming,
                }),
                ...(formData.role === 'laboratory' && {
                    name: formData.fullName,
                    labType: formData.labType,
                }),
            };

            await adminAPI.createUser({
                email: formData.email,
                password: formData.password,
                role: formData.role,
                profileData
            });

            setMessage('User created successfully!');
            setFormData({ email: '', password: '', role: 'patient', profileData: {} });
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error creating user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="mb-lg">Create New User</h1>
            <div className="card" style={{ maxWidth: '600px' }}>
                {message && (
                    <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <input
                            type="email"
                            className="input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input
                            type="password"
                            className="input"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Role</label>
                        <select
                            className="input"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            required
                        >
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                            <option value="staff">Staff</option>
                            <option value="pharmacy">Pharmacy</option>
                            <option value="laboratory">Laboratory</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Full Name</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.fullName || ''}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Contact Number</label>
                        <input
                            type="tel"
                            className="input"
                            value={formData.contactNumber || ''}
                            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                            required
                        />
                    </div>

                    {formData.role === 'patient' && (
                        <>
                            <div className="input-group">
                                <label className="input-label">Age</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.age || ''}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Gender</label>
                                <select
                                    className="input"
                                    value={formData.gender || ''}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Address</label>
                                <textarea
                                    className="input"
                                    value={formData.address || ''}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {formData.role === 'doctor' && (
                        <>
                            <div className="input-group">
                                <label className="input-label">Specialization *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.specialization || ''}
                                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Department *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.department || ''}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Qualification *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.qualification || ''}
                                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Experience (years) *</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.experience || ''}
                                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                    required
                                    min="0"
                                />
                            </div>
                        </>
                    )}

                    {formData.role === 'staff' && (
                        <>
                            <div className="input-group">
                                <label className="input-label">Department *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.department || ''}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Role Type *</label>
                                <select
                                    className="input"
                                    value={formData.roleType || ''}
                                    onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                                    required
                                >
                                    <option value="">Select Role Type</option>
                                    <option value="Reception">Reception</option>
                                    <option value="Support">Support</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Shift Time *</label>
                                <select
                                    className="input"
                                    value={formData.shiftTime || ''}
                                    onChange={(e) => setFormData({ ...formData, shiftTime: e.target.value })}
                                    required
                                >
                                    <option value="">Select Shift</option>
                                    <option value="Morning">Morning</option>
                                    <option value="Evening">Evening</option>
                                    <option value="Night">Night</option>
                                </select>
                            </div>
                        </>
                    )}

                    {formData.role === 'pharmacy' && (
                        <>
                            <div className="input-group">
                                <label className="input-label">License Number *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.licenseNumber || ''}
                                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Shift Timing *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.shiftTiming || ''}
                                    onChange={(e) => setFormData({ ...formData, shiftTiming: e.target.value })}
                                    placeholder="e.g., 9 AM - 5 PM"
                                    required
                                />
                            </div>
                        </>
                    )}

                    {formData.role === 'laboratory' && (
                        <>
                            <div className="input-group">
                                <label className="input-label">Lab Type *</label>
                                <select
                                    className="input"
                                    value={formData.labType || ''}
                                    onChange={(e) => setFormData({ ...formData, labType: e.target.value })}
                                    required
                                >
                                    <option value="">Select Lab Type</option>
                                    <option value="Pathology">Pathology</option>
                                    <option value="Radiology">Radiology</option>
                                </select>
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? <span className="spinner"></span> : 'Create User'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const ManageUsers = () => {
    const [role, setRole] = useState('patient');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchUsers = () => {
        setLoading(true);
        adminAPI.getUsersByRole(role)
            .then(res => setUsers(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUsers();
    }, [role]);

    const handleViewProfile = async (userId) => {
        try {
            setActionLoading(userId);
            const res = await adminAPI.getUserDetails(userId);
            setSelectedUser(res.data);
            setShowProfileModal(true);
        } catch (error) {
            console.error(error);
            alert('Failed to load user details');
        } finally {
            setActionLoading(null);
        }
    };

    const handleBlockUser = async (user) => {
        const action = user.status === 'blocked' ? 'unblock' : 'block';
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
            return;
        }

        try {
            setActionLoading(user._id);
            await adminAPI.blockUser(user._id);
            // Refresh the user list
            fetchUsers();
            alert(`User ${action}ed successfully`);
        } catch (error) {
            console.error(error);
            alert(`Failed to ${action} user`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone!')) {
            return;
        }

        try {
            setActionLoading(userId);
            await adminAPI.deleteUser(userId);
            // Refresh the user list
            fetchUsers();
            alert('User deleted successfully');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to delete user');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-lg">
                <h1>Manage Users</h1>
                <select className="input" value={role} onChange={(e) => setRole(e.target.value)} style={{ width: 'auto' }}>
                    <option value="patient">Patients</option>
                    <option value="doctor">Doctors</option>
                    <option value="staff">Staff</option>
                    <option value="pharmacy">Pharmacy</option>
                    <option value="laboratory">Laboratory</option>
                </select>
            </div>

            {loading ? (
                <div className="spinner"></div>
            ) : (
                <div className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td>{user.email}</td>
                                    <td>{user.profile?.fullName || user.profile?.name || user.profile?.pharmacistName || 'N/A'}</td>
                                    <td>
                                        <span className={`badge badge-${user.status === 'approved' ? 'success' :
                                            user.status === 'blocked' ? 'danger' :
                                                'warning'
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => handleViewProfile(user._id)}
                                                className="btn btn-sm btn-info"
                                                disabled={actionLoading === user._id}
                                            >
                                                {actionLoading === user._id ? '...' : 'View Profile'}
                                            </button>
                                            <button
                                                onClick={() => handleBlockUser(user)}
                                                className={`btn btn-sm ${user.status === 'blocked' ? 'btn-success' : 'btn-warning'}`}
                                                disabled={actionLoading === user._id}
                                            >
                                                {actionLoading === user._id ? '...' : user.status === 'blocked' ? 'Unblock' : 'Block'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user._id)}
                                                className="btn btn-sm btn-danger"
                                                disabled={actionLoading === user._id}
                                            >
                                                {actionLoading === user._id ? '...' : 'Delete'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showProfileModal && selectedUser && (
                <UserProfileModal
                    user={selectedUser.user}
                    profile={selectedUser.profile}
                    onClose={() => {
                        setShowProfileModal(false);
                        setSelectedUser(null);
                    }}
                />
            )}
        </div>
    );
};

const Analytics = () => {
    return (
        <div>
            <h1 className="mb-lg">Analytics</h1>
            <div className="card">
                <p className="text-gray-500">Detailed analytics and reports will be displayed here.</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
