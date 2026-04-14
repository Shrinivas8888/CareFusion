import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Login.css';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        role: 'patient',
        email: '',
        password: '',
        confirmPassword: '',
        // Common fields
        fullName: '',
        mobile: '',
        // Patient fields
        age: '',
        gender: '',
        // Doctor fields
        specialization: '',
        qualification: '',
        department: '',
        experience: '',
        // Staff fields
        roleType: '',
        shiftTime: '',
        // Pharmacy fields
        licenseNumber: '',
        shiftTiming: '',
        // Laboratory fields
        labType: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const roles = [
        { value: 'patient', label: 'Patient', icon: '👨‍⚕️' },
        { value: 'doctor', label: 'Doctor', icon: '⚕️' },
        { value: 'staff', label: 'Staff', icon: '👥' },
        { value: 'pharmacy', label: 'Pharmacy', icon: '💊' },
        { value: 'laboratory', label: 'Laboratory', icon: '🔬' },
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            let profileData = {};

            // Build profile data based on selected role
            if (formData.role === 'patient') {
                profileData = {
                    fullName: formData.fullName,
                    mobile: formData.mobile,
                    age: formData.age ? parseInt(formData.age) : undefined,
                    gender: formData.gender,
                };
            } else if (formData.role === 'doctor') {
                profileData = {
                    fullName: formData.fullName,
                    contactNumber: formData.mobile,
                    specialization: formData.specialization,
                    qualification: formData.qualification,
                    department: formData.department,
                    experience: formData.experience ? parseInt(formData.experience) : 0,
                };
            } else if (formData.role === 'staff') {
                profileData = {
                    name: formData.fullName,
                    contactNumber: formData.mobile,
                    roleType: formData.roleType,
                    department: formData.department || 'General',
                    shiftTime: formData.shiftTime,
                };

            } else if (formData.role === 'pharmacy') {
                profileData = {
                    pharmacistName: formData.fullName,
                    contactNumber: formData.mobile,
                    licenseNumber: formData.licenseNumber,
                    shiftTiming: formData.shiftTiming,
                };
            } else if (formData.role === 'laboratory') {
                profileData = {
                    name: formData.fullName,
                    contactNumber: formData.mobile,
                    labType: formData.labType,
                };
            }

            const requestData = {
                email: formData.email,
                password: formData.password,
                role: formData.role,
                profileData
            };

            const res = await authAPI.register(requestData);
            setSuccess(res.data?.message || (formData.role === 'patient'
                ? 'Registration successful! You can now login with your credentials.'
                : 'Registration successful! Your account is pending approval. You will be notified once approved.'));

            // Reset form
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <Link to="/" className="back-link">← Back to Home</Link>
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join CareFusion Hospital Management System</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {/* Role Selection */}
                    <div className="form-group">
                        <label htmlFor="role">Select Your Role *</label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="form-select"
                            required
                        >
                            {roles.map(role => (
                                <option key={role.value} value={role.value}>
                                    {role.icon} {role.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Common Fields */}
                    <div className="form-group">
                        <label htmlFor="email">Email Address *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">Password *</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create password"
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password *</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm password"
                                className="form-input"
                                required
                            />
                        </div>
                    </div>

                    {/* Role-Specific Fields */}
                    <div className="role-specific-fields">
                        <h3 className="role-header">{roles.find(r => r.value === formData.role)?.label} Information</h3>

                        {/* Patient Fields */}
                        {formData.role === 'patient' && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="fullName">Full Name *</label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Enter your full name"
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="mobile">Mobile Number *</label>
                                        <input
                                            type="tel"
                                            id="mobile"
                                            name="mobile"
                                            value={formData.mobile}
                                            onChange={handleChange}
                                            placeholder="10-digit mobile"
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="age">Age</label>
                                        <input
                                            type="number"
                                            id="age"
                                            name="age"
                                            value={formData.age}
                                            onChange={handleChange}
                                            placeholder="Your age"
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="gender">Gender</label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Doctor Fields */}
                        {formData.role === 'doctor' && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="fullName">Full Name *</label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Dr. Full Name"
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="mobile">Contact Number *</label>
                                    <input
                                        type="tel"
                                        id="mobile"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        placeholder="10-digit mobile"
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="specialization">Specialization *</label>
                                        <input
                                            type="text"
                                            id="specialization"
                                            name="specialization"
                                            value={formData.specialization}
                                            onChange={handleChange}
                                            placeholder="e.g., Cardiology"
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="department">Department *</label>
                                        <input
                                            type="text"
                                            id="department"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            placeholder="e.g., Medicine"
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="qualification">Qualification *</label>
                                        <input
                                            type="text"
                                            id="qualification"
                                            name="qualification"
                                            value={formData.qualification}
                                            onChange={handleChange}
                                            placeholder="e.g., MBBS, MD"
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="experience">Experience (years)</label>
                                        <input
                                            type="number"
                                            id="experience"
                                            name="experience"
                                            value={formData.experience}
                                            onChange={handleChange}
                                            placeholder="Years"
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Staff Fields */}
                        {formData.role === 'staff' && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="fullName">Full Name *</label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Enter your full name"
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="mobile">Contact Number *</label>
                                    <input
                                        type="tel"
                                        id="mobile"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        placeholder="10-digit mobile"
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="roleType">Role Type *</label>
                                        <select
                                            id="roleType"
                                            name="roleType"
                                            value={formData.roleType}
                                            onChange={handleChange}
                                            className="form-select"
                                            required
                                        >
                                            <option value="">Select Role</option>
                                            <option value="Reception">Reception</option>
                                            <option value="Support">Support</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="department">Department *</label>
                                        <input
                                            type="text"
                                            id="department"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            placeholder="e.g., OPD, Emergency"
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="shiftTime">Shift Time *</label>
                                    <select
                                        id="shiftTime"
                                        name="shiftTime"
                                        value={formData.shiftTime}
                                        onChange={handleChange}
                                        className="form-select"
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

                        {/* Pharmacy Fields */}
                        {formData.role === 'pharmacy' && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="fullName">Pharmacist Name *</label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Enter pharmacist full name"
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="mobile">Contact Number *</label>
                                        <input
                                            type="tel"
                                            id="mobile"
                                            name="mobile"
                                            value={formData.mobile}
                                            onChange={handleChange}
                                            placeholder="10-digit mobile"
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="licenseNumber">License Number *</label>
                                        <input
                                            type="text"
                                            id="licenseNumber"
                                            name="licenseNumber"
                                            value={formData.licenseNumber}
                                            onChange={handleChange}
                                            placeholder="License number"
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="shiftTiming">Shift Timing *</label>
                                    <input
                                        type="text"
                                        id="shiftTiming"
                                        name="shiftTiming"
                                        value={formData.shiftTiming}
                                        onChange={handleChange}
                                        placeholder="e.g., 24/7"
                                        className="form-input"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {/* Laboratory Fields */}
                        {formData.role === 'laboratory' && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="fullName">Laboratory Name *</label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Enter lab name"
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="mobile">Contact Number *</label>
                                        <input
                                            type="tel"
                                            id="mobile"
                                            name="mobile"
                                            value={formData.mobile}
                                            onChange={handleChange}
                                            placeholder="10-digit mobile"
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="labType">Lab Type *</label>
                                        <input
                                            type="text"
                                            id="labType"
                                            name="labType"
                                            value={formData.labType}
                                            onChange={handleChange}
                                            placeholder="e.g., Pathology"
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Error/Success Messages */}
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading || success}
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>

                    {/* Links */}
                    <div className="auth-links">
                        <span>Already have an account?</span>
                        <Link to="/login" className="link">Login Here</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
