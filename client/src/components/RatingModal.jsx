import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import './RatingModal.css';

export default function RatingModal({ helperId, helperName, onSubmit, onClose }) {
    const { socket } = useSocket();
    const [rating, setRating] = useState(5);
    const [hoveredRating, setHoveredRating] = useState(0);

    const handleSubmit = () => {
        if (socket && helperId) {
            socket.emit('rate-helper', { helperId, rating });
        }
        if (onSubmit) {
            onSubmit(rating);
        }
    };

    return (
        <div className="rating-modal-overlay">
            <motion.div
                className="rating-modal-container glass-card-strong animate-pulse-glow"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
            >
                <span className="rating-emoji">🌟</span>
                <h3 className="rating-title">Rate Your Helper</h3>
                <p className="rating-desc">
                    How helpful was <strong>{helperName}</strong> in resolving this crisis? Your review helps keep our community safe.
                </p>

                {/* Stars Grid */}
                <div className="stars-wrapper">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                            key={star}
                            className={`star-btn ${(hoveredRating || rating) >= star ? 'filled' : ''}`}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            ★
                        </motion.button>
                    ))}
                </div>

                <div className="rating-actions">
                    <button className="btn-secondary" onClick={onClose}>
                        Skip
                    </button>
                    <button className="btn-primary" onClick={handleSubmit}>
                        Submit Review
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
