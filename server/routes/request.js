const express = require('express');
const { createRequest, getRequest, getUserRequests } = require('../controllers/requestController');
const { verifyToken } = require('../controllers/authController');
const router = express.Router();

router.post('/', verifyToken, createRequest);
router.get('/mine', verifyToken, getUserRequests);
router.get('/:id', getRequest);

module.exports = router;
