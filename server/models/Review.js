const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    requestId: { type: String, required: true },
    helperId: { type: String, required: true, index: true },
    seekerId: { type: String, required: true },
    seekerName: { type: String, required: true },
    seekerAvatar: { type: String, default: '👤' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);
