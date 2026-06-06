const express = require('express');
const { getLeaderboard, claimDailyLogin } = require('../controllers/gamificationController');
const { verifyToken } = require('../controllers/authController');
const router = express.Router();

router.get('/leaderboard', verifyToken, getLeaderboard);
router.post('/daily-login', verifyToken, claimDailyLogin);

module.exports = router;
