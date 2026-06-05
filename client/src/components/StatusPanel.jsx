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

                    {/* AI Analysis Results */}
                    <AnimatePresence>
                        {analysis && (status === 'analyzing' || status !== 'received') && (
                            <motion.div
                                className="analysis-section"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                            >
                                <div className="analysis-header">
                                    <span className="section-title">🧠 AI Analysis</span>
                                    <span className="confidence-badge">
                                        {Math.round((analysis.confidence || 0.92) * 100)}% confidence
                                    </span>
                                </div>
                                <div className="analysis-grid">
                                    <div className="analysis-item">
                                        <span className="analysis-label">Type</span>
                                        <span className="analysis-value">{analysis.type?.replace('_', ' ')}</span>
                                    </div>
                                    <div className="analysis-item">
                                        <span className="analysis-label">Urgency</span>
                                        <span className={`badge badge-urgency-${analysis.urgency}`}>
                                            {analysis.urgency?.toUpperCase()}
                                        </span>
                                    </div>
                                    {analysis.bloodGroup && (
                                        <div className="analysis-item">
                                            <span className="analysis-label">Blood Group</span>
                                            <span className="analysis-value highlight">{analysis.bloodGroup}</span>
                                        </div>
                                    )}
                                    <div className="analysis-item">
                                        <span className="analysis-label">Location</span>
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
