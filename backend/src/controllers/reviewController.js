const Review = require('../models/Review');
const Application = require('../models/Application');

exports.createReview = async (req, res) => {
  const { applicationId } = req.params;
  const { rating, text } = req.body;

  const application = await Application.findById(applicationId);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Заявка не найдена' });
  }

  // Проверяем, что заявка завершена и принята клиентом/исполнителем
  if (application.status !== 'closed' && application.status !== 'completed') {
    return res.status(400).json({ 
      success: false, 
      message: 'Отзыв можно оставить только после завершения заказа' 
    });
  }

  const isClient = application.user.toString() === req.user._id.toString();
  const isSpecialist = application.currentSpecialist.toString() === req.user._id.toString();

  if (!isClient && !isSpecialist) {
    return res.status(403).json({ success: false, message: 'Доступ запрещен' });
  }

  try {
    const review = new Review({
      application: applicationId,
      from: req.user._id,
      to: isClient ? application.currentSpecialist : application.user,
      rating,
      text,
      type: isClient ? 'client_to_specialist' : 'specialist_to_client'
    });

    await review.save();
    await review.populate([
      { path: 'from', select: 'name surname avatarUrl' },
      { path: 'to', select: 'name surname avatarUrl' }
    ]);

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Вы уже оставили отзыв по этой заявке' 
      });
    }
    throw error;
  }
};

// Получение отзывов для заявки
exports.getApplicationReviews = async (req, res) => {
  const applicationId = req.params.applicationId || req.params.id;

  const application = await Application.findById(applicationId);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Заявка не найдена' });
  }

  const reviews = await Review.find({ application: applicationId })
    .populate('from', 'name surname avatarUrl')
    .populate('to', 'name surname avatarUrl')
    .sort('-createdAt');

  res.json({ success: true, data: reviews });
};