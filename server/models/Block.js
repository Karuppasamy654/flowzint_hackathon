const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    blockedUserId: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Block', BlockSchema);
