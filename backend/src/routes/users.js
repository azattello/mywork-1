const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { updateSchema } = require('../validation/user');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists (dev use)
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// simple disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).substring(2,8)}${ext}`;
    cb(null, name);
  }
});

// Accept only common image types and limit file size (5MB)
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const mimetype = allowed.test(file.mimetype);
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    const err = new Error('Only image files are allowed (jpeg, png, gif)');
    err.status = 400;
    cb(err);
  }
});

router.get('/me', auth, userController.getMe);
router.put('/me', auth, validate(updateSchema), userController.updateMe);
router.post('/me/avatar', auth, upload.single('avatar'), userController.uploadAvatar);
router.post('/me/portfolio', auth, upload.array('files', 12), userController.uploadPortfolio);
router.delete('/me/portfolio', auth, userController.deletePortfolioItem);
router.post('/me/verify', auth, upload.array('docs', 6), userController.submitVerification);
router.post('/me/switch-mode', auth, userController.switchMode);
router.get('/:id', userController.getUserById);
router.get('/stats/:userId', userController.getSpecialistStats);

// Public users listing with optional filters
router.get('/', userController.getAll);

module.exports = router;
