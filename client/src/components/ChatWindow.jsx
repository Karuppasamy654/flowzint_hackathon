import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { useUI } from '../context/UIContext';
import './ChatWindow.css';

const PRESET_EMOJIS = ['😀', '😂', '👍', '🙏', '❤️', '🔥', '🎉', '🚀', '🩸', '🏥', '🚨', '🤔'];

export default function ChatWindow({ requestId, currentUser, helper, onClose }) {
    const { socket } = useSocket();
    const { t } = useUI();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isHelperTyping, setIsHelperTyping] = useState(false);
    
    // WhatsApp features states
    const [showEmojiDrawer, setShowEmojiDrawer] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const recordingIntervalRef = useRef(null);
    const fileInputRef = useRef(null);

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
                // Mark incoming messages as seen
                socket.emit('mark-seen', { requestId, userId: senderId });
            }
        });

        // Listen for incoming messages
        socket.on('message-received', (message) => {
            if (message.requestId === requestId) {
                setMessages(prev => {
                    if (prev.find(m => m._id === message._id || (m.createdAt === message.createdAt && m.text === message.text))) {
                        return prev;
                    }
                    return [...prev, message];
                });
                setIsHelperTyping(false); // Stop typing when message is received
                
                // If message is from the other party, emit seen event and play notification sound
                if (message.senderId !== senderId) {
                    socket.emit('mark-seen', { requestId, userId: senderId });
                    
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

        // Listen for seen receipts update
        socket.on('messages-seen', (data) => {
            if (data.requestId === requestId) {
                setMessages(prev => prev.map(m => m.senderId === senderId ? { ...m, status: 'seen' } : m));
            }
        });

        // Listen for pinned status update
        socket.on('message-pinned-update', (data) => {
            const { messageId, isPinned, message } = data;
            setMessages(prev => prev.map(m => {
                if (m._id === messageId || m.id === messageId) {
                    return { ...m, isPinned };
                }
                return m;
            }));
        });

        return () => {
            socket.off('chat-history');
            socket.off('message-received');
            socket.off('typing-status');
            socket.off('messages-seen');
            socket.off('message-pinned-update');
        };
    }, [socket, requestId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isHelperTyping]);

    const handleSend = (textToSend = inputText, type = 'text', fileUrl = '') => {
        if ((!textToSend.trim() && !fileUrl) || !socket) return;

        socket.emit('send-message', {
            requestId,
            senderId,
            senderName,
            text: textToSend.trim(),
            type,
            fileUrl
        });

        // Stop typing indicator
        socket.emit('typing-status', {
            requestId,
            senderName,
            isTyping: false
        });

        setInputText('');
        setShowEmojiDrawer(false);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleSend();
    };

    const handleInputChange = (e) => {
        setInputText(e.target.value);
        if (!socket) return;

        // Emit typing status
        socket.emit('typing-status', {
            requestId,
            senderName,
            isTyping: true
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing-status', {
                requestId,
                senderName,
                isTyping: false
            });
        }, 1500);
    };

    // Pin toggling
    const handleTogglePin = (msg) => {
        if (!socket) return;
        const msgId = msg._id || msg.id;
        const nextPinned = !msg.isPinned;
        socket.emit('pin-message', {
            messageId: msgId,
            requestId,
            isPinned: nextPinned
        });
    };

    // Emoji clicking
    const handleEmojiClick = (emoji) => {
        setInputText(prev => prev + emoji);
    };

    // File attachments click simulation
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const isImage = file.type.startsWith('image/');
            handleSend(
                isImage ? `Sent an image: ${file.name}` : `Sent a file: ${file.name}`,
                isImage ? 'image' : 'file',
                reader.result // data URI representation
            );
        };
        reader.readAsDataURL(file);
    };

    // Recording Voice Note simulation
    const handleVoiceRecordingToggle = () => {
        if (isRecording) {
            // Stop recording & send
            clearInterval(recordingIntervalRef.current);
            setIsRecording(false);
            handleSend(`🎤 Voice Note (0:0${recordingTime > 0 ? recordingTime : 3})`, 'text');
            setRecordingTime(0);
        } else {
            // Start recording
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }
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

    // Filter messages by search keyword
    const filteredMessages = messages.filter(m => 
        m.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pinnedMessages = messages.filter(m => m.isPinned);

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
                
                {/* Header Actions */}
                <div className="chat-header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                        className={`chat-action-icon-btn ${showSearch ? 'active' : ''}`}
                        onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); }}
                        title={t('searchMessagesPlaceholder')}
                    >
                        🔍
                    </button>
                    <button className="chat-close-btn" onClick={onClose}>✕</button>
                </div>
            </div>

            {/* Inline search bar toggle */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div 
                        className="chat-search-bar-row"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: '40px', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <input
                            type="text"
                            placeholder={t('searchMessagesPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="chat-search-input"
                            autoFocus
                        />
                        {searchQuery && (
                            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pinned Messages Header Shelf */}
            {pinnedMessages.length > 0 && (
                <div className="chat-pinned-shelf">
                    <span className="pinned-shelf-title">{t('pinnedMessageLabel')}</span>
                    <div className="pinned-message-preview">
                        "{pinnedMessages[pinnedMessages.length - 1].text.slice(0, 50)}..."
                    </div>
                </div>
            )}

            {/* Live Emergency Dispatch Banner */}
            <div className="emergency-status-banner animate-pulse-glow" style={{ padding: '8px 16px', background: 'rgba(16, 185, 129, 0.12)', borderBottom: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-green)', letterSpacing: '0.04em' }}>
                    🟢 AI STATUS: HELP ON THE WAY — VOLUNTEER DISPATCHED (ETA: 8 MINS)
                </span>
                <span className="badge badge-urgency-high animate-pulse-glow" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>HELP EN ROUTE</span>
            </div>

            {/* Message Area */}
            <div className="chat-messages-container">
                {filteredMessages.length === 0 ? (
                    <div className="chat-empty-state">
                        <span>💬</span>
                        <p>{searchQuery ? t('noMatchingMessages') : t('noMessagesYet')}</p>
                    </div>
                ) : (
                    filteredMessages.map((msg, i) => {
                        const isOwnMessage = msg.senderId === senderId;
                        const isPinned = msg.isPinned;
                        
                        return (
                          <div key={msg.id || msg._id || i} className={`chat-message-row ${isOwnMessage ? 'own' : 'other'}`}>
                              <div className={`message-bubble ${isPinned ? 'pinned-highlight' : ''}`}>
                                  <div className="message-bubble-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                      <span className="message-sender">{isOwnMessage ? t('youLabel') : msg.senderName}</span>
                                      <button className="msg-pin-toggle-btn" onClick={() => handleTogglePin(msg)} title={isPinned ? 'Unpin message' : 'Pin message'}>
                                          {isPinned ? '📌' : '📍'}
                                      </button>
                                  </div>
                                  
                                  {/* Render by message type */}
                                  {msg.type === 'image' ? (
                                      <div className="chat-image-attachment">
                                          <img src={msg.fileUrl} alt="Attached attachment" style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginTop: '4px' }} />
                                          <p className="message-text" style={{ marginTop: '4px' }}>{msg.text}</p>
                                      </div>
                                  ) : msg.type === 'file' ? (
                                      <div className="chat-file-attachment" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}>
                                          <span style={{ fontSize: '1.3rem' }}>📄</span>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                              <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.text}</div>
                                              <a href={msg.fileUrl} download={msg.text} style={{ fontSize: '0.68rem', color: 'var(--accent-blue)', textDecoration: 'underline' }}>{t('downloadLabel')}</a>
                                          </div>
                                      </div>
                                  ) : (
                                      <p className="message-text">{msg.text}</p>
                                  )}

                                  {/* Footer details: time + seen ticks */}
                                  <div className="message-bubble-footer" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                      <span className="message-time">{formatTime(msg.createdAt)}</span>
                                      {isOwnMessage && (
                                          <span className={`seen-status-ticks ${msg.status || 'sent'}`}>
                                              {msg.status === 'seen' ? (
                                                  <span style={{ color: 'var(--accent-cyan)' }}>✓✓</span>
                                              ) : msg.status === 'delivered' ? (
                                                  <span>✓✓</span>
                                              ) : (
                                                  <span>✓</span>
                                                )}
                                            </span>
                                        )}
                                    </div>
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
                            <div className="typing-indicator-chat" style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '18px' }}>
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Emoji Drawer Panel */}
            <AnimatePresence>
                {showEmojiDrawer && (
                    <motion.div 
                        className="chat-emoji-drawer-card glass-card-strong"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                    >
                        <div className="emoji-picker-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', padding: '10px' }}>
                            {PRESET_EMOJIS.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleEmojiClick(emoji)}
                                    style={{ background: 'transparent', fontSize: '1.4rem', border: 'none', cursor: 'pointer', outline: 'none' }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Smart Suggested Replies & Quick Actions (Wow Feature 6) */}
            <div className="smart-chat-extras" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.1)' }}>
                {/* AI Suggested Replies */}
                <div className="ai-suggestions-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 800, textTransform: 'uppercase' }}>🤖 AI SUGGESTIONS:</span>
                    {["On my way!", "I am outside the gate", "Oxygen cylinder ready!", "Thank you!"].map((reply) => (
                        <button
                            key={reply}
                            type="button"
                            onClick={() => handleSend(reply, 'text')}
                            className="chat-suggested-pill-btn"
                            style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', color: 'var(--text-accent)', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                            💬 {reply}
                        </button>
                    ))}
                </div>

                {/* Quick Action Buttons */}
                <div className="quick-actions-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={() => handleSend("📍 Shared Location: Karol Bagh (GPS Coordinates: 28.6519, 77.1905)", "text")}
                        className="quick-action-pill-btn"
                        style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', color: 'var(--accent-cyan)', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        📍 Share Location
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            alert("📞 Voice Call Simulation: Connecting emergency VoIP routing to volunteer...");
                            handleSend("📞 Initiated emergency call check-in", "text");
                        }}
                        className="quick-action-pill-btn"
                        style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', color: 'var(--accent-purple)', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        📞 Call Volunteer
                    </button>
                </div>
            </div>

            {/* Input Form Area */}
            <div className="chat-input-form-wrapper" style={{ position: 'relative' }}>
                <form onSubmit={handleFormSubmit} className="chat-input-form" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    
                    {/* Attachment trigger */}
                    <button 
                        type="button" 
                        className="chat-attach-btn" 
                        onClick={() => fileInputRef.current.click()}
                        title={t('attachFileTitle')}
                        style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '4px' }}
                    >
                        📎
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                        accept="image/*,application/pdf,text/plain"
                    />

                    {/* Emoji drawer trigger */}
                    <button 
                        type="button" 
                        className="chat-emoji-toggle" 
                        onClick={() => setShowEmojiDrawer(!showEmojiDrawer)}
                        title={t('emojiDrawerTitle')}
                        style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '4px' }}
                    >
                        😀
                    </button>

                    <input
                        type="text"
                        value={inputText}
                        onChange={handleInputChange}
                        placeholder={isRecording ? t('recordingVoiceNote') : t('chatPlaceholder')}
                        className="chat-text-input"
                        disabled={isRecording}
                        style={{ flex: 1 }}
                    />

                    {/* Voice recorder simulation */}
                    <button
                        type="button"
                        className={`chat-voice-btn ${isRecording ? 'recording' : ''}`}
                        onClick={handleVoiceRecordingToggle}
                        title={isRecording ? t('stopVoiceNote') : t('recordVoiceNote')}
                        style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '4px', animation: isRecording ? 'pulse-glow 1s infinite' : 'none' }}
                    >
                        {isRecording ? '🟥' : '🎤'}
                    </button>

                    <button type="submit" disabled={!inputText.trim()} className="chat-send-submit-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </form>
            </div>
        </motion.div>
    );
}
