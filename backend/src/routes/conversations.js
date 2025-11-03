const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Conversation = require('../models/Conversation');

// Create or get conversation between participants
router.post('/', auth, async (req, res) => {
  const { participants } = req.body; // array of user ids
  if (!participants || !Array.isArray(participants) || participants.length < 2) return res.status(400).json({ success: false, message: 'Participants array required' });

  // Try to find existing conversation with same participants
  const conv = await Conversation.findOne({ participants: { $size: participants.length, $all: participants } });
  if (conv) return res.json({ success: true, data: conv });

  const newConv = new Conversation({ participants });
  await newConv.save();
  res.status(201).json({ success: true, data: newConv });
});

// List user's conversations
router.get('/', auth, async (req, res) => {
  const userId = req.user._id;
  const convs = await Conversation.find({ participants: userId }).sort({ updatedAt: -1 });
  res.json({ success: true, data: convs });
});

module.exports = router;
