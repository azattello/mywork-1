const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// Отправить сообщение с файлом/фото
exports.sendMessageWithAttachment = async (req, res) => {
  try {
    const { conversationId, to } = req.body;
    const from = req.user._id;

    // Проверяем что есть либо текст, либо файл
    if (!req.body.text && !req.files) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message must have text or attachment' 
      });
    }

    // Проверяем что беседа существует
    let conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      // Создаем новую беседу если не существует
      conversation = new Conversation({
        participants: [from, to],
        lastMessage: req.body.text || 'Файл',
        lastMessageTime: new Date()
      });
      await conversation.save();
    }

    // Подготавливаем файлы
    const attachments = [];
    if (req.files && req.files.length > 0) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      attachments.push(...req.files.map(file => ({
        url: `${baseUrl}/uploads/${file.filename}`,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        type: file.mimetype.startsWith('image/') ? 'image' : 
              file.mimetype.startsWith('video/') ? 'video' : 'file',
        uploadedAt: new Date()
      })));
    }

    // Создаем сообщение
    const message = new Message({
      conversation: conversation._id,
      from,
      to,
      text: req.body.text || '',
      attachments
    });

    await message.save();
    await message.populate('from', 'name surname avatarUrl');

    // Обновляем последнее сообщение в беседе
    conversation.lastMessage = req.body.text || `Файл: ${req.files[0]?.originalname || 'Приложение'}`;
    conversation.lastMessageTime = new Date();
    await conversation.save();

    res.json({ success: true, data: message });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// Получить все сообщения из беседы
exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversation: conversationId })
      .populate('from', 'name surname avatarUrl role')
      .populate('to', 'name surname avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Message.countDocuments({ conversation: conversationId });

    res.json({
      success: true,
      data: messages.reverse(), // Обратный порядок для чата
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error getting messages:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// Отметить сообщение как прочитанное
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { 
        $set: { 
          isRead: true,
          readAt: new Date()
        }
      },
      { new: true }
    ).populate('from', 'name surname');

    res.json({ success: true, data: message });
  } catch (err) {
    console.error('Error marking message as read:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Удалить сообщение
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: 'Message not found' 
      });
    }

    // Проверяем что это отправитель сообщения
    if (message.from.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only sender can delete message' 
      });
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
            if (err) console.warn('Failed to delete attachment:', err.message);
          });
        }
      });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Получить все беседы пользователя
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({ participants: userId })
      .populate({
        path: 'participants',
        select: 'name surname avatarUrl',
        match: { _id: { $ne: userId } }
      })
      .sort({ lastMessageTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Conversation.countDocuments({ participants: userId });

    res.json({
      success: true,
      data: conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error getting conversations:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Создать системное сообщение (вызывается внутренне, не напрямую из API)
exports.createSystemMessage = async (conversationId, fromUser, toUser, eventType, systemData = {}) => {
  try {
    const message = new Message({
      conversation: conversationId,
      from: fromUser,
      to: toUser,
      messageType: 'system',
      systemEventType: eventType,
      systemData,
      text: buildSystemMessageText(eventType, systemData)
    });

    await message.save();
    return message;
  } catch (err) {
    console.error('Error creating system message:', err);
    return null;
  }
};

// Построить текст системного сообщения
const buildSystemMessageText = (eventType, data) => {
  const messages = {
    'work_started': '🚀 Работа начата',
    'work_updated': '✏️ Работа обновлена',
    'work_completed': '✅ Работа завершена и ожидает подтверждения',
    'work_accepted': '👍 Работа подтверждена и принята',
    'work_rejected': '❌ Работа отклонена',
    'specialist_assigned': `👤 Специалист назначен на заказ`,
    'status_changed': `📊 Статус заказа изменился: ${data.oldStatus || 'неизвестно'} → ${data.newStatus || 'неизвестно'}`
  };

  return messages[eventType] || 'Системное сообщение';
};
