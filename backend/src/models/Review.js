const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  application: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Application', 
    required: true 
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  toUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Legacy fields for compatibility
  from: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  to: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  
  // Основная оценка 1-5
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  
  // Отдельные критерии оценки 1-5
  qualityRating: { type: Number, min: 1, max: 5 }, // Качество работы
  timingRating: { type: Number, min: 1, max: 5 }, // Соблюдение сроков
  communicationRating: { type: Number, min: 1, max: 5 }, // Коммуникация
  
  // Текстовый отзыв и фото
  text: { type: String, maxlength: 500 },
  image: { type: String },
  
  // Тип отзыва (от заказчика или от исполнителя)
  type: {
    type: String,
    enum: ['client_to_specialist', 'specialist_to_client']
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Индексы
reviewSchema.index({ application: 1, author: 1 }, { unique: true }); // Один отзыв на заявку от одного пользователя
reviewSchema.index({ toUser: 1 }); // Поиск всех отзывов для пользователя
reviewSchema.index({ createdAt: -1 }); // Сортировка по дате

module.exports = mongoose.model('Review', reviewSchema);