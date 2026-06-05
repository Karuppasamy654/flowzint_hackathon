const mongoose = require('mongoose');
const Request = require('../models/Request');
const { analyzeRequest, detectFakeRequest, getQuickAssist } = require('../services/aiService');

const memoryRequests = []; // Fallback memory store

async function createRequest(req, res) {
    const { text, isEmergency } = req.body;

    if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Request text is required' });
    }

    // Check for fake request
    const fakeCheck = detectFakeRequest(text);
    if (fakeCheck.isFake) {
        return res.status(400).json({
            error: 'Request flagged as potentially invalid',
            reason: fakeCheck.reason,
            confidence: fakeCheck.confidence
        });
    }

    try {
        // Analyze request (real AI analysis with fallback)
        const analysis = await analyzeRequest(text);
        if (isEmergency) analysis.urgency = 'high';

        // Get quick assist tips
        const quickAssist = getQuickAssist(analysis);

        const isDbConnected = mongoose.connection.readyState === 1;

        if (isDbConnected) {
            const request = await Request.create({
                userId: req.user?.id || 'anonymous',
                text,
                analysis,
                quickAssist,
                status: 'analyzing',
                matchedHelpers: [],
                timeline: [{
                    time: new Date(),
                    event: 'created',
                    detail: 'Request submitted'
                }]
            });
            return res.status(201).json(request);
        } else {
            // Memory fallback
            const { v4: uuidv4 } = require('uuid');
            const request = {
                id: uuidv4(),
                userId: req.user?.id || 'anonymous',
                text,
                analysis,
                quickAssist,
                status: 'analyzing',
                matchedHelpers: [],
                timeline: [{
                    time: Date.now(),
                    event: 'created',
                    detail: 'Request submitted'
                }],
                createdAt: new Date().toISOString()
            };
            memoryRequests.push(request);
            return res.status(201).json(request);
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function getRequest(req, res) {
    try {
        const isDbConnected = mongoose.connection.readyState === 1;
        if (isDbConnected) {
            const request = await Request.findById(req.params.id);
            if (!request) {
                return res.status(404).json({ error: 'Request not found' });
            }
            return res.json(request);
        } else {
            const request = memoryRequests.find(r => r.id === req.params.id || r._id === req.params.id);
            if (!request) {
                return res.status(404).json({ error: 'Request not found' });
            }
            return res.json(request);
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function getUserRequests(req, res) {
    try {
        const userId = req.user?.id || 'anonymous';
        const isDbConnected = mongoose.connection.readyState === 1;

        if (isDbConnected) {
            const userRequests = await Request.find({ userId });
            return res.json(userRequests);
        } else {
            const userRequests = memoryRequests.filter(r => r.userId === userId);
            return res.json(userRequests);
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function getActiveRequests(req, res) {
    try {
        const isDbConnected = mongoose.connection.readyState === 1;
        if (isDbConnected) {
            const activeRequests = await Request.find({
                status: { $nin: ['resolved', 'cancelled'] }
            }).sort({ createdAt: -1 });
            return res.json(activeRequests);
        } else {
            const activeRequests = memoryRequests.filter(
                r => !['resolved', 'cancelled'].includes(r.status)
            );
            return res.json(activeRequests);
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { createRequest, getRequest, getUserRequests, getActiveRequests, memoryRequests };

