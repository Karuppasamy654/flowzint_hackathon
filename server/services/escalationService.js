const { getTopHelpers, getExpandedHelpers } = require('./matchingService');
const { communities, institutions } = require('../data/seed');

class EscalationEngine {
    constructor(io) {
        this.io = io;
        this.activeEscalations = new Map();
    }

    startEscalation(requestId, analysis, socket) {
        const escalation = {
            requestId,
            analysis,
            tier: 0,
            topHelpers: [],
            expandedHelpers: [],
            institution: null,
            resolved: false,
            timeline: []
        };

        this.activeEscalations.set(requestId, escalation);
        this.runTier1(requestId, socket);
    }

    runTier1(requestId, socket) {
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

        escalation.timeline.push({
            time: Date.now(),
            event: 'community_search',
            detail: `Searching ${matchedCommunities.length} communities`
        });

        socket.emit('escalation-update', {
            requestId,
            tier: 1,
            status: 'searching_communities',
            communities: matchedCommunities.map(c => ({ id: c.id, name: c.name, icon: c.icon, memberCount: c.memberCount }))
        });

        // After 1.5s, show top helpers
        setTimeout(() => {
            if (escalation.resolved) return;

            const topHelpers = getTopHelpers(analysis, 3);
            escalation.topHelpers = topHelpers;

            escalation.timeline.push({
                time: Date.now(),
                event: 'helpers_found',
                detail: `Found ${topHelpers.length} potential helpers`
            });

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

    runTier2(requestId, socket) {
        const escalation = this.activeEscalations.get(requestId);
        if (!escalation || escalation.resolved) return;

        escalation.tier = 2;
        const excludeIds = escalation.topHelpers.map(h => h.id);

        escalation.timeline.push({
            time: Date.now(),
            event: 'escalation_tier2',
            detail: 'No response — expanding search radius'
        });

        socket.emit('escalation-update', {
            requestId,
            tier: 2,
            status: 'expanding_search',
            message: 'No response from initial helpers. Expanding search...'
        });

        // After 2s, show expanded helpers and simulate acceptance
        setTimeout(() => {
            if (escalation.resolved) return;

            const expandedHelpers = getExpandedHelpers(escalation.analysis, excludeIds, 3);
            escalation.expandedHelpers = expandedHelpers;

            socket.emit('helpers-found', {
                requestId,
                helpers: expandedHelpers,
                tier: 2,
                isExpanded: true
            });

            escalation.timeline.push({
                time: Date.now(),
                event: 'expanded_helpers_found',
                detail: `${expandedHelpers.length} additional helpers notified`
            });

            // Simulate a helper accepting after 1.5s
            setTimeout(() => {
                if (escalation.resolved) return;

                const acceptingHelper = expandedHelpers[0] || escalation.topHelpers[0];
                if (acceptingHelper) {
                    this.resolveRequest(requestId, acceptingHelper, socket);
                } else {
                    this.runTier3(requestId, socket);
                }
            }, 1500);
        }, 2000);
    }

    runTier3(requestId, socket) {
        const escalation = this.activeEscalations.get(requestId);
        if (!escalation || escalation.resolved) return;

        escalation.tier = 3;

        const institution = institutions.find(i => {
            if (escalation.analysis.type === 'blood' || escalation.analysis.type === 'medical')
                return i.type === 'hospital' || i.type === 'ngo';
            return true;
        }) || institutions[0];

        escalation.institution = institution;

        escalation.timeline.push({
            time: Date.now(),
            event: 'escalation_tier3',
            detail: `Escalated to institution: ${institution.name}`
        });

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
                name: institution.name,
                avatar: institution.icon,
                badge: 'Institution',
                distance: 3.2,
                isInstitution: true
            }, socket);
        }, 2000);
    }

    resolveRequest(requestId, helper, socket) {
        const escalation = this.activeEscalations.get(requestId);
        if (!escalation) return;

        escalation.resolved = true;

        escalation.timeline.push({
            time: Date.now(),
            event: 'resolved',
            detail: `Help confirmed by ${helper.name}`
        });

        socket.emit('helper-response', {
            requestId,
            helper: {
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
            socket.emit('micro-community-created', {
                requestId,
                community: {
                    name: `Help Group #${requestId.slice(0, 6)}`,
                    members: [helper.name, 'You'],
                    purpose: escalation.analysis.summary,
                    createdAt: new Date().toISOString()
                }
            });
        }, 1000);

        // Success confirmation after 1.5s
        setTimeout(() => {
            const etaMinutes = Math.floor(5 + Math.random() * 15);
            socket.emit('request-resolved', {
                requestId,
                helper: {
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
        }
    }
}

module.exports = EscalationEngine;
