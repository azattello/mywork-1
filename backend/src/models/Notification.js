const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['new_application', 'status_changed', 'new_response', 'new_message', 'review_received'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: {
    applicationId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    responseId: mongoose.Schema.Types.ObjectId,
    conversationId: mongoose.Schema.Types.ObjectId,
  },
  read: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
