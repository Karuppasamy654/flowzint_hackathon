const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    location: {
        lat: { type: Number, default: 28.6139 },
        lng: { type: Number, default: 77.2090 },
        label: { type: String, default: 'Delhi' }
    },
    skills: [{ type: String }],
    expertiseLevel: { type: String, default: 'Beginner' },
    occupation: { type: String, default: 'student' },
    bloodGroup: { type: String },
    city: { type: String, default: 'Delhi' },
    state: { type: String, default: 'Delhi' },
    country: { type: String, default: 'India' },
    bio: { type: String, default: '' },
    banner: { type: String, default: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
    rating: { type: Number, default: 4.5 },
    ratingCount: { type: Number, default: 1 },
    successCount: { type: Number, default: 0 },
    badge: { type: String, default: 'Silver' },
    availability: { type: Number, default: 0.8 },
    availabilityText: { type: String, default: 'Available Now' },
    responseSpeed: { type: Number, default: 0.8 },
    communities: [{ type: String }],
    avatar: { type: String, default: '👤' },
    isHelper: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    points: { type: Number, default: 0 },
    helpRequestsCompleted: { type: Number, default: 0 },
    acceptanceRate: { type: Number, default: 100 },
    responseTime: { type: Number, default: 10 },
    communityContributions: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
