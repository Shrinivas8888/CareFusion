import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <div className="navbar-brand">
                    <h2>CareFusion</h2>
                    <span className="badge badge-info">{user?.role?.toUpperCase()}</span>
                </div>

                <div className="navbar-actions">
                    <div className="user-info">
                        <span className="user-email">{user?.email}</span>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
