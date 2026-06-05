const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    requestId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
