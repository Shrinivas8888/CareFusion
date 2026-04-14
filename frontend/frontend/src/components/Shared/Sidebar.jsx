import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ links }) => {
    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? 'active' : ''}`
                        }
                    >
                        {link.icon && <span className="sidebar-icon">{link.icon}</span>}
                        <span>{link.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
