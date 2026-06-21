const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

/**
 * GET /api/categories
 * Получить все главные категории (без родителя)
 */
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ parentId: null, active: true })
      .select('_id name icon description')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении категорий',
      error: error.message
    });
  }
});

/**
 * GET /api/categories/tree
 * Получить полное дерево категорий (родители + подкатегории)
 */
router.get('/tree', async (req, res) => {
  try {
    const parentCategories = await Category.find({ parentId: null, active: true })
      .select('_id name icon description');

    // Получить дерево с подкатегориями
    const tree = await Promise.all(
      parentCategories.map(async (parent) => {
        const subcategories = await Category.find({
          parentId: parent._id,
          active: true
        }).select('_id name icon');

        return {
          ...parent.toObject(),
          subcategories
        };
      })
    );

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении дерева категорий',
      error: error.message
    });
  }
});

/**
 * GET /api/categories/:id
 * Получить категорию с её подкатегориями
 */
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }

    const subcategories = await Category.find({
      parentId: category._id,
      active: true
    }).select('_id name icon');

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        subcategories
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении категории',
      error: error.message
    });
  }
});

module.exports = router;
