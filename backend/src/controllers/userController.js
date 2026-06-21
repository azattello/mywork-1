const User = require('../models/User');
const Review = require('../models/Review');
const Application = require('../models/Application');
const fs = require('fs');
const path = require('path');

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
  res.json({ success: true, data: user });
};

exports.updateMe = async (req, res) => {
  const updates = {};
  const allowed = ['name','surname','avatarUrl','isAvailable','city','categories','about','portfolio'];
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
  const reviews = await Review.find({ to: userId, type: 'client_to_specialist' });
  
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

// Get list of users with optional filters (role, city, categories, search)
exports.getAll = async (req, res) => {
  try {
    const { role, city, categories, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (city) filter.city = city;
    if (categories) {
      // categories can be comma-separated
      const cats = Array.isArray(categories) ? categories : String(categories).split(',').map(c => c.trim()).filter(Boolean);
      if (cats.length) filter.categories = { $in: cats };
    }
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ name: re }, { surname: re }, { about: re }];
    }

    const users = await User.find(filter)
      .select('-passwordHash')
      .populate('city', 'name region')
      .populate('categories', '_id name icon')
      .lean();

    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Error fetching users', err);
    res.status(500).json({ success: false, message: 'Server error' });
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
