const mongoose = require('mongoose');

const CommunityPostSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: '👤' },
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['question', 'knowledge', 'tip', 'discussion'], default: 'discussion' },
    upvotes: [{ type: String }], // Array of user IDs who upvoted
    commentsCount: { type: Number, default: 0 },
    savedBy: [{ type: String }], // Array of user IDs who bookmarked/saved the post
}, { timestamps: true });

module.exports = mongoose.model('CommunityPost', CommunityPostSchema);
