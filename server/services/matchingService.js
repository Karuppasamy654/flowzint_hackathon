const { helpers } = require('../data/seed');

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

function rankHelpers(analysis, helperPool = null) {
    const pool = helperPool || helpers;
    const requestLoc = analysis.location;

    const scored = pool.map(helper => {
        // Proximity score (0–1, closer = higher)
        const distance = calculateDistance(requestLoc, helper.location);
        const proximityScore = Math.max(0, 1 - distance / 20); // within 20km radius

        // Availability score
        const availabilityScore = helper.availability;

        // Past success score (normalized)
        const maxSuccess = Math.max(...pool.map(h => h.successCount));
        const successScore = helper.successCount / maxSuccess;

        // Response speed score
        const speedScore = helper.responseSpeed;

        // Skill match bonus
        let skillBonus = 0;
        if (analysis.skillsNeeded) {
            const matchedSkills = helper.skills.filter(s => analysis.skillsNeeded.includes(s));
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

function getTopHelpers(analysis, count = 3) {
    const ranked = rankHelpers(analysis);
    return ranked.slice(0, count);
}

function getExpandedHelpers(analysis, excludeIds = [], count = 3) {
    const ranked = rankHelpers(analysis);
    const filtered = ranked.filter(h => !excludeIds.includes(h.id));
    return filtered.slice(0, count);
}

module.exports = { rankHelpers, getTopHelpers, getExpandedHelpers, calculateDistance };
