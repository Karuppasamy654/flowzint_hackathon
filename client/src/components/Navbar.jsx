import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar({ onLogout }) {
    const { user, logout, demoLogin } = useAuth();
    const [showAuth, setShowAuth] = useState(false);

    const handleLogout = () => {
        logout();
        if (onLogout) onLogout();
    };

    return (
        <motion.nav
            className="navbar"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
            <div className="navbar-inner container">
                <div className="navbar-brand">
                    <div className="navbar-logo">
                        <span className="logo-icon">⚡</span>
                        <span className="logo-text">FlowZint</span>
                    </div>
                    <span className="navbar-tagline">Real-time Assistance Platform</span>
                </div>

                <div className="navbar-actions">
                    {user ? (
                        <div className="user-info">
                            <div className="user-avatar">{user.name?.[0] || 'U'}</div>
                            <span className="user-name">{user.name}</span>
                            <button className="btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
                        </div>
                    ) : (
                        <button className="btn-primary btn-sm" onClick={demoLogin}>
                            🚀 Quick Demo
                        </button>
                    )}
                </div>
            </div>
        </motion.nav>
    );
}
