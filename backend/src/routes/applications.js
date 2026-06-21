const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const responseController = require('../controllers/responseController');
const applicationStatusController = require('../controllers/applicationStatusController');
const reviewController = require('../controllers/reviewController');
const applicationChatController = require('../controllers/applicationChatController');
const validate = require('../middlewares/validate');
const auth = require('../middlewares/auth');
const { createApplicationSchema } = require('../validation/application');
const upload = require('../middlewares/upload');

// РЎРѕР·РґР°РЅРёРµ Рё РїРѕР»СѓС‡РµРЅРёРµ Р·Р°СЏРІРѕРє
router.post('/', auth, validate(createApplicationSchema), applicationController.create);
router.get('/', applicationController.getAll);
// Get single application by id
router.get('/:id', applicationController.getById);
router.get('/user/:userId', applicationController.getByUser);
router.get('/specialist/:specialistId', applicationController.getBySpecialist);

// РЈРїСЂР°РІР»РµРЅРёРµ РѕС‚РєР»РёРєР°РјРё
router.get('/:applicationId/responses', auth, responseController.getApplicationResponses);
router.post('/:applicationId/respond', auth, responseController.createResponse);
router.post('/:applicationId/responses/:responseId/accept', auth, responseController.acceptResponse);
router.post("/:applicationId/responses/:responseId/reject", auth, responseController.rejectResponse);
router.post('/:applicationId/responses/:responseId/confirm', auth, responseController.confirmResponse);
router.post('/:applicationId/responses/:responseId/decline', auth, responseController.declineResponse);
router.get('/:applicationId/responses/:specialistId', auth, responseController.getResponseForSpecialist);

// Work completion and reviews
router.post('/:applicationId/markWorkComplete', auth, responseController.markWorkComplete);
router.post('/:applicationId/acceptWork', auth, responseController.acceptWork);
router.post('/:applicationId/createReview', auth, upload.single('image'), responseController.createReview);

// РЈРїСЂР°РІР»РµРЅРёРµ СЃС‚Р°С‚СѓСЃР°РјРё
router.put('/:id/status', auth, applicationStatusController.updateStatus);
router.post('/:id/publish', auth, applicationController.publishAsOrder);

// РћС‚Р·С‹РІС‹
router.post('/:id/reviews', auth, reviewController.createReview);
router.get('/:id/reviews', auth, reviewController.getApplicationReviews);

// Chat routes
router.get('/:id/chat', auth, applicationChatController.getApplicationChat);
router.post('/:id/chat', auth, applicationChatController.sendApplicationMessage);

module.exports = router;

