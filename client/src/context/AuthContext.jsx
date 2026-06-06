import { createContext, useContext, useState, useEffect } from 'react';
import {
  ensureEngineSeed,
  findUserByEmail,
  createUser,
  updateUser,
  DEFAULT_SKILLS
} from '../utils/engine';

const AuthContext = createContext(null);
const STORAGE_USER = 'help_social_current_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    ensureEngineSeed();
    const savedUser = localStorage.getItem(STORAGE_USER);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem(STORAGE_USER);
      }
    }
  }, []);

  const persistUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem(STORAGE_USER, JSON.stringify(nextUser));
    updateUser(nextUser);
  };

  const login = async (email, password) => {
    const found = findUserByEmail(email);
    if (!found || found.password !== password) {
      throw new Error('Invalid email or password.');
    }
    persistUser(found);
    return found;
  };

  const register = async ({ name, email, password, bio, skills }) => {
    const existing = findUserByEmail(email);
    if (existing) {
      throw new Error('This email is already registered.');
    }
    if (!name || !email || !password) {
      throw new Error('Name, email, and password are required.');
    }
    const nextUser = createUser({ name, email, password, bio: bio || '', skills: skills || [] });
    persistUser(nextUser);
    return nextUser;
  };

  const updateProfile = async ({ bio, skills }) => {
    if (!user) throw new Error('No authenticated user.');
    const nextUser = updateUser({ ...user, bio: bio || user.bio, skills: skills || user.skills });
    persistUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_USER);
  };

  const demoLogin = async () => {
    const demoEmail = 'demo@flowmatch.app';
    let demoUser = findUserByEmail(demoEmail);
    if (!demoUser) {
      demoUser = createUser({
        name: 'Demo Helper',
        email: demoEmail,
        password: 'demo123',
        bio: 'Fast responder with strong collaboration skills.',
        skills: ['Web Development', 'Content Writing', 'Career Advice']
      });
    }
    persistUser(demoUser);
    return demoUser;
  };

  return (
    <AuthContext.Provider value={{ user, DEFAULT_SKILLS, login, register, logout, demoLogin, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
