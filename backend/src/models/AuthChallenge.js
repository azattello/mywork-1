const mongoose = require('mongoose');

const authChallengeSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  type: { type: String, enum: ['registration', 'sms_login', 'two_factor', 'password_reset'], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  otpHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  consumedAt: { type: Date },
  payload: { type: mongoose.Schema.Types.Mixed },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  lastSentAt: { type: Date, required: true },
}, { timestamps: true });

authChallengeSchema.index({ phone: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('AuthChallenge', authChallengeSchema);