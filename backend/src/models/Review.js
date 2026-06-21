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
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  text: { type: String },
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

// Один отзыв на заявку от одного пользователя
reviewSchema.index({ application: 1, author: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);