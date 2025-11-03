const Application = require('../models/Application');
const User = require('../models/User');

exports.create = async (req, res) => {
  const { title, summ, info, city, mode, comm, active, userID } = req.body;

  if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
  if (!userID) return res.status(400).json({ success: false, message: 'userID is required' });

  // Try resolve user
  let user = null;
  try {
    user = await User.findById(userID);
  } catch (e) {
    // ignore
  }

  if (!user) return res.status(400).json({ success: false, message: 'Invalid userID' });

  const app = new Application({
    title,
    summ: summ ? Number(summ) : 0,
    info,
    city,
    mode,
    comm,
    active: typeof active === 'boolean' ? active : true,
    user: user._id,
  });

  await app.save();

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
    const apps = await Application.find({ user: userId }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: apps });
  } catch (err) {
    console.error('Error fetching user applications', err);
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
