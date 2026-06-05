import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('acin_token'));

    useEffect(() => {
        const savedUser = localStorage.getItem('acin_user');
        if (savedUser) {
            try { setUser(JSON.parse(savedUser)); } catch { }
        }
    }, []);

    const login = async (email, password) => {
        const res = await fetch(`${SERVER_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('acin_token', data.token);
        localStorage.setItem('acin_user', JSON.stringify(data.user));
        return data;
    };

    const register = async (name, email, password) => {
        const res = await fetch(`${SERVER_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('acin_token', data.token);
        localStorage.setItem('acin_user', JSON.stringify(data.user));
        return data;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('acin_token');
        localStorage.removeItem('acin_user');
    };

    const demoLogin = async () => {
        return login('demo@acin.ai', 'demo123');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, demoLogin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
