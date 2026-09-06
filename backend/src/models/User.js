const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  phoneVerified: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false },
  passwordHash: { type: String, required: true },
  name: { type: String },
  surname: { type: String },
  role: { type: String, enum: ['user', 'specialist', 'admin'], default: 'user' },
  // Активный режим: какой режим пользователь использует в данный момент (user или specialist)
  activeRole: { type: String, enum: ['user', 'specialist'], default: 'user' },
  avatarUrl: { type: String },
  city: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  isAvailable: { type: Boolean, default: true }, // Для специалистов: доступен ли для новых заказов
  about: { type: String },
  portfolio: [{ type: String }], // URLs to portfolio images/files
  
  // Для специалистов: цены и опыт
  minPrice: { type: Number, default: 0 }, // Минимальная цена заказа
  maxPrice: { type: Number, default: 0 }, // Максимальная цена заказа
  yearsOfExperience: { type: Number, default: 0 }, // Лет опыта
  
  // Для специалистов: режим работы
  workMode: { type: String, enum: ['online', 'offline', 'both'], default: 'online' },
  
  // Для специалистов: геолокация
  latitude: { type: Number },
  longitude: { type: Number },
  serviceRadius: { type: Number, default: 10 }, // км
  
  // GeoJSON для геопространственного поиска
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude] в GeoJSON порядке
      index: '2dsphere'
    }
  },
  
  // Рейтинг (кэшируется, рассчитывается из Review)
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  
  verification: {
    status: { type: String, enum: ['none','pending','verified','rejected'], default: 'none' },
    docs: [{ type: String }]
  },
  lastSeen: { type: Date, default: Date.now }, // Когда пользователь был в сети
}, { timestamps: true });

// Обновляем location только при корректных координатах.
// Если lat/long не указаны, не создаём пустой GeoJSON объект.
userSchema.pre('save', function(next) {
  const hasValidCoords =
    this.latitude !== undefined &&
    this.latitude !== null &&
    this.longitude !== undefined &&
    this.longitude !== null &&
    !Number.isNaN(this.latitude) &&
    !Number.isNaN(this.longitude);

  if (hasValidCoords) {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude]
    };
  } else {
    this.location = undefined;
  }

  next();
});

// Индексы для поиска и фильтрации
userSchema.index({ role: 1, isAvailable: 1 }); // Фильтр по роли и доступности
userSchema.index({ city: 1 }); // Фильтр по городу
userSchema.index({ categories: 1 }); // Фильтр по категориям
userSchema.index({ rating: -1 }); // Сортировка по рейтингу (desc)
userSchema.index({ minPrice: 1, maxPrice: 1 }); // Сортировка по цене
userSchema.index({ yearsOfExperience: -1 }); // Сортировка по опыту
userSchema.index({ name: 'text', surname: 'text', about: 'text' }); // Полнотекстовый поиск
userSchema.index({ 'location': '2dsphere' }); // Геопространственный поиск

module.exports = mongoose.model('User', userSchema);
