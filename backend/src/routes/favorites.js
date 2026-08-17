const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const auth = require('../middlewares/auth');

// Все маршруты требуют аутентификации
router.use(auth);

// Получить избранных пользователя
router.get('/', favoriteController.getFavorites);

// Получить количество избранных
router.get('/count', favoriteController.getFavoriteCount);

// Проверить, находится ли специалист в избранном
router.get('/:specialistId/check', favoriteController.isFavorite);

// Добавить в избранное
router.post('/:specialistId', favoriteController.addFavorite);

// Удалить из избранного
router.delete('/:specialistId', favoriteController.removeFavorite);

module.exports = router;
