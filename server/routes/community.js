const express = require('express');
const { 
    getPosts, 
    createPost, 
    toggleUpvote, 
    toggleSavePost, 
    addComment, 
    getComments 
} = require('../controllers/communityController');
const { verifyToken } = require('../controllers/authController');
const router = express.Router();

router.get('/', verifyToken, getPosts);
router.post('/', verifyToken, createPost);
router.post('/:id/upvote', verifyToken, toggleUpvote);
router.post('/:id/save', verifyToken, toggleSavePost);
router.post('/:id/comment', verifyToken, addComment);
router.get('/:id/comments', verifyToken, getComments);

module.exports = router;
