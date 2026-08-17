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

    // Новый сценарий: специалист не пишет до первого сообщения заказчика.
    // После первого сообщения клиента он получает доступ в диалог, даже если ещё не был выбран.
    const isOwner = application.user.toString() === userId.toString();
    const isSelectedSpecialist =
      (application.currentSpecialist && application.currentSpecialist.toString() === userId.toString()) ||
      (application.proposedSpecialist && application.proposedSpecialist.toString() === userId.toString());
    const existingConversation = await Conversation.findOne({
      application: applicationId,
      participants: userId
    });

    const isParticipant = isOwner || isSelectedSpecialist || !!existingConversation;

    if (!isOwner && req.user.role === 'specialist' && !isSelectedSpecialist && (!existingConversation || !existingConversation.specialistUnlocked)) {
      return res.status(403).json({ success: false, message: 'Доступ к переписке еще не открыт. Ждите первого сообщения от клиента.' });
    }

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Доступ запрещен: этот чат закреплен за другим специалистом' });
    }

    // Находим или создаем чат для заявки.
    // Важный сценарий: заказчик уже выбрал специалиста, но тот ещё не подтвердил — для него чат уже должен быть доступен.
    const applicationParticipants = [
      application.user,
      application.currentSpecialist || application.proposedSpecialist
    ].filter(Boolean);

    let conversation = await Conversation.findOne({
      application: applicationId,
      participants: { $all: applicationParticipants }
    });

    if (!conversation && applicationParticipants.length >= 2) {
      conversation = new Conversation({
        application: applicationId,
        participants: applicationParticipants,
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

    const isOwner = application.user.toString() === userId.toString();
    const isCurrentSpecialist = application.currentSpecialist && application.currentSpecialist.toString() === userId.toString();
    const isProposedSpecialist = application.proposedSpecialist &&
      application.proposedSpecialist.toString() === userId.toString() &&
      application.pendingSpecialistConfirmation;

    const existingConversation = await Conversation.findOne({
      application: applicationId,
      participants: userId
    });

    const isParticipant = isOwner || isCurrentSpecialist || isProposedSpecialist || !!existingConversation;

    if (req.user.role === 'specialist' && !isOwner && !isCurrentSpecialist && !isProposedSpecialist && !existingConversation?.specialistUnlocked) {
      return res.status(403).json({ success: false, message: 'Доступ к переписке закрыт: сначала клиент должен написать первое сообщение' });
    }

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Доступ запрещен: этот чат закреплен за другим специалистом' });
    }

    // Находим чат. Для выбранного специалиста до подтверждения он должен существовать и быть доступным по applicationId.
    const applicationParticipants = [
      application.user,
      application.currentSpecialist || application.proposedSpecialist
    ].filter(Boolean);

    let conversation = await Conversation.findOne({
      application: applicationId,
      participants: { $all: applicationParticipants }
    });

    if (!conversation && applicationParticipants.length >= 2) {
      conversation = new Conversation({
        application: applicationId,
        participants: applicationParticipants,
        type: 'application'
      });
      await conversation.save();
    }

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