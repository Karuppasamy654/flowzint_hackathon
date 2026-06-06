const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    requestId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true },
    status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
    isPinned: { type: Boolean, default: false },
    type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
    fileUrl: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
