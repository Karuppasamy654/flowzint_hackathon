const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    type: { 
        type: String, 
        enum: ['match', 'accept', 'message', 'view', 'endorsement', 'reputation', 'activity'], 
        required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
