const { analyzeRequest, detectFakeRequest, getQuickAssist } = require('../services/aiService');
const EscalationEngine = require('../services/escalationService');
const { v4: uuidv4 } = require('uuid');

function setupSocketHandlers(io) {
    const escalationEngine = new EscalationEngine(io);

    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        socket.on('submit-request', (data) => {
            const { text, isEmergency } = data;
            const requestId = uuidv4();

            console.log(`[Request] New request: "${text}" (Emergency: ${isEmergency})`);

            // Check for fake
            const fakeCheck = detectFakeRequest(text);
            if (fakeCheck.isFake) {
                socket.emit('request-error', {
                    requestId,
                    error: 'Request flagged as potentially invalid',
                    reason: fakeCheck.reason
                });
                return;
            }

            // Acknowledge receipt
            socket.emit('request-received', { requestId, text });

            // AI analysis (simulated delay 1.5s)
            setTimeout(() => {
                const analysis = analyzeRequest(text);
                if (isEmergency) analysis.urgency = 'high';

                const quickAssist = getQuickAssist(analysis);

                socket.emit('ai-analysis', {
                    requestId,
                    analysis,
                    quickAssist
                });

                // Start escalation engine after analysis (1s delay)
                setTimeout(() => {
                    escalationEngine.startEscalation(requestId, analysis, socket);
                }, 1000);
            }, 1500);
        });

        socket.on('cancel-request', (data) => {
            escalationEngine.cancelEscalation(data.requestId);
            socket.emit('request-cancelled', { requestId: data.requestId });
        });

        socket.on('report-helper', (data) => {
            console.log(`[Report] Helper ${data.helperId} reported by user`);
            socket.emit('report-acknowledged', {
                message: 'Report submitted. We will review this helper.'
            });
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });
}

module.exports = { setupSocketHandlers };
