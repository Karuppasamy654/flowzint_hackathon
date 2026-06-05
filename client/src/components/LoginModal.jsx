import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './LoginModal.css';

export default function LoginModal({ onClose }) {
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isHelper, setIsHelper] = useState(false);
    const [occupation, setOccupation] = useState('student');
    const [selectedSpecialties, setSelectedSpecialties] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (isRegister) {
                const specialtiesToSubmit = isHelper ? (selectedSpecialties.length > 0 ? selectedSpecialties : ['general']) : [];
                const res = await register(name, email, password, isHelper, occupation, specialtiesToSubmit);
                if (res.user?.isHelper) {
                    navigate('/helper');
                } else {
                    navigate('/dashboard');
                }
            } else {
                const res = await login(email, password);
                if (res.user?.isHelper) {
                    navigate('/helper');
                } else {
                    navigate('/dashboard');
                }
            }
            onClose();
        } catch (err) {
            setError(err.message || 'Authentication failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Quick demo login shortcuts
    const handleQuickLogin = async (role) => {
        setError(null);
        setIsLoading(true);
        try {
            if (role === 'seeker') {
                await login('demo@acin.ai', 'demo123');
                navigate('/dashboard');
            } else if (role === 'volunteer') {
                await login('priya@demo.com', 'demo123');
                navigate('/helper');
            }
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-modal-overlay" onClick={onClose}>
            <motion.div
                className="login-modal-container glass-card-strong"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="login-modal-header">
                    <span className="login-logo-icon">⚡</span>
                    <h3>{isRegister ? 'Join ACIN Network' : 'Access Hub Workspace'}</h3>
                    <button className="login-close-btn" onClick={onClose}>✕</button>
                </div>

                {error && <div className="login-error-banner">⚠️ {error}</div>}

                {/* Form Selection Tabs */}
                <div className="login-tabs-row">
                    <button
                        className={`login-tab-btn ${!isRegister ? 'active' : ''}`}
                        onClick={() => { setIsRegister(false); setError(null); }}
                    >
                        Sign In
                    </button>
                    <button
                        className={`login-tab-btn ${isRegister ? 'active' : ''}`}
                        onClick={() => { setIsRegister(true); setError(null); }}
                    >
                        Create Account
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="login-form-main">
                    {isRegister && (
                        <div className="form-input-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter name"
                                required
                            />
                        </div>
                    )}

                    <div className="form-input-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            required
                        />
                    </div>

                    <div className="form-input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter security password"
                            required
                        />
                    </div>

                    {isRegister && (
                        <>
                            <div className="form-input-group">
                                <label>Occupation Status</label>
                                <select
                                    value={occupation}
                                    onChange={(e) => setOccupation(e.target.value)}
                                >
                                    <option value="student">🎓 Student</option>
                                    <option value="worker">💼 Worker / Professional</option>
                                </select>
                            </div>

                            <div className="form-checkbox-group">
                                <input
                                    type="checkbox"
                                    id="isHelperCheck"
                                    checked={isHelper}
                                    onChange={(e) => setIsHelper(e.target.checked)}
                                />
                                <label htmlFor="isHelperCheck">
                                    I am registering as a <strong>volunteer helper</strong>
                                </label>
                            </div>

                             {isHelper && (
                                <div className="form-checkboxes-group">
                                    <label className="checkboxes-label">What types of help can you provide?</label>
                                    <div className="specialty-grid">
                                        {[
                                            { val: 'blood_donation', label: '🩸 Blood Donation' },
                                            { val: 'medical', label: '🏥 Medical Aid' },
                                            { val: 'tutoring', label: '📚 Tutoring' },
                                            { val: 'financial_help', label: '💰 Financial Aid' },
                                            { val: 'food_supply', label: '🍲 Food Supply' },
                                            { val: 'shelter', label: '🏠 Shelter' },
                                            { val: 'transport', label: '🚗 Transport' },
                                            { val: 'counseling', label: '🧘 Counselling' },
                                            { val: 'legal_aid', label: '⚖️ Legal Aid' },
                                            { val: 'general', label: '🤝 General Help' }
                                        ].map((item) => (
                                            <div key={item.val} className="specialty-checkbox">
                                                <input
                                                    type="checkbox"
                                                    id={`spec-${item.val}`}
                                                    checked={selectedSpecialties.includes(item.val)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedSpecialties([...selectedSpecialties, item.val]);
                                                        } else {
                                                            setSelectedSpecialties(selectedSpecialties.filter(x => x !== item.val));
                                                        }
                                                    }}
                                                />
                                                <label htmlFor={`spec-${item.val}`}>{item.label}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <button type="submit" disabled={isLoading} className="btn-primary submit-auth-btn">
                        {isLoading ? 'Processing...' : isRegister ? 'Join Network' : 'Access Workspace'}
                    </button>
                </form>

                {/* Quick Shortcuts Banner */}
                <div className="quick-shortcuts-panel">
                    <span className="shortcuts-title">🎬 Rapid Demo Gateways</span>
                    <div className="shortcuts-row">
                        <button className="shortcut-btn seeker" onClick={() => handleQuickLogin('seeker')}>
                            👤 Login as Seeker
                        </button>
                        <button className="shortcut-btn volunteer" onClick={() => handleQuickLogin('volunteer')}>
                            🛡️ Login as Volunteer Priya
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
