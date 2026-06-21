/**
 * Seed script для заполнения БД городами и категориями
 * Использование: node seeds.js
 */

const mongoose = require('mongoose');
const City = require('./src/models/City');
const Category = require('./src/models/Category');

require('dotenv').config();
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yoyo-kz';

const cities = [
  { name: 'Алматы', region: 'Алматы' },
  { name: 'Нур-Султан (Астана)', region: 'Акмола' },
  { name: 'Караганда', region: 'Караганда' },
  { name: 'Шымкент', region: 'Түркістан' },
  { name: 'Кокшетау', region: 'Акмола' },
  { name: 'Атырау', region: 'Атырау' },
  { name: 'Актобе', region: 'Мангыстау' },
  { name: 'Уральск', region: 'Западно-Казахстанская' },
  { name: 'Павлодар', region: 'Павлодарская' },
  { name: 'Семей', region: 'Восточно-Казахстанская' },
  { name: 'Костанай', region: 'Костанайская' },
  { name: 'Тараз', region: 'Түркістан' },
  { name: 'Кызылорда', region: 'Түркістан' },
  { name: 'Актау', region: 'Мангыстау' },
  { name: 'Жезказган', region: 'Караганда' },
  { name: 'Текели', region: 'Түркістан' },
  { name: 'Аксай', region: 'Атырау' },
  { name: 'Риддер', region: 'Восточно-Казахстанская' },
  { name: 'Лиссакович', region: 'Восточно-Казахстанская' },
  { name: 'Зеленодольск', region: 'Западно-Казахстанская' },
  { name: 'Байконур', region: 'Кызылординская' },
  { name: 'Таразе', region: 'Түркістан' },
  { name: 'Туркестан', region: 'Түркістан' },
];

const categories = [
  // Веб & IT
  { name: 'Веб-разработка', icon: '💻', parentId: null },
  { name: 'Frontend', icon: '⚛️', parentId: null, parentName: 'Веб-разработка' },
  { name: 'Backend', icon: '🔧', parentId: null, parentName: 'Веб-разработка' },
  { name: 'Full Stack', icon: '🌐', parentId: null, parentName: 'Веб-разработка' },
  { name: 'Мобильная разработка', icon: '📱', parentId: null },
  { name: 'iOS', icon: '🍎', parentId: null, parentName: 'Мобильная разработка' },
  { name: 'Android', icon: '🤖', parentId: null, parentName: 'Мобильная разработка' },
  { name: 'React Native', icon: '⚛️', parentId: null, parentName: 'Мобильная разработка' },
  { name: 'DevOps', icon: '⚙️', parentId: null },
  { name: 'QA & Тестирование', icon: '🧪', parentId: null },

  // Дизайн
  { name: 'Дизайн', icon: '🎨', parentId: null },
  { name: 'UI/UX Design', icon: '✨', parentId: null, parentName: 'Дизайн' },
  { name: 'Графический дизайн', icon: '🖼️', parentId: null, parentName: 'Дизайн' },
  { name: 'Веб-дизайн', icon: '🌐', parentId: null, parentName: 'Дизайн' },
  { name: 'Иллюстрация', icon: '🎭', parentId: null, parentName: 'Дизайн' },
  { name: 'Motion Design', icon: '🎬', parentId: null, parentName: 'Дизайн' },
  { name: '3D моделирование', icon: '🎯', parentId: null, parentName: 'Дизайн' },

  // Маркетинг
  { name: 'Маркетинг', icon: '📊', parentId: null },
  { name: 'Social Media Marketing', icon: '📱', parentId: null, parentName: 'Маркетинг' },
  { name: 'SEO / SEM', icon: '🔍', parentId: null, parentName: 'Маркетинг' },
  { name: 'Email Marketing', icon: '✉️', parentId: null, parentName: 'Маркетинг' },
  { name: 'Контент-маркетинг', icon: '📝', parentId: null, parentName: 'Маркетинг' },
  { name: 'Брендинг', icon: '🏷️', parentId: null, parentName: 'Маркетинг' },
  { name: 'Analytics', icon: '📈', parentId: null, parentName: 'Маркетинг' },

  // Копирайтинг & Контент
  { name: 'Копирайтинг', icon: '✍️', parentId: null },
  { name: 'Рефрейтинг', icon: '📄', parentId: null, parentName: 'Копирайтинг' },
  { name: 'Перевод', icon: '🌍', parentId: null },
  { name: 'Технический писатель', icon: '📖', parentId: null },

  // Другое
  { name: 'Фотография', icon: '📸', parentId: null },
    { name: 'Frontend', icon: '⚛️', parentName: 'Веб-разработка' },
    { name: 'Backend', icon: '🔧', parentName: 'Веб-разработка' },
    { name: 'Full Stack', icon: '🌐', parentName: 'Веб-разработка' },
    { name: 'Мобильная разработка', icon: '📱', parentName: null },
    { name: 'iOS', icon: '🍎', parentName: 'Мобильная разработка' },
    { name: 'Android', icon: '🤖', parentName: 'Мобильная разработка' },
    { name: 'React Native', icon: '⚛️', parentName: 'Мобильная разработка' },
    { name: 'DevOps', icon: '⚙️', parentName: null },
    { name: 'QA & Тестирование', icon: '🧪', parentName: null },

    // Дизайн
    { name: 'Дизайн', icon: '🎨', parentName: null },
    { name: 'UI/UX Design', icon: '✨', parentName: 'Дизайн' },
    { name: 'Графический дизайн', icon: '🖼️', parentName: 'Дизайн' },
    { name: 'Веб-дизайн', icon: '🌐', parentName: 'Дизайн' },
    { name: 'Иллюстрация', icon: '🎭', parentName: 'Дизайн' },
    { name: 'Motion Design', icon: '🎬', parentName: 'Дизайн' },
    { name: '3D моделирование', icon: '🎯', parentName: 'Дизайн' },

    // Маркетинг
    { name: 'Маркетинг', icon: '📊', parentName: null },
    { name: 'Social Media Marketing', icon: '📱', parentName: 'Маркетинг' },
    { name: 'SEO / SEM', icon: '🔍', parentName: 'Маркетинг' },
    { name: 'Email Marketing', icon: '✉️', parentName: 'Маркетинг' },
  { name: 'Видеомонтаж', icon: '🎥', parentId: null },
  { name: 'Аудио & Озвучка', icon: '🎙️', parentId: null },
  { name: 'Консалтинг', icon: '💼', parentId: null },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📡 Подключение к БД успешно');

    // Очистить существующие данные
    await City.deleteMany({});
    await Category.deleteMany({});
    console.log('🧹 Существующие данные удалены');

    // Добавить города
    const savedCities = await City.insertMany(cities);
    console.log(`✅ Добавлено ${savedCities.length} городов`);

    // Добавить категории с сохранением parent-child связей
    const savedCategories = [];
    const categoryMap = {}; // Для маппинга имён на ObjectIds

    // Первый проход: сохраняем родительские категории
    for (const cat of categories) {
      if (cat.parentName === null) {
        const saved = await Category.create({
          name: cat.name,
          icon: cat.icon,
          parentId: null
        });
        categoryMap[cat.name] = saved._id;
        savedCategories.push(saved);
      }
    }

    // Второй проход: сохраняем подкатегории
    for (const cat of categories) {
      if (cat.parentName !== null && cat.parentName !== undefined) {
        const parentId = categoryMap[cat.parentName];
        if (parentId) {
          const saved = await Category.create({
            name: cat.name,
            icon: cat.icon,
            parentId: parentId
          });
          categoryMap[cat.name] = saved._id;
          savedCategories.push(saved);
        }
      }
    }

    console.log(`✅ Добавлено ${savedCategories.length} категорий`);

    // Вывести примеры
    console.log('\n📋 Примеры добавленных данных:');
    const exampleCities = await City.find().limit(5);
    console.log('\nГорода:', exampleCities.map(c => c.name).join(', '));

    const parentCats = await Category.find({ parentId: null }).limit(3);
    console.log('\nГлавные категории:', parentCats.map(c => c.name).join(', '));

    const subCats = await Category.find({ parentId: { $ne: null } }).limit(3);
    console.log('Подкатегории:', subCats.map(c => c.name).join(', '));

    console.log('\n✨ Seed успешно завершён!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при seed:', error);
    process.exit(1);
  }
}

seed();
