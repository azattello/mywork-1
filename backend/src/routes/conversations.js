const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Create or get conversation between participants
router.post('/', auth, async (req, res) => {
  const { participants, applicationId } = req.body; // array of user ids and optional applicationId
  if (!participants || !Array.isArray(participants) || participants.length < 2) return res.status(400).json({ success: false, message: 'Participants array required' });

  // Try to find existing conversation with same participants
  const conv = await Conversation.findOne({ participants: { $size: participants.length, $all: participants } });
  if (conv) return res.json({ success: true, data: conv });

  const newConv = new Conversation({ 
    participants,
    application: applicationId || undefined,
    type: applicationId ? 'application' : 'direct'
  });
  await newConv.save();
  res.status(201).json({ success: true, data: newConv });
});

// List user's conversations
router.get('/', auth, async (req, res) => {
  const userId = req.user._id;
  const convs = await Conversation.find({ 
    participants: userId,
    isDeleted: { $ne: true } // Не показываем удаленные диалоги
  }).sort({ updatedAt: -1 });
  
  // Calculate unreadCount for each conversation
  const convsWithUnread = await Promise.all(
    convs.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        to: userId,
        isRead: false
      });
      
      return {
        ...conv.toObject(),
        unreadCount
      };
    })
  );
  
  res.json({ success: true, data: convsWithUnread });
});

// Delete conversation (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const convId = req.params.id;
    const userId = req.user._id;
    
    // Проверяем что пользователь участник диалога
    const conv = await Conversation.findById(convId);
    if (!conv) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    
    const isParticipant = conv.participants.some(p => p.toString() === userId.toString());
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'You are not a participant of this conversation' });
    }
    
    // Soft delete - просто отмечаем как удалено
    conv.isDeleted = true;
    await conv.save();
    
    res.json({ success: true, message: 'Conversation deleted', data: conv });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ success: false, message: 'Error deleting conversation', error: error.message });
  }
});

module.exports = router;
