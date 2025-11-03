const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema, refreshSchema } = require('../validation/auth');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { success: false, message: 'Too many login attempts, try later' } });

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;
