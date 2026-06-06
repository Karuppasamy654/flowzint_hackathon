const express = require('express');
const { getRequestSuggestions } = require('../controllers/aiController');
const { verifyToken } = require('../controllers/authController');
const router = express.Router();

router.post('/suggest', verifyToken, getRequestSuggestions);

module.exports = router;
