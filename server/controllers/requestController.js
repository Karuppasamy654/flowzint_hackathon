const { v4: uuidv4 } = require('uuid');
const { analyzeRequest, detectFakeRequest, getQuickAssist } = require('../services/aiService');

const requests = [];

function createRequest(req, res) {
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

    // Analyze request
    const analysis = analyzeRequest(text);
    if (isEmergency) analysis.urgency = 'high';

    // Get quick assist tips
    const quickAssist = getQuickAssist(analysis);

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

    requests.push(request);

    res.status(201).json(request);
}

function getRequest(req, res) {
    const request = requests.find(r => r.id === req.params.id);
    if (!request) {
        return res.status(404).json({ error: 'Request not found' });
    }
    res.json(request);
}

function getUserRequests(req, res) {
    const userId = req.user?.id || 'anonymous';
    const userRequests = requests.filter(r => r.userId === userId);
    res.json(userRequests);
}

module.exports = { createRequest, getRequest, getUserRequests };
