const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Тип жалобы
  complaintType: {
    type: String,
    enum: [
      'unprofessional_behavior',
      'rude_communication',
      'payment_issue',
      'work_not_completed',
      'quality_issue',
      'misrepresentation',
      'scam',
      'offensive_content',
      'other'
    ],
    required: true
  },
  // Описание жалобы
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  // Доказательства (скриншоты, файлы)
  attachments: [{
    url: String,
    filename: String,
    mimeType: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Статус жалобы
  status: {
    type: String,
    enum: ['pending', 'in_review', 'resolved', 'rejected', 'appealed'],
    default: 'pending'
  },
  // Приоритет
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  // Результат разбирательства
  resolution: {
    type: String,
    enum: ['upheld', 'denied', 'partial', 'inconclusive'],
    default: null
  },
  // Комментарий администратора
  adminComment: {
    type: String,
    maxlength: 500
  },
  // Когда жалоба будет закрыта
  resolvedAt: Date,
  // Когда будет рассмотрена
  reviewedAt: Date,

}, { timestamps: true });

// Индексы для быстрого поиска и фильтрации
complaintSchema.index({ application: 1 });
complaintSchema.index({ reporter: 1 });
complaintSchema.index({ reportedUser: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ createdAt: -1 }); // Сортировка по дате (новые сначала)

module.exports = mongoose.model('Complaint', complaintSchema);
