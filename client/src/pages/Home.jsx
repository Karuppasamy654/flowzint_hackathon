import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TagSelector from '../components/TagSelector';
import './Home.css';

const onboardingFeatures = [
  { icon: '🌐', title: 'Purposeful Connections', desc: 'Match with peers based on real skills, not just keywords.' },
  { icon: '⚡', title: 'Instant Matching', desc: 'See only requests that match your expertise and availability.' },
  { icon: '💬', title: 'Focused Conversations', desc: 'Chats are tied to a request and stay contextual.' }
];

const authSkills = ['Web Development', 'Content Writing', 'Mathematics', 'Mechanics', 'Design', 'Mental Health', 'Career Advice', 'Productivity'];

export default function Home() {
  const navigate = useNavigate();
  const { user, login, register, demoLogin, updateProfile } = useAuth();
  const [authMode, setAuthMode] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    bio: '',
    skills: []
  });

  useEffect(() => {
    if (user && user.bio && user.skills?.length > 0) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleInput = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        bio: form.bio,
        skills: form.skills
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await updateProfile({ bio: form.bio, skills: form.skills });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        bio: user.bio || '',
        skills: user.skills || []
      });
    }
  }, [user]);

  return (
    <div className="home-page">
      <div className="home-shell">
        <section className="auth-panel glass-card-strong">
          <div className="auth-brand">
            <div className="brand-mark">FM</div>
            <div>
              <h1>FlowMatch</h1>
              <p>Peer help matching redesigned as a social experience.</p>
            </div>
          </div>

          {user && (!user.bio || !user.skills?.length) ? (
            <form className="profile-form" onSubmit={handleProfileSave}>
              <h2>Finish your profile</h2>
              <p>Complete your bio and skills so the platform can connect you with the right requests.</p>
              <label>
                Bio
                <textarea
                  value={form.bio}
                  onChange={(e) => handleInput('bio', e.target.value)}
                  placeholder="Describe your strengths and what you enjoy helping with"
                  rows={4}
                />
              </label>
              <TagSelector
                label="Select your skills"
                tags={authSkills}
                selected={form.skills}
                onChange={(next) => handleInput('skills', next)}
              />
              {error && <p className="form-error">{error}</p>}
              <button className="btn-primary" type="submit" disabled={loading || !form.bio || !form.skills.length}>
                Save Profile
              </button>
            </form>
          ) : (
            <>
              <div className="auth-switch">
                <button
                  type="button"
                  className={authMode === 'login' ? 'active' : ''}
                  onClick={() => setAuthMode('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={authMode === 'signup' ? 'active' : ''}
                  onClick={() => setAuthMode('signup')}
                >
                  Sign Up
                </button>
              </div>

              <form className="auth-form" onSubmit={authMode === 'login' ? handleLogin : handleSignup}>
                <h2>{authMode === 'login' ? 'Welcome Back' : 'Create your account'}</h2>
                <p>{authMode === 'login' ? 'Log in and start matching with helpers instantly.' : 'Build a profile that matches requests with the right skills.'}</p>

                {authMode === 'signup' && (
                  <label>
                    Full name
                    <input
                      value={form.name}
                      onChange={(e) => handleInput('name', e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </label>
                )}

                <label>
                  Email address
                  <input
                    value={form.email}
                    onChange={(e) => handleInput('email', e.target.value)}
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    value={form.password}
                    onChange={(e) => handleInput('password', e.target.value)}
                    type="password"
                    placeholder="Enter a secure password"
                    required
                  />
                </label>

                {authMode === 'signup' && (
                  <>
                    <label>
                      Bio
                      <textarea
                        value={form.bio}
                        onChange={(e) => handleInput('bio', e.target.value)}
                        placeholder="Tell people what kind of help you offer"
                        rows={3}
                        required
                      />
                    </label>

                    <TagSelector
                      label="Choose your strengths"
                      tags={authSkills}
                      selected={form.skills}
                      onChange={(next) => handleInput('skills', next)}
                    />
                  </>
                )}

                {error && <p className="form-error">{error}</p>}
                <button className="btn-primary" type="submit" disabled={loading || (authMode === 'signup' && (!form.bio || !form.skills.length))}>
                  {authMode === 'login' ? 'Login' : 'Create account'}
                </button>
              </form>

              <div className="demo-footer">
                <span>Want a quick walkthrough?</span>
                <button className="btn-secondary" type="button" onClick={handleDemo} disabled={loading}>
                  Launch Demo Account
                </button>
              </div>
            </>
          )}
        </section>

        <section className="hero-panel">
          <div className="hero-copy">
            <div className="hero-pill">Social help matching meets modern collaboration.</div>
            <h1>Connect over problem-solving, not noise.</h1>
            <p>Build your profile, discover requests that match your skills, and keep every conversation contextual to the task at hand.</p>
            <div className="hero-stats">
              <div>
                <strong>12</strong>
                <span>Live skill channels</span>
              </div>
              <div>
                <strong>4.8/5</strong>
                <span>Connection quality</span>
              </div>
              <div>
                <strong>In-browser</strong>
                <span>Local demo state</span>
              </div>
            </div>
          </div>

          <div className="hero-cards">
            {onboardingFeatures.map((feature) => (
              <motion.div key={feature.title} className="hero-card glass-card" whileHover={{ y: -6 }}>
                <span className="hero-card-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
