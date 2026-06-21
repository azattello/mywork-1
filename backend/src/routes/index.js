const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const convRoutes = require('./conversations');
const msgRoutes = require('./messages');
const appRoutes = require('./applications');
const usersRoutes = require('./users');
const citiesRoutes = require('./cities');
const categoriesRoutes = require('./categories');
const notificationRoutes = require('./notifications');

router.use('/auth', authRoutes);
router.use('/conversations', convRoutes);
router.use('/messages', msgRoutes);
router.use('/applications', appRoutes);
router.use('/users', usersRoutes);
router.use('/cities', citiesRoutes);
router.use('/categories', categoriesRoutes);
router.use('/notifications', notificationRoutes);
module.exports = router;