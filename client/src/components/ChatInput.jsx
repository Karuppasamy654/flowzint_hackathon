import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ChatInput.css';

export default function ChatInput({ onSubmit, disabled, demoMode }) {
    const [text, setText] = useState('');
    const [isEmergency, setIsEmergency] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (demoMode) {
            setText('');
            const demoText = 'Need O+ blood urgently near Connaught Place';
            let i = 0;
            const interval = setInterval(() => {
                if (i <= demoText.length) {
                    setText(demoText.slice(0, i));
                    i++;
                } else {
                    clearInterval(interval);
                    setIsEmergency(true);
                    setTimeout(() => {
                        onSubmit(demoText, true);
                    }, 600);
                }
            }, 50);
            return () => clearInterval(interval);
        }
    }, [demoMode]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim() || disabled) return;
        onSubmit(text.trim(), isEmergency);
        setText('');
    };

    const suggestions = [
        'Need O+ blood urgently',
        'Looking for math tutor for exam prep',
        'Need financial help for medical bills',
        'Feeling overwhelmed, need someone to talk to'
    ];

    return (
        <div className="chat-input-wrapper">
            <motion.div
                className={`chat-input-container glass-card-strong ${isFocused ? 'focused' : ''} ${isEmergency ? 'emergency' : ''}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <div className="input-header">
                    <span className="input-label">Describe your situation</span>
                    <motion.button
                        className={`emergency-toggle ${isEmergency ? 'active' : ''}`}
                        onClick={() => setIsEmergency(!isEmergency)}
                        whileTap={{ scale: 0.95 }}
                        disabled={disabled}
                    >
                        <span className="emergency-icon">🚨</span>
                        <span>Emergency</span>
                    </motion.button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-row">
                        <textarea
                            ref={inputRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder="Tell us what help you need..."
                            disabled={disabled}
                            rows={3}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                        <motion.button
                            type="submit"
                            className="send-btn"
                            disabled={!text.trim() || disabled}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </motion.button>
                    </div>
                </form>

                <AnimatePresence>
                    {!disabled && !text && (
                        <motion.div
                            className="suggestions"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <span className="suggestions-label">Quick examples:</span>
                            <div className="suggestion-chips">
                                {suggestions.map((s, i) => (
                                    <motion.button
                                        key={i}
                                        className="suggestion-chip"
                                        onClick={() => setText(s)}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.08 }}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        {s}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
