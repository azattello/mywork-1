const Application = require('../models/Application');
const User = require('../models/User');
const notificationController = require('./notificationController');

exports.create = async (req, res) => {
  const { title, summ, info, city, categories, budgetType, budgetMin, budgetMax, workMode, address, deadline, active, userID, currentSpecialist, status } = req.body;

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
    deadline: deadline ? new Date(deadline) : undefined,
    active: typeof active === 'boolean' ? active : true,
    user: user._id,
    currentSpecialist: specialist ? specialist._id : undefined,
    status: status || 'open',
    proposalStatus: specialist ? 'active' : 'closed' // Если есть специалист - активное предложение, если нет - закрытое
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
    const apps = await Application.find({ currentSpecialist: specialistId })
      .sort({ createdAt: -1 })
      .populate('currentSpecialist', 'name surname')
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
      const apps = await Application.find()
        .sort({ createdAt: -1 })
        .lean()
        .populate('user', 'name');

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
        .populate({
          path: 'user',
          select: 'name surname city',
          populate: {
            path: 'city',
            select: 'name'
          }
        })
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