const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// Post a message
router.post('/', auth, async (req, res) => {
  const { conversationId, to, text, attachments } = req.body;
  if (!conversationId || !to) return res.status(400).json({ success: false, message: 'conversationId and to required' });

  const conv = await Conversation.findById(conversationId);
  if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

  const message = new Message({ conversation: conversationId, from: req.user._id, to, text, attachments });
  await message.save();

  conv.lastMessage = text || (attachments && attachments[0]) || '';
  await conv.save();

  res.status(201).json({ success: true, data: message });
});

// Get messages for a conversation
router.get('/:conversationId', auth, async (req, res) => {
  const { conversationId } = req.params;
  const messages = await Message.find({ conversation: conversationId }).sort({ createdAt: 1 });
  res.json({ success: true, data: messages });
});

module.exports = router;
