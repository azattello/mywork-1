const Joi = require('joi');

const createApplicationSchema = Joi.object({
  title: Joi.string().min(3).required(),
  summ: Joi.number().min(0).optional(),
  info: Joi.string().allow('', null).optional(),
  city: Joi.string().allow('', null).optional(),
  mode: Joi.string().allow('', null).optional(),
  comm: Joi.string().allow('', null).optional(),
  active: Joi.boolean().optional(),
  userID: Joi.string().required(),
});

module.exports = { createApplicationSchema };
