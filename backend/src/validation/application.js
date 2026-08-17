const Joi = require('joi');

const createApplicationSchema = Joi.object({
  title: Joi.string().min(3).required(),
  summ: Joi.number().min(0).optional(),
  budgetType: Joi.string().valid('fixed','range').optional(),
  budgetMin: Joi.number().min(0).optional(),
  budgetMax: Joi.number().min(0).optional(),
  info: Joi.string().min(10).allow('', null).optional(),
  city: Joi.string().allow('', null).optional(),
  categories: Joi.array().items(Joi.string()).optional(),
  workMode: Joi.string().valid('online','offline').optional(),
  address: Joi.string().allow('', null).optional(),
  deadline: Joi.date().optional(),
  status: Joi.string().valid('open', 'in_progress', 'closed', 'new', 'agreed', 'completed', 'cancelled').optional(),
  currentSpecialist: Joi.string().allow('', null).optional(),
  proposalStatus: Joi.string().valid('active', 'closed').optional(),
  mode: Joi.string().valid('proposal', 'order').optional(),
  active: Joi.boolean().optional(),
  userID: Joi.string().optional(),
});

const responseSchema = Joi.object({
  message: Joi.string().required(),
  price: Joi.number().min(0).optional()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('open', 'in_progress', 'closed').required(),
  reason: Joi.when('status', {
    is: 'closed',
    then: Joi.string().optional(),
    otherwise: Joi.string().optional()
  })
});

const reviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  text: Joi.string().min(10).required()
});

module.exports = { 
  createApplicationSchema,
  responseSchema,
  updateStatusSchema,
  reviewSchema
};
