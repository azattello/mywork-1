const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middlewares/auth');

// Get user's notifications
router.get('/', auth, notificationController.getNotifications);

// Get unread count
router.get('/count/unread', auth, notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', auth, notificationController.markAsRead);

// Mark all as read
router.patch('/read/all', auth, notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', auth, notificationController.deleteNotification);

module.exports = router;