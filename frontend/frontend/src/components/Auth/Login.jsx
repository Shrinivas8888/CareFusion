import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'patient'
    });
    const [error, setError] = useState('');
    const [errorType, setErrorType] = useState(''); // 'pending' | 'rejected' | 'blocked' | ''
    const [loading, setLoading] = useState(false);

    const roles = [
        { value: 'patient', label: 'Patient', icon: '👨‍⚕️' },
        { value: 'doctor', label: 'Doctor', icon: '⚕️' },
        { value: 'staff', label: 'Staff', icon: '👥' },
        { value: 'pharmacy', label: 'Pharmacy', icon: '💊' },
        { value: 'laboratory', label: 'Laboratory', icon: '🔬' },
        { value: 'admin', label: 'Admin', icon: '🔐' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setErrorType('');
        setLoading(true);

        try {
            const user = await login(formData.email, formData.password);

            // Check if user's role matches selected role
            if (user.role !== formData.role) {
                setError(`Invalid credentials for ${formData.role} login. Your account role is: ${user.role}`);
                setLoading(false);
                return;
            }

            // Redirect to role-specific dashboard
            navigate(`/${user.role}`);
        } catch (err) {
            const msg = err.response?.data?.message;
            const code = err.response?.data?.code;
            if (code === 'PENDING') {
                setErrorType('pending');
                setError('Your account is pending admin approval. Please wait for approval or contact admin.');
            } else if (code === 'REJECTED') {
                setErrorType('rejected');
                setError('Your registration was rejected. Please contact admin for assistance.');
            } else if (code === 'BLOCKED') {
                setErrorType('blocked');
                setError('Your account has been blocked. Please contact admin.');
            } else {
                setErrorType('');
                setError(msg || 'Login failed. Please check your credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <Link to="/" className="back-link">← Back to Home</Link>
                    <h1 className="auth-title">Login</h1>
                    <p className="auth-subtitle">Access your CareFusion dashboard</p>
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

                    {/* Email */}
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

                    {/* Password */}
                    <div className="form-group">
                        <label htmlFor="password">Password *</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            className="form-input"
                            required
                        />
                    </div>

                    {/* Error / Status Message */}
                    {error && (
                        <div className={`error-message ${errorType ? `error-${errorType}` : ''}`} role="alert">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                    {/* Links */}
                    <div className="auth-links">
                        <Link to="/forgot-password" className="link">Forgot Password?</Link>
                        <span className="separator">•</span>
                        <Link to="/register" className="link">Create Account</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
