/**
 * Seed script для заполнения БД городами и категориями
 * Использование: node seeds.js
 */

const mongoose = require('mongoose');
const City = require('./src/models/City');
const Category = require('./src/models/Category');

require('dotenv').config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/mywork';

const cities = [
  { name: 'Аягоз', region: 'Абайская область', country: 'Kazakhstan', active: true },
  { name: 'Курчатов', region: 'Абайская область', country: 'Kazakhstan', active: true },
  { name: 'Семей', region: 'Абайская область', country: 'Kazakhstan', active: true },
  { name: 'Шар', region: 'Абайская область', country: 'Kazakhstan', active: true },
  { name: 'Акколь', region: 'Акмолинская область', country: 'Kazakhstan', active: true },
  { name: 'Атбасар', region: 'Акмолинская область', country: 'Kazakhstan', active: true },
  { name: 'Державинск', region: 'Акмолинская область', country: 'Kazakhstan', active: true },
  { name: 'Ерейментау', region: 'Акмолинская область', country: 'Kazakhstan', active: true },
  { name: 'Есиль', region: 'Акмолинская область', country: 'Kazakhstan', active: true },
  { name: 'Кокшетау', region: 'Акмолинская область', country: 'Kazakhstan', active: true },
  { name: 'Косшы', region: 'Акмолинская область', country: 'Kazakhstan', active: true },
  { name: 'Макинск', region: 'Акмолинская область', country: 'Kazakhstan', active: true },
  { name: 'Степногорск', region: 'Акмолинская область', country: 'Kazakhstan', active: true },
  { name: 'Степняк', region: 'Акмолинская область', country: 'Kazakhstan', active: true },
  { name: 'Щучинск', region: 'Акмолинская область', country: 'Kazakhstan', active: true },
  { name: 'Актобе', region: 'Актюбинская область', country: 'Kazakhstan', active: true },
  { name: 'Алга', region: 'Актюбинская область', country: 'Kazakhstan', active: true },
  { name: 'Жем', region: 'Актюбинская область', country: 'Kazakhstan', active: true },
  { name: 'Кандыагаш', region: 'Актюбинская область', country: 'Kazakhstan', active: true },
  { name: 'Темир', region: 'Актюбинская область', country: 'Kazakhstan', active: true },
  { name: 'Хромтау', region: 'Актюбинская область', country: 'Kazakhstan', active: true },
  { name: 'Шалкар', region: 'Актюбинская область', country: 'Kazakhstan', active: true },
  { name: 'Эмба', region: 'Актюбинская область', country: 'Kazakhstan', active: true },
  { name: 'Алатау', region: 'Алматинская область', country: 'Kazakhstan', active: true },
  { name: 'Есик', region: 'Алматинская область', country: 'Kazakhstan', active: true },
  { name: 'Каскелен', region: 'Алматинская область', country: 'Kazakhstan', active: true },
  { name: 'Конаев', region: 'Алматинская область', country: 'Kazakhstan', active: true },
  { name: 'Талгар', region: 'Алматинская область', country: 'Kazakhstan', active: true },
  { name: 'Атырау', region: 'Атырауская область', country: 'Kazakhstan', active: true },
  { name: 'Кульсары', region: 'Атырауская область', country: 'Kazakhstan', active: true },
  { name: 'Аксай', region: 'Западно-Казахстанская область', country: 'Kazakhstan', active: true },
  { name: 'Уральск', region: 'Западно-Казахстанская область', country: 'Kazakhstan', active: true },
  { name: 'Жанатас', region: 'Жамбылская область', country: 'Kazakhstan', active: true },
  { name: 'Каратау', region: 'Жамбылская область', country: 'Kazakhstan', active: true },
  { name: 'Шу', region: 'Жамбылская область', country: 'Kazakhstan', active: true },
  { name: 'Тараз', region: 'Жамбылская область', country: 'Kazakhstan', active: true },
  { name: 'Жаркент', region: 'Жетісу облысы', country: 'Kazakhstan', active: true },
  { name: 'Сарканд', region: 'Жетісу облысы', country: 'Kazakhstan', active: true },
  { name: 'Талдыкорган', region: 'Жетісу облысы', country: 'Kazakhstan', active: true },
  { name: 'Текели', region: 'Жетісу облысы', country: 'Kazakhstan', active: true },
  { name: 'Ушарал', region: 'Жетісу облысы', country: 'Kazakhstan', active: true },
  { name: 'Уштобе', region: 'Жетісу облысы', country: 'Kazakhstan', active: true },
  { name: 'Абай', region: 'Карагандинская область', country: 'Kazakhstan', active: true },
  { name: 'Балхаш', region: 'Карагандинская область', country: 'Kazakhstan', active: true },
  { name: 'Караганда', region: 'Карагандинская область', country: 'Kazakhstan', active: true },
  { name: 'Каркаралинск', region: 'Карагандинская область', country: 'Kazakhstan', active: true },
  { name: 'Приозерск', region: 'Карагандинская область', country: 'Kazakhstan', active: true },
  { name: 'Сарань', region: 'Карагандинская область', country: 'Kazakhstan', active: true },
  { name: 'Темиртау', region: 'Карагандинская область', country: 'Kazakhstan', active: true },
  { name: 'Шахтинск', region: 'Карагандинская область', country: 'Kazakhstan', active: true },
  { name: 'Аркалык', region: 'Костанайская область', country: 'Kazakhstan', active: true },
  { name: 'Житикара', region: 'Костанайская область', country: 'Kazakhstan', active: true },
  { name: 'Костанай', region: 'Костанайская область', country: 'Kazakhstan', active: true },
  { name: 'Лисаковск', region: 'Костанайская область', country: 'Kazakhstan', active: true },
  { name: 'Рудный', region: 'Костанайская область', country: 'Kazakhstan', active: true },
  { name: 'Тобыл', region: 'Костанайская область', country: 'Kazakhstan', active: true },
  { name: 'Аральск', region: 'Кызылординская область', country: 'Kazakhstan', active: true },
  { name: 'Байконур', region: 'Кызылординская область', country: 'Kazakhstan', active: true },
  { name: 'Казалинск', region: 'Кызылординская область', country: 'Kazakhstan', active: true },
  { name: 'Кызылорда', region: 'Кызылординская область', country: 'Kazakhstan', active: true },
  { name: 'Актау', region: 'Мангистауская область', country: 'Kazakhstan', active: true },
  { name: 'Форт-Шевченко', region: 'Мангистауская область', country: 'Kazakhstan', active: true },
  { name: 'Жанаозен', region: 'Мангистауская область', country: 'Kazakhstan', active: true },
  { name: 'Аксу', region: 'Павлодарская область', country: 'Kazakhstan', active: true },
  { name: 'Экибастуз', region: 'Павлодарская область', country: 'Kazakhstan', active: true },
  { name: 'Павлодар', region: 'Павлодарская область', country: 'Kazakhstan', active: true },
  { name: 'Булаево', region: 'Северо-Казахстанская область', country: 'Kazakhstan', active: true },
  { name: 'Мамлютка', region: 'Северо-Казахстанская область', country: 'Kazakhstan', active: true },
  { name: 'Петропавловск', region: 'Северо-Казахстанская область', country: 'Kazakhstan', active: true },
  { name: 'Сергеевка', region: 'Северо-Казахстанская область', country: 'Kazakhstan', active: true },
  { name: 'Тайынша', region: 'Северо-Казахстанская область', country: 'Kazakhstan', active: true },
  { name: 'Арыс', region: 'Туркестанская область', country: 'Kazakhstan', active: true },
  { name: 'Жетысай', region: 'Туркестанская область', country: 'Kazakhstan', active: true },
  { name: 'Кентау', region: 'Туркестанская область', country: 'Kazakhstan', active: true },
  { name: 'Ленгер', region: 'Туркестанская область', country: 'Kazakhstan', active: true },
  { name: 'Сарыагаш', region: 'Туркестанская область', country: 'Kazakhstan', active: true },
  { name: 'Туркестан', region: 'Туркестанская область', country: 'Kazakhstan', active: true },
  { name: 'Шардара', region: 'Туркестанская область', country: 'Kazakhstan', active: true },
  { name: 'Жезказган', region: 'Ұлытау облысы', country: 'Kazakhstan', active: true },
  { name: 'Каражал', region: 'Ұлытау облысы', country: 'Kazakhstan', active: true },
  { name: 'Сатпаев', region: 'Ұлытау облысы', country: 'Kazakhstan', active: true },
  { name: 'Алтай', region: 'Восточно-Казахстанская область', country: 'Kazakhstan', active: true },
  { name: 'Риддер', region: 'Восточно-Казахстанская область', country: 'Kazakhstan', active: true },
  { name: 'Серебрянск', region: 'Восточно-Казахстанская область', country: 'Kazakhstan', active: true },
  { name: 'Шемонаиха', region: 'Восточно-Казахстанская область', country: 'Kazakhstan', active: true },
  { name: 'Усть-Каменогорск', region: 'Восточно-Казахстанская область', country: 'Kazakhstan', active: true },
  { name: 'Зайсан', region: 'Восточно-Казахстанская область', country: 'Kazakhstan', active: true },
  { name: 'Астана', region: 'г. Астана', country: 'Kazakhstan', active: true },
  { name: 'Алматы', region: 'г. Алматы', country: 'Kazakhstan', active: true },
  { name: 'Шымкент', region: 'г. Шымкент', country: 'Kazakhstan', active: true },
];

const categoryTree = {
  'Ремонт и строительство': [
    'Ремонт квартир', 'Ремонт домов', 'Строительство домов', 'Отделочные работы', 'Малярные работы',
    'Штукатурные работы', 'Укладка плитки', 'Поклейка обоев', 'Монтаж гипсокартона', 'Кровельные работы',
    'Сварочные работы', 'Металлоконструкции', 'Электромонтажные работы', 'Сантехнические работы',
    'Установка дверей', 'Установка окон', 'Утепление домов', 'Бетонные работы'
  ],
  'Уборка': [
    'Уборка квартиры', 'Генеральная уборка', 'Уборка после ремонта', 'Уборка офиса', 'Мытьё окон',
    'Химчистка мебели', 'Химчистка ковров', 'Уборка частного дома', 'Уборка территории'
  ],
  'Красота': [
    'Парикмахеры', 'Мужская стрижка', 'Женская стрижка', 'Окрашивание волос', 'Маникюр', 'Педикюр',
    'Наращивание ногтей', 'Макияж', 'Брови и ресницы', 'Косметолог', 'Массаж', 'Эпиляция', 'Барбер'
  ],
  'Репетиторы и обучение': [
    'Английский язык', 'Казахский язык', 'Русский язык', 'Математика', 'Физика', 'Химия', 'Биология',
    'История', 'Программирование', 'Подготовка к школе', 'Подготовка к ЕНТ', 'Музыкальные занятия', 'Рисование'
  ],
  'IT и разработка': [
    'Создание сайта', 'Разработка интернет-магазина', 'Разработка лендинга', 'Frontend-разработка',
    'Backend-разработка', 'Fullstack-разработка', 'Мобильная разработка', 'React-разработка',
    'Node.js-разработка', 'Разработка Telegram-ботов', 'Настройка серверов', 'DevOps', 'Тестирование ПО',
    'SEO', 'Техническая поддержка'
  ],
  'Дизайн': [
    'Веб-дизайн', 'UI/UX дизайн', 'Дизайн логотипа', 'Фирменный стиль', 'Графический дизайн',
    'Дизайн баннеров', 'Дизайн презентаций', '3D-визуализация', 'Дизайн интерьера', 'Чертежи',
    'Архитектурная визуализация'
  ],
  'Фото и видео': [
    'Фотограф', 'Свадебный фотограф', 'Предметная съёмка', 'Видеооператор', 'Свадебная видеосъёмка',
    'Монтаж видео', 'Монтаж Reels', 'Монтаж TikTok', 'Обработка фотографий', 'Аэросъёмка'
  ],
  'Переводы': [
    'Перевод с казахского', 'Перевод на казахский', 'Перевод с английского', 'Перевод на английский',
    'Перевод с русского', 'Перевод документов', 'Нотариальный перевод', 'Устный перевод', 'Технический перевод'
  ],
  'Юристы': [
    'Юридическая консультация', 'Составление документов', 'Договоры', 'Семейный юрист', 'Трудовой юрист',
    'Гражданский юрист', 'Налоговый юрист', 'Защита прав потребителей', 'Регистрация бизнеса'
  ],
  'Бухгалтерия и финансы': [
    'Бухгалтерские услуги', 'Ведение бухгалтерии', 'Налоговая отчётность', 'Расчёт заработной платы',
    'Консультация бухгалтера', 'Регистрация ИП', 'Регистрация ТОО', 'Финансовый анализ'
  ],
  'Авто': [
    'Ремонт автомобиля', 'Диагностика автомобиля', 'Автоэлектрик', 'Шиномонтаж', 'Замена масла',
    'Кузовной ремонт', 'Покраска автомобиля', 'Полировка автомобиля', 'Ремонт кондиционера', 'Эвакуатор', 'Детейлинг'
  ],
  'Грузоперевозки': [
    'Грузовое такси', 'Квартирный переезд', 'Офисный переезд', 'Грузчики', 'Перевозка мебели',
    'Междугородние перевозки', 'Доставка товаров', 'Курьерская доставка', 'Перевозка из Китая'
  ],
  'Мебель': [
    'Изготовление мебели', 'Кухни на заказ', 'Шкафы на заказ', 'Ремонт мебели', 'Сборка мебели',
    'Перетяжка мебели', 'Мебель из дерева', 'Мебель для офиса'
  ],
  'Ремонт техники': [
    'Ремонт телефонов', 'Ремонт компьютеров', 'Ремонт ноутбуков', 'Ремонт телевизоров', 'Ремонт холодильников',
    'Ремонт стиральных машин', 'Ремонт кондиционеров', 'Ремонт бытовой техники'
  ],
  'Музыка': [
    'Вокал', 'Гитара', 'Фортепиано', 'Барабаны', 'Скрипка', 'Музыкальная теория', 'Музыканты на мероприятие'
  ],
  'Мероприятия': [
    'Ведущий', 'Тамада', 'Аниматор', 'Организация мероприятий', 'Декор мероприятий', 'DJ', 'Свадебный организатор',
    'Шарики и оформление', 'Кейтеринг'
  ],
  'Здоровье и спорт': [
    'Персональный тренер', 'Фитнес-тренер', 'Йога', 'Пилатес', 'Танцы', 'Бокс', 'Массаж', 'Диетолог'
  ],
  'Сад и участок': [
    'Уход за садом', 'Стрижка газона', 'Обрезка деревьев', 'Благоустройство участка', 'Установка забора', 'Полив'
  ],
  'Помощь по хозяйству': [
    'Сиделка', 'Няня', 'Помощник по хозяйству', 'Выгул собак', 'Уход за животными', 'Ремонт и мелкие работы'
  ],
  'Другое': ['Консультации', 'Помощь с документами', 'Набор текста', 'Расшифровка аудио', 'Виртуальный ассистент', 'Другое']
};

const icons = {
  'Ремонт и строительство': 'construction',
  'Уборка': 'cleaning',
  'Красота': 'beauty',
  'Репетиторы и обучение': 'education',
  'IT и разработка': 'computer',
  'Дизайн': 'design',
  'Фото и видео': 'camera',
  'Переводы': 'language',
  'Юристы': 'legal',
  'Бухгалтерия и финансы': 'finance',
  'Авто': 'car',
  'Грузоперевозки': 'truck',
  'Мебель': 'furniture',
  'Ремонт техники': 'repair',
  'Музыка': 'music',
  'Мероприятия': 'event',
  'Здоровье и спорт': 'sport',
  'Сад и участок': 'garden',
  'Помощь по хозяйству': 'home',
  'Другое': 'more'
};

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
    });

    console.log('✓ MongoDB connected');

    await City.deleteMany({});
    await Category.deleteMany({});
    console.log('🧹 Existing city/category data removed');

    const insertedCities = await City.insertMany(cities, { ordered: false });
    console.log(`✓ Cities inserted: ${insertedCities.length}`);

    const parentDocs = Object.entries(categoryTree).map(([name, children]) => ({
      name,
      parentId: null,
      icon: icons[name] || 'more',
      description: `${name} — услуги специалистов MyWork`,
      active: true,
    }));

    const insertedParents = await Category.insertMany(parentDocs, { ordered: false });
    console.log(`✓ Main categories inserted: ${insertedParents.length}`);

    const parentMap = new Map(insertedParents.map((category) => [category.name, category._id]));
    const childDocs = [];

    for (const [parentName, children] of Object.entries(categoryTree)) {
      const parentId = parentMap.get(parentName);
      if (!parentId) continue;

      for (const childName of children) {
        childDocs.push({
          name: childName,
          parentId,
          icon: null,
          description: `${childName} — услуга в категории «${parentName}»`,
          active: true,
        });
      }
    }

    const insertedChildren = await Category.insertMany(childDocs, { ordered: false });
    console.log(`✓ Subcategories inserted: ${insertedChildren.length}`);

    const exampleCities = await City.find().limit(5).lean();
    const parentCats = await Category.find({ parentId: null }).limit(5).lean();
    const subCats = await Category.find({ parentId: { $ne: null } }).limit(5).lean();

    console.log('\n📋 Added data examples:');
    console.log('Cities:', exampleCities.map((city) => city.name).join(', '));
    console.log('Main categories:', parentCats.map((cat) => cat.name).join(', '));
    console.log('Subcategories:', subCats.map((cat) => cat.name).join(', '));

    const totalCategories = insertedParents.length + insertedChildren.length;
    console.log('');
    console.log('========================================');
    console.log('       MYWORK SEED COMPLETED');
    console.log('========================================');
    console.log(`Cities: ${insertedCities.length}`);
    console.log(`Main categories: ${insertedParents.length}`);
    console.log(`Subcategories: ${insertedChildren.length}`);
    console.log(`Total categories: ${totalCategories}`);
    console.log('========================================');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('✗ SEED ERROR');
    console.error(error);
    console.error('');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('✓ MongoDB disconnected');
  }
}

seed();
