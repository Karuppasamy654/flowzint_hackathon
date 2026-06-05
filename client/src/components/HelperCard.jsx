import { motion } from 'framer-motion';
import './HelperCard.css';

const badgeColors = {
    Platinum: 'badge-platinum',
    Gold: 'badge-gold',
    Silver: 'badge-silver',
    Bronze: 'badge-bronze',
    Institution: 'badge-platinum'
};

export default function HelperCard({ helper, index, isExpanded, status }) {
    const accepted = status === 'accepted';
    const rejected = status === 'rejected';

    return (
        <motion.div
            className={`helper-card glass-card ${accepted ? 'accepted' : ''} ${rejected ? 'rejected' : ''} ${isExpanded ? 'expanded' : ''}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.4, delay: index * 0.12 }}
            layout
        >
            {accepted && <div className="accepted-glow" />}

            <div className="helper-header">
                <div className="helper-avatar">{helper.avatar}</div>
                <div className="helper-info">
                    <div className="helper-name-row">
                        <span className="helper-name">{helper.name}</span>
                        <span className={`badge ${badgeColors[helper.badge] || 'badge-silver'}`}>
                            {helper.badge}
                        </span>
                    </div>
                    <div className="helper-meta">
                        <span>{helper.distance} km away</span>
                        {helper.bloodGroup && <span>🩸 {helper.bloodGroup}</span>}
                    </div>
                </div>
                <div className="helper-score-ring">
                    <svg width="52" height="52" viewBox="0 0 52 52">
                        <circle cx="26" cy="26" r="22" fill="none" stroke="var(--bg-tertiary)" strokeWidth="4" />
                        <motion.circle
                            cx="26" cy="26" r="22" fill="none"
                            stroke="url(#scoreGrad)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 22}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - (helper.score?.total || 0) / 100) }}
                            transition={{ duration: 1.2, delay: index * 0.12 + 0.3 }}
                            transform="rotate(-90 26 26)"
                        />
                        <defs>
                            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="var(--accent-blue)" />
                                <stop offset="100%" stopColor="var(--accent-purple)" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span className="score-text">{helper.score?.total || 0}</span>
                </div>
            </div>

            <div className="score-breakdown">
                <div className="score-item">
                    <span className="score-label">Proximity</span>
                    <div className="score-bar">
                        <motion.div
                            className="score-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${helper.score?.proximity || 0}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 + 0.5 }}
                        />
                    </div>
                    <span className="score-val">{helper.score?.proximity || 0}</span>
                </div>
                <div className="score-item">
                    <span className="score-label">Availability</span>
                    <div className="score-bar">
                        <motion.div
                            className="score-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${helper.score?.availability || 0}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 + 0.6 }}
                        />
                    </div>
                    <span className="score-val">{helper.score?.availability || 0}</span>
                </div>
                <div className="score-item">
                    <span className="score-label">Track Record</span>
                    <div className="score-bar">
                        <motion.div
                            className="score-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${helper.score?.pastSuccess || 0}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 + 0.7 }}
                        />
                    </div>
                    <span className="score-val">{helper.score?.pastSuccess || 0}</span>
                </div>
                <div className="score-item">
                    <span className="score-label">Response Speed</span>
                    <div className="score-bar">
                        <motion.div
                            className="score-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${helper.score?.responseSpeed || 0}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 + 0.8 }}
                        />
                    </div>
                    <span className="score-val">{helper.score?.responseSpeed || 0}</span>
                </div>
            </div>

            <div className="helper-footer">
                <div className="response-prob">
                    <span className="prob-label">Response Probability</span>
                    <span className="prob-value">{helper.responseProbability || 0}%</span>
                </div>
                {accepted && (
                    <motion.div
                        className="accepted-badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        ✅ Accepted
                    </motion.div>
                )}
                {rejected && (
                    <span className="rejected-badge">Unavailable</span>
                )}
            </div>
        </motion.div>
    );
}
