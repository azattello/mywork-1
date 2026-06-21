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

    // If sender is a specialist, check whether they are allowed to send messages
    if (req.user.role === 'specialist') {
      const senderId = req.user._id.toString();

      // If there is a response for this specialist and it's rejected by client, block sending
      const Response = require('../models/Response');
      const resp = await Response.findOne({ application: application._id, specialist: senderId });
      if (resp && resp.status === 'rejected') {
        return res.status(403).json({ success: false, message: 'Ваш отклик был отклонён — вы не можете писать в этом чате' });
      }

      // If application is not open, allow only currentSpecialist or proposedSpecialist (if pending confirmation)
      if (application.status !== 'open') {
        const isCurrent = application.currentSpecialist && application.currentSpecialist.toString() === senderId;
        const isProposed = application.proposedSpecialist && application.proposedSpecialist.toString() === senderId && application.pendingSpecialistConfirmation;
        if (!isCurrent && !isProposed) {
          return res.status(403).json({ success: false, message: 'Переговоры по этой заявке закрыты для вас' });
        }
      }
    }
  }

  const message = new Message({ conversation: conversationId, from: req.user._id, to, text, attachments });
  await message.save();

  conv.lastMessage = text || (attachments && attachments[0]) || '';

  // Check if this is the first message from the application owner (client) and unlock specialist
  if (!conv.specialistUnlocked && conv.application) {
    const messageCount = await Message.countDocuments({ conversation: conversationId });

    // If this is the first message in conversation
    if (messageCount === 1) {
      // If conversation linked to an application, check if sender is application owner
      const appOwnerId = conv.application && conv.application.user ? conv.application.user.toString() : null;
      const isAppOwner = appOwnerId && req.user._id.toString() === appOwnerId;

      if (isAppOwner) {
        conv.specialistUnlocked = true;

        // Emit unlock event via socket.io to the specialist user room
        try {
          const io = req.io || req.app.get('io');
          if (io) {
            io.to('user_' + to.toString()).emit('unlock_chat', {
              conversation: conversationId,
              clientId: req.user._id,
              message: 'Вам открыт доступ к переписке. Клиент отправил первое сообщение.'
            });
          }
        } catch (e) {
          console.warn('Socket unlock emit failed', e.message || e);
        }
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

  // If conversation not yet unlocked, allow access to application owner (client)
  if (!conv.specialistUnlocked) {
    const isAppOwner = conv.application && conv.application.user && conv.application.user.toString() === req.user._id.toString();
    if (!isAppOwner && req.user.role === 'specialist') {
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

module.exports = router;
