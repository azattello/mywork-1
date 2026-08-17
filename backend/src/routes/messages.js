const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// Post a message
router.post('/', auth, async (req, res) => {
  const { conversationId, to, text, attachments } = req.body;
  if (!conversationId || !to) return res.status(400).json({ success: false, message: 'conversationId and to required' });

  const conv = await Conversation.findById(conversationId).populate('application');
  if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

  // If conversation attached to an application, enforce sending rules
  if (conv.application) {
    const application = conv.application; // populated

    if (req.user.role === 'specialist') {
      const senderId = req.user._id.toString();

      const Response = require('../models/Response');
      const resp = await Response.findOne({ application: application._id, specialist: senderId });
      if (resp && resp.status === 'rejected') {
        return res.status(403).json({ success: false, message: 'Ваш отклик был отклонён — вы не можете писать в этом чате' });
      }

      const isAppOwner = application.user && application.user.toString() === senderId;
      const isParticipant = conv.participants.some(p => p.toString() === senderId);
      const isSelectedSpecialist =
        (application.currentSpecialist && application.currentSpecialist.toString() === senderId) ||
        (application.proposedSpecialist && application.proposedSpecialist.toString() === senderId);

      // Новый сценарий: специалист не пишет до первого сообщения заказчика, но если он уже выбран
      // клиентом или уже назначен на заказ, доступ к переписке должен оставаться открытым.
      if (!isAppOwner && !isSelectedSpecialist && !conv.specialistUnlocked) {
        return res.status(403).json({ success: false, message: 'Доступ к переписке закрыт: сначала клиент должен написать первое сообщение' });
      }

      if (!isParticipant) {
        return res.status(403).json({ success: false, message: 'У вас нет доступа к этой переписке' });
      }

      if (application.status === 'closed' && !isAppOwner) {
        return res.status(403).json({ success: false, message: 'Переговоры по этой заявке закрыты для вас' });
      }
    }
  }

  const message = new Message({ conversation: conversationId, from: req.user._id, to, text, attachments });
  await message.save();

  conv.lastMessage = text || (attachments && attachments[0]) || '';

  if (!conv.specialistUnlocked && conv.application) {
    const appOwnerId = conv.application && conv.application.user ? conv.application.user.toString() : null;
    const isAppOwner = appOwnerId && req.user._id.toString() === appOwnerId;
    const isAssignedSpecialist = conv.application.currentSpecialist && conv.application.currentSpecialist.toString() === req.user._id.toString();
    const isProposedSpecialist = conv.application.proposedSpecialist &&
      conv.application.proposedSpecialist.toString() === req.user._id.toString() &&
      conv.application.pendingSpecialistConfirmation;

    if (isAppOwner || isAssignedSpecialist || isProposedSpecialist) {
      conv.specialistUnlocked = true;

      try {
        const io = req.io || req.app.get('io');
        if (io) {
          io.to('user_' + to.toString()).emit('unlock_chat', {
            conversation: conversationId,
            clientId: req.user._id,
            message: 'Вам открыт доступ к переписке.'
          });
        }
      } catch (e) {
        console.warn('Socket unlock emit failed', e.message || e);
      }
    }
  }

  await conv.save();

  // Emit via socket.io if available on the request (app middleware sets req.io)
  try {
    const io = req.io || req.app.get('io');
    if (io) {
      io.to(conversationId.toString()).emit('message', { conversation: conversationId, message });
    }
  } catch (e) {
    console.warn('Socket emit failed', e.message || e);
  }

  res.status(201).json({ success: true, data: message });
});

// Get messages for a conversation
router.get('/:conversationId', auth, async (req, res) => {
  const { conversationId } = req.params;

  const conv = await Conversation.findById(conversationId).populate('application');
  if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

  if (conv.application && req.user.role === 'specialist') {
    const isAppOwner = conv.application.user && conv.application.user.toString() === req.user._id.toString();
    const isParticipant = conv.participants.some(p => p.toString() === req.user._id.toString());
    const isSelectedSpecialist =
      (conv.application.currentSpecialist && conv.application.currentSpecialist.toString() === req.user._id.toString()) ||
      (conv.application.proposedSpecialist && conv.application.proposedSpecialist.toString() === req.user._id.toString());

    if (!isAppOwner && !isSelectedSpecialist && (!conv.specialistUnlocked || !isParticipant)) {
      return res.status(403).json({ success: false, message: 'Доступ к переписке еще не открыт. Ждите первого сообщения от клиента.' });
    }
  }

  // Check if user is participant in conversation
  const isParticipant = conv.participants.some(p => p.toString() === req.user._id.toString());
  if (!isParticipant && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'У вас нет доступа к этой переписке' });
  }

  const messages = await Message.find({ conversation: conversationId }).sort({ createdAt: 1 });
  res.json({ success: true, data: messages });
});

// Mark message as read
router.patch('/:messageId/read', auth, async (req, res) => {
  const { messageId } = req.params;
  const message = await Message.findById(messageId);
  if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

  message.isRead = true;
  message.readAt = new Date();
  await message.save();

  res.json({ success: true, data: message });
});

// Загрузить файл/фото к сообщению (новая версия)
const upload = require('../middlewares/upload');
router.post('/:conversationId/file-upload', auth, upload.array('attachments', 10), async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { to, text } = req.body;

    if (!to) {
      return res.status(400).json({ success: false, message: 'Recipient (to) required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Подготавливаем файлы
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const attachments = req.files.map(file => ({
      url: `${baseUrl}/uploads/${file.filename}`,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      type: file.mimetype.startsWith('image/') ? 'image' : 
            file.mimetype.startsWith('video/') ? 'video' : 'file',
      uploadedAt: new Date()
    }));

    // Создаем сообщение
    const message = new Message({
      conversation: conversationId,
      from: req.user._id,
      to,
      text: text || '',
      attachments
    });

    await message.save();
    await message.populate('from', 'name surname avatarUrl');

    // Обновляем последнее сообщение в беседе
    conversation.lastMessage = text || `Файл: ${req.files[0]?.originalname || 'Приложение'}`;
    await conversation.save();

    res.json({ success: true, data: message });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Удалить сообщение (с удалением файлов)
router.delete('/:messageId/delete', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Проверяем что это отправитель
    if (message.from.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only sender can delete' });
    }

    // Удаляем файлы если нужно
    if (message.attachments && message.attachments.length > 0) {
      const path = require('path');
      const fs = require('fs');
      
      message.attachments.forEach(attachment => {
        const filename = attachment.url.split('/uploads/').pop();
        if (filename) {
          const filePath = path.join(__dirname, '..', '..', 'uploads', filename);
          fs.unlink(filePath, (err) => {
            if (err) console.warn('Failed to delete file:', err.message);
          });
        }
      });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
