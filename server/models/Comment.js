const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    postId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: '👤' },
    text: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Comment', CommentSchema);
