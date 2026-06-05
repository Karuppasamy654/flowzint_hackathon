import { useState, useEffect } from 'react';
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
import './Dashboard.css';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { logout } = useAuth();
  
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

  useEffect(() => {
    if (!socket) return;

    socket.on('request-received', (data) => {
      setRequestId(data.requestId);
      setStatus('received');
    });

    socket.on('ai-analysis', (data) => {
      setAnalysis(data.analysis);
      setQuickAssist(data.quickAssist);
      setStatus('analyzing');
      setTimeout(() => setStatus('searching_communities'), 1000);
    });

    socket.on('escalation-update', (data) => {
      setEscalationTier(data.tier);
      setEscalationData(data);
      setStatus(data.status);
      
      if (data.communities) {
        setCommunities(data.communities);
      }
    });

    socket.on('helpers-found', (data) => {
      setHelpers(data.helpers);
      setStatus('matching');
      setTimeout(() => setStatus('waiting'), 500);
    });

    socket.on('helper-response', (data) => {
      if (data.action === 'accepted') {
        setStatus('helper_accepted');
        setHelpers(prev => prev.map(h => 
          h.name === data.helper.name ? { ...h, status: 'accepted' } : h
        ));
      }
    });

    socket.on('request-resolved', (data) => {
      setSuccessData(data);
      setStatus('resolved');
      setIsProcessing(false);
    });

    socket.on('request-error', (data) => {
      console.error('Request error:', data.error);
      setIsProcessing(false);
    });

    return () => {
      socket.off('request-received');
      socket.off('ai-analysis');
      socket.off('escalation-update');
      socket.off('helpers-found');
      socket.off('helper-response');
      socket.off('request-resolved');
      socket.off('request-error');
    };
  }, [socket]);

  const handleSubmit = (text, isEmergency) => {
    if (!socket) return;
    setIsProcessing(true);
    setStatus('received');
    socket.emit('submit-request', { text, isEmergency });
  };

  const handleReset = () => {
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
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard-page">
      <Navbar onLogout={handleLogout} />
      
      <div className="dashboard-container">
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
              className="dashboard-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Chat Input */}
              <ChatInput 
                onSubmit={handleSubmit} 
                disabled={isProcessing}
                demoMode={demoMode}
              />

              {/* Status Panel */}
              <StatusPanel 
                status={status}
                analysis={analysis}
                communities={communities}
                quickAssist={quickAssist}
              />

              {/* Escalation View */}
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
                          key={helper.id || index}
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

              {/* Reset Button */}
              {isProcessing && (
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
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
