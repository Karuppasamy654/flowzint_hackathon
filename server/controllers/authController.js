const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const User = require('../models/User');

const JWT_SECRET = 'acin_secret_key_2024';
const memoryUsers = []; // Fallback memory store

async function register(req, res) {
    const { name, email, password, isHelper } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const isDbConnected = mongoose.connection.readyState === 1;

        if (isDbConnected) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            const hashedPassword = bcrypt.hashSync(password, 10);
            const user = await User.create({
                name,
                email,
                password: hashedPassword,
                location: { lat: 28.6139, lng: 77.2090, label: 'Delhi' },
                isHelper: isHelper || false
            });

            const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
            return res.status(201).json({
                token,
                user: { id: user._id, name: user.name, email: user.email, isHelper: user.isHelper || false }
            });
        } else {
            // Memory fallback
            if (memoryUsers.find(u => u.email === email)) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            const hashedPassword = bcrypt.hashSync(password, 10);
            const user = {
                id: uuidv4(),
                name,
                email,
                password: hashedPassword,
                location: { lat: 28.6139, lng: 77.2090, label: 'Delhi' },
                isHelper: isHelper || false,
                createdAt: new Date().toISOString()
            };
            memoryUsers.push(user);

            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
            return res.status(201).json({
                token,
                user: { id: user.id, name: user.name, email: user.email, isHelper: user.isHelper || false }
            });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function login(req, res) {
    const { email, password } = req.body;

    // Allow demo login shortcut
    if (email === 'demo@acin.ai' && password === 'demo123') {
        const token = jwt.sign({ id: 'demo-user', email }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({
            token,
            user: { id: 'demo-user', name: 'Demo User', email, isHelper: false }
        });
    }

    try {
        const isDbConnected = mongoose.connection.readyState === 1;

        if (isDbConnected) {
            const user = await User.findOne({ email });
            if (!user || !bcrypt.compareSync(password, user.password)) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
            return res.json({
                token,
                user: { id: user._id, name: user.name, email: user.email, isHelper: user.isHelper || false }
            });
        } else {
            // Memory fallback
            const user = memoryUsers.find(u => u.email === email);
            if (!user || !bcrypt.compareSync(password, user.password)) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
            return res.json({
                token,
                user: { id: user.id, name: user.name, email: user.email, isHelper: user.isHelper || false }
            });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next(); // Allow unauthed for demo

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
    } catch (err) {
        // Token invalid, continue without auth for demo
    }
    next();
}

module.exports = { register, login, verifyToken, JWT_SECRET, memoryUsers };
