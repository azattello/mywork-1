const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const AuthChallenge = require('../models/AuthChallenge');
const { generateOtp, hashOtp, sendSms } = require('../services/smsService');
const { normalizePhone, maskPhone } = require('../utils/phone');

const OTP_TTL_MS = Number(process.env.AUTH_OTP_TTL_MS || 5 * 60 * 1000);
const RESEND_COOLDOWN_MS = Number(process.env.AUTH_OTP_RESEND_COOLDOWN_MS || 45 * 1000);
const MAX_ATTEMPTS = Number(process.env.AUTH_OTP_MAX_ATTEMPTS || 5);

const tokenPair = async (user) => {
  const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' });
  const decoded = jwt.decode(refreshToken);
  await RefreshToken.create({ user: user._id, token: refreshToken, expiresAt: new Date(decoded.exp * 1000) });
  return { accessToken, refreshToken, user: { id: user._id, phone: user.phone, name: user.name, surname: user.surname, role: user.role, phoneVerified: user.phoneVerified, twoFactorEnabled: user.twoFactorEnabled } };
};

const userByPhone = async (phone) => User.findOne({ phone: { $in: [phone, phone.replace(/^\+7/, '8')] } }).populate('city categories');

const createChallenge = async ({ phone, type, user, payload }) => {
  const latest = await AuthChallenge.findOne({ phone, type, consumedAt: { $exists: false } }).sort({ createdAt: -1 });
  if (latest && Date.now() - latest.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    const seconds = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - latest.lastSentAt.getTime())) / 1000);
    const error = new Error(`Повторная отправка будет доступна через ${seconds} сек.`);
    error.status = 429;
    throw error;
  }

  const code = generateOtp();
  const challenge = await AuthChallenge.create({ phone, type, user: user?._id, otpHash: hashOtp(code), payload, expiresAt: new Date(Date.now() + OTP_TTL_MS), lastSentAt: new Date() });
  await sendSms(phone, `Код подтверждения mywork: ${code}`);
  const result = { challengeId: challenge._id, phone: maskPhone(phone), expiresIn: OTP_TTL_MS / 1000, resendIn: RESEND_COOLDOWN_MS / 1000 };
  if (process.env.NODE_ENV !== 'production' && getDevelopmentOtpEnabled()) result.developmentCode = code;
  return result;
};

const getDevelopmentOtpEnabled = () => process.env.AUTH_RETURN_DEV_OTP === 'true';

const consumeChallenge = async (challengeId, code, type) => {
  const challenge = await AuthChallenge.findOne({ _id: challengeId, type, consumedAt: { $exists: false } });
  if (!challenge || challenge.expiresAt < new Date()) throw Object.assign(new Error('Код истёк или недействителен'), { status: 400 });
  if (challenge.attempts >= MAX_ATTEMPTS) throw Object.assign(new Error('Слишком много попыток. Запросите новый код'), { status: 429 });
  if (hashOtp(code) !== challenge.otpHash) {
    challenge.attempts += 1;
    await challenge.save();
    throw Object.assign(new Error('Неверный код'), { status: 400 });
  }
  challenge.consumedAt = new Date();
  await challenge.save();
  return challenge;
};

exports.startRegistration = async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (await userByPhone(phone)) return res.status(409).json({ success: false, message: 'Этот номер уже зарегистрирован' });
  const passwordHash = await bcrypt.hash(req.body.password, 10);
  const data = await createChallenge({ phone, type: 'registration', payload: { name: req.body.name || '', surname: req.body.surname || '', passwordHash } });
  res.status(202).json({ success: true, data });
};

exports.verifyRegistration = async (req, res) => {
  const challenge = await consumeChallenge(req.body.challengeId, req.body.code, 'registration');
  const user = await User.create({ phone: challenge.phone, phoneVerified: true, passwordHash: challenge.payload.passwordHash, name: challenge.payload.name, surname: challenge.payload.surname });
  res.status(201).json({ success: true, data: await tokenPair(user) });
};

exports.startSmsLogin = async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const user = await userByPhone(phone);
  if (!user) return res.status(404).json({ success: false, message: 'Аккаунт не найден' });
  const data = await createChallenge({ phone, type: 'sms_login', user });
  res.status(202).json({ success: true, data });
};

exports.verifySmsLogin = async (req, res) => {
  const challenge = await consumeChallenge(req.body.challengeId, req.body.code, 'sms_login');
  const user = await User.findByIdAndUpdate(challenge.user, { phoneVerified: true }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'Аккаунт не найден' });
  res.json({ success: true, data: await tokenPair(user) });
};

exports.passwordLogin = async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const user = await userByPhone(phone);
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) return res.status(401).json({ success: false, message: 'Неверный телефон или пароль' });
  if (user.twoFactorEnabled) {
    const data = await createChallenge({ phone, type: 'two_factor', user });
    return res.json({ success: true, data: { requiresTwoFactor: true, ...data } });
  }
  res.json({ success: true, data: await tokenPair(user) });
};

exports.verifyTwoFactor = async (req, res) => {
  const challenge = await consumeChallenge(req.body.challengeId, req.body.code, 'two_factor');
  const user = await User.findById(challenge.user);
  if (!user) return res.status(404).json({ success: false, message: 'Аккаунт не найден' });
  res.json({ success: true, data: await tokenPair(user) });
};

exports.startPasswordReset = async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const user = await userByPhone(phone);
  if (!user) return res.status(404).json({ success: false, message: 'Аккаунт не найден' });
  const data = await createChallenge({ phone, type: 'password_reset', user });
  res.status(202).json({ success: true, data });
};

exports.completePasswordReset = async (req, res) => {
  const challenge = await consumeChallenge(req.body.challengeId, req.body.code, 'password_reset');
  const passwordHash = await bcrypt.hash(req.body.password, 10);
  await User.findByIdAndUpdate(challenge.user, { passwordHash });
  await RefreshToken.deleteMany({ user: challenge.user });
  res.json({ success: true, message: 'Пароль успешно изменён' });
};

exports.setTwoFactor = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { twoFactorEnabled: Boolean(req.body.enabled) }, { new: true }).select('-passwordHash');
  res.json({ success: true, data: { twoFactorEnabled: user.twoFactorEnabled } });
};