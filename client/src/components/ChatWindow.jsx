import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import './ChatWindow.css';

export default function ChatWindow({ requestId, currentUser, helper, onClose }) {
    const { socket } = useSocket();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isHelperTyping, setIsHelperTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const senderId = currentUser?.id || 'anonymous';
    const senderName = currentUser?.name || 'You';

    useEffect(() => {
        if (!socket || !requestId) return;

        // Join chat room
        socket.emit('join-chat', { requestId });

        // Listen for history
        socket.on('chat-history', (data) => {
            if (data.requestId === requestId) {
                setMessages(data.messages || []);
            }
        });

        // Listen for incoming messages
        socket.on('message-received', (message) => {
            if (message.requestId === requestId) {
                setMessages(prev => [...prev, message]);
                setIsHelperTyping(false); // Stop typing when message is received
                
                // Play notification chime if from the other party
                if (message.senderId !== senderId) {
                    try {
                        const ctx = new (window.AudioContext || window.webkitAudioContext)();
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
                        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
                        gain.gain.setValueAtTime(0.08, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                        osc.start(ctx.currentTime);
                        osc.stop(ctx.currentTime + 0.2);
                    } catch (e) {}
                }
            }
        });

        // Listen for typing indicator
        socket.on('typing-status', (data) => {
            if (data.senderName !== senderName) {
                setIsHelperTyping(data.isTyping);
            }
        });

        return () => {
            socket.off('chat-history');
            socket.off('message-received');
            socket.off('typing-status');
        };
    }, [socket, requestId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isHelperTyping]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputText.trim() || !socket) return;

        socket.emit('send-message', {
            requestId,
            senderId,
            senderName,
            text: inputText.trim()
        });

        // Emit typing status stopped
        socket.emit('typing-status', {
            requestId,
            senderName,
            isTyping: false
        });

        setInputText('');
    };

    const handleInputChange = (e) => {
        setInputText(e.target.value);
        if (!socket) return;

        // Emit typing status started
        socket.emit('typing-status', {
            requestId,
            senderName,
            isTyping: true
        });

        // Clear previous timeout and set new one to stop typing indicator after 1.5s
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing-status', {
                requestId,
                senderName,
                isTyping: false
            });
        }, 1500);
    };

    // Format timestamps
    const formatTime = (isoString) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    };

    return (
        <motion.div
            className="chat-window-panel glass-card-strong"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        >
            {/* Header */}
            <div className="chat-header">
                <div className="chat-helper-avatar">{helper?.avatar || '👤'}</div>
                <div className="chat-helper-details">
                    <span className="chat-helper-name">{helper?.name || 'Helper Connection'}</span>
                    <span className="chat-helper-status">
                        {isHelperTyping ? 'typing...' : 'Active Connection'}
                    </span>
                </div>
                <button className="chat-close-btn" onClick={onClose}>✕</button>
            </div>

            {/* Message Area */}
            <div className="chat-messages-container">
                {messages.length === 0 ? (
                    <div className="chat-empty-state">
                        <span>💬</span>
                        <p>No messages yet. Send a message to coordinate help details.</p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isOwnMessage = msg.senderId === senderId;
                        return (
                            <div key={msg.id || msg._id || i} className={`chat-message-row ${isOwnMessage ? 'own' : 'other'}`}>
                                <div className="message-bubble">
                                    <span className="message-sender">{isOwnMessage ? 'You' : msg.senderName}</span>
                                    <p className="message-text">{msg.text}</p>
                                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Helper typing state */}
                {isHelperTyping && (
                    <div className="chat-message-row other">
                        <div className="message-bubble typing">
                            <span className="message-sender">{helper?.name}</span>
                            <div className="typing-indicator-chat">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="chat-input-form">
                <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="Type a message to coordinate..."
                    className="chat-text-input"
                />
                <button type="submit" disabled={!inputText.trim()} className="chat-send-submit-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </form>
        </motion.div>
    );
}
