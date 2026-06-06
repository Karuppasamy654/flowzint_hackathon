import { useState } from 'react';
import { motion } from 'framer-motion';
import './CrisisRadarMap.css';

export default function CrisisRadarMap({ status, analysis, helpers, escalationTier }) {
    const userLoc = analysis?.location || { lat: 28.6139, lng: 77.2090, label: 'Delhi' };
    const [hoveredHelperId, setHoveredHelperId] = useState(null);
    
    // Map latitude/longitude to SVG 400x400 viewbox (center 200, 200)
    const mapCoords = (lat, lng) => {
        const userLat = userLoc.lat;
        const userLng = userLoc.lng;
        
        // Scale factor: roughly 400px represents ~35km (0.3 degrees)
        const scaleLat = 900;
        const scaleLng = 900;
        
        const x = 200 + (lng - userLng) * scaleLng;
        const y = 200 - (lat - userLat) * scaleLat; // Invert SVG y-axis
        
        // Keep within map boundaries
        return {
            x: Math.max(40, Math.min(360, x)),
            y: Math.max(40, Math.min(360, y))
        };
    };

    // Concentric circles representing search tiers
    const searchRadii = [60, 110, 160];

    // Status details to overlay
    const getStatusText = () => {
        switch (status) {
            case 'received': return '📥 Submitting crisis details...';
            case 'analyzing': return '🧠 AI classification & location parsing...';
            case 'searching_communities': return '📡 Notifying local community groups...';
            case 'matching': return '🎯 Ranking nearby helpers by proximity...';
            case 'waiting': return '⏳ Awaiting acceptance from top matches...';
            case 'expanding_search': return '📡 Radial expansion triggered (Radius: +15km)...';
            case 'institution_escalation': return '🏛️ Routing request to emergency institutions...';
            case 'helper_accepted': return '✅ Dispatch confirmed! Helper responding...';
            case 'resolved': return '🎉 Help arrived safely.';
            default: return '🛰️ Radar Standby — Ready for prompt';
        }
    };

    return (
        <div className="crisis-radar-map glass-card-strong">
            <div className="radar-header">
                <span className="radar-title">🛰️ Real-time Emergency Dispatch Radar</span>
                <span className="radar-status">{getStatusText()}</span>
            </div>

            <div className="radar-svg-wrapper">
                {/* SVG Scanning Indicator Overlay */}
                {status !== 'idle' && status !== 'resolved' && status !== 'helper_accepted' && (
                    <div className="radar-scan-overlay">
                        <span className="scan-text">SCANNING REGION...</span>
                    </div>
                )}

                <svg width="100%" height="100%" viewBox="0 0 400 400" className="radar-svg">
                    {/* Glowing grid backgrounds */}
                    <defs>
                        <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    <circle cx="200" cy="200" r="180" fill="url(#radarGlow)" />

                    {/* Concentric Search Radar Pulsing Waves (Wow Feature 3.1) */}
                    {status !== 'idle' && status !== 'resolved' && (
                        <>
                            <circle cx="200" cy="200" r="0" className="radar-pulse-wave wave-1" />
                            <circle cx="200" cy="200" r="0" className="radar-pulse-wave wave-2" />
                            <circle cx="200" cy="200" r="0" className="radar-pulse-wave wave-3" />
                        </>
                    )}

                    {/* Concentric search rings */}
                    {searchRadii.map((radius, idx) => {
                        const active = escalationTier >= idx + 1 || (status === 'matching' && idx === 0);
                        return (
                            <circle
                                key={idx}
                                cx="200"
                                cy="200"
                                r={radius}
                                className={`radar-ring ${active ? 'active' : ''} tier-${idx + 1}`}
                            />
                        );
                    })}

                    {/* Radar Crosshairs */}
                    <line x1="200" y1="20" x2="200" y2="380" className="radar-grid-line" />
                    <line x1="20" y1="200" x2="380" y2="200" className="radar-grid-line" />

                    {/* Rotating Radar Sweep Line */}
                    {(status !== 'idle' && status !== 'resolved' && status !== 'helper_accepted') && (
                        <motion.line
                            x1="200"
                            y1="200"
                            x2="200"
                            y2="20"
                            stroke="url(#laserGrad)"
                            strokeWidth="3"
                            style={{ originX: '200px', originY: '200px' }}
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                        />
                    )}

                    {/* Render active helper nodes */}
                    {helpers && helpers.map((helper, idx) => {
                        const coords = mapCoords(helper.location?.lat || 28.6139, helper.location?.lng || 77.2090);
                        const isAccepted = helper.status === 'accepted';
                        const idKey = helper.id || helper._id?.toString() || idx;
                        const isHovered = hoveredHelperId === idKey;
                        
                        return (
                            <g 
                                key={idKey}
                                onMouseEnter={() => setHoveredHelperId(idKey)}
                                onMouseLeave={() => setHoveredHelperId(null)}
                                style={{ cursor: 'pointer' }}
                            >
                                {/* Connecting line to user */}
                                <motion.line
                                    x1="200"
                                    y1="200"
                                    x2={coords.x}
                                    y2={coords.y}
                                    className={`radar-connection-line ${isAccepted ? 'accepted' : 'active-matching'}`}
                                    initial={{ strokeDasharray: 8, strokeDashoffset: 50, opacity: 0 }}
                                    animate={{ strokeDashoffset: 0, opacity: 0.8 }}
                                    transition={{ duration: 1 }}
                                />

                                {/* Glowing background pulse for helper node */}
                                <circle
                                    cx={coords.x}
                                    cy={coords.y}
                                    r={isAccepted || isHovered ? 18 : 10}
                                    className={`helper-node-glow ${isAccepted ? 'accepted' : ''}`}
                                />

                                {/* Central dot representing helper */}
                                <circle
                                    cx={coords.x}
                                    cy={coords.y}
                                    r={isHovered ? 8 : 6}
                                    className={`helper-node ${isAccepted ? 'accepted' : ''}`}
                                    style={{ transition: 'r 0.2s ease' }}
                                />

                                {/* Avatar text overlay */}
                                <text
                                    x={coords.x}
                                    y={coords.y - 12}
                                    className="helper-node-label"
                                    textAnchor="middle"
                                >
                                    {helper.avatar} {helper.name.split(' ')[0]} ({helper.distance}km)
                                </text>

                                {/* Specialty Skill Tag on Node Hover (Wow Feature 3.2) */}
                                {isHovered && (
                                    <g style={{ pointerEvents: 'none' }}>
                                        <rect
                                            x={coords.x - 70}
                                            y={coords.y - 52}
                                            width="140"
                                            height="32"
                                            rx="6"
                                            fill="#111827"
                                            stroke="var(--accent-cyan)"
                                            strokeWidth="1"
                                            opacity="0.95"
                                        />
                                        <text
                                            x={coords.x}
                                            y={coords.y - 40}
                                            fill="var(--text-muted)"
                                            fontSize="8px"
                                            fontWeight="800"
                                            textAnchor="middle"
                                        >
                                            🛠️ VERIFIED SPECIALTIES:
                                        </text>
                                        <text
                                            x={coords.x}
                                            y={coords.y - 28}
                                            fill="var(--accent-cyan)"
                                            fontSize="8px"
                                            fontWeight="700"
                                            textAnchor="middle"
                                        >
                                            {helper.skills?.slice(0, 2).join(', ') || 'First Aid, Emergency'}
                                        </text>
                                    </g>
                                )}
                            </g>
                        );
                    })}

                    {/* Center Node representing YOU */}
                    <g>
                        <circle cx="200" cy="200" r="18" className="center-node-glow" />
                        <circle cx="200" cy="200" r="7" className="center-node" />
                        <text x="200" y="222" className="center-node-label" textAnchor="middle">
                            📍 YOU ({userLoc.label})
                        </text>
                    </g>
                </svg>
            </div>
            
            {/* Legend / Metrics overlay */}
            <div className="radar-legend">
                <div className="legend-item"><span className="dot dot-user" /> User (Center)</div>
                <div className="legend-item"><span className="dot dot-match" /> Potential Helper</div>
                <div className="legend-item"><span className="dot dot-accept" /> Confirmed Responder</div>
            </div>
        </div>
    );
}
