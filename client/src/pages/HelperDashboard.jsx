import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ChatWindow from '../components/ChatWindow';
import './HelperDashboard.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export default function HelperDashboard() {
    const { socket } = useSocket();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [activeRequest, setActiveRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Play synthetic sound chimes using Web Audio API
    const playBeep = (type = 'success') => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            if (type === 'success') {
                osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.3);
            } else if (type === 'alert') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
                osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
                osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.4);
            }
        } catch (e) {
            console.log('AudioContext blocked or failed:', e);
        }
    };

    // Fetch active requests on mount
    useEffect(() => {
        const fetchActiveRequests = async () => {
            try {
                const token = localStorage.getItem('acin_token');
                const res = await fetch(`${SERVER_URL}/api/requests/active`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setRequests(data);
                }
            } catch (err) {
                console.error('Failed to fetch active requests:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActiveRequests();
    }, []);

    // Setup socket listeners
    useEffect(() => {
        if (!socket) return;

        // Join helper lobby room
        socket.emit('join-helper-lobby');

        // Listen for new emergency request broadcasts
        socket.on('request-broadcast', (data) => {
            playBeep('alert');
            setRequests(prev => {
                // Prevent duplicate tickets
                if (prev.find(r => r.id === data.requestId || r._id === data.requestId)) return prev;
                return [data, ...prev];
            });
        });

        // Listen for when requester cancels ticket
        socket.on('request-cancelled', (data) => {
            setRequests(prev => prev.filter(r => r.id !== data.requestId && r._id !== data.requestId));
            if (activeRequest && (activeRequest.id === data.requestId || activeRequest._id === data.requestId)) {
                setActiveRequest(null);
                alert('Requester has cancelled the emergency request.');
            }
        });

        // Listen for success resolution
        socket.on('request-resolved', (data) => {
            // Remove request from pending list
            setRequests(prev => prev.filter(r => r.id !== data.requestId && r._id !== data.requestId));
        });

        return () => {
            socket.off('request-broadcast');
            socket.off('request-cancelled');
            socket.off('request-resolved');
        };
    }, [socket, activeRequest]);

    const handleAccept = (req) => {
        if (!socket || !user) return;
        socket.emit('volunteer-accept-request', {
            requestId: req.id || req._id,
            helperId: user.id
        });
        setActiveRequest(req);
        playBeep('success');
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="helper-dashboard-page">
            <Navbar onLogout={handleLogout} />

            <div className="helper-dashboard-container container">
                {/* Volunteer stats and metadata */}
                <div className="volunteer-hero glass-card">
                    <div className="volunteer-badge-glow" />
                    <div className="volunteer-header-main">
                        <div className="volunteer-profile-info">
                            <span className="volunteer-avatar-icon">🛡️</span>
                            <div className="volunteer-profile-details">
                                <h2 className="volunteer-panel-title">Volunteer Command Center</h2>
                                <p className="volunteer-meta-status">
                                    Logged in as <strong>{user?.name}</strong> • Status: <span className="status-badge-green">ONLINE</span>
                                </p>
                            </div>
                        </div>
                        <div className="volunteer-quick-stats">
                            <div className="v-stat-box">
                                <span className="v-stat-val">{requests.length}</span>
                                <span className="v-stat-lbl">Active Incidents</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid layout */}
                <div className="helper-grid-layout">
                    {/* Left Column: List of Incidents */}
                    <div className="helper-incidents-col">
                        <span className="column-incident-title">📋 Pending Emergencies & Calls</span>

                        {isLoading ? (
                            <div className="incidents-loader">Loading active dispatch queue...</div>
                        ) : requests.length === 0 ? (
                            <div className="incidents-empty glass-card">
                                <span>🛰️</span>
                                <p>No active incidents reported. Monitoring Delhi coordinate radius...</p>
                            </div>
                        ) : (
                            <div className="incidents-list">
                                {requests.map((req, index) => {
                                    const analysis = req.analysis || {};
                                    const score = analysis.emergencyScore || 50;
                                    const isHigh = analysis.urgency === 'high';
                                    
                                    return (
                                        <motion.div
                                            key={req.id || req._id || index}
                                            className={`incident-card glass-card ${isHigh ? 'emergency' : ''}`}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: index * 0.08 }}
                                        >
                                            <div className="incident-header">
                                                <div className="incident-category-badge">
                                                    <span className="inc-cat-icon">⚡</span>
                                                    <span>{analysis.type?.replace('_', ' ').toUpperCase()}</span>
                                                </div>
                                                <span className={`badge badge-urgency-${analysis.urgency}`}>
                                                    {analysis.urgency?.toUpperCase()}
                                                </span>
                                            </div>

                                            <p className="incident-text">"{req.text}"</p>

                                            <div className="incident-meta-details">
                                                <div className="inc-meta-item">
                                                    <span className="inc-lbl">Locality</span>
                                                    <span className="inc-val">{analysis.location?.label}</span>
                                                </div>
                                                {analysis.bloodGroup && (
                                                    <div className="inc-meta-item">
                                                        <span className="inc-lbl">Blood Group</span>
                                                        <span className="inc-val highlight">{analysis.bloodGroup}</span>
                                                    </div>
                                                )}
                                                <div className="inc-meta-item">
                                                    <span className="inc-lbl">Sentiment</span>
                                                    <span className="inc-val">{analysis.sentiment || 'neutral'}</span>
                                                </div>
                                            </div>

                                            {/* Score bar */}
                                            <div className="incident-score-section">
                                                <div className="inc-score-header">
                                                    <span>Emergency Score</span>
                                                    <span>{score}/100</span>
                                                </div>
                                                <div className="score-bar">
                                                    <div className="score-bar-fill" style={{ width: `${score}%`, background: isHigh ? 'var(--gradient-danger)' : 'var(--gradient-primary)' }} />
                                                </div>
                                            </div>

                                            <div className="incident-actions">
                                                <button 
                                                    className="btn-primary btn-sm accept-btn-ticket" 
                                                    onClick={() => handleAccept(req)}
                                                    disabled={activeRequest && (activeRequest.id === req.id || activeRequest._id === req._id)}
                                                >
                                                    🚀 Respond & Accept
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Console/Active Incident Chat */}
                    <div className="helper-console-col">
                        <AnimatePresence mode="wait">
                            {activeRequest ? (
                                <motion.div
                                    key="active-incident"
                                    className="active-incident-console glass-card-strong"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <div className="console-active-header">
                                        <div className="console-title-row">
                                            <span className="console-active-dot" />
                                            <h3>Active Incident Response</h3>
                                        </div>
                                        <p>Coordinate details using the live chat workspace.</p>
                                    </div>

                                    <div className="console-active-details">
                                        <div className="c-details-row">
                                            <span className="c-lbl">Incident ID</span>
                                            <span className="c-val">#{activeRequest._id?.slice(-6) || activeRequest.id?.slice(-6)}</span>
                                        </div>
                                        <div className="c-details-row">
                                            <span className="c-lbl">Target Locality</span>
                                            <span className="c-val">{activeRequest.analysis?.location?.label}</span>
                                        </div>
                                        <div className="c-details-row">
                                            <span className="c-lbl">Summary</span>
                                            <span className="c-val">{activeRequest.analysis?.summary}</span>
                                        </div>
                                    </div>

                                    {/* Inline Chat workspace */}
                                    <div className="console-chat-wrapper">
                                        <ChatWindow
                                            requestId={activeRequest.id || activeRequest._id}
                                            currentUser={user}
                                            helper={{ name: 'Crisis Requester', avatar: '🚨' }}
                                            onClose={() => setActiveRequest(null)}
                                        />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="standby"
                                    className="console-standby glass-card"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <span className="standby-icon">🛰️</span>
                                    <h3>Incident Console Standby</h3>
                                    <p>Awaiting incoming distress beacons. Ready to coordinate response units.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            
            <div className="dashboard-resiliency-footer" style={{
                marginTop: '40px',
                textAlign: 'center',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '20px',
                width: '100%',
                letterSpacing: '0.02em',
                opacity: 0.85
            }}>
                🛡️ Resiliency safeguard active: AI & Database fallbacks online. Even if AI fails, our fallback system ensures zero downtime.
            </div>
        </div>
    );
}
