const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const validate = require('../middlewares/validate');
const { createApplicationSchema } = require('../validation/application');

router.post('/', validate(createApplicationSchema), applicationController.create);

// Get all applications
router.get('/', applicationController.getAll);

// Get applications for specific user
router.get('/user/:userId', applicationController.getByUser);

module.exports = router;
