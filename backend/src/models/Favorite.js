const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Фильтр против дубликатов
  // Каждый пользователь может добавить каждого специалиста только один раз
}, { timestamps: true });

// Уникальный индекс: один пользователь может добавить одного специалиста только один раз
favoriteSchema.index({ user: 1, specialist: 1 }, { unique: true });
// Индекс для быстрого поиска избранных пользователя
favoriteSchema.index({ user: 1 });
// Индекс для подсчета, сколько раз был добавлен специалист в избранное
favoriteSchema.index({ specialist: 1 });

module.exports = mongoose.model('Favorite', favoriteSchema);
