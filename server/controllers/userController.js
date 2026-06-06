const User = require('../models/User');
const Review = require('../models/Review');
const Request = require('../models/Request');

async function getProfile(req, res) {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User profile not found.' });
        }
        return res.json(user);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function updateProfile(req, res) {
    const userId = req.user?.id || 'anonymous';
    const { bio, city, state, country, skills, expertiseLevel, availabilityText, avatar } = req.body;

    if (userId === 'anonymous') {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const updateData = {};
        if (bio !== undefined) updateData.bio = bio;
        if (city !== undefined) updateData.city = city;
        if (state !== undefined) updateData.state = state;
        if (country !== undefined) updateData.country = country;
        if (skills !== undefined) updateData.skills = skills;
        if (expertiseLevel !== undefined) updateData.expertiseLevel = expertiseLevel;
        if (availabilityText !== undefined) {
            updateData.availabilityText = availabilityText;
            updateData.availability = availabilityText === 'Available Now' ? 0.95 : (availabilityText === 'Available Today' ? 0.8 : 0.6);
        }
        if (avatar !== undefined) updateData.avatar = avatar;

        const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        return res.json(user);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function submitReview(req, res) {
    const helperId = req.params.id;
    const seekerId = req.user?.id || 'anonymous';
    const { rating, text, requestId } = req.body;

    if (!rating || !text) {
        return res.status(400).json({ error: 'Rating and review content are required.' });
    }

    try {
        const helper = await User.findById(helperId);
        if (!helper) {
            return res.status(404).json({ error: 'Helper not found.' });
        }

        let seekerName = 'Anonymous Seeker';
        let seekerAvatar = '👤';
        if (seekerId !== 'anonymous') {
            const seeker = await User.findById(seekerId);
            if (seeker) {
                seekerName = seeker.name;
                seekerAvatar = seeker.avatar;
                
                // Reward seeker points for review feedback
                seeker.points = (seeker.points || 0) + 10;
                await seeker.save();
            }
        }

        const review = await Review.create({
            requestId: requestId || 'manual',
            helperId,
            seekerId,
            seekerName,
            seekerAvatar,
            rating,
            text
        });

        // Recalculate helper rating
        const allReviews = await Review.find({ helperId });
        const ratingCount = allReviews.length;
        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const newRating = Math.round((totalRating / ratingCount) * 10) / 10;

        // Reward points to helper for completing help session & reviews
        const pointBonus = rating >= 4 ? 100 : 50;
        
        await User.findByIdAndUpdate(helperId, {
            rating: newRating,
            ratingCount,
            $inc: { 
                successCount: 1, 
                points: pointBonus, 
                helpRequestsCompleted: 1 
            }
        });

        // If request ID is specified, update request state to resolved
        if (requestId && requestId !== 'manual') {
            await Request.findByIdAndUpdate(requestId, { status: 'resolved' });
        }

        return res.status(201).json(review);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function getReviews(req, res) {
    const helperId = req.params.id;
    try {
        const reviews = await Review.find({ helperId }).sort({ createdAt: -1 });
        return res.json(reviews);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getProfile,
    updateProfile,
    submitReview,
    getReviews
};
