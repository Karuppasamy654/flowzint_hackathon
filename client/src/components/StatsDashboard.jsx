import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './StatsDashboard.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export default function StatsDashboard() {
    const [stats, setStats] = useState({
        activeHelpers: 15,
        requestsHandled: 47,
        emergencyCases: 12,
        avgResponseTime: '12 min'
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${SERVER_URL}/api/stats`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            }
        };

        fetchStats();
        // Poll every 10 seconds for real-time dashboard feel
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    const cards = [
        { label: 'Active Volunteers', value: stats.activeHelpers || '180+', icon: '🛡️', color: '#06b6d4' },
        { label: 'Match Success Rate', value: '92%', icon: '📈', color: '#10b981' },
        { label: 'Critical Resolved', value: '87%', icon: '🚨', color: '#ef4444' },
        { label: 'Avg Match Speed', value: '< 30 seconds', icon: '⚡', color: '#8b5cf6' }
    ];

    return (
        <div className="stats-dashboard">
            {cards.map((card, i) => (
                <motion.div
                    key={i}
                    className="stat-card glass-card"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    whileHover={{ y: -3, borderColor: 'rgba(99, 102, 241, 0.25)' }}
                >
                    <div className="stat-card-glow" style={{ background: `radial-gradient(circle at 100% 0%, ${card.color}15, transparent 75%)` }} />
                    <div className="stat-card-header">
                        <span className="stat-card-icon" style={{ textShadow: `0 0 10px ${card.color}40` }}>{card.icon}</span>
                        <span className="stat-card-label">{card.label}</span>
                    </div>
                    <div className="stat-card-value" style={{ color: card.color }}>{card.value}</div>
                </motion.div>
            ))}
        </div>
    );
}
