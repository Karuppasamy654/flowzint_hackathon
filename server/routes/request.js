const express = require('express');
const { createRequest, getRequest, getUserRequests, getActiveRequests } = require('../controllers/requestController');
const { verifyToken } = require('../controllers/authController');
const router = express.Router();

router.post('/', verifyToken, createRequest);
router.get('/mine', verifyToken, getUserRequests);
router.get('/active', verifyToken, getActiveRequests);
router.get('/:id', getRequest);

module.exports = router;
