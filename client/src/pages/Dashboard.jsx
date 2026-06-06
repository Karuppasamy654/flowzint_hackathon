import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import ChatWindow from '../components/ChatWindow';
import StatusPanel from '../components/StatusPanel';
import HelperCard from '../components/HelperCard';
import EscalationView from '../components/EscalationView';
import SuccessScreen from '../components/SuccessScreen';
import StatsDashboard from '../components/StatsDashboard';
import CrisisRadarMap from '../components/CrisisRadarMap';
import './Dashboard.css';

const avatarList = ['👤', '👨‍💻', '👩‍⚕️', '👨‍🎓', '👩‍🔬', '💼', '🧘‍♀️', '🚗', '🏥', '⚖️', '🍲', '🩸', '🔬', '💰', '🏠'];

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user, logout } = useAuth();
  const { language, setLanguage, theme, setTheme, t } = useUI();
  
  const demoMode = searchParams.get('demo') === 'true';

  // Navigation Panel State
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'request' | 'chats' | 'notifications' | 'community' | 'profile' | 'settings'
  const [toasts, setToasts] = useState([]);

  // Seeker Dispatch & Radar States
  const [status, setStatus] = useState('idle'); // 'idle' | 'received' | 'analyzing' | 'searching_communities' | 'matching' | 'waiting' | 'expanding_search' | 'helper_accepted' | 'resolved'
  const [analysis, setAnalysis] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [helpers, setHelpers] = useState([]);
  const [escalationTier, setEscalationTier] = useState(0);
  const [escalationData, setEscalationData] = useState(null);
  const [quickAssist, setQuickAssist] = useState([]);
  const [successData, setSuccessData] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);

  // Request Feed States
  const [activeRequests, setActiveRequests] = useState([]);
  const [bookmarkedRequestIds, setBookmarkedRequestIds] = useState([]);
  const [feedCategoryFilter, setFeedCategoryFilter] = useState('All');
  const [feedSearch, setFeedSearch] = useState('');

  // Active Chats States
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatHelper, setActiveChatHelper] = useState(null);
  const [chatSearch, setChatSearch] = useState('');

  // Notifications State
  const [notifications, setNotifications] = useState([]);

  // Community Feed States
  const [posts, setPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState('discussion');
  const [activePostComments, setActivePostComments] = useState(null); // Post object or null
  const [commentsList, setCommentsList] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');

  // Profile Details State
  const [profileUser, setProfileUser] = useState(null);
  const [profileReviews, setProfileReviews] = useState([]);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editableBio, setEditableBio] = useState('');
  const [selectedProfileAvatar, setSelectedProfileAvatar] = useState('👤');

  // Gamification Leaderboard State
  const [leaderboard, setLeaderboard] = useState([]);

  // AI Assistant Suggestions State
  const [aiTitleInput, setAiTitleInput] = useState('');
  const [aiDescInput, setAiDescInput] = useState('');
  const [aiCategoryInput, setAiCategoryInput] = useState('General Help');
  const [aiUrgencyInput, setAiUrgencyInput] = useState('low');
  const [aiDurationInput, setAiDurationInput] = useState('1 hour');
  const [aiBudgetInput, setAiBudgetInput] = useState('');
  const [aiAnonymousInput, setAiAnonymousInput] = useState(false);
  const [aiSkillsInput, setAiSkillsInput] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Review Rating Seeker Modal
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewHelperId, setReviewHelperId] = useState('');
  const [reviewHelperName, setReviewHelperName] = useState('');

  // Admin Analytics State
  const [adminStats, setAdminStats] = useState({
    totalUsers: 250,
    activeHelpers: 15,
    openRequests: 12,
    resolvedRequests: 47,
    avgResponseTime: '8 min',
    avgRating: 4.7
  });

  const aiDebounceRef = useRef(null);

  // play synthesis chime
  const playBeep = (type = 'success') => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'alert') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'notification') {
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(); osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {}
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    playBeep('notification');
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const token = localStorage.getItem('acin_token');

  // Trigger HTML5 geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'GPS Coordinates' }),
        (err) => console.log('Geolocation unavailable:', err.message)
      );
    }
  }, []);

  // Fetch Dashboard datasets based on tab loading
  const fetchActiveRequests = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/requests/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRequests(data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setNotifications(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/community`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPosts(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/gamification/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setLeaderboard(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchProfile = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileUser(data);
        setEditableBio(data.bio || '');
        setSelectedProfileAvatar(data.avatar || '👤');
      }
      const reviewsRes = await fetch(`${SERVER_URL}/api/users/${user.id}/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (reviewsRes.ok) setProfileReviews(await reviewsRes.json());
    } catch (err) { console.error(err); }
  };

  const fetchAdminStats = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/stats`);
      if (res.ok) {
        const data = await res.json();
        setAdminStats(prev => ({
          ...prev,
          totalUsers: data.activeHelpers * 4 + 120,
          activeHelpers: data.activeHelpers,
          resolvedRequests: data.requestsHandled,
          openRequests: data.emergencyCases,
          avgResponseTime: data.avgResponseTime
        }));
      }
    } catch (err) { console.error(err); }
  };

  // Run initial tab feeds
  useEffect(() => {
    if (activeTab === 'feed') {
      fetchActiveRequests();
      fetchLeaderboard();
    } else if (activeTab === 'notifications') {
      fetchNotifications();
    } else if (activeTab === 'community') {
      fetchPosts();
    } else if (activeTab === 'profile') {
      fetchProfile();
    } else if (activeTab === 'settings') {
      fetchAdminStats();
    }
  }, [activeTab]);

  // Load chat conversations index based on completed matches and past logs
  useEffect(() => {
    if (activeTab === 'chats') {
      const loadConversations = async () => {
        try {
          const res = await fetch(`${SERVER_URL}/api/requests/mine`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            // Filter resolved or accepted tickets containing matched helpers
            const list = data.filter(r => r.matchedHelpers && r.matchedHelpers.length > 0);
            setConversations(list);
          }
        } catch (e) {}
      };
      loadConversations();
    }
  }, [activeTab, status]);

  // Sockets connections Setup
  useEffect(() => {
    if (!socket) return;

    socket.emit('join-helper-lobby');

    socket.on('request-broadcast', (data) => {
      playBeep('alert');
      addToast(`🚨 Match broadcast: Nearby assist request classified as: ${data.analysis?.type || 'General'}`, 'warning');
      setActiveRequests(prev => {
        if (prev.find(r => r.id === data.requestId || r._id === data.requestId)) return prev;
        return [data, ...prev];
      });
    });

    socket.on('request-received', (data) => {
      setRequestId(data.requestId);
      setStatus('received');
      addToast('Incident ticket registered. Dispatch radar searching...');
    });

    socket.on('ai-analysis', (data) => {
      setAnalysis(data.analysis);
      setQuickAssist(data.quickAssist);
      setStatus('analyzing');
      addToast('AI analysis completed. Classifying tags...');
    });

    socket.on('escalation-update', (data) => {
      setEscalationTier(data.tier);
      setEscalationData(data);
      setStatus(data.status);
      if (data.communities) setCommunities(data.communities);
      if (data.message) addToast(data.message, 'warning');
    });

    socket.on('helpers-found', (data) => {
      setHelpers(data.helpers);
      setStatus('matching');
      addToast(`Identified ${data.helpers.length} matching helpers. Pinging availability...`);
    });

    socket.on('helper-response', (data) => {
      if (data.action === 'accepted') {
        playBeep('success');
        setStatus('helper_accepted');
        setHelpers(prev => prev.map(h => 
          (h.id === data.helper.id || h._id === data.helper.id) ? { ...h, status: 'accepted' } : h
        ));
        addToast(`Connection established! Helper ${data.helper.name} accepted your request.`);
        
        // Show review modal params
        setReviewHelperId(data.helper.id);
        setReviewHelperName(data.helper.name);
      }
    });

    socket.on('request-resolved', (data) => {
      playBeep('success');
      setSuccessData(data);
      setStatus('resolved');
      setIsProcessing(false);
      addToast('Incident request marked as resolved.');
    });

    socket.on('request-error', (data) => {
      addToast(data.error, 'error');
      setIsProcessing(false);
    });

    return () => {
      socket.off('request-broadcast');
      socket.off('request-received');
      socket.off('ai-analysis');
      socket.off('escalation-update');
      socket.off('helpers-found');
      socket.off('helper-response');
      socket.off('request-resolved');
      socket.off('request-error');
    };
  }, [socket]);

  // Seeker submits help request form
  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!socket || !aiTitleInput.trim()) return;

    setIsProcessing(true);
    setStatus('received');
    playBeep('alert');

    // Submit payload to sockets
    socket.emit('submit-request', {
      text: `${aiTitleInput}: ${aiDescInput}`,
      title: aiTitleInput,
      description: aiDescInput,
      category: aiCategoryInput,
      urgency: aiUrgencyInput,
      expectedDuration: aiDurationInput,
      budget: aiBudgetInput,
      isAnonymous: aiAnonymousInput,
      requiredSkills: aiSkillsInput,
      userId: user?.id || 'anonymous',
      location: gpsLocation
    });
  };

  const handleCancelRequest = () => {
    if (socket && requestId) socket.emit('cancel-request', { requestId });
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

  // Helper accepts a feed request card
  const handleAcceptRequestCard = (req) => {
    if (!socket || !user?.id) return;
    const reqId = req._id || req.id;
    socket.emit('volunteer-accept-request', {
      requestId: reqId,
      helperId: user.id
    });
    addToast('Acceptance signature dispatched. Creating workspace...', 'success');
    
    // Jump to chat pane for direct coord
    setTimeout(() => {
      setActiveTab('chats');
      setActiveChatId(reqId);
      setActiveChatHelper({
        name: req.isAnonymous ? 'Anonymous Seeker' : (req.userId === 'anonymous' ? 'Anonymous Seeker' : 'FlowZint Seeker'),
        avatar: '🚨'
      });
    }, 1000);
  };

  // Simulate helper response inside seeker sandbox
  const handleSimulateHelperAccept = () => {
    if (socket && requestId) {
      const topMatch = helpers[0]?.id || helpers[0]?._id?.toString() || 'helper_priya';
      socket.emit('volunteer-accept-request', {
        requestId,
        helperId: topMatch
      });
    }
  };

  // Submit Seeker rating feedback
  const handleRatingReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewHelperId) return;

    try {
      const res = await fetch(`${SERVER_URL}/api/users/${reviewHelperId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: ratingValue,
          text: reviewText,
          requestId: requestId || 'manual'
        })
      });

      if (res.ok) {
        addToast('Review submitted! Added reputation points.', 'success');
        setShowRatingModal(false);
        setReviewText('');
        // Clean radar matching state
        setStatus('idle');
        setAnalysis(null);
        setHelpers([]);
        setRequestId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AI Assistant Debounced Input triggers suggestions
  useEffect(() => {
    if (!aiTitleInput.trim()) {
      setAiSuggestions(null);
      return;
    }

    if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
    
    aiDebounceRef.current = setTimeout(async () => {
      setIsAiLoading(true);
      try {
        const res = await fetch(`${SERVER_URL}/api/ai/suggest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ title: aiTitleInput, description: aiDescInput })
        });
        if (res.ok) {
          const data = await res.json();
          setAiSuggestions(data);
          // Auto fill suggested category & skills if user hasn't overwritten
          setAiCategoryInput(data.category);
          setAiSkillsInput(data.tags);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsAiLoading(false);
      }
    }, 800);

    return () => clearTimeout(aiDebounceRef.current);
  }, [aiTitleInput, aiDescInput]);

  // Handle Profile Update
  const handleUpdateBioSubmit = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bio: editableBio, avatar: selectedProfileAvatar })
      });
      if (res.ok) {
        addToast('Bio updated successfully.', 'success');
        setIsEditingBio(false);
        fetchProfile();
      }
    } catch (e) {}
  };

  // Community postings
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    try {
      const res = await fetch(`${SERVER_URL}/api/community`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: newPostTitle, content: newPostContent, type: newPostType })
      });
      if (res.ok) {
        addToast('Community post created. Earned +15 XP!', 'success');
        setNewPostTitle('');
        setNewPostContent('');
        fetchPosts();
      }
    } catch (e) {}
  };

  const handlePostUpvote = async (postId) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/community/${postId}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchPosts();
    } catch (e) {}
  };

  const handlePostSave = async (postId) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/community/${postId}/save`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Post saved to bookmarks.', 'success');
        fetchPosts();
      }
    } catch (e) {}
  };

  const handleOpenComments = async (post) => {
    setActivePostComments(post);
    setNewCommentText('');
    try {
      const res = await fetch(`${SERVER_URL}/api/community/${post._id}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setCommentsList(await res.json());
    } catch (e) {}
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activePostComments) return;

    try {
      const res = await fetch(`${SERVER_URL}/api/community/${activePostComments._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: newCommentText })
      });
      if (res.ok) {
        addToast('Comment added. Earned +5 XP!', 'success');
        setNewCommentText('');
        handleOpenComments(activePostComments);
        fetchPosts();
      }
    } catch (e) {}
  };

  // Mark notification read
  const handleMarkNotificationRead = async (id) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchNotifications();
    } catch (e) {}
  };

  // Claim Daily XP points
  const handleClaimDailyLogin = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/gamification/daily-login`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        addToast(data.message, 'success');
        fetchLeaderboard();
      }
    } catch (e) {
      addToast('Already claimed reward today!', 'warning');
    }
  };

  // Database seed reset endpoint
  const handleDatabaseReset = async () => {
    if (!window.confirm('Wipe and reset the database mock tables?')) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/reset`);
      if (res.ok) {
        addToast('Database reset and seeded volunteers successfully.', 'success');
        if (activeTab === 'feed') fetchActiveRequests();
        else setActiveTab('feed');
      }
    } catch (e) {}
  };

  // Filter requests feed lists
  const filteredFeedRequests = activeRequests.filter(req => {
    const isCategoryMatch = feedCategoryFilter === 'All' || req.category === feedCategoryFilter || (req.analysis && req.analysis.type === feedCategoryFilter.toLowerCase());
    const isSearchMatch = !feedSearch.trim() || req.title.toLowerCase().includes(feedSearch.toLowerCase()) || req.description.toLowerCase().includes(feedSearch.toLowerCase()) || req.text.toLowerCase().includes(feedSearch.toLowerCase());
    // Prevent seeing own request cards on feed
    const isNotOwn = req.userId !== user?.id;
    return isCategoryMatch && isSearchMatch && isNotOwn;
  });

  return (
    <div className="dashboard-page">
      {/* Toast Alert Box */}
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

      {/* TOP HEADER */}
      <nav className="navbar" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '64px', background: 'rgba(11, 15, 26, 0.75)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)', zIndex: 1000, display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="logo-icon" style={{ fontSize: '1.4rem' }}>⚡</span>
            <span className="logo-text" style={{ fontSize: '1.3rem', fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>{t('brand')}</span>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-accent)', letterSpacing: '0.1em', background: 'rgba(99, 102, 241, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(99,102,241,0.2)' }}>{t('mvpHub')}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Language Dropdown Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '700',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="en" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🇺🇸 English</option>
              <option value="hi" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🇮🇳 हिंदी (Hindi)</option>
              <option value="ta" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🇮🇳 தமிழ் (Tamil)</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px 12px', borderRadius: '99px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '1rem' }}>🏆</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{user?.points || profileUser?.points || 0} {t('pointsXp')}</span>
            </div>
            
            <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="user-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>{user?.avatar || profileUser?.avatar || '👤'}</div>
              <span className="user-name" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</span>
              <button className="btn-secondary btn-sm" style={{ padding: '4px 12px', fontSize: '0.78rem' }} onClick={() => { logout(); navigate('/'); }}>{t('logoutButton')}</button>
            </div>
          </div>
        </div>
      </nav>

      {/* DASHBOARD LAYOUT */}
      <div className="dashboard-layout-main container" style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px', alignItems: 'start', position: 'relative' }}>
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="left-sidebar glass-card-strong" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'sticky', top: '88px', height: 'calc(100vh - 120px)' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px 8px' }}>{t('workspaceMenu')}</span>
          {[
            { id: 'feed', icon: '🏠', label: t('homeFeed') },
            { id: 'request', icon: '🚨', label: t('requestHelp') },
            { id: 'chats', icon: '💬', label: t('activeChats') },
            { id: 'notifications', icon: '🔔', label: t('alertCenter') },
            { id: 'community', icon: '👥', label: t('communityFeed') },
            { id: 'profile', icon: '👤', label: t('myProfile') },
            { id: 'settings', icon: '⚙️', label: t('adminHub') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 14px',
                borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, color: activeTab === tab.id ? 'var(--text-accent)' : 'var(--text-secondary)',
                background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                border: activeTab === tab.id ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid transparent',
                textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s ease'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
          
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('gpsLoc')}:</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              📍 {gpsLocation ? `${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)}` : t('scanning')}
            </div>
          </div>
        </aside>

        {/* WORKSPACE FEED / COLUMNS */}
        <main className="dashboard-grid-layout" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
          
          {/* CENTER PANEL CONTROLLER */}
          <div className="dashboard-left-col">
            
            {activeTab === 'feed' && (
              /* TAB 1: HOME FEED */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{t('browseRequests')}</h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['All', 'Web Development', 'Design', 'Academics', 'Medical', 'Volunteering'].map(cat => {
                      let key = cat.toLowerCase();
                      if (cat === 'All') key = 'all';
                      else if (cat === 'Web Development') key = 'webDev';
                      return (
                        <button
                          key={cat}
                          onClick={() => setFeedCategoryFilter(cat)}
                          style={{
                            fontSize: '0.75rem', padding: '6px 12px', borderRadius: '99px', fontWeight: 600,
                            background: feedCategoryFilter === cat ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-subtle)', color: '#fff', cursor: 'pointer'
                          }}
                        >
                          {t(key)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={feedSearch}
                    onChange={(e) => setFeedSearch(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.85rem', outline: 'none'
                    }}
                  />
                </div>

                {filteredFeedRequests.length === 0 ? (
                  <div className="glass-card" style={{ padding: '40px', textAlignment: 'center', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '2.5rem' }}>🛰️</span>
                    <h3>{t('feedRadarStandby')}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '380px', textAlign: 'center' }}>
                      {t('noRequests')}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredFeedRequests.map((req, idx) => {
                      const analysis = req.analysis || {};
                      const isEmergency = req.urgency === 'high' || req.urgency === 'critical';
                      
                      let catKey = req.category?.toLowerCase();
                      if (req.category === 'Web Development') catKey = 'webDev';
                      
                      return (
                        <motion.div
                          key={req._id || req.id || idx}
                          className={`glass-card ${isEmergency ? 'emergency-card-glow' : ''}`}
                          style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', border: isEmergency ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-glass)' }}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '1.5rem', background: 'rgba(255,255,255,0.05)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</span>
                              <div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block' }}>
                                  {req.isAnonymous ? 'Anonymous Seeker' : 'FlowZint Seeker'}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📍 {analysis.location?.label || 'Delhi'}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <span style={{ fontSize: '0.72rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--text-accent)', padding: '2px 10px', borderRadius: '4px', fontWeight: 600 }}>
                                {t(catKey || 'generalHelp').toUpperCase()}
                              </span>
                              <span className={`badge badge-urgency-${req.urgency || 'low'}`}>
                                {t(req.urgency === 'low' ? 'urgencyLow' : req.urgency === 'medium' ? 'urgencyMedium' : req.urgency === 'high' ? 'urgencyHigh' : 'urgencyCritical').toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{req.title}</h3>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>"{req.description || req.text}"</p>
                          </div>

                          {req.requiredSkills && req.requiredSkills.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {req.requiredSkills.map(skill => (
                                <span key={skill} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                  🏷️ {skill}
                                </span>
                              ))}
                            </div>
                          )}

                          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <span>⏱️ {t('durationLabel')}: <strong>{req.expectedDuration || '1h'}</strong></span>
                              {req.budget && <span>💰 {t('budgetLabel')}: <strong>{req.budget}</strong></span>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                onClick={() => {
                                  if (bookmarkedRequestIds.includes(req._id)) {
                                    setBookmarkedRequestIds(prev => prev.filter(id => id !== req._id));
                                  } else {
                                    setBookmarkedRequestIds(prev => [...prev, req._id]);
                                    addToast('Card saved to bookmarks shelf.', 'success');
                                  }
                                }}
                              >
                                {bookmarkedRequestIds.includes(req._id) ? t('bookmarkSaved') : t('bookmarkSave')}
                              </button>
                              <button 
                                className="btn-primary" 
                                style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                                onClick={() => handleAcceptRequestCard(req)}
                              >
                                🚀 {t('respondButton')}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'request' && (
              /* TAB 2: REQUEST FORM MODULE WITH AI ASSISTANT PANEL */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{t('requestHelp')}</h2>
                
                {status !== 'idle' ? (
                  /* Searching dispatch feedback radar */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

                    {helpers.length > 0 && status !== 'resolved' && (
                      <div className="helpers-section">
                        <span className="section-title">
                          {escalationTier === 2 ? t('radialExpandedHelpers') : t('topMatchingHelpers')}
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
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="reset-btn" onClick={handleCancelRequest}>{t('cancelRequestBtn')}</button>
                      
                      {(status === 'waiting' || status === 'matching' || status === 'expanding_search') && (
                        <button className="simulate-btn" onClick={handleSimulateHelperAccept}>
                          {t('simulateAcceptBtn')}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Form Input Panel */
                  <form onSubmit={handleRequestSubmit} className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-input-group">
                      <label>{t('titleLabel')}</label>
                      <input
                        type="text"
                        placeholder="E.g. My React state management is broken"
                        value={aiTitleInput}
                        onChange={(e) => setAiTitleInput(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-input-group">
                      <label>{t('descLabel')}</label>
                      <textarea
                        placeholder="State error logs, context details..."
                        value={aiDescInput}
                        onChange={(e) => setAiDescInput(e.target.value)}
                        required
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', color: '#fff', padding: '10px 12px', borderRadius: 'var(--radius-md)', resize: 'none', height: '90px', outline: 'none' }}
                      />
                    </div>

                    {/* AI ASSISTANT SUGGESTIONS CARD BLOCK */}
                    <AnimatePresence>
                      {(isAiLoading || aiSuggestions) && (
                        <motion.div 
                          className="ai-assistant-card glass-card-strong"
                          style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-accent)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {t('aiSuggestionsHeader')}
                            </span>
                            {isAiLoading && <span className="loader-dots-pulse" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('aiLoaderText')}</span>}
                          </div>

                          {aiSuggestions && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>{t('aiTitleSuggestions')}</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                                  {aiSuggestions.titleSuggestions?.map(title => (
                                    <button
                                      key={title}
                                      type="button"
                                      onClick={() => setAiTitleInput(title)}
                                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '6px 10px', borderRadius: '4px', textAlign: 'left', fontSize: '0.78rem', cursor: 'pointer' }}
                                    >
                                      📝 {title}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '16px' }}>
                                <div>
                                  <span style={{ color: 'var(--text-muted)' }}>{t('aiClassifiedCategory')}</span>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }}>📁 {t(aiSuggestions.category === 'Web Development' ? 'webDev' : aiSuggestions.category === 'Design' ? 'design' : aiSuggestions.category === 'Academics' ? 'academics' : aiSuggestions.category === 'Medical' ? 'medical' : aiSuggestions.category === 'Volunteering' ? 'volunteering' : aiSuggestions.category === 'Career Advice' ? 'careerAdvice' : aiSuggestions.category === 'Blood Donation' ? 'bloodDonation' : 'generalHelp')}</div>
                                </div>
                                <div>
                                  <span style={{ color: 'var(--text-muted)' }}>{t('aiSuggestedSkills')}</span>
                                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                                    {aiSuggestions.tags?.map(tag => (
                                      <span key={tag} style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--text-accent)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>🏷️ {tag}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>{t('aiPossibleSolutions')}</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                                  {aiSuggestions.possibleSolutions?.map(sol => (
                                    <div key={sol} style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.4, padding: '4px 6px', borderLeft: '2px solid var(--accent-blue)', background: 'rgba(0,0,0,0.1)' }}>
                                      {sol}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Standard parameters selectors */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-input-group">
                        <label>{t('categoryLabel')}</label>
                        <select value={aiCategoryInput} onChange={(e) => setAiCategoryInput(e.target.value)}>
                          <option value="Web Development">{t('webDev')}</option>
                          <option value="Design">{t('design')}</option>
                          <option value="Career Advice">{t('careerAdvice')}</option>
                          <option value="Academics">{t('academics')}</option>
                          <option value="Volunteering">{t('volunteering')}</option>
                          <option value="Medical">{t('medical')}</option>
                          <option value="Blood Donation">{t('bloodDonation')}</option>
                          <option value="General Help">{t('generalHelp')}</option>
                        </select>
                      </div>

                      <div className="form-input-group">
                        <label>{t('urgencyLabel')}</label>
                        <select value={aiUrgencyInput} onChange={(e) => setAiUrgencyInput(e.target.value)}>
                          <option value="low">{t('urgencyLow')}</option>
                          <option value="medium">{t('urgencyMedium')}</option>
                          <option value="high">{t('urgencyHigh')}</option>
                          <option value="critical">{t('urgencyCritical')}</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-input-group">
                        <label>{t('durationLabel')}</label>
                        <input type="text" value={aiDurationInput} onChange={(e) => setAiDurationInput(e.target.value)} placeholder={t('durationPlaceholder')} />
                      </div>
                      <div className="form-input-group">
                        <label>{t('budgetLabel')}</label>
                        <input type="text" value={aiBudgetInput} onChange={(e) => setAiBudgetInput(e.target.value)} placeholder={t('budgetPlaceholder')} />
                      </div>
                    </div>

                    <div className="form-checkbox-group">
                      <input type="checkbox" id="anonToggle" checked={aiAnonymousInput} onChange={(e) => setAiAnonymousInput(e.target.checked)} />
                      <label htmlFor="anonToggle">{t('anonymousLabel')}</label>
                    </div>

                    <button type="submit" disabled={isProcessing} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '10px' }}>
                      {t('submitRequest')}
                    </button>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'chats' && (
              /* TAB 3: WORKSPACE CHATS LAYOUT */
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', background: 'rgba(17, 24, 39, 0.4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
                
                {/* Chats Left Conversations index */}
                <div style={{ borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '10px' }}>{t('directChats')}</h3>
                    <input
                      type="text"
                      placeholder={t('filterUsers')}
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', color: '#fff', outline: 'none' }}
                    />
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {conversations.length === 0 ? (
                      <div style={{ padding: '24px', textAlignment: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        {t('noChats')}
                      </div>
                    ) : (
                      conversations
                        .filter(c => !chatSearch.trim() || c.title.toLowerCase().includes(chatSearch.toLowerCase()) || (c.matchedHelpers && c.matchedHelpers[0]?.name.toLowerCase().includes(chatSearch.toLowerCase())))
                        .map(c => {
                          const helper = c.matchedHelpers?.[0] || {};
                          const isActive = activeChatId === (c._id || c.id);
                          return (
                            <button
                              key={c._id || c.id}
                              onClick={() => {
                                setActiveChatId(c._id || c.id);
                                setActiveChatHelper(helper);
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px',
                                background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                                border: 'none', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s ease'
                              }}
                            >
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', border: '1px solid var(--border-glass)' }}>{helper.avatar || '👤'}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{helper.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Req: {c.title}</div>
                              </div>
                            </button>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Chats Right active view */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  {activeChatId ? (
                    <ChatWindow
                      requestId={activeChatId}
                      currentUser={user}
                      helper={activeChatHelper}
                      onClose={() => {
                        setActiveChatId(null);
                        setActiveChatHelper(null);
                      }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      <span style={{ fontSize: '3rem' }}>💬</span>
                      <h4 style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{t('inboxStandbyTitle')}</h4>
                      <p style={{ fontSize: '0.8rem', textAlign: 'center', maxWidth: '320px', marginTop: '4px' }}>{t('inboxStandbyDesc')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              /* TAB 4: ALERTS NOTIFICATION CENTER */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{t('alertCenter')}</h2>
                
                {notifications.length === 0 ? (
                  <div className="glass-card" style={{ padding: '40px', textAlignment: 'center', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '2.5rem' }}>🔔</span>
                    <h3>{t('welcomeBack')}!</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('noAlerts')}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {notifications.map((n) => (
                      <div
                        key={n._id || n.id}
                        className={`glass-card ${!n.isRead ? 'unread-notification-highlight' : ''}`}
                        style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: !n.isRead ? '3px solid var(--accent-blue)' : '1px solid var(--border-glass)' }}
                      >
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '1.5rem', marginTop: '2px' }}>
                            {n.type === 'match' ? '🎯' : n.type === 'accept' ? '🚀' : n.type === 'message' ? '💬' : n.type === 'reputation' ? '🏆' : '🔔'}
                          </span>
                          <div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {n.title}
                              {!n.isRead && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-red)' }} />}
                            </h4>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{n.message}</p>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {!n.isRead && (
                          <button
                            className="btn-secondary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                            onClick={() => handleMarkNotificationRead(n._id || n.id)}
                          >
                            {t('markRead')}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'community' && (
              /* TAB 5: PUBLIC REDDIT + LINKEDIN COMMUNITY FEED */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{t('communityFeed')}</h2>
                
                {/* Create post form */}
                <form onSubmit={handleCreatePost} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-accent)' }}>📝 {t('shareTips')}</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.3fr', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Title of your post..."
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      required
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', padding: '10px 12px', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                    />
                    <select value={newPostType} onChange={(e) => setNewPostType(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', padding: '10px 8px', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', outline: 'none' }}>
                      <option value="discussion">Discussion</option>
                      <option value="question">Question</option>
                      <option value="tip">Tip</option>
                      <option value="knowledge">Knowledge</option>
                    </select>
                  </div>
                  <textarea
                    placeholder={t('newPostPlaceholder')}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    required
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', padding: '10px 12px', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', resize: 'none', height: '60px', outline: 'none' }}
                  />
                  <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', padding: '6px 18px', fontSize: '0.8rem' }}>
                    {t('postToFeed')}
                  </button>
                </form>

                {/* Posts rendering */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {posts.map(post => {
                    const hasUpvoted = post.upvotes?.includes(user?.id);
                    const hasSaved = post.savedBy?.includes(user?.id);
                    
                    return (
                      <div key={post._id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-glass)', fontSize: '1.1rem' }}>{post.avatar || '👤'}</div>
                            <div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block' }}>{post.name}</span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', color: 'var(--text-accent)', textTransform: 'uppercase', fontWeight: 600 }}>
                            {post.type}
                          </span>
                        </div>

                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{post.title}</h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>{post.content}</p>
                        </div>

                        {/* Social interactive buttons */}
                        <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', fontSize: '0.8rem' }}>
                          <button
                            onClick={() => handlePostUpvote(post._id)}
                            style={{ background: 'transparent', border: 'none', color: hasUpvoted ? 'var(--accent-blue)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            ▲ {t('upvote')} ({post.upvotes?.length || 0})
                          </button>
                          <button
                            onClick={() => handleOpenComments(post)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            💬 {t('comments')} ({post.commentsCount || 0})
                          </button>
                          <button
                            onClick={() => handlePostSave(post._id)}
                            style={{ background: 'transparent', border: 'none', color: hasSaved ? 'var(--accent-amber)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}
                          >
                            ⭐ {hasSaved ? t('bookmarkSaved') : t('save')}
                          </button>
                        </div>

                        {/* Paged comments drawer inside same card */}
                        <AnimatePresence>
                          {activePostComments && activePostComments._id === post._id && (
                            <motion.div
                              className="post-comments-drawer"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}
                            >
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>{t('commentsFeed')}</span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                                {commentsList.length === 0 ? (
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '6px' }}>{t('noComments')}</div>
                                ) : (
                                  commentsList.map(comment => (
                                    <div key={comment._id} style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                                      <span style={{ fontSize: '1rem' }}>{comment.avatar}</span>
                                      <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{comment.name}</div>
                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{comment.text}</p>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>

                              <form onSubmit={handleAddComment} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginTop: '6px' }}>
                                <input
                                  type="text"
                                  placeholder={t('writeCommentPlaceholder')}
                                  value={newCommentText}
                                  onChange={(e) => setNewCommentText(e.target.value)}
                                  required
                                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', padding: '8px 10px', borderRadius: '6px', color: '#fff', fontSize: '0.78rem', outline: 'none' }}
                                />
                                <button type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>{t('send')}</button>
                              </form>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'profile' && profileUser && (
              /* TAB 6: LINKEDIN-STYLE PROFESSIONAL PROFILE */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="profile-banner-hero glass-card" style={{ overflow: 'hidden', position: 'relative' }}>
                  {/* Banner */}
                  <div style={{ height: '120px', background: profileUser.banner || 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
                  
                  {/* Bio summary card */}
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', marginTop: '-50px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '4px solid var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: 'var(--shadow-md)', zIndex: 5 }}>
                        {selectedProfileAvatar}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {isEditingBio ? (
                          <>
                            <button className="btn-secondary btn-sm" onClick={() => setIsEditingBio(false)}>{t('cancelBtn')}</button>
                            <button className="btn-primary btn-sm" onClick={handleUpdateBioSubmit}>{t('saveDetailsBtn')}</button>
                          </>
                        ) : (
                          <button className="btn-secondary btn-sm" onClick={() => setIsEditingBio(true)}>{t('editBioBtn')}</button>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{profileUser.name}</h2>
                        {profileUser.isVerified && <span style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem' }} title="Verified Skilled Helper">🛡️</span>}
                        <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--text-accent)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          {profileUser.badge || 'Silver Badge'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {profileUser.occupation?.toUpperCase()} • 📍 {profileUser.city}, {profileUser.state}, {profileUser.country}
                      </span>

                      {isEditingBio ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                          <textarea
                            value={editableBio}
                            onChange={(e) => setEditableBio(e.target.value)}
                            placeholder="Write a short summary bio for investors / seekers..."
                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem', resize: 'none', height: '60px', outline: 'none' }}
                          />
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {avatarList.map(a => (
                              <button
                                key={a}
                                type="button"
                                onClick={() => setSelectedProfileAvatar(a)}
                                style={{ background: selectedProfileAvatar === a ? 'rgba(99,102,241,0.2)' : 'transparent', border: selectedProfileAvatar === a ? '1px solid var(--accent-blue)' : '1px solid transparent', fontSize: '1.3rem', borderRadius: '4px', cursor: 'pointer', padding: '4px' }}
                              >
                                {a}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>
                          "{profileUser.bio || t('noBio')}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Professional skills segment */}
                <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{t('skillsEndorsements')}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {profileUser.skills?.map(skill => (
                      <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', padding: '6px 12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>🏷️ {skill}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-accent)', background: 'rgba(0,0,0,0.2)', padding: '1px 6px', borderRadius: '4px' }}>Level: {profileUser.expertiseLevel || 'Advanced'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seeker ratings list reviews */}
                <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{t('incidentsFeedback')} ({profileReviews.length})</h3>
                  {profileReviews.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '8px 0' }}>{t('noReviews')}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {profileReviews.map((rev) => (
                        <div key={rev._id} style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.15)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                          <span style={{ fontSize: '1.4rem' }}>{rev.seekerAvatar || '👤'}</span>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{rev.seekerName}</span>
                              <span style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', fontWeight: 800 }}>{'⭐'.repeat(rev.rating)}</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>"{rev.text}"</p>
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>{t('reviewedOn')}: {new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              /* TAB 7: ADMIN METRICS ANALYTICS PANEL */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{t('adminOpsTitle')}</h2>
                  <button className="btn-danger btn-sm" onClick={handleDatabaseReset}>{t('adminReset')}</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {[
                    { label: t('activeHelpers'), value: adminStats.activeHelpers, icon: '🛡️', color: 'var(--accent-cyan)' },
                    { label: t('resolvedIncidents'), value: adminStats.resolvedRequests, icon: '✅', color: 'var(--accent-green)' },
                    { label: t('avgSpeed'), value: adminStats.avgResponseTime, icon: '⏱️', color: 'var(--accent-blue)' }
                  ].map((block, i) => (
                    <div key={i} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '2.5rem', filter: `drop-shadow(0 0 6px ${block.color})` }}>{block.icon}</span>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>{block.label}</span>
                        <span style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{block.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CUSTOM SVG/CSS CHARTS & GRAPHS */}
                <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{t('weekGrowth')}</h3>
                  
                  {/* SVG Bar Chart Visualization */}
                  <div style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '10px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid var(--border-subtle)', position: 'relative' }}>
                    {/* Y-axis grids */}
                    <div style={{ position: 'absolute', left: 0, top: '20%', width: '100%', borderBottom: '1px dashed rgba(255,255,255,0.05)' }} />
                    <div style={{ position: 'absolute', left: 0, top: '50%', width: '100%', borderBottom: '1px dashed rgba(255,255,255,0.05)' }} />
                    <div style={{ position: 'absolute', left: 0, top: '80%', width: '100%', borderBottom: '1px dashed rgba(255,255,255,0.05)' }} />
                    
                    {[
                      { week: 'W1', value: 12, color: 'var(--accent-cyan)' },
                      { week: 'W2', value: 24, color: 'var(--accent-blue)' },
                      { week: 'W3', value: 18, color: 'var(--accent-purple)' },
                      { week: 'W4', value: 37, color: 'var(--accent-pink)' },
                      { week: 'W5', value: 47, color: 'var(--accent-green)' }
                    ].map((bar, idx) => {
                      const pctHeight = `${(bar.value / 50) * 100}%`;
                      return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 5, width: '40px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{bar.value}</span>
                          <motion.div
                            style={{ width: '20px', background: bar.color, borderRadius: '4px 4px 0 0', height: 0, boxShadow: '0 0 10px rgba(99, 102, 241, 0.15)' }}
                            animate={{ height: pctHeight }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                          />
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{bar.week}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{t('securityLogs')}</h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {t('trustProtocol')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT CONTEXTUAL SIDEBAR CONTROLLER */}
          <div className="dashboard-right-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {(activeTab === 'request' || status !== 'idle') && (
              /* Context Radar: Seeker is searching matches */
              <CrisisRadarMap 
                status={status}
                analysis={analysis}
                helpers={helpers}
                escalationTier={escalationTier}
              />
            )}

            {(activeTab === 'feed' || activeTab === 'community') && (
              /* Context Leaderboard: Show Gamification dashboard */
              <div className="glass-card-strong" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>🏆 {t('topHelpers')}</span>
                  <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={handleClaimDailyLogin}>{t('claimDailyXp')}</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {leaderboard.map((leader, i) => (
                    <div key={leader.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-accent)', width: '16px' }}>#{i+1}</span>
                        <span style={{ fontSize: '1.2rem' }}>{leader.avatar}</span>
                        <div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block' }}>{leader.name.split(' ')[0]}</span>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{leader.badge}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>+{leader.points} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'chats' && activeChatHelper && (
              /* Context helper profile detailed summary inside chats tab */
              <div className="glass-card-strong" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>🛡️ {t('connectionDetails')}</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '2.5rem' }}>{activeChatHelper.avatar || '👤'}</span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>{activeChatHelper.name}</h4>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>
                    {activeChatHelper.badge || 'Volunteer Helper'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                  {activeChatHelper.skills && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{t('helperSpecialties')}</span>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {activeChatHelper.skills.map(s => (
                          <span key={s} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeChatHelper.rating && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t('helperRating')}</span>
                      <span style={{ color: 'var(--accent-amber)', fontWeight: 800 }}>⭐ {activeChatHelper.rating}</span>
                    </div>
                  )}

                  {activeChatHelper.distance && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t('estProximity')}</span>
                      <span style={{ fontWeight: 600 }}>📍 {activeChatHelper.distance} {t('kmAway')}</span>
                    </div>
                  )}
                </div>

                {/* Rating trigger button / safety reporting */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    className="btn-primary"
                    style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
                    onClick={() => setShowRatingModal(true)}
                  >
                    {t('confirmRateHelp')}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'profile' && profileUser && (
              /* Tab Profile Right: Quick stats shelf */
              <div className="glass-card-strong" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{t('socialStats')}</span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: t('completedDeliveries'), value: profileUser.helpRequestsCompleted || 0, icon: '✅' },
                    { label: t('avgMatchingResponse'), value: `${profileUser.responseTime || 10}m`, icon: '⏱️' },
                    { label: t('requestAcceptanceRate'), value: `${profileUser.acceptanceRate || 100}%`, icon: '📈' },
                    { label: t('communityContributions'), value: profileUser.communityContributions || 0, icon: '💬' }
                  ].map((stat, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{stat.icon}</span> {stat.label}
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* RATINGS / FEEDBACK OVERLAY MODAL */}
      <AnimatePresence>
        {showRatingModal && (
          <div className="login-modal-overlay" onClick={() => setShowRatingModal(false)}>
            <motion.div
              className="login-modal-container glass-card-strong"
              style={{ width: '380px' }}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="login-modal-header">
                <h3>{t('rateHelperTitle')}</h3>
                <button className="login-close-btn" onClick={() => setShowRatingModal(false)}>✕</button>
              </div>

              <form onSubmit={handleRatingReviewSubmit} className="login-form-main">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {t('howWasExperience')} **{reviewHelperName}**?
                </span>

                <div className="form-input-group">
                  <label>{t('selectStarRating')}</label>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '1.8rem', cursor: 'pointer', justifyContent: 'center', padding: '10px 0' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        onClick={() => setRatingValue(star)}
                        style={{ color: star <= ratingValue ? 'var(--accent-amber)' : 'rgba(255,255,255,0.15)', transition: 'color 0.2s ease' }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-input-group">
                  <label>{t('reviewDetailsLabel')}</label>
                  <textarea
                    placeholder={t('reviewPlaceholder')}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    required
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', color: '#fff', padding: '10px 12px', borderRadius: '6px', fontSize: '0.82rem', resize: 'none', height: '80px', outline: 'none' }}
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }}>
                  {t('submitRatingBtn')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="dashboard-resiliency-footer" style={{ marginTop: '40px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', width: '100%', letterSpacing: '0.02em', opacity: 0.85 }}>
        {t('safeguardFooter')}
      </div>
    </div>
  );
}
