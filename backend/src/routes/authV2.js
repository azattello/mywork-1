const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/authV2Controller');
const validate = require('../middlewares/validate');
const auth = require('../middlewares/auth');
const schemas = require('../validation/authV2');

const router = express.Router();
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 12, message: { success: false, message: 'Слишком много запросов. Попробуйте позже' } });

router.post('/registration/start', otpLimiter, validate(schemas.startRegistration), controller.startRegistration);
router.post('/registration/verify', otpLimiter, validate(schemas.verifyChallenge), controller.verifyRegistration);
router.post('/sms-login/start', otpLimiter, validate(schemas.startSmsLogin), controller.startSmsLogin);
router.post('/sms-login/verify', otpLimiter, validate(schemas.verifyChallenge), controller.verifySmsLogin);
router.post('/password/login', otpLimiter, validate(schemas.passwordLogin), controller.passwordLogin);
router.post('/2fa/verify', otpLimiter, validate(schemas.verifyChallenge), controller.verifyTwoFactor);
router.post('/password-reset/start', otpLimiter, validate(schemas.startReset), controller.startPasswordReset);
router.post('/password-reset/complete', otpLimiter, validate(schemas.completeReset), controller.completePasswordReset);
router.patch('/2fa', auth, controller.setTwoFactor);

module.exports = router;