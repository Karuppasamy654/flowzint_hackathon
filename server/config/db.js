const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/acin';

async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('[Database] MongoDB Connected Successfully.');
        
        // Seed database if empty
        const { seedData } = require('../data/seed');
        await seedData();
    } catch (error) {
        console.error(`[Database] Connection Error: ${error.message}`);
        console.log('[Database] Running without DB persistence (fallback to mock memory)...');
    }
}

module.exports = connectDB;
