import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useNavigate } from 'react-router-dom';
import './LoginModal.css';

const avatarList = ['👤', '👨‍💻', '👩‍⚕️', '👨‍🎓', '👩‍🔬', '💼', '🧘‍♀️', '🚗', '🏥', '⚖️', '🍲', '🩸', '🔬', '💰', '🏠'];

const skillCategories = [
    {
        name: '💻 Technology',
        skills: ['React', 'NodeJS', 'Java', 'Python', 'C++', 'AI/ML', 'MongoDB', 'JavaScript', 'Frontend', 'Backend']
    },
    {
        name: '🎨 Design',
        skills: ['UI/UX', 'Figma', 'Photoshop', 'Graphics', 'Web Design']
    },
    {
        name: '💼 Career Development',
        skills: ['Resume Review', 'Interview Prep', 'Career Advice']
    },
    {
        name: '📚 Academics',
        skills: ['Mathematics', 'Physics', 'Chemistry', 'Tutoring']
    },
    {
        name: '🤝 Community Support',
        skills: ['Volunteering', 'Mentoring', 'First Aid', 'Blood Donation', 'Emergency']
    }
];

export default function LoginModal({ onClose, initialRegister = false }) {
    const { login, register } = useAuth();
    const { t, language, setLanguage, theme, setTheme } = useUI();
    const navigate = useNavigate();

    const [isRegister, setIsRegister] = useState(initialRegister);
    const [step, setStep] = useState(1);
    
    // Step 1: Credentials & Avatar
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('👤');

    // Step 2: Profile & Location
    const [bio, setBio] = useState('');
    const [occupation, setOccupation] = useState('student');
    const [city, setCity] = useState('Delhi');
    const [state, setState] = useState('Delhi');
    const [country, setCountry] = useState('India');

    // Step 3: Help Setup
    const [isHelper, setIsHelper] = useState(false);
    const [expertiseLevel, setExpertiseLevel] = useState('Beginner');
    const [availabilityText, setAvailabilityText] = useState('Available Now');
    const [selectedSkills, setSelectedSkills] = useState([]);

    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleNextStep = () => {
        setError(null);
        if (step === 1) {
            if (!name || !email || !password) {
                setError('Please fill in all credentials before continuing.');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!city || !state || !country) {
                setError('Please fill in your location details.');
                return;
            }
            if (!isHelper) {
                handleRegisterSubmit();
            } else {
                setStep(3);
            }
        }
    };

    const handlePrevStep = () => {
        setError(null);
        setStep(prev => Math.max(1, prev - 1));
    };

    const handleRegisterSubmit = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const extraData = {
                bio,
                city,
                state,
                country,
                avatar: selectedAvatar,
                expertiseLevel,
                availabilityText
            };
            
            await register(
                name,
                email,
                password,
                isHelper,
                occupation,
                isHelper ? (selectedSkills.length > 0 ? selectedSkills : ['General']) : [],
                extraData
            );
            
            navigate('/dashboard');
            onClose();
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignInSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
            onClose();
        } catch (err) {
            setError(err.message || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickLogin = async (role) => {
        setError(null);
        setIsLoading(true);
        try {
            if (role === 'seeker') {
                await login('demo@acin.ai', 'demo123');
                navigate('/dashboard');
            } else if (role === 'volunteer') {
                await login('priya@demo.com', 'demo123');
                navigate('/dashboard');
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
                style={{ width: isRegister && step === 3 ? '520px' : '420px', maxHeight: '90vh', overflowY: 'auto' }}
            >
                <div className="login-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="login-logo-icon">⚡</span>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{isRegister ? `${t('brand')} (${step}/3)` : t('signIn')}</h3>
                    </div>
                    <button className="login-close-btn" onClick={onClose}>✕</button>
                </div>

                {error && <div className="login-error-banner">⚠️ {error}</div>}

                {/* Form Selection Tabs (Only on Sign In stage or Step 1) */}
                {(!isRegister || step === 1) && (
                    <div className="login-tabs-row" style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.15)', padding: '4px', borderRadius: '8px' }}>
                        <button
                            className={`login-tab-btn ${!isRegister ? 'active' : ''}`}
                            onClick={() => { setIsRegister(false); setError(null); }}
                            style={{ flex: 1, padding: '10px', fontSize: '0.88rem' }}
                        >
                            {t('signIn')}
                        </button>
                        <button
                            className={`login-tab-btn ${isRegister ? 'active' : ''}`}
                            onClick={() => { setIsRegister(true); setError(null); }}
                            style={{ flex: 1, padding: '10px', fontSize: '0.88rem' }}
                        >
                            {t('createAccount')}
                        </button>
                    </div>
                )}

                {!isRegister ? (
                    /* SIGN IN VIEW */
                    <form onSubmit={handleSignInSubmit} className="login-form-main" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div className="form-input-group">
                            <label>{t('emailAddress')}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter email address"
                                required
                                style={{ padding: '12px', fontSize: '0.92rem' }}
                            />
                        </div>

                        <div className="form-input-group">
                            <label>{t('password')}</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                required
                                style={{ padding: '12px', fontSize: '0.92rem' }}
                            />
                        </div>

                        <button type="submit" disabled={isLoading} className="btn-primary submit-auth-btn" style={{ padding: '14px', fontSize: '1rem' }}>
                            {isLoading ? 'Accessing Workspace...' : t('signIn')}
                        </button>
                    </form>
                ) : (
                    /* MULTI-STEP REGISTER VIEW */
                    <div className="login-form-main" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        
                        {/* Step Indicators */}
                        <div className="step-indicators-row">
                            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}><span className="step-num">1</span></div>
                            <div className="step-bar-line" />
                            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}><span className="step-num">2</span></div>
                            <div className="step-bar-line" />
                            <div className={`step-dot ${step >= 3 ? 'active' : ''}`}><span className="step-num">3</span></div>
                        </div>

                        {step === 1 && (
                            /* STEP 1: CREDENTIALS & AVATAR */
                            <div className="onboarding-step-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div className="form-input-group">
                                    <label>{t('fullName')}</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="E.g. Priya Sharma"
                                        required
                                        style={{ padding: '12px', fontSize: '0.92rem' }}
                                    />
                                </div>
                                <div className="form-input-group">
                                    <label>{t('emailAddress')}</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="E.g. priya@example.com"
                                        required
                                        style={{ padding: '12px', fontSize: '0.92rem' }}
                                    />
                                </div>
                                <div className="form-input-group">
                                    <label>{t('password')}</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Set security password"
                                        required
                                        style={{ padding: '12px', fontSize: '0.92rem' }}
                                    />
                                </div>
                                <div className="form-input-group">
                                    <label>{t('avatarLabel')}</label>
                                    <div className="avatar-grid-picker">
                                        {avatarList.map(avatar => (
                                            <button 
                                                key={avatar}
                                                type="button"
                                                className={`avatar-picker-btn ${selectedAvatar === avatar ? 'selected' : ''}`}
                                                onClick={() => setSelectedAvatar(avatar)}
                                            >
                                                {avatar}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            /* STEP 2: PROFILE & LOCATION */
                            <div className="onboarding-step-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div className="form-input-group">
                                    <label>{t('descLabel')} / Bio</label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Write a brief tagline or intro..."
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', resize: 'none', height: '80px', outline: 'none' }}
                                    />
                                </div>
                                <div className="form-input-group">
                                    <label>{t('occupation')}</label>
                                    <select value={occupation} onChange={(e) => setOccupation(e.target.value)} style={{ padding: '12px', fontSize: '0.92rem' }}>
                                        <option value="student">🎓 Student</option>
                                        <option value="developer">👨‍💻 Software Developer</option>
                                        <option value="doctor">👩‍⚕️ Healthcare worker</option>
                                        <option value="social_worker">🤝 NGO / Social Worker</option>
                                        <option value="academic">📚 Educator / Academic</option>
                                        <option value="other">💼 Professional / Other</option>
                                    </select>
                                </div>
                                <div className="form-location-row" style={{ display: 'flex', gap: '8px' }}>
                                    <div className="form-input-group" style={{ flex: 1 }}>
                                        <label>{t('city')}</label>
                                        <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required style={{ padding: '12px', fontSize: '0.92rem' }} />
                                    </div>
                                    <div className="form-input-group" style={{ flex: 1 }}>
                                        <label>{t('state')}</label>
                                        <input type="text" value={state} onChange={(e) => setState(e.target.value)} required style={{ padding: '12px', fontSize: '0.92rem' }} />
                                    </div>
                                </div>
                                <div className="form-input-group">
                                    <label>{t('country')}</label>
                                    <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} required style={{ padding: '12px', fontSize: '0.92rem' }} />
                                </div>
                                <div className="form-checkbox-group" style={{ marginTop: '16px' }}>
                                    <input
                                        type="checkbox"
                                        id="isHelperCheck"
                                        checked={isHelper}
                                        onChange={(e) => setIsHelper(e.target.checked)}
                                    />
                                    <label htmlFor="isHelperCheck">
                                        {t('registerAsHelper')}
                                    </label>
                                </div>
                            </div>
                        )}

                        {step === 3 && isHelper && (
                            /* STEP 3: SKILLS & EXPERTISE SETUP */
                            <div className="onboarding-step-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                                    <div className="form-input-group" style={{ flex: 1 }}>
                                        <label>{t('expertise')}</label>
                                        <select value={expertiseLevel} onChange={(e) => setExpertiseLevel(e.target.value)} style={{ padding: '10px', fontSize: '0.9rem' }}>
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                            <option value="Expert">Expert</option>
                                        </select>
                                    </div>
                                    <div className="form-input-group" style={{ flex: 1 }}>
                                        <label>{t('availability')}</label>
                                        <select value={availabilityText} onChange={(e) => setAvailabilityText(e.target.value)} style={{ padding: '10px', fontSize: '0.9rem' }}>
                                            <option value="Available Now">Available Now ⚡</option>
                                            <option value="Available Today">Available Today 📅</option>
                                            <option value="Available This Week">Available This Week 🗓️</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-checkboxes-group">
                                    <label className="checkboxes-label">Select multiple skills tags you can verify:</label>
                                    <div className="skills-scroll-container" style={{ maxHeight: '180px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {skillCategories.map(cat => (
                                            <div key={cat.name} className="skill-cat-section">
                                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-accent)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{cat.name}</span>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                                                    {cat.skills.map(skill => (
                                                        <div key={skill} className="specialty-checkbox">
                                                            <input
                                                                type="checkbox"
                                                                id={`skill-${skill}`}
                                                                checked={selectedSkills.includes(skill)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedSkills([...selectedSkills, skill]);
                                                                    } else {
                                                                        setSelectedSkills(selectedSkills.filter(s => s !== skill));
                                                                    }
                                                                }}
                                                            />
                                                            <label htmlFor={`skill-${skill}`} style={{ fontSize: '0.78rem' }}>{skill}</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="modal-actions-row" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            {step > 1 && (
                                <button type="button" className="btn-secondary" style={{ flex: 1, padding: '12px' }} onClick={handlePrevStep}>
                                    {t('back')}
                                </button>
                            )}
                            <button
                                type="button"
                                className="btn-primary"
                                style={{ flex: 2, padding: '12px' }}
                                disabled={isLoading}
                                onClick={
                                    (isRegister && (step === 3 || (step === 2 && !isHelper))) 
                                        ? handleRegisterSubmit 
                                        : handleNextStep
                                }
                            >
                                {isLoading ? 'Saving...' : (isRegister && (step === 3 || (step === 2 && !isHelper))) ? t('joinFlowzint') : t('nextStep')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Quick Shortcuts Banner */}
                {(!isRegister || step === 1) && (
                    <div className="quick-shortcuts-panel" style={{ marginTop: '16px' }}>
                        <span className="shortcuts-title">🎬 Rapid Demo Gateways</span>
                        <div className="shortcuts-row">
                            <button className="shortcut-btn seeker" onClick={() => handleQuickLogin('seeker')}>
                                👤 Seeker Sandbox
                            </button>
                            <button className="shortcut-btn volunteer" onClick={() => handleQuickLogin('volunteer')}>
                                👩‍⚕️ Expert Priya
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
