import { Routes, Route } from 'react-router-dom';
import Navbar from '../Shared/Navbar';
import Sidebar from '../Shared/Sidebar';
import '../Patient/PatientDashboard.css';
import { useState, useEffect } from 'react';
import { pharmacyAPI } from '../../services/api';

const PharmacyDashboard = () => {
    const sidebarLinks = [
        { to: '/pharmacy', label: 'Dashboard' },
        { to: '/pharmacy/prescriptions', label: 'Prescriptions' },
        { to: '/pharmacy/inventory', label: 'Inventory' },
        { to: '/pharmacy/sales', label: 'Sales Report' },
    ];

    return (
        <div>
            <Navbar />
            <div className="dashboard-layout">
                <Sidebar links={sidebarLinks} />
                <main className="dashboard-main">
                    <Routes>
                        <Route index element={<PharmacyHome />} />
                        <Route path="prescriptions" element={<Prescriptions />} />
                        <Route path="inventory" element={<Inventory />} />
                        <Route path="sales" element={<SalesReport />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

const PharmacyHome = () => {
    const [stats, setStats] = useState({ pending: 0, ready: 0, dispensed: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            pharmacyAPI.getPrescriptions('pending'),
            pharmacyAPI.getPrescriptions('ready'),
            pharmacyAPI.getPrescriptions('dispensed')
        ])
            .then(([pendingRes, readyRes, dispensedRes]) => {
                setStats({
                    pending: pendingRes.data.length,
                    ready: readyRes.data.length,
                    dispensed: dispensedRes.data.length
                });
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="spinner"></div>;

    return (
        <div>
            <h1 className="mb-lg">Pharmacy Dashboard</h1>
            <div className="grid grid-4">
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Pending</h3>
                    <p className="text-4xl font-bold">{stats.pending}</p>
                    <p className="text-sm text-gray-500">Awaiting check</p>
                </div>
                <div className="card" style={{ backgroundColor: '#dbeafe', borderColor: '#3b82f6' }}>
                    <h3 className="text-gray-600 mb-sm">Ready</h3>
                    <p className="text-4xl font-bold">{stats.ready}</p>
                    <p className="text-sm text-gray-500">Ready for pickup</p>
                </div>
                <div className="card" style={{ backgroundColor: '#fef3c7', borderColor: '#f59e0b' }}>
                    <h3 className="text-gray-600 mb-sm">Out of Stock</h3>
                    <p className="text-4xl font-bold">—</p>
                    <p className="text-sm text-gray-500">View in Prescriptions</p>
                </div>
                <div className="card" style={{ backgroundColor: '#d1fae5', borderColor: '#10b981' }}>
                    <h3 className="text-gray-600 mb-sm">Dispensed</h3>
                    <p className="text-4xl font-bold">{stats.dispensed}</p>
                    <p className="text-sm text-gray-500">Completed</p>
                </div>
            </div>
        </div>
    );
};

const Prescriptions = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchPrescriptions = () => {
        setLoading(true);
        const statusParam = filter === 'all' ? undefined : filter;
        pharmacyAPI.getPrescriptions(statusParam)
            .then(res => setPrescriptions(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPrescriptions();
    }, [filter]);

    const handleStatusUpdate = async (id, status) => {
        setActionLoading(id);
        try {
            await pharmacyAPI.updatePrescriptionStatus(id, status);
            fetchPrescriptions();
        } catch (error) {
            console.error(error);
            alert('Failed to update status');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDispense = async (id) => {
        setActionLoading(id);
        try {
            await pharmacyAPI.dispensePrescription(id);
            fetchPrescriptions();
        } catch (error) {
            console.error(error);
            alert('Failed to dispense');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status) => {
        const map = { pending: 'warning', ready: 'info', out_of_stock: 'danger', dispensed: 'success' };
        return map[status] || 'secondary';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-lg">
                <h1>Incoming Prescriptions</h1>
                <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 'auto' }}>
                    <option value="all">All Incoming</option>
                    <option value="pending">Pending</option>
                    <option value="ready">Ready</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="dispensed">Dispensed</option>
                </select>
            </div>

            {loading ? <div className="spinner"></div> : (
                <div className="grid">
                    {prescriptions.length === 0 ? (
                        <p className="text-gray-500">No prescriptions found</p>
                    ) : (
                        prescriptions.map((rx) => (
                            <div key={rx._id} className="card">
                                <div className="flex justify-between items-center mb-md">
                                    <div>
                                        <h3>{rx.patientId?.fullName}</h3>
                                        <p className="text-sm text-gray-500">Dr. {rx.doctorId?.fullName} • {rx.prescriptionId || rx._id}</p>
                                    </div>
                                    <span className={`badge badge-${getStatusBadge(rx.status)}`}>
                                        {rx.status?.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="mb-sm"><strong>Diagnosis:</strong> {rx.diagnosis}</p>
                                <div className="mb-md">
                                    <strong>Medicines:</strong>
                                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                        {rx.medicines?.map((med, idx) => (
                                            <li key={idx}>{med.name} - {med.dosage}, {med.frequency} for {med.duration}</li>
                                        ))}
                                    </ul>
                                </div>
                                {rx.labTestsRequested && rx.labTestsRequested.length > 0 && (
                                    <div className="mb-md">
                                        <strong>Lab Tests Requested:</strong>
                                        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', listStyleType: 'circle' }}>
                                            {rx.labTestsRequested.map((test, idx) => (
                                                <li key={idx} className="text-info-dark">{test.name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {rx.status !== 'dispensed' && (
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {rx.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleStatusUpdate(rx._id, 'ready')} className="btn btn-sm btn-info" disabled={actionLoading === rx._id}>
                                                    Mark Ready
                                                </button>
                                                <button onClick={() => handleStatusUpdate(rx._id, 'out_of_stock')} className="btn btn-sm btn-warning" disabled={actionLoading === rx._id}>
                                                    Out of Stock
                                                </button>
                                            </>
                                        )}
                                        {(rx.status === 'ready' || rx.status === 'out_of_stock') && (
                                            <>
                                                {rx.status === 'out_of_stock' && (
                                                    <button onClick={() => handleStatusUpdate(rx._id, 'ready')} className="btn btn-sm btn-info" disabled={actionLoading === rx._id}>
                                                        Mark Ready
                                                    </button>
                                                )}
                                                <button onClick={() => handleDispense(rx._id)} className="btn btn-sm btn-success" disabled={actionLoading === rx._id}>
                                                    {actionLoading === rx._id ? '...' : 'Dispense'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const Inventory = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({ name: '', genericName: '', quantity: 0, minQuantity: 10, unit: 'strip', category: 'tablet' });

    const fetchInventory = () => {
        setLoading(true);
        pharmacyAPI.getInventory()
            .then(res => setMedicines(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleAddMedicine = async (e) => {
        e.preventDefault();
        try {
            await pharmacyAPI.addMedicine(formData);
            setShowAdd(false);
            setFormData({ name: '', genericName: '', quantity: 0, minQuantity: 10, unit: 'strip', category: 'tablet' });
            fetchInventory();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add medicine');
        }
    };

    const handleUpdateQuantity = async (id, quantity) => {
        try {
            await pharmacyAPI.updateInventory(id, { quantity });
            fetchInventory();
        } catch (err) {
            alert('Failed to update');
        }
    };

    const getStatusBadge = (status) => {
        const map = { in_stock: 'success', low_stock: 'warning', out_of_stock: 'danger' };
        return map[status] || 'secondary';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-lg">
                <h1>Medicine Inventory</h1>
                <button onClick={() => setShowAdd(!showAdd)} className="btn btn-primary">+ Add Medicine</button>
            </div>

            {showAdd && (
                <div className="card mb-lg">
                    <h3>Add New Medicine</h3>
                    <form onSubmit={handleAddMedicine} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '600px' }}>
                        <input className="input" placeholder="Medicine Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                        <input className="input" placeholder="Generic Name" value={formData.genericName} onChange={(e) => setFormData({ ...formData, genericName: e.target.value })} />
                        <input type="number" className="input" placeholder="Quantity" value={formData.quantity || ''} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} min="0" />
                        <input type="number" className="input" placeholder="Min Quantity" value={formData.minQuantity || ''} onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 10 })} min="0" />
                        <select className="input" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}>
                            <option value="strip">Strip</option>
                            <option value="bottle">Bottle</option>
                            <option value="box">Box</option>
                            <option value="piece">Piece</option>
                        </select>
                        <select className="input" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                            <option value="tablet">Tablet</option>
                            <option value="capsule">Capsule</option>
                            <option value="syrup">Syrup</option>
                            <option value="injection">Injection</option>
                            <option value="cream">Cream</option>
                            <option value="other">Other</option>
                        </select>
                        <button type="submit" className="btn btn-success" style={{ gridColumn: '1 / -1' }}>Add</button>
                    </form>
                </div>
            )}

            {loading ? <div className="spinner"></div> : (
                <div className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {medicines.length === 0 ? (
                                <tr><td colSpan="5">No medicines in inventory. Add one above.</td></tr>
                            ) : (
                                medicines.map((med) => (
                                    <tr key={med._id}>
                                        <td><strong>{med.name}</strong>{med.genericName && <span className="text-gray-500 text-sm ml-1">({med.genericName})</span>}</td>
                                        <td>{med.category}</td>
                                        <td>
                                            <input type="number" min="0" defaultValue={med.quantity} style={{ width: '80px' }}
                                                onBlur={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v !== med.quantity) handleUpdateQuantity(med._id, v); }} />
                                            {' '}{med.unit}
                                        </td>
                                        <td><span className={`badge badge-${getStatusBadge(med.status)}`}>{med.status}</span></td>
                                        <td>—</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const SalesReport = () => {
    const [data, setData] = useState({ prescriptions: [], summary: {} });
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchReport = () => {
        setLoading(true);
        pharmacyAPI.getSalesReport(startDate || undefined, endDate || undefined)
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchReport();
    }, []);

    return (
        <div>
            <h1 className="mb-lg">Sales Report</h1>
            <div className="flex gap-2 mb-lg" style={{ flexWrap: 'wrap' }}>
                <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="Start" />
                <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="End" />
                <button onClick={fetchReport} className="btn btn-primary">Apply Filter</button>
            </div>
            <div className="card mb-lg">
                <h3>Summary</h3>
                <p className="text-2xl font-bold">{data.summary?.totalDispensed ?? 0} prescriptions dispensed</p>
                <p className="text-sm text-gray-500">{data.summary?.period === 'all' ? 'All time' : `${startDate} to ${endDate}`}</p>
            </div>
            {loading ? <div className="spinner"></div> : (
                <div className="card">
                    <h3>Dispensed Prescriptions</h3>
                    {data.prescriptions?.length === 0 ? (
                        <p className="text-gray-500">No dispensed prescriptions in this period.</p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Doctor</th>
                                    <th>Dispensed At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.prescriptions?.map((p) => (
                                    <tr key={p._id}>
                                        <td>{p.patientId?.fullName}</td>
                                        <td>Dr. {p.doctorId?.fullName}</td>
                                        <td>{p.dispensedAt ? new Date(p.dispensedAt).toLocaleString() : '—'}</td>
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

export default PharmacyDashboard;
