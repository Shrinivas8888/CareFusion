import './UserProfileModal.css';

const UserProfileModal = ({ user, profile, onClose }) => {
    if (!user) return null;

    const formatDate = (date) => {
        return date ? new Date(date).toLocaleDateString() : 'N/A';
    };

    const getStatusBadge = (status) => {
        const statusClass = {
            approved: 'badge-success',
            pending: 'badge-warning',
            rejected: 'badge-danger',
            blocked: 'badge-danger'
        }[status] || 'badge-secondary';

        return <span className={`badge ${statusClass}`}>{status}</span>;
    };

    const renderProfileDetails = () => {
        if (!profile) return <p className="text-gray-500">No profile data available</p>;

        switch (user.role) {
            case 'patient':
                return (
                    <>
                        <div className="profile-field">
                            <label>Full Name:</label>
                            <span>{profile.fullName || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Age:</label>
                            <span>{profile.age || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Gender:</label>
                            <span>{profile.gender || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Mobile:</label>
                            <span>{profile.mobile || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Address:</label>
                            <span>{profile.address || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Blood Group:</label>
                            <span>{profile.bloodGroup || 'N/A'}</span>
                        </div>
                        {profile.emergencyContact && (
                            <>
                                <h4 className="mt-md mb-sm">Emergency Contact</h4>
                                <div className="profile-field">
                                    <label>Name:</label>
                                    <span>{profile.emergencyContact.name || 'N/A'}</span>
                                </div>
                                <div className="profile-field">
                                    <label>Relationship:</label>
                                    <span>{profile.emergencyContact.relationship || 'N/A'}</span>
                                </div>
                                <div className="profile-field">
                                    <label>Phone:</label>
                                    <span>{profile.emergencyContact.phone || 'N/A'}</span>
                                </div>
                            </>
                        )}
                    </>
                );

            case 'doctor':
                return (
                    <>
                        <div className="profile-field">
                            <label>Full Name:</label>
                            <span>{profile.fullName || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Specialization:</label>
                            <span>{profile.specialization || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Department:</label>
                            <span>{profile.department || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Qualification:</label>
                            <span>{profile.qualification || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Experience:</label>
                            <span>{profile.experience ? `${profile.experience} years` : 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Contact:</label>
                            <span>{profile.contactNumber || 'N/A'}</span>
                        </div>
                    </>
                );

            case 'staff':
                return (
                    <>
                        <div className="profile-field">
                            <label>Name:</label>
                            <span>{profile.name || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Role Type:</label>
                            <span>{profile.roleType || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Department:</label>
                            <span>{profile.department || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Shift Time:</label>
                            <span>{profile.shiftTime || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Contact:</label>
                            <span>{profile.contactNumber || 'N/A'}</span>
                        </div>
                    </>
                );

            case 'pharmacy':
                return (
                    <>
                        <div className="profile-field">
                            <label>Pharmacist Name:</label>
                            <span>{profile.pharmacistName || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>License Number:</label>
                            <span>{profile.licenseNumber || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Shift Timing:</label>
                            <span>{profile.shiftTiming || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Contact:</label>
                            <span>{profile.contactNumber || 'N/A'}</span>
                        </div>
                    </>
                );

            case 'laboratory':
                return (
                    <>
                        <div className="profile-field">
                            <label>Name:</label>
                            <span>{profile.name || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Lab Type:</label>
                            <span>{profile.labType || 'N/A'}</span>
                        </div>
                        <div className="profile-field">
                            <label>Contact:</label>
                            <span>{profile.contactNumber || 'N/A'}</span>
                        </div>
                    </>
                );

            default:
                return <p className="text-gray-500">No profile details available</p>;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>User Profile</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <h3 className="mb-md">Account Information</h3>
                    <div className="profile-field">
                        <label>Email:</label>
                        <span>{user.email}</span>
                    </div>
                    <div className="profile-field">
                        <label>Role:</label>
                        <span className="badge badge-info">{user.role}</span>
                    </div>
                    <div className="profile-field">
                        <label>Status:</label>
                        {getStatusBadge(user.status)}
                    </div>
                    <div className="profile-field">
                        <label>Registered:</label>
                        <span>{formatDate(user.createdAt)}</span>
                    </div>

                    <h3 className="mb-md mt-lg">Profile Details</h3>
                    {renderProfileDetails()}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
