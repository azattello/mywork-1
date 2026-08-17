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
const favoritesRoutes = require('./favorites');
const complaintsRoutes = require('./complaints');

router.use('/auth', authRoutes);
router.use('/conversations', convRoutes);
router.use('/messages', msgRoutes);
router.use('/applications', appRoutes);
router.use('/users', usersRoutes);
router.use('/cities', citiesRoutes);
router.use('/categories', categoriesRoutes);
router.use('/notifications', notificationRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/complaints', complaintsRoutes);
module.exports = router;