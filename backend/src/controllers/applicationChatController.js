const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Application = require('../models/Application');

exports.getApplicationChat = async (req, res) => {
  const applicationId = req.params.applicationId || req.params.id;
  const userId = req.user._id;

  try {
    // Проверяем заявку
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Заявка не найдена' });
    }

    // Проверяем права доступа (только заказчик и выбранный специалист)
    const isParticipant = 
      application.user.toString() === userId.toString() ||
      (application.currentSpecialist && 
       application.currentSpecialist.toString() === userId.toString());

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Доступ запрещен' });
    }

    // Находим или создаем чат для заявки
    let conversation = await Conversation.findOne({
      application: applicationId,
      participants: { 
        $all: [application.user, application.currentSpecialist].filter(Boolean)
      }
    });

    if (!conversation && application.currentSpecialist) {
      conversation = new Conversation({
        application: applicationId,
        participants: [application.user, application.currentSpecialist],
        type: 'application'
      });
      await conversation.save();
    }

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Чат недоступен (специалист еще не выбран)' 
      });
    }

    // Получаем сообщения
    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: 1 })
      .populate('from', 'name surname avatarUrl');

    res.json({ success: true, data: { conversation, messages } });
  } catch (err) {
    console.error('Error in getApplicationChat:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.sendApplicationMessage = async (req, res) => {
  const applicationId = req.params.applicationId || req.params.id;
  const { text } = req.body;
  const userId = req.user._id;

  if (!text?.trim()) {
    return res.status(400).json({ success: false, message: 'Текст сообщения обязателен' });
  }

  try {
    // Проверяем заявку и права доступа
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Заявка не найдена' });
    }

    const isParticipant = 
      application.user.toString() === userId.toString() ||
      (application.currentSpecialist && 
       application.currentSpecialist.toString() === userId.toString());

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Доступ запрещен' });
    }

    // Находим чат
    let conversation = await Conversation.findOne({
      application: applicationId,
      participants: { 
        $all: [application.user, application.currentSpecialist].filter(Boolean)
      }
    });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Чат не найден' 
      });
    }

    // Создаем сообщение
    const message = new Message({
      conversation: conversation._id,
      from: userId,
      to: userId.toString() === application.user.toString() 
        ? application.currentSpecialist 
        : application.user,
      text,
      type: 'application'
    });

    await message.save();
    await message.populate('from', 'name surname avatarUrl');

    // Обновляем время последнего сообщения в чате
    conversation.lastMessage = text;
    conversation.updatedAt = new Date();
    await conversation.save();

    // Отправляем через socket.io если есть
    if (req.io) {
      req.io.to(conversation._id.toString()).emit('message', {
        conversation: conversation._id,
        message
      });
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    console.error('Error in sendApplicationMessage:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};