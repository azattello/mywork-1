const Application = require('../models/Application');
const Conversation = require('../models/Conversation');
const messageController = require('./messageController');

const normalizeApplicationStatus = (value) => {
  if (!value) return 'open';
  const legacyMap = {
    new: 'open',
    agreed: 'in_progress',
    completed: 'closed',
    cancelled: 'closed',
  };
  return legacyMap[value] || value;
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const normalizedStatus = normalizeApplicationStatus(status);

  const application = await Application.findById(id);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Заявка не найдена' });
  }

  // Проверка прав на изменение статуса
  const isOwner = application.user.toString() === req.user._id.toString();
  const isSpecialist = application.currentSpecialist && 
    application.currentSpecialist.toString() === req.user._id.toString();

  if (!isOwner && !isSpecialist) {
    return res.status(403).json({ success: false, message: 'Доступ запрещен' });
  }

  // Валидация перехода статусов
  const validTransitions = {
    open: ['in_progress', 'closed'],
    in_progress: ['closed'],
    closed: [],
  };

  const currentStatus = normalizeApplicationStatus(application.status);
  if (!validTransitions[currentStatus]?.includes(normalizedStatus)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Недопустимый переход статуса' 
    });
  }

  const oldStatus = currentStatus;

  // Обновление статуса
  application.status = normalizedStatus;
  if (normalizedStatus === 'closed') {
    application.cancelReason = reason || application.cancelReason;
    application.cancelledAt = application.cancelledAt || new Date();
    application.active = false;
  }

  await application.save();

  // Отправляем системное сообщение в чат заказа
  if (application.currentSpecialist) {
    const conversation = await Conversation.findOne({
      application: application._id
    });

    if (conversation) {
      const eventType = status === 'completed' ? 'work_completed' : 'status_changed';
      await messageController.createSystemMessage(
        conversation._id,
        req.user._id,
        application.currentSpecialist,
        eventType,
        { oldStatus, newStatus: status }
      );
    }
  }

  // Возвращаем обновленную заявку со связанными данными
  await application.populate([
    { path: 'user', select: 'name surname avatarUrl' },
    { path: 'currentSpecialist', select: 'name surname avatarUrl' },
    { path: 'responses' },
    { path: 'review' }
  ]);

  res.json({ success: true, data: application });
};