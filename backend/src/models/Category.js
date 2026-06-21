const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Название категории обязательно'],
    trim: true,
    maxlength: [60, 'Название не более 60 символов']
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  icon: {
    type: String,
    default: null
  },
  description: {
    type: String,
    maxlength: [300, 'Описание не более 300 символов']
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Индекс для поиска
categorySchema.index({ name: 'text', description: 'text' });

// Виртуальное поле для получения подкатегорий
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId'
});

module.exports = mongoose.model('Category', categorySchema);
