const User = require('../models/User');

async function getLeaderboard(req, res) {
    try {
        // Find top helper users sorted by points descending
        const leaderboard = await User.find({ isHelper: true })
            .sort({ points: -1 })
            .limit(10)
            .select('name avatar points badge rating successCount expertiseLevel');
            
        return res.json(leaderboard);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function claimDailyLogin(req, res) {
    const userId = req.user?.id || 'anonymous';
    if (userId === 'anonymous') {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Add daily login points (e.g. 10 points)
        const dailyPoints = 10;
        user.points = (user.points || 0) + dailyPoints;
        await user.save();

        return res.json({ 
            success: true, 
            message: `Claimed daily login reward! +${dailyPoints} points.`,
            points: user.points 
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { getLeaderboard, claimDailyLogin };
