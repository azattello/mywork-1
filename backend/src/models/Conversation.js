const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: String },
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  type: { type: String, enum: ['direct', 'application'], default: 'direct' },
  unreadCount: { type: Number, default: 0 }, // Количество непрочитанных сообщений
  specialistUnlocked: { type: Boolean, default: false }, // Разблокирован ли специалист после первого сообщения клиента
  isDeleted: { type: Boolean, default: false } // Soft delete флаг
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
