import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiMessageCircle, FiPlusCircle, FiUsers, FiLogOut, FiCheckCircle, FiSend } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  ensureEngineSeed,
  loadRequests,
  saveRequests,
  loadChats,
  saveChats,
  loadUsers,
  DEFAULT_SKILLS
} from '../utils/engine';
import TagSelector from '../components/TagSelector';
import './Dashboard.css';

const sections = [
  { id: 0, label: 'Request Help', icon: <FiPlusCircle /> },
  { id: 1, label: 'Notifications', icon: <FiBell /> },
  { id: 2, label: 'Chat Center', icon: <FiMessageCircle /> }
];

const urgencyOptions = ['Low', 'Medium', 'High'];

const createTimestamp = () => new Date().toISOString();

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeSection, setActiveSection] = useState(0);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    requiredSkills: [],
    urgency: 'Medium'
  });
  const [notice, setNotice] = useState('Welcome to your connection hub.');

  useEffect(() => {
    const { users: seededUsers, requests: seededRequests, chats: seededChats } = ensureEngineSeed();
    setUsers(seededUsers);
    setRequests(seededRequests);
    setChats(seededChats);
  }, []);

  useEffect(() => {
    const sync = (event) => {
      if (!event.key) return;
      if (['help_social_users', 'help_social_requests', 'help_social_chats'].includes(event.key)) {
        setUsers(loadUsers());
        setRequests(loadRequests());
        setChats(loadChats());
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const myRequests = useMemo(
    () => requests.filter((request) => request.requesterId === user.id),
    [requests, user.id]
  );

  const notifications = useMemo(
    () => requests.filter(
      (request) =>
        request.status === 'Pending' &&
        request.requesterId !== user.id &&
        request.requiredSkills.some((skill) => user.skills.includes(skill))
    ),
    [requests, user.skills, user.id]
  );

  const myChats = useMemo(
    () => chats.filter((chat) => chat.participants.includes(user.id)),
    [chats, user.id]
  );

  const selectedChat = useMemo(
    () => myChats.find((chat) => chat.id === selectedChatId) || myChats[0] || null,
    [myChats, selectedChatId]
  );

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedChat?.requestId) || null,
    [requests, selectedChat]
  );

  useEffect(() => {
    if (!selectedChatId && myChats.length > 0) {
      setSelectedChatId(myChats[0].id);
    }
  }, [myChats, selectedChatId]);

  const saveRequestState = (nextRequests) => {
    setRequests(nextRequests);
    saveRequests(nextRequests);
  };

  const saveChatState = (nextChats) => {
    setChats(nextChats);
    saveChats(nextChats);
  };

  const handleRequestInput = (field, value) => {
    setRequestForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitRequest = (event) => {
    event.preventDefault();
    if (!requestForm.title.trim() || !requestForm.description.trim() || requestForm.requiredSkills.length === 0) {
      setNotice('Please complete all request details before submitting.');
      return;
    }

    const nextRequest = {
      id: `req_${Date.now()}`,
      title: requestForm.title.trim(),
      description: requestForm.description.trim(),
      requiredSkills: requestForm.requiredSkills,
      urgency: requestForm.urgency,
      status: 'Pending',
      requesterId: user.id,
      helperId: null,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp()
    };

    const nextRequests = [nextRequest, ...requests];
    saveRequestState(nextRequests);
    setRequestForm({ title: '', description: '', requiredSkills: [], urgency: 'Medium' });
    setNotice('Your request has been posted successfully. Helpers will see it immediately.');
    setActiveSection(1);
  };

  const handleAcceptRequest = (requestId) => {
    const nextRequests = requests.map((request) =>
      request.id === requestId
        ? { ...request, status: 'In Progress', helperId: user.id, updatedAt: createTimestamp() }
        : request
    );

    const request = nextRequests.find((item) => item.id === requestId);
    const chatId = `chat_${Date.now()}`;
    const newChat = {
      id: chatId,
      requestId: request.id,
      participants: [user.id, request.requesterId],
      messages: [
        {
          id: `msg_${Date.now()}`,
          senderId: user.id,
          text: `I accepted your request and I am ready to help with ${request.requiredSkills.join(', ')}.`,
          createdAt: createTimestamp()
        }
      ],
      closed: false,
      createdAt: createTimestamp()
    };

    saveRequestState(nextRequests);
    saveChatState([newChat, ...chats]);
    setSelectedChatId(chatId);
    setActiveSection(2);
    setNotice('You have accepted the request. Continue the conversation in Chat Center.');
  };

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (!selectedChat || !messageText.trim() || selectedChat.closed) return;

    const nextChats = chats.map((chat) =>
      chat.id === selectedChat.id
        ? {
            ...chat,
            messages: [
              ...chat.messages,
              {
                id: `msg_${Date.now()}`,
                senderId: user.id,
                text: messageText.trim(),
                createdAt: createTimestamp()
              }
            ]
          }
        : chat
    );

    setMessageText('');
    saveChatState(nextChats);
    setNotice('Message sent. The request is still active until resolved.');
  };

  const handleMarkResolved = () => {
    if (!selectedChat || !selectedRequest || selectedChat.closed) return;

    const nextRequests = requests.map((request) =>
      request.id === selectedRequest.id ? { ...request, status: 'Resolved', updatedAt: createTimestamp() } : request
    );

    const nextChats = chats.map((chat) =>
      chat.id === selectedChat.id ? { ...chat, closed: true } : chat
    );

    saveRequestState(nextRequests);
    saveChatState(nextChats);
    setNotice('Request marked resolved. The chat is now archived.');
  };

  const getUserById = (id) => users.find((item) => item.id === id) || { name: 'Unknown' };

  const currentPartner = selectedChat ? getUserById(selectedChat.participants.find((id) => id !== user.id)) : null;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header glass-card-strong">
        <div>
          <div className="brand-title">FlowMatch</div>
          <p className="brand-subtitle">A social help desk for peer-to-peer requests.</p>
        </div>
        <div className="header-actions">
          <div className="profile-pill">
            <span>{user.name[0]}</span>
            <div>
              <strong>{user.name}</strong>
              <span>{user.skills.join(' • ')}</span>
            </div>
          </div>
          <button className="btn-secondary" type="button" onClick={() => { logout(); navigate('/'); }}>
            <FiLogOut /> Logout
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        <aside className="dashboard-sidebar glass-card">
          <div className="sidebar-top">
            <h2>Navigation</h2>
            <p>Switch between creation, smart matches, and active chats.</p>
          </div>

          <div className="section-list">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`section-button ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="section-icon">{section.icon}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </div>

          <div className="summary-block">
            <div className="summary-item">
              <span>{myRequests.length}</span>
              <small>My requests</small>
            </div>
            <div className="summary-item">
              <span>{notifications.length}</span>
              <small>Matches available</small>
            </div>
            <div className="summary-item">
              <span>{myChats.length}</span>
              <small>Active chats</small>
            </div>
          </div>

          <div className="sidebar-note">
            <strong>Tip</strong>
            <p>Open another tab and log in as a different user to simulate real-time request retraction across sessions.</p>
          </div>
        </aside>

        <main className="dashboard-main">
          <div className="notice-banner glass-card">
            <span>{notice}</span>
          </div>

          {activeSection === 0 && (
            <section className="panel-section">
              <div className="panel-grid">
                <motion.div className="panel-card glass-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="panel-header">
                    <div>
                      <h3>Request Help</h3>
                      <p>Create a targeted request for helpers that match your skills.</p>
                    </div>
                    <span className="badge badge-urgency-medium">{requestForm.urgency}</span>
                  </div>

                  <form className="request-form" onSubmit={handleSubmitRequest}>
                    <label>
                      Title
                      <input
                        value={requestForm.title}
                        onChange={(e) => handleRequestInput('title', e.target.value)}
                        placeholder="Example: React state update issue"
                        required
                      />
                    </label>
                    <label>
                      Description
                      <textarea
                        value={requestForm.description}
                        onChange={(e) => handleRequestInput('description', e.target.value)}
                        placeholder="What do you need help with?"
                        rows={4}
                        required
                      />
                    </label>
                    <TagSelector
                      label="Required Skills"
                      tags={DEFAULT_SKILLS}
                      selected={requestForm.requiredSkills}
                      onChange={(tags) => handleRequestInput('requiredSkills', tags)}
                      small
                    />
                    <label>
                      Urgency level
                      <select value={requestForm.urgency} onChange={(e) => handleRequestInput('urgency', e.target.value)}>
                        {urgencyOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <button className="btn-primary" type="submit">
                      Post Request
                    </button>
                  </form>
                </motion.div>

                <motion.div className="panel-card glass-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <h3>My Requests</h3>
                  <div className="request-feed">
                    {myRequests.length === 0 ? (
                      <div className="empty-state">
                        <p>You don’t have any active requests yet.</p>
                        <small>Create a request to get started.</small>
                      </div>
                    ) : (
                      myRequests.map((request) => (
                        <div key={request.id} className="request-card">
                          <div className="request-card-top">
                            <div>
                              <h4>{request.title}</h4>
                              <p>{request.description}</p>
                            </div>
                            <span className={`badge badge-urgency-${request.urgency.toLowerCase()}`}>{request.status}</span>
                          </div>
                          <div className="request-tags">
                            {request.requiredSkills.map((skill) => (
                              <span key={skill} className="skill-chip">{skill}</span>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </div>
            </section>
          )}

          {activeSection === 1 && (
            <section className="panel-section">
              <motion.div className="panel-card glass-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="panel-header">
                  <div>
                    <h3>Helper Feed</h3>
                    <p>Requests matching your skills appear here. Accept to start a connection.</p>
                  </div>
                  <span className="badge badge-urgency-low">{notifications.length} matches</span>
                </div>

                <div className="notification-grid">
                  {notifications.length === 0 ? (
                    <div className="empty-state">
                      <p>No matching requests at the moment.</p>
                      <small>Try updating your skills or post a request yourself.</small>
                    </div>
                  ) : (
                    notifications.map((request) => {
                      const seeker = getUserById(request.requesterId);
                      return (
                        <div key={request.id} className="notification-card">
                          <div className="notification-header">
                            <div>
                              <span className="badge badge-urgency-{request.urgency.toLowerCase()}">{request.urgency}</span>
                              <h4>{request.title}</h4>
                            </div>
                            <button className="btn-primary small" type="button" onClick={() => handleAcceptRequest(request.id)}>
                              Accept
                            </button>
                          </div>
                          <p>{request.description}</p>
                          <div className="notification-meta">
                            <span>{seeker.name}</span>
                            <span>{request.requiredSkills.join(' • ')}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </section>
          )}

          {activeSection === 2 && (
            <section className="chat-section panel-section">
              <div className="chat-shell">
                <motion.div className="chat-list glass-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="panel-header">
                    <h3>Active Chats</h3>
                    <span className="badge badge-urgency-low">{myChats.length}</span>
                  </div>
                  <div className="chat-list-items">
                    {myChats.length === 0 ? (
                      <div className="empty-state">
                        <p>No active chats yet.</p>
                        <small>Accept a request from the Helper Feed to begin.</small>
                      </div>
                    ) : (
                      myChats.map((chat) => {
                        const request = requests.find((item) => item.id === chat.requestId);
                        const partner = getUserById(chat.participants.find((id) => id !== user.id));
                        return (
                          <button
                            key={chat.id}
                            type="button"
                            className={`chat-list-item ${selectedChat?.id === chat.id ? 'selected' : ''}`}
                            onClick={() => setSelectedChatId(chat.id)}
                          >
                            <div>
                              <strong>{partner.name}</strong>
                              <p>{request?.title}</p>
                            </div>
                            <span className={`status-dot ${chat.closed ? 'closed' : 'open'}`}></span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>

                <motion.div className="chat-panel glass-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  {selectedChat ? (
                    <>
                      <div className="chat-header">
                        <div>
                          <p className="chat-tag">{selectedRequest?.requiredSkills?.[0] || 'General'}</p>
                          <h3>{currentPartner?.name}</h3>
                          <p className="chat-subtitle">Chatting about: {selectedRequest?.title}</p>
                        </div>
                        <div className="chat-status-pill">
                          <FiCheckCircle />
                          {selectedRequest?.status}
                        </div>
                      </div>

                      <div className="messages-window">
                        {selectedChat.messages.map((message) => {
                          const isMine = message.senderId === user.id;
                          return (
                            <div key={message.id} className={`message-bubble ${isMine ? 'outgoing' : 'incoming'}`}>
                              <p>{message.text}</p>
                              <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          );
                        })}
                      </div>

                      <form className="message-form" onSubmit={handleSendMessage}>
                        <textarea
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder={selectedChat.closed ? 'This chat is resolved.' : 'Write a reply...'}
                          rows={2}
                          disabled={selectedChat.closed}
                        />
                        <button className="btn-primary" type="submit" disabled={!messageText.trim() || selectedChat.closed}>
                          <FiSend /> Send
                        </button>
                      </form>

                      <button
                        className="btn-secondary resolve-button"
                        type="button"
                        onClick={handleMarkResolved}
                        disabled={selectedChat.closed}
                      >
                        Mark as Resolved
                      </button>
                    </>
                  ) : (
                    <div className="empty-state chat-empty">
                      <p>Select a chat on the left to continue the conversation.</p>
                    </div>
                  )}
                </motion.div>
              </div>
            </section>
          )}
        </main>
      </div>

      <footer className="dashboard-mobile-nav glass-card">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`mobile-nav-button ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            <span>{section.icon}</span>
            <small>{section.label}</small>
          </button>
        ))}
      </footer>
    </div>
  );
}
