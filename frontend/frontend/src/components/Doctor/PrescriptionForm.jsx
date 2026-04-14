import { useState } from 'react';
import MedicineAutocomplete from './MedicineAutocomplete';
import DiagnosticTestAutocomplete from './DiagnosticTestAutocomplete';
import './PrescriptionForm.css';

const PrescriptionForm = ({ appointment, onSubmit, onCancel, initialLabTests = [], onLabTestsChange }) => {
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [medicines, setMedicines] = useState([]);
    const [labTests, setLabTests] = useState(initialLabTests);
    const [currentMedicine, setCurrentMedicine] = useState(null);
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [duration, setDuration] = useState('');
    const [errors, setErrors] = useState({});

    const handleMedicineSelect = (medicine) => {
        setCurrentMedicine(medicine);
        setErrors({ ...errors, medicine: '' });
    };

    const handleAddMedicine = () => {
        const newErrors = {};
        if (!currentMedicine) newErrors.medicine = 'Select a medicine first';
        if (!dosage.trim()) newErrors.dosage = 'Req.';
        if (!frequency.trim()) newErrors.frequency = 'Req.';
        if (!duration.trim()) newErrors.duration = 'Req.';

        if (Object.keys(newErrors).length > 0) {
            setErrors({ ...errors, ...newErrors });
            return;
        }

        const medicineEntry = {
            id: currentMedicine._id,
            name: currentMedicine.name,
            manufacturer: currentMedicine.manufacturer,
            saltComposition: currentMedicine.saltComposition,
            price: currentMedicine.price,
            dosage,
            frequency,
            duration
        };

        setMedicines([...medicines, medicineEntry]);
        setCurrentMedicine(null);
        // Regimen fields (dosage, freq, duration) are now STICKY
        setErrors({});
    };

    const handleFillStandard = () => {
        setDosage('1 tablet');
        setFrequency('3 times daily');
        setDuration('5 days');
        setErrors({ ...errors, dosage: '', frequency: '', duration: '' });
    };

    const handleRemoveMedicine = (index) => {
        setMedicines(medicines.filter((_, i) => i !== index));
    };

    const handleAddTest = (test) => {
        if (!labTests.find(t => t._id === test._id)) {
            const updated = [...labTests, test];
            setLabTests(updated);
            if (onLabTestsChange) onLabTestsChange(updated);
        }
    };

    const handleRemoveTest = (index) => {
        const updated = labTests.filter((_, i) => i !== index);
        setLabTests(updated);
        if (onLabTestsChange) onLabTestsChange(updated);
    };

    const handleSubmit = () => {
        const newErrors = {};
        if (!diagnosis.trim()) newErrors.diagnosis = 'Diagnosis is required';
        if (medicines.length === 0) newErrors.medicines = 'Add at least one medicine';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Helper function to check if a string is a valid MongoDB ObjectId
        const isValidObjectId = (id) => {
            if (!id) return false;
            // MongoDB ObjectId is 24 hex characters
            return /^[0-9a-fA-F]{24}$/.test(id.toString());
        };

        const prescriptionData = {
            appointmentId: appointment._id,
            patientId: appointment.patientId?._id || appointment.patient,
            diagnosis,
            notes,
            medicines: medicines.map(m => ({
                medicineId: m.id,
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency,
                duration: m.duration
            })),
            labTestsRequested: labTests.map(t => {
                // Only include testId if it's a valid ObjectId
                const testData = { name: t.name };
                if (isValidObjectId(t._id)) {
                    testData.testId = t._id;
                }
                return testData;
            })
        };

        console.log('📝 Prescription data being submitted:', prescriptionData);
        onSubmit(prescriptionData);
    };

    return (
        <div className="prescription-form">
            <div className="prescription-container">
                {/* Left Side: Core Info */}
                <div className="form-section">
                    <div className="section-title">
                        <i>📝</i>
                        <span>Clinical Findings</span>
                    </div>
                    <div className="form-group">
                        <label>Diagnosis *</label>
                        <textarea
                            value={diagnosis}
                            onChange={(e) => {
                                setDiagnosis(e.target.value);
                                setErrors({ ...errors, diagnosis: '' });
                            }}
                            placeholder="Enter patient diagnosis and findings..."
                            rows="4"
                        />
                        {errors.diagnosis && <div className="validation-msg">⚠️ {errors.diagnosis}</div>}
                    </div>

                    <div className="form-group">
                        <label>Instructions to Patient</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Advice on diet, rest, or follow-up..."
                            rows="2"
                        />
                    </div>
                </div>

                {/* Right Side: Medicine Selection */}
                <div className="form-section">
                    <div className="section-title" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <i>💊</i>
                            <span>Prescribe Medicines</span>
                        </div>
                        <button
                            type="button"
                            className="btn-premium btn-outline"
                            style={{ padding: '4px 12px', fontSize: '12px' }}
                            onClick={handleFillStandard}
                        >
                            ⚡ Fill Standard
                        </button>
                    </div>

                    <div className="form-group">
                        <label>Search Master Database</label>
                        <MedicineAutocomplete
                            onSelect={handleMedicineSelect}
                            placeholder="Type 3-4 letters (e.g. Paracetamol)"
                        />
                    </div>

                    {currentMedicine && (
                        <div className="medicine-detail-card">
                            <div className="detail-header">
                                <h4>{currentMedicine.name}</h4>
                            </div>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Salt Composition</span>
                                    <span className="detail-value">{currentMedicine.saltComposition || 'Not specified'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Manufacturer</span>
                                    <span className="detail-value">{currentMedicine.manufacturer || 'General'}</span>
                                </div>
                                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                                    <span className="detail-label">Primary Uses</span>
                                    <span className="detail-value">{currentMedicine.uses || 'Standard medical use'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="dosage-inputs">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Dosage</label>
                            <input
                                type="text"
                                value={dosage}
                                onChange={(e) => setDosage(e.target.value)}
                                placeholder="1 tab"
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Freq.</label>
                            <input
                                type="text"
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                placeholder="3x/day"
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Duration</label>
                            <input
                                type="text"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                placeholder="5 days"
                            />
                        </div>
                        <button type="button" className="add-btn" onClick={handleAddMedicine}>
                            + Add
                        </button>
                    </div>
                    {errors.medicine && <div className="validation-msg">⚠️ {errors.medicine}</div>}
                </div>

                {/* Bottom: Medicines List */}
                <div className="medicines-list-section">
                    <div className="section-title">
                        <i>📜</i>
                        <span>Selected Medicines</span>
                    </div>

                    {medicines.length > 0 ? (
                        <div className="premium-table-container">
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th>Medicine & Manufacturer</th>
                                        <th>Dosage</th>
                                        <th>Frequency</th>
                                        <th>Duration</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {medicines.map((med, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="med-name-cell">
                                                    <span className="med-main">{med.name}</span>
                                                    <span className="med-sub">{med.manufacturer}</span>
                                                </div>
                                            </td>
                                            <td><span className="badge-tag tag-dosage">{med.dosage}</span></td>
                                            <td><span className="badge-tag tag-freq">{med.frequency}</span></td>
                                            <td><span className="badge-tag tag-dur">{med.duration}</span></td>
                                            <td>
                                                <button
                                                    className="remove-action-btn"
                                                    onClick={() => handleRemoveMedicine(index)}
                                                    title="Remove"
                                                >
                                                    ❌
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-medicines">
                            <i>🏥</i>
                            <p>No medicines added. Use the search box above to prescribe.</p>
                        </div>
                    )}
                    {errors.medicines && <div className="validation-msg">⚠️ {errors.medicines}</div>}
                </div>

                {/* Lab Tests Section */}
                <div className="form-section" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                    <div className="section-title">
                        <i>🧪</i>
                        <span>Suggested Lab Tests</span>
                    </div>
                    <div className="form-group">
                        <label>Search Master Test Database</label>
                        <DiagnosticTestAutocomplete
                            onSelect={handleAddTest}
                        />
                    </div>
                    {labTests.length > 0 && (
                        <div className="premium-table-container">
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th>Test Name</th>
                                        <th>Category</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {labTests.map((test, index) => (
                                        <tr key={index}>
                                            <td><span className="med-main">{test.name}</span></td>
                                            <td><span className="badge-tag tag-dosage">{test.category}</span></td>
                                            <td>
                                                <button
                                                    className="remove-action-btn"
                                                    onClick={() => handleRemoveTest(index)}
                                                >
                                                    ❌
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="form-footer">
                <button type="button" className="btn-premium btn-outline" onClick={onCancel}>
                    Discard Changes
                </button>
                <button type="button" className="btn-premium btn-solid" onClick={handleSubmit}>
                    🚀 Sign & Issue Prescription
                </button>
            </div>
        </div>
    );
};

export default PrescriptionForm;
