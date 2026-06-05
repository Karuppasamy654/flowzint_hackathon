import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ChatWindow from './ChatWindow';
import RatingModal from './RatingModal';
import './SuccessScreen.css';

export default function SuccessScreen({ data }) {
    const { user } = useAuth();
    const [showChat, setShowChat] = useState(false);
    const [showRating, setShowRating] = useState(false);
    const [hasRated, setHasRated] = useState(false);

    useEffect(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
            osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.45); // C6
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.75);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.75);
        } catch (e) {}
    }, []);

    if (!data) return null;

    const isInstitution = data.helper?.isInstitution || false;

    const handleRatingSubmit = (score) => {
        setHasRated(true);
        setShowRating(false);
        alert(`Thank you for rating ${data.helper?.name} ${score} stars!`);
    };

    return (
        <div className="success-screen-wrapper">
            <motion.div
                className="success-screen"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
            >
                <div className="success-glow-bg" />

                <motion.div
                    className="success-icon"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                >
                    <div className="success-ring" />
                    <span>✅</span>
                </motion.div>

                <motion.h2
                    className="success-title"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    Help Confirmed!
                </motion.h2>

                <motion.p
                    className="success-message"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    {data.message}
                </motion.p>

                <motion.div
                    className="success-helper-card glass-card-strong"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="success-helper-avatar">{data.helper?.avatar}</div>
                    <div className="success-helper-info">
                        <span className="success-helper-name">{data.helper?.name}</span>
                        <div className="success-helper-meta">
                            {data.helper?.badge && <span className="badge badge-gold">{data.helper.badge}</span>}
                            {data.helper?.distance && <span>{data.helper.distance} km away</span>}
                        </div>
                    </div>
                    <div className="success-eta">
                        <span className="eta-label">ETA</span>
                        <span className="eta-value">{data.eta}</span>
                    </div>
                </motion.div>

                {/* Live Chat & Rating Actions */}
                <motion.div 
                    className="action-triggers"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    {!isInstitution && (
                        <button 
                            className="btn-secondary chat-trigger-btn" 
                            onClick={() => setShowChat(true)}
                        >
                            💬 Open Live Chat
                        </button>
                    )}
                    
                    {!isInstitution && !hasRated && (
                        <button 
                            className="btn-secondary rating-trigger-btn" 
                            onClick={() => setShowRating(true)}
                        >
                            ⭐ Rate Volunteer
                        </button>
                    )}

                    {hasRated && (
                        <span className="rated-confirmation-badge">⭐ Review Submitted</span>
                    )}
                </motion.div>

                {/* Timeline */}
                {data.timeline && data.timeline.length > 0 && (
                    <motion.div
                        className="success-timeline"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <span className="timeline-title">📋 Request Timeline</span>
                        <div className="timeline-items">
                            {data.timeline.map((item, i) => (
                                <motion.div
                                    key={i}
                                    className="timeline-item"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.9 + i * 0.08 }}
                                >
                                    <span className="timeline-dot" />
                                    <span className="timeline-event">{item.detail}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                <motion.div
                    className="success-actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    <button className="btn-primary" onClick={() => window.location.reload()}>
                        New Request
                    </button>
                </motion.div>
            </motion.div>

            {/* Chat Overlay drawer */}
            <AnimatePresence>
                {showChat && (
                    <ChatWindow
                        requestId={data.requestId}
                        currentUser={user}
                        helper={data.helper}
                        onClose={() => setShowChat(false)}
                    />
                )}
            </AnimatePresence>

            {/* Rating Modal pop-up */}
            <AnimatePresence>
                {showRating && (
                    <RatingModal
                        helperId={data.helper?.id}
                        helperName={data.helper?.name}
                        onSubmit={handleRatingSubmit}
                        onClose={() => setShowRating(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
