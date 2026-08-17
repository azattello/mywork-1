const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String },
  
  // Тип сообщения: 'user' - обычное сообщение, 'system' - системное сообщение
  messageType: {
    type: String,
    enum: ['user', 'system'],
    default: 'user'
  },
  
  // Для системных сообщений - тип события
  systemEventType: {
    type: String,
    enum: [
      'work_started',      // Работа начата
      'work_updated',      // Работа обновлена
      'work_completed',    // Работа завершена
      'work_accepted',     // Работа принята
      'work_rejected',     // Работа отклонена
      'specialist_assigned', // Специалист назначен
      'status_changed'     // Статус заказа изменился
    ]
  },
  
  // Данные системного сообщения (например, старый и новый статус)
  systemData: { type: Object },
  
  // Расширенная поддержка файлов
  attachments: [
    {
      url: String,
      filename: String,
      mimeType: String,
      size: Number,
      type: { type: String, enum: ['image', 'file', 'video'], default: 'file' },
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  
  // Быстрая ссылка для обратной совместимости (legacy)
  attachment: { type: String },
  
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
