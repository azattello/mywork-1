const Joi = require('joi');

const registerSchema = Joi.object({
  phone: Joi.string().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().allow('', null),
  surname: Joi.string().allow('', null),
  role: Joi.string().valid('user','specialist','admin').default('user'),
  city: Joi.string().regex(/^[0-9a-f]{24}$/).allow(null),
  categories: Joi.when('role', {
    is: 'specialist',
    then: Joi.array()
      .items(Joi.string().regex(/^[0-9a-f]{24}$/))
      .min(1)
      .required()
      .messages({ 'array.min': 'Выберите хотя бы одну категорию' }),
    otherwise: Joi.array()
      .items(Joi.string().regex(/^[0-9a-f]{24}$/))
      .allow(null)
  })
});

const loginSchema = Joi.object({
  phone: Joi.string().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

module.exports = { registerSchema, loginSchema, refreshSchema };
