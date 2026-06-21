const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
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
  verification: {
    status: { type: String, enum: ['none','pending','verified','rejected'], default: 'none' },
    docs: [{ type: String }]
  },
  lastSeen: { type: Date, default: Date.now }, // Когда пользователь был в сети
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
