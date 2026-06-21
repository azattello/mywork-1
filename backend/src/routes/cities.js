const express = require('express');
const router = express.Router();
const City = require('../models/City');

/**
 * GET /api/cities
 * Получить все города с поддержкой поиска
 * Query: ?search=Алма (опционально)
 */
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = { active: true };

    if (search) {
      query.$text = { $search: search };
    }

    const cities = await City.find(query)
      .sort({ name: 1 })
      .select('_id name region')
      .limit(100);

    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении списка городов',
      error: error.message
    });
  }
});

/**
 * GET /api/cities/:id
 * Получить конкретный город
 */
router.get('/:id', async (req, res) => {
  try {
    const city = await City.findById(req.params.id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'Город не найден'
      });
    }

    res.json({
      success: true,
      data: city
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении города',
      error: error.message
    });
  }
});

module.exports = router;
