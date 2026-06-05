import { motion, AnimatePresence } from 'framer-motion';
import './StatusPanel.css';

const statusConfig = {
    idle: { icon: '💬', label: 'Ready', color: 'var(--text-muted)' },
    received: { icon: '📥', label: 'Request Received', color: 'var(--accent-blue)' },
    analyzing: { icon: '🧠', label: 'AI Analyzing Request', color: 'var(--accent-purple)' },
    searching_communities: { icon: '🔍', label: 'Searching Communities', color: 'var(--accent-cyan)' },
    matching: { icon: '🎯', label: 'Matching Helpers', color: 'var(--accent-blue)' },
    waiting: { icon: '⏳', label: 'Awaiting Response', color: 'var(--accent-amber)' },
    expanding_search: { icon: '📡', label: 'Expanding Search', color: 'var(--accent-pink)' },
    institution_escalation: { icon: '🏛️', label: 'Escalating to Institution', color: 'var(--accent-red)' },
    helper_accepted: { icon: '✅', label: 'Helper Accepted', color: 'var(--accent-green)' },
    resolved: { icon: '🎉', label: 'Help Confirmed!', color: 'var(--accent-green)' }
};

export default function StatusPanel({ status, analysis, communities, quickAssist }) {
    const config = statusConfig[status] || statusConfig.idle;
    const isActive = status !== 'idle' && status !== 'resolved';

    // Extract wow variables
    const confidence = analysis ? Math.round((analysis.confidence || 0.92) * 100) : 0;
    const score = analysis ? (analysis.emergencyScore || 50) : 0;
    const isHigh = analysis?.urgency === 'high';
    const emergencyLabel = score >= 80 ? 'CRITICAL HIGH' : score >= 50 ? 'MEDIUM' : 'LOW';

    // Local vs Gemini AI flag
    const isLocal = analysis?.confidence === 0.85; // Custom marker we set for regex fallback

    return (
        <AnimatePresence mode="wait">
            {status !== 'idle' && (
                <motion.div
                    className="status-panel glass-card"
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Status Header */}
                    <div className="status-header">
                        <div className={`status-indicator ${isActive ? 'active' : ''}`}>
                            <span className="status-icon">{config.icon}</span>
                        </div>
                        <div className="status-info">
                            <span className="status-label" style={{ color: config.color }}>{config.label}</span>
                            {isActive && (
                                <div className="typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upgraded WOW FACTOR - AI Crisis Intel Panel */}
                    <AnimatePresence>
                        {analysis && (status === 'analyzing' || status !== 'received') && (
                            <motion.div
                                className="analysis-section"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                            >
                                <div className="analysis-header-new">
                                    <span className="section-title-intel">🔥 AI Crisis Intelligence Panel</span>
                                    <span className="safeguard-pill">
                                        {isLocal ? '🛡️ Local NLP Backup' : '⚡ Gemini AI Online'}
                                    </span>
                                </div>

                                <div className="analysis-intel-grid">
                                    {/* Confidence Level */}
                                    <div className="intel-card">
                                        <div className="intel-card-header">
                                            <span className="intel-card-lbl">AI Confidence Score</span>
                                            <span className="intel-card-val" style={{ color: 'var(--accent-cyan)' }}>{confidence}%</span>
                                        </div>
                                        <div className="intel-progress-bar">
                                            <motion.div 
                                                className="intel-progress-fill cyan"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${confidence}%` }}
                                                transition={{ duration: 0.8 }}
                                            />
                                        </div>
                                    </div>

                                    {/* Emergency Level */}
                                    <div className="intel-card">
                                        <div className="intel-card-header">
                                            <span className="intel-card-lbl">Emergency Score</span>
                                            <span className="intel-card-val" style={{ color: isHigh ? 'var(--accent-red)' : 'var(--accent-amber)' }}>{score}/100</span>
                                        </div>
                                        <div className="intel-progress-bar">
                                            <motion.div 
                                                className={`intel-progress-fill ${isHigh ? 'red' : 'amber'}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${score}%` }}
                                                transition={{ duration: 0.8 }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Details Grid */}
                                <div className="analysis-grid margin-top-intel">
                                    <div className="analysis-item">
                                        <span className="analysis-label">Parsed Category</span>
                                        <span className="analysis-value">{analysis.type?.replace('_', ' ')}</span>
                                    </div>
                                    <div className="analysis-item">
                                        <span className="analysis-label">Threat Level</span>
                                        <span className={`badge ${isHigh ? 'badge-urgency-high animate-pulse-glow' : 'badge-urgency-medium'}`}>
                                            {emergencyLabel}
                                        </span>
                                    </div>
                                    <div className="analysis-item">
                                        <span className="analysis-label">Stress Sentiment</span>
                                        <span className="analysis-value text-capitalize">{analysis.sentiment || 'neutral'}</span>
                                    </div>
                                    <div className="analysis-item">
                                        <span className="analysis-label">Incident GPS</span>
                                        <span className="analysis-value">{analysis.location?.label}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Communities */}
                    <AnimatePresence>
                        {communities && communities.length > 0 && (
                            <motion.div
                                className="communities-section"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ duration: 0.4 }}
                            >
                                <span className="section-title">📡 Communities Searched</span>
                                <div className="community-list">
                                    {communities.map((c, i) => (
                                        <motion.div
                                            key={c.id}
                                            className="community-item glass-card"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.15 }}
                                        >
                                            <span className="comm-icon">{c.icon}</span>
                                            <div className="comm-info">
                                                <span className="comm-name">{c.name}</span>
                                                <span className="comm-count">{c.memberCount?.toLocaleString()} members</span>
                                            </div>
                                            <div className="comm-status">
                                                <span className="comm-active-dot"></span>
                                                Notified
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Quick AI Assist */}
                    <AnimatePresence>
                        {quickAssist && quickAssist.length > 0 && status !== 'resolved' && (
                            <motion.div
                                className="assist-section"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ duration: 0.4, delay: 0.3 }}
                            >
                                <span className="section-title">💡 Quick AI Assist</span>
                                <div className="assist-tips">
                                    {quickAssist.map((tip, i) => (
                                        <motion.div
                                            key={i}
                                            className="assist-tip"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + i * 0.1 }}
                                        >
                                            {tip}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
