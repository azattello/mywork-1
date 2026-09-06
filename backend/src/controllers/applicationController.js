const Application = require('../models/Application');
const User = require('../models/User');
const notificationController = require('./notificationController');
const { geocodeAddress } = require('../services/geocodingService');

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

exports.create = async (req, res) => {
  const { title, summ, info, city, categories, budgetType, budgetMin, budgetMax, workMode, address, deadline, active, userID, currentSpecialist, status } = req.body;
  const normalizedStatus = normalizeApplicationStatus(status);

  // Валидация обязательных полей
  if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
  if (!title.trim() || title.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Title must be at least 3 characters' });
  }
  
  // Info необязателен, но если есть то минимум 10 символов
  if (info && info.trim() && info.trim().length < 10) {
    return res.status(400).json({ success: false, message: 'Description must be at least 10 characters' });
  }

  // Получить пользователя либо из auth middleware, либо из userID в body (fallback)
  let user = req.user;
  if (!user && userID) {
    try {
      user = await User.findById(userID);
    } catch (e) {
      // ignore
    }
  }

  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized - user not found' });
  
  // Убедиться что это клиент, а не специалист (опционально, если роли установлены)
  if (user.role === 'specialist') {
    return res.status(403).json({ success: false, message: 'Specialists cannot create applications' });
  }

  let coordinates;
  if (address && address.trim()) {
    try {
      const cityDoc = city ? await require('../models/City').findById(city).select('name').lean() : null;
      coordinates = await geocodeAddress(address.trim(), cityDoc?.name);
    } catch (error) {
      return res.status(502).json({ success: false, message: 'Не удалось определить координаты адреса' });
    }
    if (!coordinates) {
      return res.status(422).json({ success: false, message: 'Адрес не найден. Проверьте адрес и попробуйте снова' });
    }
  }

  // Optionally resolve currentSpecialist if provided
  let specialist = null;
  if (currentSpecialist) {
    try {
      specialist = await User.findById(currentSpecialist);
    } catch (e) {
      // ignore invalid id
    }

    // Check if user already has an active proposal to this specialist
    if (specialist) {
      const existingProposal = await Application.findOne({
        user: user._id,
        currentSpecialist: specialist._id,
        proposalStatus: 'active'
      });
      
      if (existingProposal) {
        return res.status(400).json({ 
          success: false, 
          message: 'Вы уже отправили активное предложение этому специалисту. Завершите или закройте его перед отправкой нового.' 
        });
      }
    }
  }

  const app = new Application({
    title,
    summ: summ ? Number(summ) : 0,
    info: info ? info.trim() : '',
    city,
    categories: Array.isArray(categories) ? categories : [],
    budgetType: budgetType || 'fixed',
    budgetMin: budgetMin ? Number(budgetMin) : undefined,
    budgetMax: budgetMax ? Number(budgetMax) : undefined,
    workMode: workMode || 'online',
    address: address || undefined,
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
    deadline: deadline ? new Date(deadline) : undefined,
    active: typeof active === 'boolean' ? active : true,
    user: user._id,
    currentSpecialist: specialist ? specialist._id : undefined,
    status: normalizedStatus,
    proposalStatus: specialist ? 'active' : 'closed'
  });

  await app.save();

  // Create notification for specialist if assigned
  if (specialist) {
    const io = req.app.get('io');
    await notificationController.createNotification(
      specialist._id,
      'new_application',
      'Новое предложение',
      `Получено новое предложение: "${title}"`,
      { applicationId: app._id, userId: user._id },
      io
    );
  }

  res.status(201).json({ success: true, data: app });
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const app = await Application.findById(id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
  if (String(app.user) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Only the owner can edit this application' });
  }

  const updates = { ...req.body };
  if (Object.prototype.hasOwnProperty.call(updates, 'address')) {
    if (!updates.address || !updates.address.trim()) {
      delete updates.latitude;
      delete updates.longitude;
    } else {
      try {
        const cityId = updates.city || app.city;
        const cityDoc = cityId ? await require('../models/City').findById(cityId).select('name').lean() : null;
        const coordinates = await geocodeAddress(updates.address.trim(), cityDoc?.name);
        if (!coordinates) {
          return res.status(422).json({ success: false, message: 'Адрес не найден. Проверьте адрес и попробуйте снова' });
        }
        updates.latitude = coordinates.latitude;
        updates.longitude = coordinates.longitude;
      } catch (error) {
        return res.status(502).json({ success: false, message: 'Не удалось определить координаты адреса' });
      }
    }
  }

  const allowed = ['title', 'summ', 'info', 'city', 'categories', 'budgetType', 'budgetMin', 'budgetMax', 'workMode', 'address', 'deadline', 'latitude', 'longitude'];
  const safeUpdates = Object.fromEntries(Object.entries(updates).filter(([key]) => allowed.includes(key)));
  const updated = await Application.findByIdAndUpdate(id, { $set: safeUpdates }, { new: true })
    .populate('city', 'name')
    .populate('categories', 'name');
  res.json({ success: true, data: updated });
};

exports.getByUser = async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

  // validate ObjectId-ish
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid userId format' });
  }

  try {
    const apps = await Application.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('currentSpecialist', 'name surname')
      .populate('city', 'name')
      .populate('categories', 'name')
      .populate('responses')
      .populate('review')
      .populate({
        path: 'user',
        select: 'name surname city',
        populate: {
          path: 'city',
          select: 'name'
        }
      })
      .lean();
    
    return res.json({ success: true, data: apps });
  } catch (err) {
    console.error('Error fetching user applications', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get applications where specialist is the currentSpecialist
exports.getBySpecialist = async (req, res) => {
  const { specialistId } = req.params;
  if (!specialistId) return res.status(400).json({ success: false, message: 'specialistId is required' });

  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(specialistId)) {
    return res.status(400).json({ success: false, message: 'Invalid specialistId format' });
  }

  try {
    const apps = await Application.find({
      $or: [
        { currentSpecialist: specialistId },
        { proposedSpecialist: specialistId, pendingSpecialistConfirmation: true },
      ]
    })
      .sort({ createdAt: -1 })
      .populate('currentSpecialist', 'name surname')
      .populate('proposedSpecialist', 'name surname')
      .populate('city', 'name')
      .populate('categories', 'name')
      .populate({
        path: 'user',
        select: 'name surname city avatar',
        populate: {
          path: 'city',
          select: 'name'
        }
      })
      .populate('responses')
      .populate('review')
      .lean();
    return res.json({ success: true, data: apps });
  } catch (err) {
    console.error('Error fetching specialist applications', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

  // Get all applications
  exports.getAll = async (req, res) => {
    try {
      const requestedStatus = (req.query.status || 'open').toString().trim().toLowerCase();
      const filters = {
        status: requestedStatus,
        active: true,
        $and: [
          {
            $or: [
              { proposedSpecialist: { $exists: false } },
              { proposedSpecialist: null },
              { pendingSpecialistConfirmation: false },
              { pendingSpecialistConfirmation: { $exists: false } },
            ],
          },
          {
            $or: [
              { currentSpecialist: { $exists: false } },
              { currentSpecialist: null },
            ],
          },
          {
            $or: [
              { status: 'open' },
              { status: { $exists: false } },
            ],
          },
        ],
      };

      const apps = await Application.find(filters)
        .sort({ createdAt: -1 })
        .populate('user', 'name surname')
        .populate('city', 'name')
        .populate('categories', 'name')
        .populate('currentSpecialist', 'name surname')
        .lean();

      return res.json({ success: true, data: apps });
    } catch (err) {
      console.error('Error fetching applications', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  // Get application by id (detailed)
  exports.getById = async (req, res) => {
    const { id } = req.params;
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id format' });
    }

    try {
      const app = await Application.findById(id)
        .populate('currentSpecialist', 'name surname')
        .populate('proposedSpecialist', 'name surname')
        .populate({
          path: 'user',
          select: 'name surname city',
          populate: {
            path: 'city',
            select: 'name'
          }
        })
        .populate('city', 'name')
        .populate('categories', 'name')
        .populate('responses')
        .populate('review')
        .lean();

      if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
      return res.json({ success: true, data: app });
    } catch (err) {
      console.error('Error fetching application by id', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  // Publish proposal as public order (anyone can respond)
  exports.publishAsOrder = async (req, res) => {
    const { id } = req.params;
    const mongoose = require('mongoose');
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id format' });
    }

    try {
      const app = await Application.findById(id);
      if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

      // Only owner can publish
      if (app.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Only owner can publish' });
      }

      // Convert proposal to public order: remove specific specialist and mark proposal as closed
      app.currentSpecialist = undefined;
      app.proposalStatus = 'closed';
      
      await app.save();
      return res.json({ success: true, data: app });
    } catch (err) {
      console.error('Error publishing application:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };

// Загрузить фото к заказу
exports.uploadPhotos = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files || !req.files.length) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    // Найти заказ
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Проверить что это владелец заказа
    if (application.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only owner can upload photos' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Добавить новые фото
    const photos = req.files.map(file => ({
      url: `${baseUrl}/uploads/${file.filename}`,
      uploadedAt: new Date()
    }));

    application.photos = application.photos || [];
    application.photos.push(...photos);
    
    await application.save();

    const updatedApp = await Application.findById(id);

    res.json({ success: true, data: updatedApp });
  } catch (err) {
    console.error('Error uploading photos:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Удалить фото из заказа
exports.deletePhoto = async (req, res) => {
  try {
    const { id, photoUrl } = req.params;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Проверить что это владелец заказа
    if (application.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only owner can delete photos' });
    }

    // Удалить фото с диска если нужно
    const decodedUrl = decodeURIComponent(photoUrl);
    const filename = decodedUrl.split('/uploads/').pop();
    if (filename) {
      const path = require('path');
      const fs = require('fs');
      const filePath = path.join(__dirname, '..', '..', 'uploads', filename);
      fs.unlink(filePath, (err) => {
        if (err) console.warn('Failed to delete photo file:', err.message);
      });
    }

    // Удалить из массива
    application.photos = (application.photos || []).filter(p => p.url !== decodedUrl);
    await application.save();

    res.json({ success: true, data: application });
  } catch (err) {
    console.error('Error deleting photo:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};