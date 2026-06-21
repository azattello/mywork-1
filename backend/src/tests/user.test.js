const request = require('supertest');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { app } = require('../index');
const setup = require('./setup');
const User = require('../models/User');

beforeAll(async () => {
  await setup.connect();
});

afterAll(async () => {
  await setup.closeDatabase();
});

afterEach(async () => {
  await setup.clearDatabase();
  // clean uploads folder
  const uploadDir = path.join(__dirname, '..', '..', 'uploads');
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    for (const f of files) fs.unlinkSync(path.join(uploadDir, f));
  }
});

function makeToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1h' });
}

test('PUT /api/users/me updates profile', async () => {
  const user = new User({ phone: '123456', passwordHash: 'x', name: 'Old', surname: 'Name' });
  await user.save();

  const token = makeToken(user);

  const res = await request(app)
    .put('/api/users/me')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'New', surname: 'User' })
    .expect(200);

  expect(res.body.success).toBe(true);
  expect(res.body.data.name).toBe('New');
  expect(res.body.data.surname).toBe('User');

  const u = await User.findById(user._id);
  expect(u.name).toBe('New');
});

test('POST /api/users/me/avatar uploads avatar and deletes old one', async () => {
  const user = new User({ phone: '321', passwordHash: 'x', name: 'Avatar' });
  // simulate existing avatar file
  const uploads = path.join(__dirname, '..', '..', 'uploads');
  if (!fs.existsSync(uploads)) fs.mkdirSync(uploads, { recursive: true });
  const oldFile = path.join(uploads, 'old-avatar.png');
  fs.writeFileSync(oldFile, 'old');
  user.avatarUrl = `http://localhost/uploads/old-avatar.png`;
  await user.save();

  const token = makeToken(user);

  const buffer = Buffer.from([0x89,0x50,0x4e,0x47]); // PNG magic (small)

  const res = await request(app)
    .post('/api/users/me/avatar')
    .set('Authorization', `Bearer ${token}`)
    .attach('avatar', buffer, { filename: 'avatar.png', contentType: 'image/png' })
    .expect(200);

  expect(res.body.success).toBe(true);
  expect(res.body.data.avatarUrl).toMatch(/\/uploads\//);

  // old file should be removed
  expect(fs.existsSync(oldFile)).toBe(false);

  // new file exists
  const newFilename = res.body.data.avatarUrl.split('/uploads/').pop();
  expect(fs.existsSync(path.join(uploads, newFilename))).toBe(true);
});

// Negative tests

test('POST /api/users/me/avatar without token returns 401', async () => {
  const buffer = Buffer.from([0x89,0x50,0x4e,0x47]);
  const res = await request(app)
    .post('/api/users/me/avatar')
    .attach('avatar', buffer, { filename: 'avatar.png', contentType: 'image/png' })
    .expect(401);

  expect(res.body.success).toBe(false);
});

test('POST /api/users/me/avatar rejects invalid mime types', async () => {
  const user = new User({ phone: '999', passwordHash: 'x', name: 'Mime' });
  await user.save();
  const token = makeToken(user);

  const buffer = Buffer.from('hello');
  const res = await request(app)
    .post('/api/users/me/avatar')
    .set('Authorization', `Bearer ${token}`)
    .attach('avatar', buffer, { filename: 'file.txt', contentType: 'text/plain' })
    .expect(400);

  expect(res.body.success).toBe(false);
  expect(res.body.message).toMatch(/Only image files/);
});

test('POST /api/users/me/avatar rejects oversized files', async () => {
  const user = new User({ phone: '888', passwordHash: 'x', name: 'Big' });
  await user.save();
  const token = makeToken(user);

  const hugeBuffer = Buffer.alloc(6 * 1024 * 1024, 0); // 6MB

  const res = await request(app)
    .post('/api/users/me/avatar')
    .set('Authorization', `Bearer ${token}`)
    .attach('avatar', hugeBuffer, { filename: 'big.png', contentType: 'image/png' })
    .expect(400);

  expect(res.body.success).toBe(false);
  expect(res.body.message).toMatch(/File too large/i);
});

// New tests: update availability and invalid update payload

test('PUT /api/users/me updates isAvailable flag', async () => {
  const user = new User({ phone: '555', passwordHash: 'x', name: 'Avail' });
  await user.save();
  const token = makeToken(user);

  const res = await request(app)
    .put('/api/users/me')
    .set('Authorization', `Bearer ${token}`)
    .send({ isAvailable: false })
    .expect(200);

  expect(res.body.success).toBe(true);
  expect(res.body.data.isAvailable).toBe(false);

  const u = await User.findById(user._id);
  expect(u.isAvailable).toBe(false);
});

test('PUT /api/users/me rejects invalid payloads (wrong type)', async () => {
  const user = new User({ phone: '556', passwordHash: 'x', name: 'Bad' });
  await user.save();
  const token = makeToken(user);

  const res = await request(app)
    .put('/api/users/me')
    .set('Authorization', `Bearer ${token}`)
    .send({ isAvailable: 'not-a-boolean' })
    .expect(400);

  expect(res.body.success).toBe(false);
});