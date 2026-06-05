import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import ChatInput from '../components/ChatInput';
import StatusPanel from '../components/StatusPanel';
import HelperCard from '../components/HelperCard';
import EscalationView from '../components/EscalationView';
import SuccessScreen from '../components/SuccessScreen';
import Navbar from '../components/Navbar';
import StatsDashboard from '../components/StatsDashboard';
import CrisisRadarMap from '../components/CrisisRadarMap';
import './Dashboard.css';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user, logout } = useAuth();
  
  const demoMode = searchParams.get('demo') === 'true';
  
  const [status, setStatus] = useState('idle');
  const [analysis, setAnalysis] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [helpers, setHelpers] = useState([]);
  const [escalationTier, setEscalationTier] = useState(0);
  const [escalationData, setEscalationData] = useState(null);
  const [quickAssist, setQuickAssist] = useState([]);
  const [successData, setSuccessData] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // GPS Coordinates and Toast alerts states
  const [gpsLocation, setGpsLocation] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Synthetic beep audio synthesizer (Web Audio API)
  const playBeep = (type = 'success') => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'alert') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'notification') {
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      console.log('AudioContext blocked or failed:', e);
    }
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    playBeep('notification');
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // HTML5 Geolocation Query
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setGpsLocation({
            lat,
            lng,
            label: 'My Coordinates (GPS)'
          });
          console.log(`[Geolocation] Coordinates acquired: ${lat}, ${lng}`);
        },
        (error) => {
          console.log('[Geolocation] Permission denied or failed:', error.message);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('request-received', (data) => {
      setRequestId(data.requestId);
      setStatus('received');
      addToast('Emergency dispatch request registered.');
    });

    socket.on('ai-analysis', (data) => {
      setAnalysis(data.analysis);
      setQuickAssist(data.quickAssist);
      setStatus('analyzing');
      addToast('AI analysis completed. Classifying threat vectors...');
      setTimeout(() => setStatus('searching_communities'), 1000);
    });

    socket.on('escalation-update', (data) => {
      setEscalationTier(data.tier);
      setEscalationData(data);
      setStatus(data.status);
      
      if (data.communities) {
        setCommunities(data.communities);
      }

      if (data.message) {
        addToast(data.message, 'warning');
      }
    });

    socket.on('helpers-found', (data) => {
      setHelpers(data.helpers);
      setStatus('matching');
      addToast(`Located ${data.helpers.length} nearby rescue matches. Connecting...`);
      setTimeout(() => setStatus('waiting'), 500);
    });

    socket.on('helper-response', (data) => {
      if (data.action === 'accepted') {
        playBeep('success');
        setStatus('helper_accepted');
        setHelpers(prev => prev.map(h => 
          (h.id === data.helper.id || h._id === data.helper.id) ? { ...h, status: 'accepted' } : h
        ));
        addToast(`Confirmed! Helper ${data.helper.name} accepted your request.`);
      }
    });

    socket.on('request-resolved', (data) => {
      playBeep('success');
      setSuccessData(data);
      setStatus('resolved');
      setIsProcessing(false);
      addToast('Dispatch incident resolved successfully.');
    });

    socket.on('request-error', (data) => {
      console.error('Request error:', data.error);
      addToast(data.error, 'error');
      setIsProcessing(false);
    });

    socket.on('block-acknowledged', (data) => {
      addToast(data.message, 'success');
      setHelpers(prev => prev.filter(h => h.status !== 'blocked'));
    });

    socket.on('report-acknowledged', (data) => {
      addToast(data.message, 'success');
    });

    return () => {
      socket.off('request-received');
      socket.off('ai-analysis');
      socket.off('escalation-update');
      socket.off('helpers-found');
      socket.off('helper-response');
      socket.off('request-resolved');
      socket.off('request-error');
      socket.off('block-acknowledged');
      socket.off('report-acknowledged');
    };
  }, [socket]);

  const handleSubmit = (text, isEmergency) => {
    if (!socket) return;
    setIsProcessing(true);
    setStatus('received');
    playBeep('alert');
    // Send request with GPS coordinates if permitted
    socket.emit('submit-request', {
      text,
      isEmergency,
      userId: user?.id || 'anonymous',
      location: gpsLocation
    });
  };

  const handleReset = () => {
    if (socket && requestId) {
      socket.emit('cancel-request', { requestId });
    }
    setStatus('idle');
    setAnalysis(null);
    setCommunities([]);
    setHelpers([]);
    setEscalationTier(0);
    setEscalationData(null);
    setQuickAssist([]);
    setSuccessData(null);
    setRequestId(null);
    setIsProcessing(false);
    addToast('Incident request cancelled.');
  };

  const handleSimulateAccept = () => {
    if (socket && requestId) {
      const helperId = helpers[0]?.id || helpers[0]?._id?.toString() || 'helper_priya';
      socket.emit('volunteer-accept-request', {
        requestId,
        helperId
      });
      addToast('Simulating volunteer acceptance...', 'info');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard-page">
      <Navbar onLogout={handleLogout} />
      
      {/* Toast notifications rendering */}
      <div className="toasts-anchor-container">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className={`toast-alert-card glass-card-strong ${t.type}`}
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 200, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <span className="toast-bullet-icon">📡</span>
              <span className="toast-alert-text">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="dashboard-container">
        {/* Metric Cards Banner */}
        <StatsDashboard />

        <AnimatePresence mode="wait">
          {status === 'resolved' && successData ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SuccessScreen data={successData} />
            </motion.div>
          ) : (
            <motion.div
              key="main"
              className="dashboard-grid-layout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Left Column: Form & Matching Details */}
              <div className="dashboard-left-col">
                <ChatInput 
                  onSubmit={handleSubmit} 
                  disabled={isProcessing}
                  demoMode={demoMode}
                />

                <StatusPanel 
                  status={status}
                  analysis={analysis}
                  communities={communities}
                  quickAssist={quickAssist}
                />

                {escalationTier > 0 && (
                  <EscalationView 
                    currentTier={escalationTier}
                    escalationData={escalationData}
                  />
                )}

                {/* Helper Cards */}
                <AnimatePresence>
                  {helpers.length > 0 && status !== 'resolved' && (
                    <motion.div
                      className="helpers-section"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <span className="section-title">
                        {escalationTier === 2 ? '📡 Expanded Helpers' : '🎯 Top Helpers'}
                      </span>
                      <div className="helpers-grid">
                        {helpers.map((helper, index) => (
                          <HelperCard
                            key={helper.id || helper._id?.toString() || index}
                            helper={helper}
                            index={index}
                            isExpanded={escalationTier === 2}
                            status={helper.status}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Reset & Simulate Buttons */}
                {isProcessing && (
                  <div className="action-btns-row">
                    <motion.button
                      className="reset-btn"
                      onClick={handleReset}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Cancel Request
                    </motion.button>
                    {(status === 'waiting' || status === 'matching' || status === 'expanding_search') && (
                      <motion.button
                        className="simulate-btn"
                        onClick={handleSimulateAccept}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ⚡ Simulate Helper Accept
                      </motion.button>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Visual Delhi Coordinate Radar Map */}
              <div className="dashboard-right-col">
                <CrisisRadarMap 
                  status={status}
                  analysis={analysis}
                  helpers={helpers}
                  escalationTier={escalationTier}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="dashboard-resiliency-footer" style={{
        marginTop: '40px',
        textAlign: 'center',
        fontSize: '0.78rem',
        color: 'var(--text-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '20px',
        width: '100%',
        letterSpacing: '0.02em',
        opacity: 0.85
      }}>
        🛡️ Resiliency safeguard active: AI & Database fallbacks online. Even if AI fails, our fallback system ensures zero downtime.
      </div>
    </div>
  );
}
