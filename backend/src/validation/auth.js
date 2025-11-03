const Joi = require('joi');

const registerSchema = Joi.object({
  phone: Joi.string().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().allow('', null),
  surname: Joi.string().allow('', null),
  role: Joi.string().valid('user','specialist','admin').default('user')
});

const loginSchema = Joi.object({
  phone: Joi.string().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

module.exports = { registerSchema, loginSchema, refreshSchema };
