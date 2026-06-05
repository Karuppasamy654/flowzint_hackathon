const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/request');
const { setupSocketHandlers } = require('./sockets/handler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', name: 'ACIN Server', version: '1.0.0' });
});

// Socket.io
setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║   ACIN Server Running on Port ${PORT}       ║
║   AI-Powered Social Crisis Help Network  ║
╚══════════════════════════════════════════╝
  `);
});
