# 🔧 КОД ДЛЯ ИСПРАВЛЕНИЯ БЭКЕНДА

## Файл 1: Добавить в backend/src/controllers/userController.js

В конец файла (после существующего кода), добавить этот метод:

```javascript
// Получить список пользователей с фильтрацией
exports.getAll = async (req, res) => {
  try {
    const { role, city, category, search } = req.query;
    
    let filter = {};
    
    // Фильтр по role (специалист или обычный пользователь)
    if (role) {
      // role может быть 'specialist', 'user' или 'admin'
      filter.role = role;
    }
    
    // Фильтр по городу
    if (city) {
      filter.city = city;
    }
    
    // Фильтр по категории
    if (category) {
      filter.categories = { $in: [category] };
    }
    
    // Поиск по имени/фамилии
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { surname: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(filter)
      .select('-passwordHash') // Не отправляем пароль
      .populate('city', 'name region')
      .populate('categories', '_id name icon')
      .limit(100);
    
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Error fetching users', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

## Файл 2: Добавить маршрут в backend/src/routes/users.js

Найти эту строку:
```javascript
router.get('/:id', userController.getUserById);
```

И ПЕРЕД ней добавить:
```javascript
router.get('/', userController.getAll); // ←← ДОБАВИТЬ ЭТУ СТРОКУ
router.get('/:id', userController.getUserById);
```

**Почему ПЕРЕД?** Потому что Express обрабатывает маршруты по порядку, и если `:id` будет раньше, то `/` будет считаться id.

## Файл 3: Обновить applicationController.js

Найти метод:
```javascript
exports.getAll = async (req, res) => {
  try {
    const apps = await Application.find()
      .sort({ createdAt: -1 })
      .lean()
      .populate('user', 'name');

    return res.json({ success: true, data: apps });
  } catch (err) {
    console.error('Error fetching applications', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

Заменить его на:
```javascript
exports.getAll = async (req, res) => {
  try {
    const { status, category, city, search } = req.query;
    
    let filter = { active: true };
    
    // Фильтр по статусу (new, in_progress, completed и т.д.)
    if (status) {
      filter.status = status;
    }
    
    // Фильтр по категории (в зависимости от вашей схемы)
    if (category) {
      // Если Application имеет поле 'mode', используй это
      filter.mode = category;
      // Или если есть поле 'categories'
      // filter.categories = { $in: [category] };
    }
    
    // Фильтр по городу
    if (city) {
      filter.city = city;
    }
    
    // Поиск по названию или описанию
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { info: { $regex: search, $options: 'i' } }
      ];
    }
    
    const apps = await Application.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'name surname avatarUrl city')
      .populate('currentSpecialist', 'name surname city avatarUrl');
    
    return res.json({ success: true, data: apps });
  } catch (err) {
    console.error('Error fetching applications', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

## Файл 4 (ОПЦИОНАЛЬНО): Добавить эндпоинт для изменения статуса

Если в `backend/src/routes/applications.js` НЕ имеется:
```javascript
router.patch('/:id', auth, applicationStatusController.updateStatus);
```

То добавить в routes/applications.js после других POST/GET маршрутов:
```javascript
// Изменение статуса заявки (только для владельца или специалиста)
router.patch('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status required' });
  }
  
  try {
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    // Проверка прав (владелец или специалист)
    const isOwner = application.user.toString() === req.user._id.toString();
    const isSpecialist = application.currentSpecialist?.toString() === req.user._id.toString();
    
    if (!isOwner && !isSpecialist) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    application.status = status;
    if (status === 'completed') {
      application.completedAt = new Date();
    }
    if (status === 'cancelled') {
      application.cancelledAt = new Date();
    }
    
    await application.save();
    await application.populate('user', 'name surname').populate('currentSpecialist', 'name surname');
    
    res.json({ success: true, data: application });
  } catch (err) {
    console.error('Error updating application', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
```

---

## ⚡ БЫСТРАЯ УСТАНОВКА

### Шаг 1: Открыть userController.js
```bash
# Скопировать метод getAll выше
# Добавить в конец файла перед модулю.экспорт
```

### Шаг 2: Открыть users.js
```bash
# Добавить router.get('/', userController.getAll); перед router.get('/:id')
```

### Шаг 3: Обновить applicationController.js
```bash
# Заменить метод getAll
```

### Шаг 4: Проверить routes/applications.js
```bash
# Убедиться что есть PATCH маршрут для статуса
# Если нет - добавить код выше
```

### Шаг 5: Перезапустить backend
```bash
cd backend
npm start
```

### Шаг 6: Проверить эндпоинты
```bash
# Тест 1: Получить специалистов
curl "http://localhost:4000/api/users?role=specialist"

# Тест 2: Получить все заказы со статусом 'new'
curl "http://localhost:4000/api/applications?status=new"

# Тест 3: Поиск заказов
curl "http://localhost:4000/api/applications?search=монтаж"
```

---

## 🐛 ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

### Ошибка: "Cannot find route GET /api/users"
**Решение:** Убедитесь что строка `router.get('/', userController.getAll);` добавлена ПЕРЕД `router.get('/:id')`.

### Ошибка: "userController.getAll is not a function"
**Решение:** Убедитесь что метод getAll добавлен в конец userController.js И экспортирован.

### Фильтр не работает
**Решение:** Проверить что:
1. Параметры передаются: `?role=specialist`
2. В БД есть такие документы с role='specialist'
3. Нет опечаток в названиях полей

### Заказы не возвращаются
**Решение:**
1. Проверить что `active: true` в фильтре
2. Проверить что в БД есть заказы с active=true
3. Проверить logs в backend (npm start выведет ошибки)

---

## 📊 ПРОВЕРКА МОДЕЛЕЙ

Убедитесь что в User модели есть поле `role`:

```javascript
// backend/src/models/User.js должен иметь
const userSchema = new mongoose.Schema({
  // ...
  role: { type: String, enum: ['user', 'specialist', 'admin'], default: 'user' },
  activeRole: { type: String, enum: ['user', 'specialist'], default: 'user' },
  // ...
});
```

И в Application модели:

```javascript
// backend/src/models/Application.js должен иметь
const applicationSchema = new mongoose.Schema({
  // ...
  status: { 
    type: String, 
    enum: ['new', 'in_progress', 'agreed', 'completed', 'cancelled'],
    default: 'new'
  },
  active: { type: Boolean, default: true },
  // ...
});
```
