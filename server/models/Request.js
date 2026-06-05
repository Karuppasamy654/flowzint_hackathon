const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
    userId: { type: String, default: 'anonymous' },
    text: { type: String, required: true },
    analysis: {
        type: { type: String, default: 'general' },
        urgency: { type: String, default: 'low' },
        location: {
            lat: { type: Number, default: 28.6139 },
            lng: { type: Number, default: 77.2090 },
            label: { type: String, default: 'Delhi' }
        },
        skillsNeeded: [{ type: String }],
        bloodGroup: { type: String, default: null },
        summary: { type: String },
        confidence: { type: Number, default: 0.9 },
        emergencyScore: { type: Number, default: 50 },
        sentiment: { type: String, default: 'neutral' }
    },
    quickAssist: [{ type: String }],
    status: { type: String, default: 'received' },
    matchedHelpers: [{ type: mongoose.Schema.Types.Mixed }],
    timeline: [{
        time: { type: Date, default: Date.now },
        event: { type: String },
        detail: { type: String }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Request', RequestSchema);
