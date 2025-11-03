const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  surname: { type: String },
  role: { type: String, enum: ['user', 'specialist', 'admin'], default: 'user' },
  avatarUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
