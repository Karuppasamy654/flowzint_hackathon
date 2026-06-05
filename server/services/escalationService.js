const { getTopHelpers, getExpandedHelpers } = require('./matchingService');
const { communities, institutions } = require('../data/seed');
const Request = require('../models/Request');
const mongoose = require('mongoose');

class EscalationEngine {
    constructor(io) {
        this.io = io;
        this.activeEscalations = new Map();
    }

    async updateRequestDb(requestId, updateData, timelineEvent = null) {
        if (mongoose.connection.readyState !== 1) return;
        try {
            const update = { $set: updateData };
            if (timelineEvent) {
                update.$push = { timeline: timelineEvent };
            }
            await Request.findByIdAndUpdate(requestId, update, { new: true });
        } catch (err) {
            console.error('[Escalation] DB Update failed:', err.message);
        }
    }

    async startEscalation(requestId, analysis, socket) {
        let requesterId = 'anonymous';
        let requestText = '';
        if (mongoose.connection.readyState === 1) {
            try {
                const reqDoc = await Request.findById(requestId);
                if (reqDoc) {
                    requesterId = reqDoc.userId || 'anonymous';
                    requestText = reqDoc.text || '';
                }
            } catch (err) {}
        }

        // Check if there are real volunteers online in the 'helpers' room
        const helpersOnlineCount = this.io.sockets.adapter.rooms.get('helpers')?.size || 0;
        const volunteerMode = helpersOnlineCount > 0;

        console.log(`[Escalation] Starting match. Volunteers online: ${helpersOnlineCount}. Mode: ${volunteerMode ? 'REAL DISPATCH' : 'SIMULATION'}`);

        const escalation = {
            requestId,
            analysis,
            requesterId,
            requestText,
            volunteerMode,
            tier: 0,
            topHelpers: [],
            expandedHelpers: [],
            institution: null,
            resolved: false,
            timeline: []
        };

        this.activeEscalations.set(requestId, escalation);

        // If volunteer mode is active, broadcast request to helper lobby immediately
        if (volunteerMode) {
            this.io.to('helpers').emit('request-broadcast', {
                requestId,
                text: requestText,
                analysis,
                createdAt: new Date().toISOString()
            });
        }

        this.runTier1(requestId, socket);
    }

    async runTier1(requestId, socket) {
        const escalation = this.activeEscalations.get(requestId);
        if (!escalation || escalation.resolved) return;

        escalation.tier = 1;
        const analysis = escalation.analysis;

        // Find matching communities
        const matchedCommunities = communities.filter(c => {
            if (analysis.type === 'study') return c.type === 'college' || c.type === 'skill_groups';
            if (analysis.type === 'blood' || analysis.type === 'medical') return true;
            if (analysis.type === 'money') return c.type === 'skill_groups' || c.type === 'local_area';
            return true;
        });

        const timelineEvent = {
            time: new Date(),
            event: 'community_search',
            detail: `Searching ${matchedCommunities.length} communities`
        };
        escalation.timeline.push(timelineEvent);

        await this.updateRequestDb(requestId, { status: 'searching_communities' }, timelineEvent);

        socket.emit('escalation-update', {
            requestId,
            tier: 1,
            status: 'searching_communities',
            communities: matchedCommunities.map(c => ({ id: c.id, name: c.name, icon: c.icon, memberCount: c.memberCount }))
        });

        // After 1.5s, show top helpers
        setTimeout(async () => {
            if (escalation.resolved) return;

            const topHelpers = await getTopHelpers(analysis, 3, escalation.requesterId);
            escalation.topHelpers = topHelpers;

            const timelineHelpersEvent = {
                time: new Date(),
                event: 'helpers_found',
                detail: `Found ${topHelpers.length} potential helpers`
            };
            escalation.timeline.push(timelineHelpersEvent);

            await this.updateRequestDb(requestId, { 
                status: 'matching',
                matchedHelpers: topHelpers 
            }, timelineHelpersEvent);

            socket.emit('helpers-found', {
                requestId,
                helpers: topHelpers,
                tier: 1
            });

            // Simulate waiting for response (2.5s for demo)
            setTimeout(() => {
                if (escalation.resolved) return;
                this.runTier2(requestId, socket);
            }, 2500);

        }, 1500);
    }

    async runTier2(requestId, socket) {
        const escalation = this.activeEscalations.get(requestId);
        if (!escalation || escalation.resolved) return;

        escalation.tier = 2;
        const excludeIds = escalation.topHelpers.map(h => h.id || h._id?.toString());

        const timelineEvent = {
            time: new Date(),
            event: 'escalation_tier2',
            detail: 'No response — expanding search radius'
        };
        escalation.timeline.push(timelineEvent);

        await this.updateRequestDb(requestId, { status: 'expanding_search' }, timelineEvent);

        socket.emit('escalation-update', {
            requestId,
            tier: 2,
            status: 'expanding_search',
            message: 'No response from initial helpers. Expanding search...'
        });

        // After 2s, show expanded helpers and simulate acceptance
        setTimeout(async () => {
            if (escalation.resolved) return;

            const expandedHelpers = await getExpandedHelpers(escalation.analysis, excludeIds, 3, escalation.requesterId);
            escalation.expandedHelpers = expandedHelpers;

            socket.emit('helpers-found', {
                requestId,
                helpers: expandedHelpers,
                tier: 2,
                isExpanded: true
            });

            const timelineExpandedEvent = {
                time: new Date(),
                event: 'expanded_helpers_found',
                detail: `${expandedHelpers.length} additional helpers notified`
            };
            escalation.timeline.push(timelineExpandedEvent);

            await this.updateRequestDb(requestId, { 
                matchedHelpers: [...escalation.topHelpers, ...expandedHelpers] 
            }, timelineExpandedEvent);

            if (escalation.volunteerMode) {
                // REAL DISPATCH MODE: Wait for volunteer accept event or auto-escalate to Institution after 25s
                setTimeout(() => {
                    if (escalation.resolved) return;
                    this.runTier3(requestId, socket);
                }, 25000);
            } else {
                // SIMULATION MODE: Auto-accept helper after 1.5s
                setTimeout(() => {
                    if (escalation.resolved) return;

                    const acceptingHelper = expandedHelpers[0] || escalation.topHelpers[0];
                    if (acceptingHelper) {
                        this.resolveRequest(requestId, acceptingHelper, socket);
                    } else {
                        this.runTier3(requestId, socket);
                    }
                }, 1500);
            }
        }, 2000);
    }

    async runTier3(requestId, socket) {
        const escalation = this.activeEscalations.get(requestId);
        if (!escalation || escalation.resolved) return;

        escalation.tier = 3;

        const institution = institutions.find(i => {
            if (escalation.analysis.type === 'blood' || escalation.analysis.type === 'medical')
                return i.type === 'hospital' || i.type === 'ngo';
            return true;
        }) || institutions[0];

        escalation.institution = institution;

        const timelineEvent = {
            time: new Date(),
            event: 'escalation_tier3',
            detail: `Escalated to institution: ${institution.name}`
        };
        escalation.timeline.push(timelineEvent);

        await this.updateRequestDb(requestId, { status: 'institution_escalation' }, timelineEvent);

        socket.emit('escalation-update', {
            requestId,
            tier: 3,
            status: 'institution_escalation',
            institution,
            message: `Escalated to ${institution.name}`
        });

        // Auto-resolve after 2s
        setTimeout(() => {
            this.resolveRequest(requestId, {
                id: institution.id,
                name: institution.name,
                avatar: institution.icon,
                badge: 'Institution',
                distance: 3.2,
                isInstitution: true
            }, socket);
        }, 2000);
    }

    async resolveRequest(requestId, helper, socket) {
        const escalation = this.activeEscalations.get(requestId);
        if (!escalation) return;

        escalation.resolved = true;

        const timelineEvent = {
            time: new Date(),
            event: 'resolved',
            detail: `Help confirmed by ${helper.name}`
        };
        escalation.timeline.push(timelineEvent);

        await this.updateRequestDb(requestId, { 
            status: 'resolved',
            matchedHelpers: [helper]
        }, timelineEvent);

        // Notify room (joins requester socket)
        this.io.to(requestId).emit('helper-response', {
            requestId,
            helper: {
                id: helper.id || helper._id?.toString(),
                name: helper.name,
                avatar: helper.avatar,
                badge: helper.badge,
                distance: helper.distance,
                isInstitution: helper.isInstitution || false
            },
            action: 'accepted'
        });

        // Create micro community after 1s
        setTimeout(() => {
            this.io.to(requestId).emit('micro-community-created', {
                requestId,
                community: {
                    name: `Help Group #${requestId.slice(-6)}`,
                    members: [helper.name, 'You'],
                    purpose: escalation.analysis.summary,
                    createdAt: new Date().toISOString()
                }
            });
        }, 1000);

        // Success confirmation after 1.5s
        setTimeout(() => {
            const etaMinutes = Math.floor(5 + Math.random() * 15);
            this.io.to(requestId).emit('request-resolved', {
                requestId,
                helper: {
                    id: helper.id || helper._id?.toString(),
                    name: helper.name,
                    avatar: helper.avatar,
                    badge: helper.badge,
                    distance: helper.distance
                },
                eta: `${etaMinutes} mins`,
                message: helper.isInstitution
                    ? `${helper.name} has been notified. Response team dispatched.`
                    : `${helper.name} confirmed. ETA: ${etaMinutes} mins`,
                timeline: escalation.timeline
            });
        }, 1500);
    }

    cancelEscalation(requestId) {
        const escalation = this.activeEscalations.get(requestId);
        if (escalation) {
            escalation.resolved = true;
            this.activeEscalations.delete(requestId);
            this.updateRequestDb(requestId, { status: 'cancelled' });
        }
    }
}

module.exports = EscalationEngine;
