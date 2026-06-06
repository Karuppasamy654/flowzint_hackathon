const express = require('express');
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { verifyToken } = require('../controllers/authController');
const router = express.Router();

router.get('/', verifyToken, getNotifications);
router.post('/:id/read', verifyToken, markAsRead);

module.exports = router;
