const express = require('express');
const { 
    getProfile, 
    updateProfile, 
    submitReview, 
    getReviews 
} = require('../controllers/userController');
const { verifyToken } = require('../controllers/authController');
const router = express.Router();

router.get('/:id', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.post('/:id/review', verifyToken, submitReview);
router.get('/:id/reviews', verifyToken, getReviews);

module.exports = router;
