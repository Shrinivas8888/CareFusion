import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { publicAPI } from '../../services/api';
import './HomePage.css';

const HomePage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);

    // Fetch real doctors from database
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                // Use public API endpoint (no authentication required)
                const response = await publicAPI.getDoctors();
                // Show ALL doctors
                setDoctors(response.data || []);
            } catch (error) {
                console.error('Error fetching doctors:', error);
                setDoctors([]);
            } finally {
                setLoadingDoctors(false);
            }
        };

        fetchDoctors();
    }, []);

    const services = [
        {
            icon: '🩺',
            title: 'General Medicine',
            description: 'Comprehensive primary care services for all ages with experienced physicians.'
        },
        {
            icon: '❤️',
            title: 'Cardiology',
            description: 'Advanced cardiac care with state-of-the-art diagnostic and treatment facilities.'
        },
        {
            icon: '🧠',
            title: 'Neurology',
            description: 'Expert neurological care for brain and nervous system disorders.'
        },
        {
            icon: '🔬',
            title: 'Laboratory',
            description: 'Cutting-edge diagnostic services with accurate and quick results.'
        },
        {
            icon: '💊',
            title: 'Pharmacy',
            description: '24/7 pharmacy services with all essential medicines in stock.'
        },
        {
            icon: '🚑',
            title: 'Emergency Care',
            description: 'Round-the-clock emergency services with rapid response team.'
        }
    ];

    return (
        <div className="homepage">
            {/* Navbar */}
            <nav className="navbar">
                <div className="nav-container">
                    <div className="nav-logo">
                        <span className="logo-icon">🏥</span>
                        <span className="logo-text">Carefusion</span>
                    </div>

                    <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
                        <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
                        <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
                        <a href="#services" onClick={() => setMobileMenuOpen(false)}>Services</a>
                        <a href="#doctors" onClick={() => setMobileMenuOpen(false)}>Doctors</a>
                        <a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a>
                    </div>

                    <div className="nav-buttons">
                        <Link to="/login?role=admin" className="btn-admin">Admin</Link>
                        <Link to="/login" className="btn-login">Login</Link>
                        <Link to="/register" className="btn-register">Register</Link>
                    </div>

                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? '✕' : '☰'}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero" id="home">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1 className="hero-title">Quality Healthcare for Everyone</h1>
                    <p className="hero-description">
                        Experience world-class medical care with our team of expert doctors and
                        state-of-the-art facilities. Your health is our priority.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/register" className="btn-primary">
                            <span>📅</span> Book Appointment
                        </Link>
                        <a href="tel:+15559110000" className="btn-emergency">
                            <span>🚨</span> Emergency: +1 (555) 911-0000
                        </a>
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="statistics">
                <div className="container">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">👥</div>
                            <div className="stat-number">50,000+</div>
                            <div className="stat-label">Happy Patients</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">👨‍⚕️</div>
                            <div className="stat-number">200+</div>
                            <div className="stat-label">Expert Doctors</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🔬</div>
                            <div className="stat-number">100K+</div>
                            <div className="stat-label">Lab Tests</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">⭐</div>
                            <div className="stat-number">25+</div>
                            <div className="stat-label">Years of Service</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="services" id="services">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Our Services</h2>
                        <p className="section-subtitle">
                            Comprehensive healthcare services tailored to your needs
                        </p>
                    </div>
                    <div className="services-grid">
                        {services.map((service, index) => (
                            <div key={index} className="service-card">
                                <div className="service-icon">{service.icon}</div>
                                <h3 className="service-title">{service.title}</h3>
                                <p className="service-description">{service.description}</p>
                                <button className="service-link">Learn More →</button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Doctors Section */}
            <section className="doctors" id="doctors">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Meet Our Doctors</h2>
                        <p className="section-subtitle">
                            Experienced professionals dedicated to your health
                        </p>
                    </div>
                    {loadingDoctors ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <div className="spinner"></div>
                        </div>
                    ) : doctors.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                            No doctors registered yet. Check back soon!
                        </p>
                    ) : (
                        <div className="doctors-grid">
                            {doctors.map((doctor, index) => (
                                <div key={doctor._id || index} className="doctor-card">
                                    <div className="doctor-image-container">
                                        <img
                                            src={doctor.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.fullName || 'Doctor')}&size=400&background=2563eb&color=fff`}
                                            alt={doctor.fullName}
                                            className="doctor-image"
                                        />
                                        <div className="doctor-overlay">
                                            <button className="btn-view-profile">View Profile</button>
                                        </div>
                                    </div>
                                    <div className="doctor-info">
                                        <h3 className="doctor-name">{doctor.fullName || 'Dr. Name'}</h3>
                                        <p className="doctor-specialization">{doctor.specialization || 'General Medicine'}</p>
                                        <p className="doctor-experience">
                                            <span className="experience-icon">💼</span>
                                            {doctor.experience || 'Expert'} experience
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* About Section */}
            <section className="about" id="about">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-image">
                            <img
                                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop"
                                alt="Hospital building"
                            />
                        </div>
                        <div className="about-content">
                            <h2 className="about-title">About Carefusion Hospital</h2>
                            <p className="about-text">
                                For over 25 years, Carefusion Hospital has been a beacon of hope and
                                healing in our community. We combine cutting-edge medical technology
                                with compassionate care to deliver the best possible outcomes for our patients.
                            </p>
                            <div className="about-features">
                                <div className="about-feature">
                                    <div className="feature-icon">🎯</div>
                                    <div className="feature-content">
                                        <h4>Our Mission</h4>
                                        <p>To provide accessible, high-quality healthcare services to all members of our community.</p>
                                    </div>
                                </div>
                                <div className="about-feature">
                                    <div className="feature-icon">👁️</div>
                                    <div className="feature-content">
                                        <h4>Our Vision</h4>
                                        <p>To be the leading healthcare provider recognized for excellence and innovation.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer" id="contact">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-column">
                            <h3 className="footer-title">
                                <span className="logo-icon">🏥</span>
                                Carefusion
                            </h3>
                            <p className="footer-text">
                                Your trusted partner in health and wellness. Providing quality
                                care since 1999.
                            </p>
                            <div className="social-links">
                                <a href="#" className="social-link">📘</a>
                                <a href="#" className="social-link">🐦</a>
                                <a href="#" className="social-link">📷</a>
                                <a href="#" className="social-link">💼</a>
                            </div>
                        </div>

                        <div className="footer-column">
                            <h4 className="footer-heading">Quick Links</h4>
                            <ul className="footer-links">
                                <li><a href="#home">Home</a></li>
                                <li><a href="#about">About Us</a></li>
                                <li><a href="#services">Services</a></li>
                                <li><a href="#doctors">Doctors</a></li>
                                <li><a href="#contact">Contact</a></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h4 className="footer-heading">Services</h4>
                            <ul className="footer-links">
                                <li><a href="#">General Medicine</a></li>
                                <li><a href="#">Cardiology</a></li>
                                <li><a href="#">Neurology</a></li>
                                <li><a href="#">Laboratory</a></li>
                                <li><a href="#">Emergency Care</a></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h4 className="footer-heading">Contact Info</h4>
                            <ul className="footer-contact">
                                <li>
                                    <span className="contact-icon">📍</span>
                                    123 Medical Center Dr, Health City, HC 12345
                                </li>
                                <li>
                                    <span className="contact-icon">📞</span>
                                    +1 (555) 123-4567
                                </li>
                                <li>
                                    <span className="contact-icon">✉️</span>
                                    info@medicare.com
                                </li>
                                <li>
                                    <span className="contact-icon">🕐</span>
                                    24/7 Emergency Services
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>&copy; 2024 Carefusion Hospital. All rights reserved.</p>
                        <div className="footer-bottom-links">
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
