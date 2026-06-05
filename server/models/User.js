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
    occupation: { type: String, default: 'student' },
    bloodGroup: { type: String },
    rating: { type: Number, default: 4.5 },
    ratingCount: { type: Number, default: 1 },
    successCount: { type: Number, default: 0 },
    badge: { type: String, default: 'Silver' },
    availability: { type: Number, default: 0.8 },
    responseSpeed: { type: Number, default: 0.8 },
    communities: [{ type: String }],
    avatar: { type: String, default: '👤' },
    isHelper: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
