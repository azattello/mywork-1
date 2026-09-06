const Joi = require('joi');

const phone = Joi.string().min(10).required();
const otp = Joi.string().pattern(/^\d{6}$/).required();

module.exports = {
  startRegistration: Joi.object({ phone, password: Joi.string().min(6).required(), name: Joi.string().max(100).allow(''), surname: Joi.string().max(100).allow('') }),
  startSmsLogin: Joi.object({ phone }),
  passwordLogin: Joi.object({ phone, password: Joi.string().required() }),
  verifyChallenge: Joi.object({ challengeId: Joi.string().required(), code: otp }),
  startReset: Joi.object({ phone }),
  completeReset: Joi.object({ challengeId: Joi.string().required(), code: otp, password: Joi.string().min(6).required() }),
};