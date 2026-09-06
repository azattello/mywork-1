# 📋 Полный анализ проекта mywork

## 🎯 Суть проекта

**mywork** — это мобильное приложение (React Native / Expo) для поиска и заказа услуг специалистов.
- **Клиенты** размещают заказы (applications)
- **Специалисты** откликаются на заказы (responses) и выполняют работу
- **Чат** для общения между клиентом и специалистом
- **Рейтинг и отзывы** системаеценки качества

---

## 🏗️ Архитектура

### Backend (Node.js + Express + MongoDB)

**Основные маршруты (`/api`)**:
- `/auth` — регистрация, вход, refresh token
- `/users` — профиль, аватар, статистика специалиста
- `/applications` — создание, редактирование, просмотр заказов
- `/responses` — отклики специалистов на заказы
- `/conversations` — чат
- `/messages` — сообщения

**Модели данных**:
1. **User** — имя, фамилия, телефон, роль (user/specialist/admin), аватар, isAvailable
2. **Application** — заказ (title, summ, city, status, currentSpecialist, responses, review)
3. **Response** — отклик специалиста на заказ
4. **Message** — сообщение в чате
5. **Conversation** — чат между клиентом и специалистом
6. **Review** — отзыв (рейтинг, текст)
7. **RefreshToken** — для JWT refresh logic

**Authentication**:
- JWT (access + refresh токены)
- Хранение в AsyncStorage фронтенде
- POST `/api/auth/login` — вход
- POST `/api/auth/register` — регистрация
- POST `/api/auth/refresh` — обновление токена

---

## 📱 Frontend (React Native / Expo)

### Структура экранов

#### Клиентский режим (`/components`)
1. **SplashScreen** — заставка при запуске
2. **Main** — выбор между "Войти" и "Регистрация"
3. **Auth** — вход по телефону/пароль
4. **Reg** — регистрация
5. **Role** — выбор роли (клиент / специалист)
6. **Home** — главная (каталог, рекомендации)
7. **CatalogScreen** — каталог услуг / фильтр
8. **AddScreen** — создание нового заказа
9. **AppsScreen** — мои активные заказы
10. **AccountScreen** — профиль (edit, avatar upload, logout)
11. **ChatScreen** — чат с специалистом
12. **ViewAccount** — просмотр профиля специалиста

#### Специалист режим (`/pro`)
1. **HomePro** — главная (новые заказы)
2. **CatalogScreenPro** — каталог заказов + фильтр
3. **AddScreenPro** — добавление услуги
4. **AppsPro** — мои активные заказы
5. **AccountScreenPro** — профиль (edit, avatar, availability toggle)
6. **SpecialistProfile** — мой профиль (рейтинг, отзывы, статистика)
7. **Message** — входящие заказы
8. **Offer** — предложение
9. **rating** — отзывы
10. **FilterScreenPro** — фильтр заказов

### Навигация
- **TabNav** — главные вкладки (Home, Catalog, Add, Apps, Account)
- **TabPro** — специалист (HomePro, CatalogPro, AddPro, AppsPro, AccountPro)

---

## 🔌 API Client

**Файл**: `utils/apiClient.js`

- Обработка всех HTTP запросов (GET, POST, PUT, DELETE)
- Автоматический refresh токена при 401
- Загрузка файлов (avatar) с progress tracking
- Fallback на AsyncStorage если API недоступен

```javascript
// Использование:
const apiClient = require('./utils/apiClient').default;
const res = await apiClient.request('get', '/api/users/me');
const uploadRes = await apiClient.uploadAvatar(formData, (progress) => console.log(progress));
```

---

## 🧹 Удаленные технологии

✅ **Firebase** — полностью удалён (был использован для auth, но перешли на JWT)
✅ **Supabase** — полностью удалён (не был в использовании)

**Конфиг сейчас**:
- `config.js` — только API_URL
- `supabase.js` — заглушка (не используется)
- `.env.example` — только API_URL

---

## 🚀 Функции к активации

### ✅ Уже готовые
1. ✅ Регистрация / вход
2. ✅ Профиль (редактирование, загрузка аватара)
3. ✅ JWT refresh logic
4. ✅ Role switching (клиент ↔ специалист)

### 🔄 Требуют активации/доработки
1. ❌ **Создание заказа (AddScreen)** — нужна связь с API
2. ❌ **Просмотр заказов (AppsScreen)** — список заказов
3. ❌ **Отклики на заказы (Responses)** — специалист откликается
4. ❌ **Чат (ChatScreen)** — WebSocket для real-time сообщений
5. ❌ **Каталог услуг (CatalogScreen)** — поиск и фильтр
6. ❌ **Рейтинг и отзывы (rating)** — система оценок
7. ❌ **Доступность специалиста (isAvailable toggle)** — в Account работает, но нужна проверка UI
8. ❌ **Статистика специалиста (stats)** — GET /api/users/stats/:userId

---

## 📊 Статус компонентов

| Компонент | Статус | Примечание |
|-----------|--------|-----------|
| Auth | ✅ Работает | JWT, loading states, показ/скрыт пароля |
| Reg | ✅ Работает | Регистрация с валидацией |
| Account (Client) | ✅ Работает | Edit, avatar upload, logout |
| AccountPro (Specialist) | ✅ Работает | Edit, avatar upload, logout, availability toggle |
| Home | 🔄 Частично | Структура есть, нужна API интеграция |
| CatalogScreen | 🔄 Частично | Список есть, нужна API интеграция |
| AddScreen | ❌ Не готов | Нужна полная реализация |
| AppsScreen | 🔄 Частично | Структура есть, нужна API интеграция |
| ChatScreen | 🔄 Частично | UI есть, нужен WebSocket |

---

## 🛠️ Примеры API эндпоинтов

```bash
# Аутентификация
POST /api/auth/register { phone, password }
POST /api/auth/login { phone, password }
POST /api/auth/refresh { refreshToken }

# Пользователь
GET /api/users/me
PUT /api/users/me { name, surname, city, about, isAvailable }
POST /api/users/me/avatar (multipart, file upload)
GET /api/users/stats/:userId

# Заказы
GET /api/applications (my applications)
POST /api/applications { title, summ, info, city, mode, comm }
PUT /api/applications/:id
DELETE /api/applications/:id

# Отклики
GET /api/responses/:applicationId
POST /api/responses { applicationId, bidPrice, message }

# Чат
GET /api/conversations
POST /api/conversations { participantId }
GET /api/messages/:conversationId
POST /api/messages { conversationId, text }
```

---

## 📝 Синтаксис файлов

✅ **Все компоненты проверены на синтаксис** (node --check)

Удалены дубликаты:
- Повторные импорты ImagePicker
- Повторные объявления LogoutModal, EditProfileModal
- Firebase и Supabase импорты

---

## 🎯 Следующие шаги

1. **Синхронизация с бэкендом**:
   - Проверить все API эндпоинты на бэкенде
   - Убедиться что валидация и логика работают

2. **Активация фичей по приоритету**:
   - Создание заказа
   - Просмотр заказов  
   - Система откликов
   - Чат с WebSocket
   - Рейтинги и отзывы

3. **Тестирование**:
   - Smoke-тесты на эмуляторе
   - E2E тесты для ключевых flows
   - API integration тесты

