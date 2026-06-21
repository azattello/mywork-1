const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Название города обязательно'],
    unique: true,
    trim: true,
    maxlength: [50, 'Название не более 50 символов']
  },
  region: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    default: 'Kazakhstan'
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Индекс для поиска
citySchema.index({ name: 'text', region: 'text' });

module.exports = mongoose.model('City', citySchema);
