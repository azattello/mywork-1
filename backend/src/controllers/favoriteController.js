const Favorite = require('../models/Favorite');
const User = require('../models/User');

// Добавить специалиста в избранное
exports.addFavorite = async (req, res) => {
  try {
    const { specialistId } = req.params;
    const userId = req.user._id;

    // Проверить, что специалист существует
    const specialist = await User.findById(specialistId);
    if (!specialist || specialist.role !== 'specialist') {
      return res.status(404).json({
        success: false,
        message: 'Specialist not found'
      });
    }

    // Проверить, что не пытаемся добавить самого себя
    if (userId.toString() === specialistId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add yourself to favorites'
      });
    }

    // Добавить в избранное (updateOne с upsert=true или create)
    let favorite = await Favorite.findOne({ user: userId, specialist: specialistId });

    if (favorite) {
      return res.status(400).json({
        success: false,
        message: 'Already in favorites'
      });
    }

    favorite = await Favorite.create({
      user: userId,
      specialist: specialistId
    });

    res.status(201).json({
      success: true,
      data: favorite
    });
  } catch (err) {
    console.error('Error adding to favorites:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Удалить специалиста из избранного
exports.removeFavorite = async (req, res) => {
  try {
    const { specialistId } = req.params;
    const userId = req.user._id;

    const favorite = await Favorite.findOneAndDelete({
      user: userId,
      specialist: specialistId
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Not in favorites'
      });
    }

    res.json({
      success: true,
      data: { message: 'Removed from favorites' }
    });
  } catch (err) {
    console.error('Error removing from favorites:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Получить список избранных специалистов пользователя
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const favorites = await Favorite.find({ user: userId })
      .populate('specialist', '-passwordHash')
      .populate('specialist.city', 'name region')
      .populate('specialist.categories', '_id name icon')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    const total = await Favorite.countDocuments({ user: userId });

    res.json({
      success: true,
      data: favorites.map(fav => fav.specialist),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + parseInt(limit) < total
      }
    });
  } catch (err) {
    console.error('Error getting favorites:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Проверить, находится ли специалист в избранном у пользователя
exports.isFavorite = async (req, res) => {
  try {
    const { specialistId } = req.params;
    const userId = req.user._id;

    const favorite = await Favorite.findOne({
      user: userId,
      specialist: specialistId
    });

    res.json({
      success: true,
      data: { isFavorite: !!favorite }
    });
  } catch (err) {
    console.error('Error checking favorite:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Получить количество избранных пользователя
exports.getFavoriteCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Favorite.countDocuments({ user: userId });

    res.json({
      success: true,
      data: { count }
    });
  } catch (err) {
    console.error('Error getting favorite count:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};
