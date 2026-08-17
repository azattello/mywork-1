const User = require('../models/User');
const Review = require('../models/Review');
const Application = require('../models/Application');
const fs = require('fs');
const path = require('path');

const hydrateUserReviewStats = async (userDoc) => {
  if (!userDoc || !userDoc._id) return userDoc;

  const reviews = await Review.find({
    $or: [
      { toUser: userDoc._id },
      { to: userDoc._id }
    ]
  });

  const total = reviews.length;
  if (total === 0) {
    userDoc.rating = 0;
    userDoc.reviewsCount = 0;
    userDoc.reviewCount = 0;
    return userDoc;
  }

  const avgRating = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / total;
  userDoc.rating = Number(avgRating.toFixed(1));
  userDoc.reviewsCount = total;
  userDoc.reviewCount = total;
  return userDoc;
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-passwordHash')
    .populate('city', 'name region')
    .populate('categories', '_id name icon');
  res.json({ success: true, data: user });
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id)
    .select('-passwordHash')
    .populate('city', 'name region')
    .populate('categories', '_id name icon');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const hydratedUser = await hydrateUserReviewStats(user);
  res.json({ success: true, data: hydratedUser });
};

exports.updateMe = async (req, res) => {
  const updates = {};
  const allowed = [
    'name', 'surname', 'avatarUrl', 'isAvailable', 'city', 'categories', 'about', 'portfolio',
    'minPrice', 'maxPrice', 'yearsOfExperience', 'workMode', 'latitude', 'longitude', 'serviceRadius'
  ];
  allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true })
    .select('-passwordHash')
    .populate('city', 'name region')
    .populate('categories', '_id name icon');
  
  res.json({ success: true, data: user });
};

// Загрузка портфолио (несколько файлов)
exports.uploadPortfolio = async (req, res) => {
  if (!req.files || !req.files.length) return res.status(400).json({ success: false, message: 'No files uploaded' });
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const urls = req.files.map(f => `${baseUrl}/uploads/${f.filename}`);

  const user = await User.findById(req.user._id);
  user.portfolio = (user.portfolio || []).concat(urls);
  await user.save();
  const out = await User.findById(req.user._id).select('-passwordHash').populate('city','name region').populate('categories','_id name icon');
  res.json({ success: true, data: out });
};

// Удалить элемент портфолио по url
exports.deletePortfolioItem = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, message: 'URL required' });
  try {
    const user = await User.findById(req.user._id);
    user.portfolio = (user.portfolio || []).filter(u => u !== url);
    await user.save();

    // Удалить файл с диска если локальный
    if (url.includes('/uploads/')) {
      const filename = url.split('/uploads/').pop();
      const filePath = path.join(__dirname, '..', '..', 'uploads', filename);
      fs.unlink(filePath, (err) => { if (err) console.warn('Failed to remove portfolio file', err.message || err); });
    }

    const out = await User.findById(req.user._id).select('-passwordHash').populate('city','name region').populate('categories','_id name icon');
    res.json({ success: true, data: out });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete portfolio item', error: err.message });
  }
};

// Отправить документы для верификации (multipart)
exports.submitVerification = async (req, res) => {
  if (!req.files || !req.files.length) return res.status(400).json({ success: false, message: 'No docs uploaded' });
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const urls = req.files.map(f => `${baseUrl}/uploads/${f.filename}`);

  const user = await User.findById(req.user._id);
  user.verification = { status: 'pending', docs: (user.verification?.docs || []).concat(urls) };
  await user.save();
  const out = await User.findById(req.user._id).select('-passwordHash');
  res.json({ success: true, data: out });
};

// Получить статистику специалиста (рейтинг, кол-во отзывов, завершенных заказов)
exports.getSpecialistStats = async (req, res) => {
  const { userId } = req.params;
  
  // Получить все отзывы для специалиста
  const reviews = await Review.find({
    $or: [
      { toUser: userId, type: 'client_to_specialist' },
      { to: userId, type: 'client_to_specialist' }
    ]
  });
  
  // Подсчитать среднюю оценку
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;
  
  // Подсчитать завершенные заказы
  const completedApplications = await Application.countDocuments({
    currentSpecialist: userId,
    status: 'completed'
  });
  
  res.json({ 
    success: true, 
    data: {
      averageRating: avgRating,
      totalReviews: reviews.length,
      completedApplications,
      reviews: reviews.map(r => ({ rating: r.rating, text: r.text, createdAt: r.createdAt }))
    }
  });
};

// Get list of specialists with full filtering, pagination, and sorting
exports.getAll = async (req, res) => {
  try {
    // Parsing query parameters
    const {
      role = 'specialist', // По умолчанию ищем специалистов
      city,
      categories,
      minPrice,
      maxPrice,
      minRating,
      minExperience,
      workMode,
      search,
      page = 1,
      limit = 20,
      sort = '-rating', // По умолчанию сортировка по рейтингу (desc)
      latitude,
      longitude,
      radius = 10 // км для поиска рядом
    } = req.query;

    // Построение фильтра
    const filter = { role };
    
    // Фильтр по городу
    if (city) {
      filter.city = city;
    }

    // Фильтр по категориям (comma-separated или array)
    if (categories) {
      const cats = Array.isArray(categories) 
        ? categories 
        : String(categories).split(',').map(c => c.trim()).filter(Boolean);
      if (cats.length) {
        filter.categories = { $in: cats };
      }
    }

    // Фильтр по диапазону цен
    if (minPrice || maxPrice) {
      filter.$and = [];
      if (minPrice) {
        filter.$and.push({ maxPrice: { $gte: Number(minPrice) } });
      }
      if (maxPrice) {
        filter.$and.push({ minPrice: { $lte: Number(maxPrice) } });
      }
    }

    // Фильтр по минимальному рейтингу
    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }

    // Фильтр по опыту
    if (minExperience) {
      filter.yearsOfExperience = { $gte: Number(minExperience) };
    }

    // Фильтр по режиму работы (online/offline/both)
    if (workMode) {
      if (workMode === 'online') {
        filter.workMode = { $in: ['online', 'both'] };
      } else if (workMode === 'offline') {
        filter.workMode = { $in: ['offline', 'both'] };
      }
    }

    // Фильтр по доступности
    filter.isAvailable = true;

    // Полнотекстовый поиск (по имени, фамилии, описанию, профессии)
    if (search) {
      const searchTerm = String(search).trim();
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { surname: { $regex: searchTerm, $options: 'i' } },
        { about: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Геопространственный поиск (если переданы координаты)
    if (latitude && longitude) {
      const radiusInMeters = Number(radius) * 1000; // Конвертируем км в метры
      filter.$or = filter.$or || [];
      filter.latitude = { $exists: true };
      filter.longitude = { $exists: true };
      // Примечание: Для полноценного геопространственного поиска нужен 2dsphere индекс
      // Здесь используем основной фильтр, расстояние будет рассчитано на frontend или в пост-обработке
    }

    // Пагинация
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20)); // Max 100 на page
    const skip = (pageNum - 1) * limitNum;

    // Сортировка
    let sortObj = {};
    if (sort) {
      const sortFields = String(sort).split(',').map(s => s.trim());
      sortFields.forEach(field => {
        if (field.startsWith('-')) {
          sortObj[field.substring(1)] = -1;
        } else {
          sortObj[field] = 1;
        }
      });
    }

    // Выполнение запроса с пагинацией
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .populate('city', 'name region')
        .populate('categories', '_id name icon')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter)
    ]);

    const hydratedUsers = await Promise.all(users.map(async (user) => {
      const reviews = await Review.find({
        $or: [
          { toUser: user._id },
          { to: user._id }
        ]
      });

      if (!reviews.length) {
        return { ...user, rating: 0, reviewsCount: 0, reviewCount: 0 };
      }

      const avgRating = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviews.length;
      return {
        ...user,
        rating: Number(avgRating.toFixed(1)),
        reviewsCount: reviews.length,
        reviewCount: reviews.length,
      };
    }));

    const totalPages = Math.ceil(total / limitNum);
    const hasMore = pageNum < totalPages;

    res.json({
      success: true,
      data: hydratedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasMore
      }
    });
  } catch (err) {
    console.error('Error fetching users', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Загрузка аватара (multipart/form-data) - сохраняет файл и обновляет user.avatarUrl
exports.uploadAvatar = async (req, res) => {
  // multer will have validated filetype/size
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  // Remove previous local avatar if present
  try {
    const existingUser = await User.findById(req.user._id);
    if (existingUser && existingUser.avatarUrl && existingUser.avatarUrl.includes('/uploads/')) {
      const oldFilename = existingUser.avatarUrl.split('/uploads/').pop();
      const oldPath = path.join(__dirname, '..', '..', 'uploads', oldFilename);
      fs.unlink(oldPath, (err) => {
        if (err) console.warn('Failed to remove old avatar', err.message || err);
      });
    }
  } catch (err) {
    console.warn('Error while attempting to delete old avatar', err.message || err);
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const filePath = `${baseUrl}/uploads/${req.file.filename}`; // public URL

  const user = await User.findByIdAndUpdate(req.user._id, { $set: { avatarUrl: filePath } }, { new: true }).select('-passwordHash');
  res.json({ success: true, data: user });
};

// Переключить активный режим (режим заказчика или специалиста)
exports.switchMode = async (req, res) => {
  const { mode } = req.body;
  
  if (!mode || !['user', 'specialist'].includes(mode)) {
    return res.status(400).json({ success: false, message: 'Invalid mode. Must be "user" or "specialist"' });
  }

  const user = await User.findById(req.user._id);
  
  // Проверяем есть ли у пользователя права на этот режим
  if (mode === 'specialist' && user.role !== 'specialist' && user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'User is not a specialist' });
  }
  
  user.activeRole = mode;
  await user.save();
  
  const updatedUser = await User.findById(req.user._id)
    .select('-passwordHash')
    .populate('city', 'name region')
    .populate('categories', '_id name icon');
  
  res.json({ success: true, data: updatedUser });
};

// Создать отзыв
const recalculateUserRating = async (userId) => {
  const reviews = await Review.find({
    $or: [
      { toUser: userId },
      { to: userId }
    ]
  });
  const total = reviews.length;

  if (total === 0) {
    await User.findByIdAndUpdate(userId, {
      $set: {
        rating: 0,
        reviewsCount: 0,
        reviewCount: 0,
      }
    }, { new: true });
    return;
  }

  const avgRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / total;
  await User.findByIdAndUpdate(userId, {
    $set: {
      rating: Number(avgRating.toFixed(1)),
      reviewsCount: total,
      reviewCount: total,
    }
  }, { new: true });
};

exports.createReview = async (req, res) => {
  try {
    const { applicationId, toUserId, rating, text, qualityRating, timingRating, communicationRating } = req.body;
    const authorId = req.user._id;

    // Валидация
    if (!applicationId || !toUserId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Invalid review data' });
    }

    // Проверяем что заказ существует
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Проверяем что пользователь (адресат отзыва) существует
    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Определяем тип отзыва
    const authorUser = await User.findById(authorId);
    let reviewType = 'client_to_specialist';
    if (authorUser.role === 'specialist') {
      reviewType = 'specialist_to_client';
    }

    // Проверяем что отзыв от этого пользователя еще не существует
    const existingReview = await Review.findOne({
      application: applicationId,
      author: authorId
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You already left a review for this application' });
    }

    // Создаем отзыв
    const review = new Review({
      application: applicationId,
      author: authorId,
      from: authorId,
      to: toUserId,
      toUser: toUserId,
      rating,
      qualityRating: qualityRating || rating,
      timingRating: timingRating || rating,
      communicationRating: communicationRating || rating,
      text: text || '',
      type: reviewType
    });

    await review.save();
    await review.populate('author', 'name surname avatarUrl');
    await recalculateUserRating(toUserId);

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Получить все отзывы для пользователя
exports.getReviewsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      $or: [
        { toUser: userId },
        { to: userId }
      ]
    })
      .populate('author', 'name surname avatarUrl role')
      .populate('application', 'title status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Review.countDocuments({
      $or: [
        { toUser: userId },
        { to: userId }
      ]
    });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error getting reviews:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Получить отзывы для конкретного заказа
exports.getReviewsByApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const reviews = await Review.find({ application: applicationId })
      .populate('author', 'name surname avatarUrl role')
      .populate('toUser', 'name surname avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error('Error getting reviews:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Получить статистику рейтинга пользователя
exports.getUserRatingStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({
      $or: [
        { toUser: userId },
        { to: userId }
      ]
    });

    if (reviews.length === 0) {
      return res.json({
        success: true,
        data: {
          averageRating: 0,
          totalReviews: 0,
          qualityAvg: 0,
          timingAvg: 0,
          communicationAvg: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      });
    }

    // Вычисляем средние значения
    const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
    const qualityAvg = reviews.reduce((sum, r) => sum + (r.qualityRating || r.rating || 0), 0) / reviews.length;
    const timingAvg = reviews.reduce((sum, r) => sum + (r.timingRating || r.rating || 0), 0) / reviews.length;
    const commAvg = reviews.reduce((sum, r) => sum + (r.communicationRating || r.rating || 0), 0) / reviews.length;

    // Распределение оценок
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      ratingDistribution[r.rating]++;
    });

    res.json({
      success: true,
      data: {
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        qualityAvg: Math.round(qualityAvg * 10) / 10,
        timingAvg: Math.round(timingAvg * 10) / 10,
        communicationAvg: Math.round(commAvg * 10) / 10,
        ratingDistribution
      }
    });
  } catch (err) {
    console.error('Error getting rating stats:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Обновить геопозицию пользователя
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, serviceRadius } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false, 
        message: 'Latitude and longitude are required' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          serviceRadius: serviceRadius ? parseInt(serviceRadius) : 50
        }
      },
      { new: true }
    )
      .select('-passwordHash')
      .populate('city', 'name region')
      .populate('categories', '_id name icon');

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Error updating location:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Получить специалистов в радиусе от текущего пользователя
exports.getNearbySpecialists = async (req, res) => {
  try {
    const { latitude, longitude, radius = 50, exclude = [] } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false, 
        message: 'Latitude and longitude are required' 
      });
    }

    const radiusKm = parseInt(radius) || 50;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Поиск специалистов в радиусе (в метрах, поэтому умножаем км на 1000)
    const specialists = await User.find({
      role: 'specialist',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat] // GeoJSON требует [longitude, latitude]
          },
          $maxDistance: radiusKm * 1000
        }
      },
      _id: { $nin: exclude }
    })
      .select('-passwordHash')
      .populate('city', 'name region')
      .populate('categories', '_id name icon')
      .limit(50)
      .lean();

    res.json({
      success: true,
      data: specialists
    });
  } catch (err) {
    console.error('Error getting nearby specialists:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Получить расстояние до специалиста (вспомогательная функция)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Радиус Земли в км
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Расстояние в км с 1 знаком после запятой
};

// Получить расстояние до конкретного специалиста
exports.getDistanceToSpecialist = async (req, res) => {
  try {
    const { specialistId } = req.params;
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false, 
        message: 'Latitude and longitude are required' 
      });
    }

    const specialist = await User.findById(specialistId).select('latitude longitude');
    if (!specialist || !specialist.latitude || !specialist.longitude) {
      return res.status(404).json({ 
        success: false, 
        message: 'Specialist not found or has no location' 
      });
    }

    const distance = getDistance(
      parseFloat(latitude),
      parseFloat(longitude),
      specialist.latitude,
      specialist.longitude
    );

    res.json({
      success: true,
      data: { distance, unit: 'км' }
    });
  } catch (err) {
    console.error('Error calculating distance:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
