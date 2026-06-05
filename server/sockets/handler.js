const { analyzeRequest, detectFakeRequest, getQuickAssist } = require('../services/aiService');
const EscalationEngine = require('../services/escalationService');
const mongoose = require('mongoose');
const Request = require('../models/Request');
const Message = require('../models/Message');
const Report = require('../models/Report');
const Block = require('../models/Block');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

function setupSocketHandlers(io) {
    const escalationEngine = new EscalationEngine(io);

    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        // Join the volunteer lobby
        socket.on('join-helper-lobby', () => {
            socket.join('helpers');
            console.log(`[Socket] Helper socket ${socket.id} joined the 'helpers' lobby`);
        });

        // Handle crisis request submission
        socket.on('submit-request', async (data) => {
            const { text, isEmergency, userId, location } = data;
            const requestId = mongoose.connection.readyState === 1 ? new mongoose.Types.ObjectId().toString() : uuidv4();

            console.log(`[Request] New request from user ${userId || 'anonymous'}: "${text}" (Emergency: ${isEmergency})`);

            // Check for fake request
            const fakeCheck = detectFakeRequest(text);
            if (fakeCheck.isFake) {
                socket.emit('request-error', {
                    requestId,
                    error: 'Request flagged as potentially invalid',
                    reason: fakeCheck.reason
                });
                return;
            }

            // Acknowledge receipt and join room right away
            socket.join(requestId);
            socket.emit('request-received', { requestId, text });

            try {
                // Save initial request document in DB
                let initialRequest;
                if (mongoose.connection.readyState === 1) {
                    initialRequest = await Request.create({
                        _id: requestId,
                        userId: userId || 'anonymous',
                        text,
                        status: 'received',
                        timeline: [{
                            time: new Date(),
                            event: 'created',
                            detail: 'Request submitted'
                        }]
                    });
                }

                // AI analysis (simulated delay 1s for better UX, or wait directly)
                setTimeout(async () => {
                    try {
                        const analysis = await analyzeRequest(text);
                        if (isEmergency) analysis.urgency = 'high';
                        // Apply custom GPS location if supplied by client
                        if (location && location.lat && location.lng) {
                            analysis.location = {
                                lat: location.lat,
                                lng: location.lng,
                                label: location.label || 'My Current Location (GPS)'
                            };
                        }

                        const quickAssist = getQuickAssist(analysis);

                        // Save analysis results to request
                        if (mongoose.connection.readyState === 1) {
                            await Request.findByIdAndUpdate(requestId, {
                                status: 'analyzing',
                                analysis,
                                quickAssist,
                                $push: {
                                    timeline: {
                                        time: new Date(),
                                        event: 'analysis_complete',
                                        detail: 'AI analysis completed'
                                    }
                                }
                            });
                        }

                        // Notify room members (including requester)
                        io.to(requestId).emit('ai-analysis', {
                            requestId,
                            analysis,
                            quickAssist
                        });

                        // Start escalation engine after analysis (1s delay)
                        setTimeout(() => {
                            escalationEngine.startEscalation(requestId, analysis, socket);
                        }, 1000);

                    } catch (innerErr) {
                        io.to(requestId).emit('request-error', {
                            requestId,
                            error: 'AI analysis failed: ' + innerErr.message
                        });
                    }
                }, 1000);

            } catch (err) {
                socket.emit('request-error', {
                    requestId,
                    error: 'Database error: ' + err.message
                });
            }
        });

        // Volunteer accepts ticket
        socket.on('volunteer-accept-request', async (data) => {
            const { requestId, helperId } = data;
            console.log(`[Socket] Volunteer accept request: ${helperId} accepting ${requestId}`);

            const escalation = escalationEngine.activeEscalations.get(requestId);
            if (!escalation || escalation.resolved) {
                socket.emit('accept-failed', { message: 'Ticket is no longer active or has already been accepted.' });
                return;
            }

            // Connect volunteer socket to the specific room channel
            socket.join(requestId);

            // Fetch volunteer model details
            let helper = null;
            if (mongoose.connection.readyState === 1) {
                try {
                    const helperDoc = await User.findById(helperId);
                    if (helperDoc) {
                        helper = helperDoc.toObject();
                        helper.id = helper._id.toString();
                    }
                } catch (e) {
                    console.error('[Socket] Volunteer find error:', e.message);
                }
            }

            if (!helper) {
                const { helpers } = require('../data/seed');
                helper = helpers.find(h => h.id === helperId) || helpers[0];
            }

            // Resolve the request in EscalationEngine
            escalationEngine.resolveRequest(requestId, helper, socket);
        });

        // Cancel an active request
        socket.on('cancel-request', (data) => {
            escalationEngine.cancelEscalation(data.requestId);
            socket.emit('request-cancelled', { requestId: data.requestId });
        });

        // Live Chat Setup
        socket.on('join-chat', async (data) => {
            const { requestId } = data;
            socket.join(requestId);
            console.log(`[Socket] Client ${socket.id} joined chat room: ${requestId}`);

            // Fetch previous message history
            if (mongoose.connection.readyState === 1) {
                try {
                    const messages = await Message.find({ requestId }).sort({ createdAt: 1 });
                    socket.emit('chat-history', { requestId, messages });
                } catch (err) {
                    console.error('[Socket] Chat history load failed:', err.message);
                }
            } else {
                socket.emit('chat-history', { requestId, messages: [] });
            }
        });

        // Send a message in live chat
        socket.on('send-message', async (data) => {
            const { requestId, senderId, senderName, text } = data;
            console.log(`[Chat] Msg in ${requestId} from ${senderName}: "${text}"`);

            let msgPayload = {
                requestId,
                senderId,
                senderName,
                text,
                createdAt: new Date().toISOString()
            };

            if (mongoose.connection.readyState === 1) {
                try {
                    const msgDoc = await Message.create({
                        requestId,
                        senderId,
                        senderName,
                        text
                    });
                    msgPayload = msgDoc.toObject();
                } catch (err) {
                    console.error('[Socket] Save message failed:', err.message);
                }
            }

            // Emit to all users in the chat room
            io.to(requestId).emit('message-received', msgPayload);
        });

        // Typing indicator
        socket.on('typing-status', (data) => {
            const { requestId, senderName, isTyping } = data;
            socket.to(requestId).emit('typing-status', { senderName, isTyping });
        });

        // Trust and Safety: Report user
        socket.on('report-user', async (data) => {
            const { reportedUserId, reporterUserId, reason } = data;
            console.log(`[Report] Safety report submitted: ${reporterUserId} -> ${reportedUserId} (${reason})`);

            if (mongoose.connection.readyState === 1) {
                try {
                    await Report.create({ reportedUserId, reporterUserId, reason });
                    socket.emit('report-acknowledged', {
                        message: 'Report submitted. We take safety issues seriously and will review this helper.'
                    });
                } catch (err) {
                    console.error('[Socket] Save report failed:', err.message);
                }
            } else {
                socket.emit('report-acknowledged', {
                    message: 'Report submitted. We will review this helper.'
                });
            }
        });

        // Trust and Safety: Block user
        socket.on('block-user', async (data) => {
            const { userId, blockedUserId } = data;
            console.log(`[Block] User blocked: ${userId} blocked ${blockedUserId}`);

            if (mongoose.connection.readyState === 1) {
                try {
                    await Block.create({ userId, blockedUserId });
                    socket.emit('block-acknowledged', {
                        message: 'Helper blocked successfully. They will no longer be matched for your requests.'
                    });
                } catch (err) {
                    console.error('[Socket] Save block failed:', err.message);
                }
            } else {
                socket.emit('block-acknowledged', {
                    message: 'Helper blocked successfully.'
                });
            }
        });

        // Trust and Safety: Rate Helper
        socket.on('rate-helper', async (data) => {
            const { helperId, rating } = data;
            console.log(`[Rating] Helper ${helperId} rated ${rating} stars`);

            if (mongoose.connection.readyState === 1) {
                try {
                    const helper = await User.findById(helperId);
                    if (helper) {
                        const newCount = (helper.ratingCount || 0) + 1;
                        const newRating = Math.round((((helper.rating || 0) * (helper.ratingCount || 0)) + rating) / newCount * 10) / 10;
                        await User.findByIdAndUpdate(helperId, {
                            rating: newRating,
                            ratingCount: newCount
                        });
                        console.log(`[Rating] Updated helper rating to ${newRating}`);
                    }
                } catch (err) {
                    console.error('[Socket] Save rating failed:', err.message);
                }
            }
        });

        // Legacy report handler fallback
        socket.on('report-helper', (data) => {
            console.log(`[Report] Legacy helper report received: ${data.helperId}`);
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
