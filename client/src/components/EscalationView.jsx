import { motion, AnimatePresence } from 'framer-motion';
import './EscalationView.css';

const tierConfig = [
    { tier: 1, label: 'Community Search', icon: '🔍', color: 'var(--accent-blue)', desc: 'Searching nearby communities' },
    { tier: 2, label: 'Expanded Search', icon: '📡', color: 'var(--accent-pink)', desc: 'Widening search radius' },
    { tier: 3, label: 'Institution Alert', icon: '🏛️', color: 'var(--accent-red)', desc: 'Escalating to institutions' }
];

export default function EscalationView({ currentTier, escalationData }) {
    if (!currentTier || currentTier < 1) return null;

    return (
        <motion.div
            className="escalation-view glass-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="escalation-header">
                <span className="section-title">⚡ Escalation Pipeline</span>
                <span className={`escalation-tier-badge tier-${currentTier}`}>
                    Tier {currentTier}
                </span>
            </div>

            <div className="escalation-timeline">
                {tierConfig.map((t, i) => {
                    const isActive = currentTier === t.tier;
                    const isComplete = currentTier > t.tier;
                    const isPending = currentTier < t.tier;

                    return (
                        <motion.div
                            key={t.tier}
                            className={`tier-step ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''} ${isPending ? 'pending' : ''}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.15 }}
                        >
                            <div className="tier-connector">
                                <div className={`tier-dot ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}>
                                    {isComplete ? '✓' : isActive ? t.icon : (i + 1)}
                                </div>
                                {i < tierConfig.length - 1 && (
                                    <div className={`tier-line ${isComplete ? 'complete' : ''}`} />
                                )}
                            </div>
                            <div className="tier-content">
                                <span className="tier-label" style={{ color: isActive ? t.color : undefined }}>
                                    {t.label}
                                </span>
                                <span className="tier-desc">{t.desc}</span>
                                {isActive && (
                                    <motion.div
                                        className="tier-active-indicator"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <div className="typing-indicator">
                                            <span></span><span></span><span></span>
                                        </div>
                                        <span className="active-text">
                                            {escalationData?.message || 'Processing...'}
                                        </span>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Institution info */}
            <AnimatePresence>
                {escalationData?.institution && (
                    <motion.div
                        className="institution-card glass-card"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <span className="inst-icon">{escalationData.institution.icon}</span>
                        <div className="inst-info">
                            <span className="inst-name">{escalationData.institution.name}</span>
                            <span className="inst-type">{escalationData.institution.type}</span>
                        </div>
                        <span className="inst-eta">~{escalationData.institution.responseTime}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
