const request = require('supertest');
const bcrypt = require('bcryptjs');
const { app } = require('../index');
const setup = require('./setup');
const User = require('../models/User');

process.env.AUTH_RETURN_DEV_OTP = 'true';
process.env.NODE_ENV = 'test';

beforeAll(async () => setup.connect());
afterAll(async () => setup.closeDatabase());
afterEach(async () => setup.clearDatabase());

test('Auth V2 registers only after OTP verification', async () => {
  const start = await request(app)
    .post('/api/auth-v2/registration/start')
    .send({ phone: '+7 777 123 45 67', password: 'password123', name: 'Test' })
    .expect(202);

  expect(start.body.data.developmentCode).toMatch(/^\d{6}$/);
  expect(await User.countDocuments()).toBe(0);

  const verified = await request(app)
    .post('/api/auth-v2/registration/verify')
    .send({ challengeId: start.body.data.challengeId, code: start.body.data.developmentCode })
    .expect(201);

  expect(verified.body.data.accessToken).toBeTruthy();
  expect((await User.findOne({ phone: '+77771234567' })).phoneVerified).toBe(true);
});

test('Auth V2 password reset changes the password', async () => {
  const passwordHash = await bcrypt.hash('old-password', 10);
  const user = await User.create({ phone: '+77770001122', passwordHash, phoneVerified: true });
  const start = await request(app).post('/api/auth-v2/password-reset/start').send({ phone: user.phone }).expect(202);

  const complete = await request(app).post('/api/auth-v2/password-reset/complete').send({
    challengeId: start.body.data.challengeId,
    code: start.body.data.developmentCode,
    password: 'new-password',
  }).expect(200);

  expect(complete.body.success).toBe(true);
  expect(await bcrypt.compare('new-password', (await User.findById(user._id)).passwordHash)).toBe(true);
});

test('Auth V2 requires a second OTP when 2FA is enabled', async () => {
  const passwordHash = await bcrypt.hash('password123', 10);
  await User.create({ phone: '+77773334455', passwordHash, phoneVerified: true, twoFactorEnabled: true });
  const login = await request(app).post('/api/auth-v2/password/login').send({ phone: '+7 777 333 44 55', password: 'password123' }).expect(200);

  expect(login.body.data.requiresTwoFactor).toBe(true);
  const verified = await request(app).post('/api/auth-v2/2fa/verify').send({ challengeId: login.body.data.challengeId, code: login.body.data.developmentCode }).expect(200);
  expect(verified.body.data.accessToken).toBeTruthy();
});