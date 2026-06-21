# 📊 Аудит Backend — Детальный анализ

## 🏗️ Архитектура Backend

```
backend/
├── src/
│   ├── index.js          → Server entry + Socket.IO setup
│   ├── app.js            → Express app config
│   ├── socket.js         → WebSocket handlers
│   ├── config/
│   │   └── db.js         → MongoDB connection
│   ├── models/           → Mongoose schemas
│   ├── controllers/      → Business logic
│   ├── routes/           → API routes
│   ├── middlewares/      → Auth, validation, error handling
│   ├── validation/       → Joi schemas
│   └── tests/            → Jest tests
└── package.json          → Dependencies
```

---

## 📡 API Routes (полный список)

### 1️⃣ Authentication (`/api/auth`)

| Метод | Эндпоинт | Auth | Описание |
|-------|----------|------|---------|
| POST | `/register` | ❌ | Регистрация (phone, password) |
| POST | `/login` | ❌ | Вход (phone, password) |
| POST | `/refresh` | ❌ | Обновление токена (refreshToken) |
| POST | `/logout` | ✅ | Выход (очистка токена) |

**Rate limiting**: Max 10 попыток логина в минуту

---

### 2️⃣ Пользователи (`/api/users`)

| Метод | Эндпоинт | Auth | Описание |
|-------|----------|------|---------|
| GET | `/me` | ✅ | Мой профиль |
| PUT | `/me` | ✅ | Обновить профиль (name, surname, city, about, isAvailable) |
| POST | `/me/avatar` | ✅ | Загрузить аватар (multipart/form-data) |
| GET | `/:id` | ❌ | Профиль пользователя (публичный) |
| GET | `/stats/:id` | ❌ | Статистика специалиста (рейтинг, отзывы, завершено) |

**Валидация профиля**:
- name, surname: строка
- city, about: строка
- isAvailable: boolean
- avatarUrl: только HTTP URL в PUT (файл через /me/avatar)

**Avatar upload**:
- Максимум 5MB
- Типы: image/jpeg, image/png, image/gif
- Сохранение в `/uploads/` (dev)
- Возвращение публичного URL

---

### 3️⃣ Заявки/Заказы (`/api/applications`)

| Метод | Эндпоинт | Auth | Описание |
|-------|----------|------|---------|
| POST | `/` | ✅ | Создать заявку |
| GET | `/` | ❌ | Все заявки (с фильтром) |
| GET | `/user/:userId` | ❌ | Заявки конкретного пользователя |
| PUT | `/:id` | ✅ | Редактировать заявку (owner only) |
| DELETE | `/:id` | ✅ | Удалить заявку (owner only) |
| PUT | `/:id/status` | ✅ | Изменить статус |

**Создание заявки** (POST body):
```json
{
  "title": "Требуется веб-сайт",
  "summ": 50000,
  "info": "Нужен сайт для кофейни",
  "city": "Алматы",
  "mode": "Design",
  "comm": "Online"
}
```

**Статусы заявки**:
- `new` — новая (ищет откликов)
- `in_progress` — специалист работает
- `agreed` — согласована цена
- `completed` — завершена
- `cancelled` — отменена

---

### 4️⃣ Отклики (`/api/responses`)

| Метод | Эндпоинт | Auth | Описание |
|-------|----------|------|---------|
| GET | `/:applicationId/responses` | ✅ | Все отклики на заявку |
| POST | `/:applicationId/respond` | ✅ | Создать отклик |
| POST | `/:applicationId/responses/:responseId/accept` | ✅ | Принять отклик |

**Создание отклика** (POST body):
```json
{
  "bidPrice": 60000,
  "message": "Я могу сделать это за 2 недели"
}
```

**Логика**:
- Специалист откликается на заявку с предложением цены
- Клиент может принять один отклик
- Остальные отклики отклоняются

---

### 5️⃣ Чат/Сообщения (`/api/conversations`, `/api/messages`)

| Метод | Эндпоинт | Auth | Описание |
|-------|----------|------|---------|
| GET | `/conversations` | ✅ | Мои чаты |
| POST | `/conversations` | ✅ | Создать чат (participantId) |
| GET | `/conversations/:id` | ✅ | Детали чата |
| GET | `/messages/:conversationId` | ✅ | Сообщения |
| POST | `/messages` | ✅ | Отправить сообщение |
| DELETE | `/messages/:id` | ✅ | Удалить сообщение |

**Отправка сообщения** (POST body):
```json
{
  "conversationId": "...",
  "text": "Привет! Согласен на вашу цену"
}
```

---

### 6️⃣ Рейтинги/Отзывы (`/api/reviews`)

| Метод | Эндпоинт | Auth | Описание |
|-------|----------|------|---------|
| POST | `/:applicationId/reviews` | ✅ | Оставить отзыв |
| GET | `/:applicationId/reviews` | ❌ | Отзывы о заявке |
| GET | `/specialist/:specialistId` | ❌ | Все отзывы специалиста |

**Создание отзыва** (POST body):
```json
{
  "applicationId": "...",
  "rating": 5,
  "text": "Отличная работа! Рекомендую"
}
```

**Рейтинг**: 1-5 звезд

---

## 🗄️ Модели данных (MongoDB)

### User
```javascript
{
  _id: ObjectId,
  phone: String (unique),
  passwordHash: String,
  name: String,
  surname: String,
  role: "user" | "specialist" | "admin",
  avatarUrl: String (URL),
  isAvailable: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Application (Заявка)
```javascript
{
  _id: ObjectId,
  title: String,
  summ: Number,
  info: String,
  city: String,
  mode: String,
  comm: String,
  active: Boolean,
  status: "new" | "in_progress" | "agreed" | "completed" | "cancelled",
  user: ObjectId (ref: User),
  currentSpecialist: ObjectId (ref: User),
  completedAt: Date,
  cancelledAt: Date,
  cancelReason: String,
  responses: [ObjectId] (virtual ref: Response),
  review: ObjectId (virtual ref: Review),
  createdAt: Date,
  updatedAt: Date
}
```

### Response (Отклик специалиста)
```javascript
{
  _id: ObjectId,
  application: ObjectId (ref: Application),
  specialist: ObjectId (ref: User),
  bidPrice: Number,
  message: String,
  status: "pending" | "accepted" | "rejected",
  createdAt: Date,
  updatedAt: Date
}
```

### Conversation (Чат)
```javascript
{
  _id: ObjectId,
  participants: [ObjectId] (ref: User),
  application: ObjectId (ref: Application),
  lastMessage: String,
  lastMessageAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Message (Сообщение)
```javascript
{
  _id: ObjectId,
  conversation: ObjectId (ref: Conversation),
  sender: ObjectId (ref: User),
  text: String,
  read: Boolean,
  createdAt: Date
}
```

### Review (Отзыв)
```javascript
{
  _id: ObjectId,
  application: ObjectId (ref: Application),
  author: ObjectId (ref: User, client),
  specialist: ObjectId (ref: User),
  rating: Number (1-5),
  text: String,
  createdAt: Date
}
```

### RefreshToken
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  token: String (unique),
  expiresAt: Date,
  createdAt: Date
}
```

---

## 🔐 Middleware

| Файл | Функция |
|------|---------|
| `auth.js` | Проверка JWT токена, добавление user в req |
| `validate.js` | Валидация запроса (Joi) |
| `errorHandler.js` | Перехват ошибок, формирование response |

---

## ✅ Валидация (Joi)

### Auth
- `phone`: строка, формат +7XXXXXXXXXX
- `password`: мин. 6 символов
- `refreshToken`: обязательно

### Application
- `title`: строка, обязательно
- `summ`: число, >= 0
- `city`: строка
- `mode`, `comm`: строки

### User (PUT /me)
- `name`, `surname`: строка
- `city`, `about`: строка
- `isAvailable`: boolean
- `avatarUrl`: должен быть HTTP URL

---

## 🧪 Тесты

**Файл**: `backend/src/tests/user.test.js`

**Текущие тесты**:
- ✅ PUT /api/users/me — обновление профиля
- ✅ POST /api/users/me/avatar — загрузка аватара
- ✅ Проверка размера файла (> 5MB)
- ✅ Проверка MIME типа
- ✅ Проверка auth

**Status**: PASS (7/7 тестов)

---

## 🔧 Настройки

**Environment variables** (.env):
```
MONGODB_URL=mongodb://localhost:27017/yoyo
JWT_SECRET=your-secret-key
REFRESH_TOKEN_SECRET=refresh-secret
PORT=4000
```

**CORS**: Разрешены все origin (нужно ограничить для продакшена)

---

## 🚨 Проблемы и TO-DO

### Найденные проблемы:
1. ❌ Двойной export в `/applications.js` (line 30-31)
2. ⚠️ CORS слишком открыт (origin: '*')
3. ⚠️ Нет рейта limit на другие endpoint-ы (только login)
4. ⚠️ Socket.IO не имеет authentication

### Нужно исправить:
1. Удалить дубликат export
2. Настроить CORS для продакшена
3. Добавить rate limiting на все POST/PUT
4. Добавить Socket.IO auth middleware

### Нужно добавить:
1. Логирование (Winston или Pino)
2. More comprehensive tests
3. API документация (Swagger/OpenAPI)
4. Pagination для GET endpoints
5. Поиск и фильтр по applications

---

## 🎯 Статус готовности Backend

| Компонент | Статус | Примечание |
|-----------|--------|-----------|
| Auth | ✅ 100% | Работает, rate limit |
| Users (CRUD) | ✅ 100% | Профиль, avatar |
| Applications (CRUD) | ✅ 90% | Нужна pagination |
| Responses | ✅ 80% | Основной функционал |
| Conversations | ✅ 70% | WebSocket нужно полировать |
| Messages | ✅ 70% | WebSocket нужно полировать |
| Reviews | ✅ 80% | Основной функционал |
| Validation | ✅ 85% | Хорошее покрытие |
| Tests | ✅ 60% | Базовые тесты есть |

---

## 🚀 Готовность к Frontend интеграции

**Green flags** ✅:
- Все основные endpoints реализованы
- JWT auth работает
- Avatar upload работает
- Tests pass
- Error handling на месте

**Concerns** ⚠️:
- Socket.IO нужна полировка
- Нет pagination
- Двойной export в applications.js
- CORS слишком открыт

