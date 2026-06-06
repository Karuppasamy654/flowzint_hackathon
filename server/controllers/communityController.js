const CommunityPost = require('../models/CommunityPost');
const Comment = require('../models/Comment');
const User = require('../models/User');

async function getPosts(req, res) {
    try {
        const posts = await CommunityPost.find().sort({ createdAt: -1 });
        return res.json(posts);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function createPost(req, res) {
    const { title, content, type } = req.body;
    const userId = req.user?.id || 'anonymous';
    
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required.' });
    }

    try {
        let name = 'Anonymous User';
        let avatar = '👤';
        
        if (userId !== 'anonymous') {
            const user = await User.findById(userId);
            if (user) {
                name = user.name;
                avatar = user.avatar;
                
                // Reward points for posting in community
                user.points = (user.points || 0) + 15;
                user.communityContributions = (user.communityContributions || 0) + 1;
                await user.save();
            }
        }

        const post = await CommunityPost.create({
            userId,
            name,
            avatar,
            title,
            content,
            type: type || 'discussion'
        });

        return res.status(201).json(post);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function toggleUpvote(req, res) {
    const postId = req.params.id;
    const userId = req.user?.id || 'anonymous';

    try {
        const post = await CommunityPost.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        const index = post.upvotes.indexOf(userId);
        if (index > -1) {
            post.upvotes.splice(index, 1);
        } else {
            post.upvotes.push(userId);
            
            // Give poster a minor gamification boost
            if (post.userId !== 'anonymous' && post.userId !== userId) {
                const author = await User.findById(post.userId);
                if (author) {
                    author.points = (author.points || 0) + 2;
                    await author.save();
                }
            }
        }

        await post.save();
        return res.json(post);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function toggleSavePost(req, res) {
    const postId = req.params.id;
    const userId = req.user?.id || 'anonymous';

    try {
        const post = await CommunityPost.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        const index = post.savedBy.indexOf(userId);
        if (index > -1) {
            post.savedBy.splice(index, 1);
        } else {
            post.savedBy.push(userId);
        }

        await post.save();
        return res.json(post);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function addComment(req, res) {
    const postId = req.params.id;
    const { text } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!text) {
        return res.status(400).json({ error: 'Comment text is required.' });
    }

    try {
        const post = await CommunityPost.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        let name = 'Anonymous User';
        let avatar = '👤';

        if (userId !== 'anonymous') {
            const user = await User.findById(userId);
            if (user) {
                name = user.name;
                avatar = user.avatar;
                
                // Reward points for commenting
                user.points = (user.points || 0) + 5;
                await user.save();
            }
        }

        const comment = await Comment.create({
            postId,
            userId,
            name,
            avatar,
            text
        });

        post.commentsCount = (post.commentsCount || 0) + 1;
        await post.save();

        return res.status(201).json(comment);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function getComments(req, res) {
    const postId = req.params.id;
    try {
        const comments = await Comment.find({ postId }).sort({ createdAt: 1 });
        return res.json(comments);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getPosts,
    createPost,
    toggleUpvote,
    toggleSavePost,
    addComment,
    getComments
};
