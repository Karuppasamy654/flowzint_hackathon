import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import './Home.css';

const features = [
    { icon: '🧠', title: 'AI Understanding', desc: 'Instantly analyzes your request type, urgency, and location using intelligent NLP' },
    { icon: '🎯', title: 'Smart Matching', desc: 'Ranks helpers by proximity, availability, track record, and response speed' },
    { icon: '📡', title: 'Auto Escalation', desc: '3-tier escalation ensures help reaches you even when initial helpers are unavailable' },
    { icon: '🏅', title: 'Trust & Reputation', desc: 'Every helper is rated — platinum, gold, silver badges backed by success history' },
    { icon: '👥', title: 'Micro Communities', desc: 'Auto-creates collaboration groups for coordinated help delivery' },
    { icon: '⚡', title: 'Quick AI Assist', desc: 'Provides instant guidance while human helpers are being matched' }
];

const stats = [
    { value: '15+', label: 'Active Helpers' },
    { value: '3', label: 'Communities' },
    { value: '<30s', label: 'Avg Match Time' },
    { value: '95%', label: 'Success Rate' }
];

export default function Home() {
    const navigate = useNavigate();
    const { demoLogin } = useAuth();
    const [showLogin, setShowLogin] = useState(false);

    const handleGetStarted = () => {
        setShowLogin(true);
    };

    const handleDemo = async () => {
        try { await demoLogin(); } catch { }
        navigate('/dashboard?demo=true');
    };

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                >
                    <motion.div
                        className="hero-badge"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <span className="badge-dot" />
                        AI-Powered Crisis Response System
                    </motion.div>

                    <h1 className="hero-title">
                        Intelligent Help
                        <br />
                        <span className="gradient-text">When You Need It Most</span>
                    </h1>

                    <p className="hero-subtitle">
                        ACIN ensures help delivery through AI-driven matching, community targeting,
                        and automated escalation. Not a chatbot — an intelligent crisis response network.
                    </p>

                    <div className="hero-actions">
                        <motion.button
                            className="btn-primary btn-lg"
                            onClick={handleGetStarted}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            Get Started →
                        </motion.button>
                        <motion.button
                            className="btn-secondary btn-lg demo-btn"
                            onClick={handleDemo}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            🎬 Run Demo
                        </motion.button>
                    </div>
                </motion.div>

                {/* Floating orbs */}
                <div className="hero-orbs">
                    <div className="orb orb-1" />
                    <div className="orb orb-2" />
                    <div className="orb orb-3" />
                </div>
            </section>

            {/* Stats */}
            <section className="stats-section container">
                <div className="stats-grid">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            className="stat-item glass-card"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="features-section container">
                <motion.h2
                    className="section-heading"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    How <span className="gradient-text">ACIN</span> Works
                </motion.h2>
                <div className="features-grid">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            className="feature-card glass-card"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            whileHover={{ y: -4, borderColor: 'rgba(99, 102, 241, 0.3)' }}
                        >
                            <span className="feature-icon">{f.icon}</span>
                            <h3 className="feature-title">{f.title}</h3>
                            <p className="feature-desc">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section container">
                <motion.div
                    className="cta-card glass-card-strong"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                >
                    <h2>Ready to see ACIN in action?</h2>
                    <p>Experience the full AI-powered crisis response pipeline with our interactive demo.</p>
                    <button className="btn-primary btn-lg" onClick={handleDemo}>
                        🚀 Launch Demo Simulation
                    </button>
                </motion.div>
            </section>

            <footer className="home-footer">
                <p>ACIN — AI-Powered Social Crisis Help Network • Built for FlowZint Hackathon</p>
            </footer>

            <AnimatePresence>
                {showLogin && (
                    <LoginModal onClose={() => setShowLogin(false)} />
                )}
            </AnimatePresence>
        </div>
    );
}
