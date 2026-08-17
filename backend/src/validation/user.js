const Joi = require('joi');

const updateSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  surname: Joi.string().max(100).optional(),
  city: Joi.string().regex(/^[0-9a-f]{24}$/).allow(null).optional(),
  categories: Joi.array()
    .items(Joi.string().regex(/^[0-9a-f]{24}$/))
    .min(1)
    .max(100)
    .messages({ 
      'array.min': 'Выберите хотя бы одну категорию',
      'array.max': 'Максимум 100 категорий'
    })
    .optional(),
  about: Joi.string().max(1000).optional(),
  portfolio: Joi.array().items(Joi.string().uri()).optional(),
  isAvailable: Joi.boolean().optional(),
  avatarUrl: Joi.string().uri().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  yearsOfExperience: Joi.number().min(0).optional(),
  workMode: Joi.string().valid('online', 'offline', 'both').optional(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  serviceRadius: Joi.number().min(0).optional()
});

module.exports = {
  updateSchema
};
