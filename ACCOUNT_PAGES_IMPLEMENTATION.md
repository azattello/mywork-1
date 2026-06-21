# Account Pages Implementation Summary

## Overview
Полностью переработаны страницы аккаунта для клиента и специалиста с интеграцией API для загрузки, отображения и обновления профиля пользователя.

## Backend Changes

### 1. New Controllers & Routes

#### `backend/src/controllers/userController.js`
Новые методы:
- **`getMe()`** - Получить профиль текущего пользователя (требует auth)
- **`updateMe()`** - Обновить профиль (name, surname, avatarUrl, isAvailable)
- **`getSpecialistStats(userId)`** - Получить статистику специалиста:
  - averageRating - средняя оценка
  - totalReviews - количество отзывов
  - completedApplications - завершенные заказы
  - reviews - список отзывов с рейтингом и текстом

#### `backend/src/routes/users.js` (новый файл)
```
GET  /api/users/me          - получить текущего пользователя
PUT  /api/users/me          - обновить профиль
GET  /api/users/:id         - получить профиль пользователя по ID
GET  /api/users/stats/:userId - получить статистику специалиста
```

### 2. Database Model Updates

#### `backend/src/models/User.js`
Добавлено поле:
- `isAvailable: Boolean` - флаг доступности специалиста для новых заказов (по умолчанию true)

## Frontend Changes

### 1. AccountScreen (Client Page) - `components/AccountScreen.js`

**Функциональность:**
- ✅ Загрузка профиля через API с fallback на AsyncStorage
- ✅ Отображение имени, фамилии, номера телефона
- ✅ Дизайн профиля с аватаром
- ✅ Модальное окно редактирования профиля (имя, фамилия, URL аватара)
- ✅ Сохранение изменений через API (PUT /api/users/me)
- ✅ Кнопка переключения на режим специалиста
- ✅ Корректный выход из аккаунта (очистка токенов)

**API взаимодействие:**
```javascript
// На загрузке страницы
GET /api/users/me (Authorization: Bearer token)

// При редактировании профиля
PUT /api/users/me (Authorization: Bearer token)
{ name, surname, avatarUrl }
```

### 2. AccountScreenPro (Specialist Page) - `pro/AccountScreenPro.js`

**Функциональность:**
- ✅ Загрузка профиля через API с fallback на Firebase
- ✅ Отображение полной информации специалиста
- ✅ Статистика специалиста:
  - Количество завершенных заказов
  - Средний рейтинг (⭐)
  - Количество отзывов
- ✅ Отображение отзывов клиентов (с датой и рейтингом)
- ✅ Тоггл "Готов к новым заказам" (isAvailable)
  - Статус сохраняется через API
  - Визуально отображается зелёным ✓ или серым ✗
- ✅ Редактирование профиля
- ✅ Корректный выход из аккаунта

**API взаимодействие:**
```javascript
// На загрузке страницы
GET /api/users/me (Authorization: Bearer token)
GET /api/users/stats/:userId (Authorization: Bearer token)

// При редактировании профиля
PUT /api/users/me (Authorization: Bearer token)
{ name, surname, isAvailable }

// При обновлении доступности
PUT /api/users/me (Authorization: Bearer token)
{ isAvailable: true/false }
```

## Data Flow

### Client Profile Loading
```
App Load
  ↓
SplashScreen checks @currentUser
  ↓
Navigate to Main → Account Tab
  ↓
AccountScreen.useEffect() → loadData()
  ↓
Try: GET /api/users/me (with @accessToken)
  ├─ Success → Display user data from API
  └─ Fail → Show cached @currentUser data
```

### Specialist Stats Loading
```
AccountScreenPro Mount
  ↓
loadData() fetches:
  1. GET /api/users/me → user profile
  2. GET /api/users/stats/:userId → statistics
  ↓
Display: rating, reviews count, completed apps
Display: recent reviews with ratings
```

## Key Features

### ✅ Implemented
1. **Profile Management**
   - Get current user profile via API
   - Update profile (name, surname, avatar)
   - Graceful fallback to local storage if API unavailable

2. **Specialist Features**
   - View average rating and review count
   - Toggle availability for new orders
   - See recent client reviews
   - Track completed applications

3. **Security**
   - All profile endpoints require authentication (Bearer token)
   - Password hash never exposed
   - Sensitive data filtered from responses

4. **UX**
   - Automatic refresh on page focus
   - Modal dialogs for editing
   - Confirmation dialogs for logout
   - Status indicators (rating, reviews, availability)

## Testing Checklist

- [ ] Backend server starts without errors
- [ ] GET /api/users/me returns correct user profile
- [ ] PUT /api/users/me updates profile correctly
- [ ] GET /api/users/stats/:userId returns stats with reviews
- [ ] AccountScreen loads user data on mount
- [ ] Edit profile modal works and saves changes
- [ ] AccountScreenPro displays specialist stats
- [ ] Availability toggle updates via API
- [ ] Reviews display with correct ratings
- [ ] Logout clears all tokens and authentication

## Configuration

- **API_URL**: Configured in `config.js` (default: http://172.20.10.2:4000)
- **Auth Tokens**: Stored in AsyncStorage (@accessToken, @refreshToken)
- **Current User**: Stored in AsyncStorage (@currentUser) as JSON

## Notes

- Account screens now primarily use backend API for data
- Firebase fallback is maintained for legacy data compatibility
- isAvailable field enables specialists to control booking availability
- Stats endpoint aggregates data from Review and Application collections
