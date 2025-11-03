const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const convRoutes = require('./conversations');
const msgRoutes = require('./messages');
const appRoutes = require('./applications');

router.use('/auth', authRoutes);
router.use('/conversations', convRoutes);
router.use('/messages', msgRoutes);
router.use('/applications', appRoutes);

module.exports = router;
