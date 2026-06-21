const Application = require('../models/Application');

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

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
    new: ['in_progress', 'cancelled'],
    in_progress: ['agreed', 'cancelled'],
    agreed: ['completed', 'cancelled'],
    completed: [], // Финальный статус
    cancelled: [], // Финальный статус
  };

  if (!validTransitions[application.status].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Недопустимый переход статуса' 
    });
  }

  // Обновление статуса
  application.status = status;
  if (status === 'cancelled') {
    application.cancelReason = reason;
    application.cancelledAt = new Date();
    application.active = false;
  } else if (status === 'completed') {
    application.completedAt = new Date();
    application.active = false;
  }

  await application.save();

  // Возвращаем обновленную заявку со связанными данными
  await application.populate([
    { path: 'user', select: 'name surname avatarUrl' },
    { path: 'currentSpecialist', select: 'name surname avatarUrl' },
    { path: 'responses' },
    { path: 'review' }
  ]);

  res.json({ success: true, data: application });
};