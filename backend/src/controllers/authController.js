const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' });
};

exports.register = async (req, res) => {
  const { phone, password, name, surname, role } = req.body;
  if (!phone || !password) return res.status(400).json({ success: false, message: 'Phone and password required' });

  const existing = await User.findOne({ phone });
  if (existing) return res.status(400).json({ success: false, message: 'Phone already registered' });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = new User({ phone, passwordHash, name, surname, role });
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token in DB
  const decoded = jwt.decode(refreshToken);
  const expiresAt = decoded && decoded.exp ? new Date(decoded.exp * 1000) : null;
  await RefreshToken.create({ user: user._id, token: refreshToken, expiresAt });

  res.status(201).json({ success: true, data: { user: { id: user._id, phone: user.phone, name: user.name, surname: user.surname, role: user.role }, accessToken, refreshToken } });
};

exports.login = async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ success: false, message: 'Phone and password required' });

  const user = await User.findOne({ phone });
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const decoded = jwt.decode(refreshToken);
  const expiresAt = decoded && decoded.exp ? new Date(decoded.exp * 1000) : null;
  await RefreshToken.create({ user: user._id, token: refreshToken, expiresAt });

  res.json({ success: true, data: { user: { id: user._id, phone: user.phone, name: user.name, role: user.role }, accessToken, refreshToken } });
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Missing refresh token' });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Check token exists in DB
    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored) return res.status(401).json({ success: false, message: 'Invalid token' });

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid token' });

    const accessToken = generateAccessToken(user);
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Missing refresh token' });

  await RefreshToken.deleteOne({ token: refreshToken });
  res.json({ success: true, message: 'Logged out' });
};
