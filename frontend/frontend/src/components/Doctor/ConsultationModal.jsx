import { useState } from 'react';
import PrescriptionForm from './PrescriptionForm';
import DiagnosticTestForm from './DiagnosticTestForm';
import { doctorAPI } from '../../services/api';
import './ConsultationModal.css';

const ConsultationModal = ({ appointment, onClose, onPrescriptionSubmit }) => {
    const [activeTab, setActiveTab] = useState('prescription');
    const [selectedTests, setSelectedTests] = useState([]);

    if (!appointment) return null;

    const patient = appointment.patientId || {};
    const patientInitial = (patient.fullName || 'U').charAt(0).toUpperCase();

    return (
        <div className="consultation-modal-overlay">
            <div className="consultation-modal-content">
                {/* Header with Patient Brief */}
                <div className="modal-header">
                    <div className="patient-brief">
                        <div className="avatar-placeholder">{patientInitial}</div>
                        <div className="patient-info-text">
                            <h2>{patient.fullName || 'Unknown Patient'}</h2>
                            <div className="patient-meta">
                                <span className="meta-item">🎂 {patient.age || 'N/A'} yrs</span>
                                <span className="meta-item">⚥ {patient.gender || 'Unknown'}</span>
                                <span className="meta-item">🆔 #{appointment._id.slice(-6).toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                    <button className="close-modal-btn" onClick={onClose} title="Close">
                        ×
                    </button>
                </div>

                {/* Modern Tabs */}
                <div className="modal-tabs">
                    <button
                        className={`modal-tab ${activeTab === 'prescription' ? 'active' : ''}`}
                        onClick={() => setActiveTab('prescription')}
                    >
                        🩺 Create Prescription
                    </button>
                    <button
                        className={`modal-tab ${activeTab === 'lab' ? 'active' : ''}`}
                        onClick={() => setActiveTab('lab')}
                    >
                        🧪 Request Lab Test
                    </button>
                </div>

                {/* Modal Body */}
                <div className="modal-body">
                    {activeTab === 'prescription' ? (
                        <PrescriptionForm
                            appointment={appointment}
                            onSubmit={onPrescriptionSubmit}
                            onCancel={onClose}
                            initialLabTests={selectedTests}
                            onLabTestsChange={setSelectedTests}
                        />
                    ) : (
                        <div className="lab-test-tab-container">
                            <DiagnosticTestForm
                                selectedTests={selectedTests}
                                onAddTest={(test) => setSelectedTests([...selectedTests, test])}
                                onRemoveTest={(index) => setSelectedTests(selectedTests.filter((_, i) => i !== index))}
                            />
                            <div className="form-footer">
                                <button className="btn-premium btn-solid" onClick={() => {
                                    // Submit lab tests separately if needed, or redirect to prescription
                                    setActiveTab('prescription');
                                }}>
                                    ✅ Added {selectedTests.length} tests to Prescription
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConsultationModal;
