const express = require('express');
const router = express.Router();
const responseController = require('../controllers/responseController');
const auth = require('../middlewares/auth');

// Получить все отклики на заявку
router.get('/:applicationId/responses', auth, responseController.getApplicationResponses);

// Создать отклик на заявку
router.post('/:applicationId/respond', auth, responseController.createResponse);

// Принять отклик (клиент выбирает специалиста — ожидается подтверждение специалиста)
router.post('/:applicationId/responses/:responseId/accept', auth, responseController.acceptResponse);

// Специалист подтверждает выбранный отклик
router.post('/:applicationId/responses/:responseId/confirm', auth, responseController.confirmResponse);

// Специалист отклоняет свой отклик / отклоняет выбор клиента
router.post('/:applicationId/responses/:responseId/decline', auth, responseController.declineResponse);

// Получить отклик для конкретного специалиста (доступен владельцу заявки и самому специалисту)
router.get('/:applicationId/responses/:specialistId', auth, responseController.getResponseForSpecialist);

module.exports = router;