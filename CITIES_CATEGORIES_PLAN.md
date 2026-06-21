# 🗂️ План добавления Городов и Категорий

## 📍 1. ГОРОДА (Cities)

### Backend модель
```javascript
// backend/src/models/City.js
const citySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  region: { type: String },
  country: { type: String, default: 'Kazakhstan' },
  active: { type: Boolean, default: true }
}, { timestamps: true });
```

### Backend API endpoints
- **GET `/api/cities`** — получить все города
- **GET `/api/cities?search=Алма`** — поиск по названию

### Данные для заполнения (все города Казахстана)
```
Крупные города:
- Алматы
- Нур-Султан (Астана)
- Карагanda
- Кокшетау
- Атырау
- Актобе
- Уральск
- Павлодар
- Семей
- Костанай
- Тараз
- Шымкент
- Кызылорда
... (более 100 городов)
```

### Фронтенд интеграция
- Вместо hardcoded списка → GET `/api/cities`
- Dropdown/Picker в AddScreen, Reg, Account
- Сохранение в User.city

---

## 🏷️ 2. КАТЕГОРИИ (Categories с иерархией)

### Backend модель
```javascript
// backend/src/models/Category.js
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  icon: { type: String }, // emoji или URL
  description: { type: String },
  active: { type: Boolean, default: true }
}, { timestamps: true });

// Пример иерархии:
// ├─ Веб-разработка (parent)
//    ├─ Frontend
//    ├─ Backend
//    ├─ Full Stack
// ├─ Дизайн (parent)
//    ├─ UI/UX
//    ├─ Графический дизайн
//    ├─ Иллюстрация
// ├─ Маркетинг (parent)
//    ├─ SMM
//    ├─ SEO
```

### Backend API endpoints
- **GET `/api/categories`** — все родительские категории
- **GET `/api/categories/:id/subcategories`** — подкатегории
- **GET `/api/categories/tree`** — вся иерархия (tree format)

### Фронтенд интеграция (как Pro.ru)
```
Шаг 1: Выбор основной категории
┌─────────────────────┐
│ 🔵 Веб-разработка   │
│ 🔵 Дизайн           │
│ 🔵 Маркетинг        │
└─────────────────────┘

Шаг 2: Выбор подкатегорий (чекбоксы)
┌─────────────────────┐
│ ☑ Frontend          │
│ ☐ Backend           │
│ ☑ Full Stack        │
└─────────────────────┘

Шаг 3: Сохраняем массив выбранных категорий
```

---

## 👨‍💻 3. СПЕЦИАЛИСТ — ВЫБОР КАТЕГОРИЙ

### Backend — User модель (добавить)
```javascript
const userSchema = new mongoose.Schema({
  // ... существующие поля
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  // Специалист может выбрать несколько категорий
}, { timestamps: true });
```

### Backend API endpoints (изменить)
- **PUT `/api/users/me`** — добавить поле `categories` в валидацию
  ```json
  {
    "name": "Иван",
    "surname": "Петров",
    "categories": ["id1", "id2", "id3"],
    "city": "Алматы"
  }
  ```

- **GET `/api/users/:id`** — возвращать categories populated

### Фронтенд UI изменения

#### Reg.js (регистрация)
```
Шаг 1: Введение phone + password
Шаг 2: Выбор роли (user / specialist)
Шаг 3 (если specialist): НОВЫЙ — Выбор категорий ← ТУТ
Шаг 4: Подтверждение и вход
```

#### AccountScreenPro.js (профиль специалиста)
```
Добавить кнопку "Мои категории"
  ↓
Modal с выбором категорий (checkboxes, tree format)
  ↓
Сохраняет в PUT /api/users/me { categories: [...] }
```

---

## 📊 Таблица категорий для Казахстана

### Веб & IT (главная)
- Frontend (React, Vue, Angular)
- Backend (Node, Python, Java)
- Full Stack
- Мобильная разработка (iOS, Android)
- DevOps & Infrastructure
- QA & Тестирование

### Дизайн
- UI/UX Design
- Графический дизайн
- Веб-дизайн
- Иллюстрация
- Motion Design
- 3D моделирование

### Маркетинг & SMM
- Social Media Marketing
- SEO / SEM
- Email Marketing
- Контент-маркетинг
- Брендинг
- Analytics

### Копирайтинг & Контент
- Копирайтинг
- Рефрейтинг
- Перевод
- Прjouralisme
- Технический писатель

### Бизнес & Консалтинг
- Бизнес-консалтинг
- Финансовое консультирование
- HR консалтинг
- Бизнес-план

### Другое
- Фотография
- Видеомонтаж
- Аудио & Озвучка
- Преподавание

---

## 🔧 План реализации (по приоритету)

### ✅ Неделя 1 — Backend infrastructure
1. [ ] Создать модель City (города Казахстана)
2. [ ] Создать модель Category (с parentId для иерархии)
3. [ ] Добавить categories[] в User модель
4. [ ] Создать API endpoints:
   - GET /api/cities
   - GET /api/categories (tree)
   - PUT /api/users/me (обновлён для categories)
5. [ ] Добавить seed скрипт для заполнения городов и категорий
6. [ ] Написать тесты

### ✅ Неделя 2 — Frontend инфраструктура
1. [ ] Создать компонент CategorySelector (tree с checkboxes)
2. [ ] Создать компонент CityPicker (dropdown)
3. [ ] Обновить Reg.js:
   - Добавить Step 3 для специалистов (выбор категорий)
4. [ ] Обновить AccountScreenPro.js:
   - Добавить UI для выбора категорий
5. [ ] Обновить apiClient для загрузки категорий/городов

### ✅ Неделя 3 — Integration & UI Polish
1. [ ] AddScreen — выбор города из dropdown
2. [ ] CatalogScreen — фильтр по городу и категории
3. [ ] CatalogScreenPro — фильтр по категории для специалиста
4. [ ] SpecialistProfile — показывать категории специалиста
5. [ ] Тестирование на эмуляторе

---

## 📝 Технические детали

### City seed data (JSON)
```json
[
  { "name": "Алматы", "region": "Алматы", "country": "Kazakhstan" },
  { "name": "Нур-Султан", "region": "Акмола", "country": "Kazakhstan" },
  { "name": "Карагanda", "region": "Карагanda", "country": "Kazakhstan" },
  ...
]
```

### Category seed data (JSON с иерархией)
```json
[
  {
    "name": "Веб-разработка",
    "parentId": null,
    "icon": "💻"
  },
  {
    "name": "Frontend",
    "parentId": "web-dev-id",
    "icon": "⚛️"
  },
  ...
]
```

### Валидация категорий (Joi)
```javascript
const updateSchema = Joi.object({
  categories: Joi.array().items(Joi.string().regex(/^[0-9a-f]{24}$/))
  // массив MongoDB ObjectIds
});
```

---

## 🎯 Готовые функции после реализации

✅ Специалист выбирает нишу/категории (как Pro.ru)
✅ Клиент видит категории специалиста
✅ Фильтр заказов по городу и категории
✅ Клиент выбирает город при создании заказа
✅ Каждый пользователь видит доступные города

