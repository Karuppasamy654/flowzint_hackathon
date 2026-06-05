const mongoose = require('mongoose');
const User = require('../models/User');
const Block = require('../models/Block');
const { helpers: seedHelpers } = require('../data/seed');

function calculateDistance(loc1, loc2) {
    const R = 6371;
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function rankHelpers(analysis, helperPool = null, requesterId = null) {
    let pool = helperPool;
    
    // Load from DB if connected and no pool provided
    if (!pool) {
        if (mongoose.connection.readyState === 1) {
            try {
                let query = { isHelper: true, isBlocked: { $ne: true } };
                if (requesterId && requesterId !== 'anonymous') {
                    const blocks = await Block.find({ userId: requesterId });
                    const blockedIds = blocks.map(b => b.blockedUserId);
                    if (blockedIds.length > 0) {
                        query._id = { $nin: blockedIds };
                    }
                }
                const dbHelpers = await User.find(query);
                // Convert mongoose objects to plain JSON to allow modifications
                pool = dbHelpers.map(h => h.toObject());
            } catch (err) {
                console.error('[Matching Service] DB Error fetching helpers:', err.message);
                pool = seedHelpers;
            }
        } else {
            pool = seedHelpers;
        }
    }

    const requestLoc = analysis.location || { lat: 28.6139, lng: 77.2090 };

    const scored = pool.map(helper => {
        const helperLoc = helper.location || { lat: 28.6139, lng: 77.2090 };
        // Proximity score (0–1, closer = higher)
        const distance = calculateDistance(requestLoc, helperLoc);
        const proximityScore = Math.max(0, 1 - distance / 20); // within 20km radius

        // Availability score
        const availabilityScore = helper.availability || 0.8;

        // Past success score (normalized)
        const maxSuccess = Math.max(...pool.map(h => h.successCount || 1), 1);
        const successScore = (helper.successCount || 0) / maxSuccess;

        // Response speed score
        const speedScore = helper.responseSpeed || 0.8;

        // Skill match bonus
        let skillBonus = 0;
        if (analysis.skillsNeeded) {
            const matchedSkills = (helper.skills || []).filter(s => analysis.skillsNeeded.includes(s));
            skillBonus = matchedSkills.length > 0 ? 0.2 : -0.3;
        }

        // Blood group match bonus
        let bloodBonus = 0;
        if (analysis.bloodGroup && helper.bloodGroup) {
            if (helper.bloodGroup === analysis.bloodGroup) bloodBonus = 0.3;
            else if (helper.bloodGroup === 'O-') bloodBonus = 0.15; // universal donor
        }

        // Calculate final score
        const baseScore = (proximityScore * 0.3) +
            (availabilityScore * 0.25) +
            (successScore * 0.25) +
            (speedScore * 0.2);

        const totalScore = Math.min(1, Math.max(0, baseScore + skillBonus + bloodBonus));

        // Response probability (simulated)
        const responseProbability = Math.min(0.99, totalScore * 0.85 + Math.random() * 0.15);

        return {
            ...helper,
            id: helper._id ? helper._id.toString() : helper.id,
            score: {
                total: Math.round(totalScore * 100),
                proximity: Math.round(proximityScore * 100),
                availability: Math.round(availabilityScore * 100),
                pastSuccess: Math.round(successScore * 100),
                responseSpeed: Math.round(speedScore * 100)
            },
            distance: Math.round(distance * 10) / 10,
            responseProbability: Math.round(responseProbability * 100),
            password: undefined // never expose
        };
    });

    // Sort by total score descending
    scored.sort((a, b) => b.score.total - a.score.total);

    return scored;
}

async function getTopHelpers(analysis, count = 3, requesterId = null) {
    const ranked = await rankHelpers(analysis, null, requesterId);
    return ranked.slice(0, count);
}

async function getExpandedHelpers(analysis, excludeIds = [], count = 3, requesterId = null) {
    const ranked = await rankHelpers(analysis, null, requesterId);
    const filtered = ranked.filter(h => !excludeIds.includes(h.id) && !excludeIds.includes(h._id?.toString()));
    return filtered.slice(0, count);
}

module.exports = { rankHelpers, getTopHelpers, getExpandedHelpers, calculateDistance };
