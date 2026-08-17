const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Создать жалобу (требует аутентификации)
router.post('/', auth, upload.array('attachments', 5), complaintController.createComplaint);

// Получить жалобы для конкретного заказа (требует аутентификации)
router.get('/application/:applicationId', auth, complaintController.getComplaintsByApplication);

// Получить жалобы на пользователя (требует аутентификации)
router.get('/user/:userId', auth, complaintController.getComplaintsAboutUser);

// Получить конкретную жалобу (требует аутентификации)
router.get('/:complaintId', auth, complaintController.getComplaint);

// Получить все жалобы (только админ)
router.get('/', auth, complaintController.getAllComplaints);

// Обновить статус жалобы (только админ)
router.put('/:complaintId', auth, complaintController.updateComplaintStatus);

// Удалить жалобу (автор или админ)
router.delete('/:complaintId', auth, complaintController.deleteComplaint);

module.exports = router;
