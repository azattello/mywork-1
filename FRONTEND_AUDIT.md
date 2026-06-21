# 📱 Аудит Frontend — Все компоненты и страницы

## 🗂️ Структура фронтенда

```
frontend/
├── App.js              → Root entry
├── navigate.js         → Navigation setup (Stack + Tab)
├── config.js           → API_URL (cleaned Supabase/Firebase)
├── supabase.js         → Disabled (заглушка)
├── components/         → Клиентский режим
├── pro/                → Специалист режим
├── utils/
│   ├── apiClient.js    → Axios wrapper с JWT refresh
│   ├── toast.js        → Toast notification util
│   └── ...
└── assets/             → Images, fonts
```

---

## 🛣️ Навигация (navigate.js)

### Stack Navigator (изначальный выбор)
1. **SplashScreen** → Заставка
2. **Main** → Выбор между Auth/Reg
3. **Role** → Выбор роли (клиент/специалист)
4. **Auth** → Вход
5. **Reg** → Регистрация

### После выбора роли → Tabbed Navigation

#### Client Mode (TabNav)
- **Home** — главная, рекомендации
- **Catalog** — поиск услуг/заказов
- **Add** — создание заказа
- **Apps** — мои заказы
- **Account** — профиль

#### Specialist Mode (TabPro)
- **HomePro** — новые заказы
- **CatalogPro** — каталог заказов
- **AddPro** — добавление услуги
- **AppsPro** — мои заказы
- **AccountPro** — профиль

### Модальные экраны (Stack вложенные)
- **ViewAccount** — профиль другого пользователя
- **ChatScreen** — чат в конкретным
- **FilterScreenPro** — фильтр (Pro)
- **PostOpen** — открытие заказа (Pro)
- **Message** — входящие заказы (Pro)
- **Offer** — предложения (Pro)
- **SpecialistProfile** — профиль специалиста (Pro)

---

## 👤 Компоненты аутентификации

### 1. Auth.js (Вход)
**Статус**: ✅ Работает

**Функциональность**:
- Ввод номера телефона
- Ввод пароля (с toggle show/hide)
- Кнопка "Войти"
- Кнопка "Создать аккаунт" (navigate к Reg)
- Loading state при отправке
- Error toast при ошибке
- JWT токены сохраняются в AsyncStorage

**API Call**:
```javascript
POST /api/auth/login { phone, password }
```

**Улучшения**:
- ✅ Показ/скрытие пароля работает
- ✅ Loading indicator есть
- ✅ Error handling с toast

---

### 2. Reg.js (Регистрация)
**Статус**: ✅ Работает

**Функциональность**:
- Ввод номера телефона
- Ввод пароля (с toggle)
- Подтверждение пароля
- Согласие с условиями
- Loading state
- Error handling

**API Call**:
```javascript
POST /api/auth/register { phone, password }
```

**Синтаксис**: ✅ Исправлены все ошибки

---

### 3. Role.js (Выбор роли)
**Статус**: ✅ Работает

**Функциональность**:
- Кнопка "Я ищу услугу" → role: 'user' → TabNav
- Кнопка "Я предоставляю услугу" → role: 'specialist' → TabPro
- Логика: устанавливает role в backend при первом входе

---

## 👤 Профиль компоненты

### 4. AccountScreen.js (Профиль клиента)
**Статус**: ✅ Готов

**Структура**:
- Avatar с кнопкой редактирования
- Имя + Фамилия
- Кнопка "Настройки аккаунта"
- Кнопка "Избранные специалисты"
- Кнопка "Режим специалиста"
- Кнопка "Выйти"

**Edit Profile Modal**:
- Загрузка аватара (image picker)
- Ввод имени и фамилии
- Кнопки сохранить/отмена

**API Calls**:
```javascript
GET /api/users/me
PUT /api/users/me { name, surname }
POST /api/users/me/avatar (multipart)
```

**Возможности**:
- ✅ Avatar upload с progress
- ✅ Оптимистический preview
- ✅ Rollback при ошибке
- ✅ Toast уведомления
- ✅ Fallback на AsyncStorage если API недоступен

---

### 5. AccountScreenPro.js (Профиль специалиста)
**Статус**: ✅ Готов (идентичен AccountScreen)

**Дополнительные функции**:
- Кнопка "Готов к новым заказам" (Switch toggle)
- Статистика (завершено, рейтинг, отзывы)
- Кнопка "Мои отзывы"
- Кнопка "Мои работы"
- Кнопка "Режим клиента"

**API Calls**:
```javascript
GET /api/users/me
PUT /api/users/me { isAvailable: boolean }
POST /api/users/me/avatar (multipart)
GET /api/users/stats/:userId
```

---

### 6. viewAccount.js (Просмотр профиля другого)
**Статус**: 🔄 Частично

**Функциональность**:
- Просмотр avatar
- Просмотр имени/фамилии
- Просмотр статистики (если специалист)
- Кнопка "Написать" (чат)

**API Calls**:
```javascript
GET /api/users/:userId
GET /api/users/stats/:userId
```

**Проблема**: 
- AsyncStorage fallback при ошибке (нужна полировка)

---

## 🏠 Главные экраны

### 7. Home.js (Главная клиента)
**Статус**: 🔄 Требует API

**UI**:
- Поиск по услугам
- Категории услуг
- Рекомендации (топ специалистов)
- Последние заказы

**API Calls** (нужно добавить):
```javascript
GET /api/applications?status=new
GET /api/users/stats?top=true (топ специалистов)
```

---

### 8. HomePro.js (Главная специалиста)
**Статус**: 🔄 Требует API

**UI**:
- Карточки новых заказов
- Фильтр по категориям
- Кнопка "Откликнуться"

**API Calls** (нужно добавить):
```javascript
GET /api/applications?status=new
GET /api/applications/:id/responses (мои отклики)
```

---

## 📋 Заказы компоненты

### 9. AddScreen.js (Создание заказа)
**Статус**: 🔄 Требует API

**UI форма**:
- Название заказа (TextInput)
- Сумма (NumberInput)
- Описание (TextArea)
- Выбор города (Dropdown)
- Выбор режима (Picker: Design, Development, etc)
- Выбор способа общения (Picker: Online, Offline, Both)

**API Call** (нужно добавить):
```javascript
POST /api/applications {
  title, summ, info, city, mode, comm
}
```

---

### 10. AppsScreen.js (Мои заказы)
**Статус**: 🔄 Требует API

**UI**:
- Список заказов (FlatList)
- Карточка с информацией
- Статус индикатор
- Кнопка детальной информации

**API Call** (нужно добавить):
```javascript
GET /api/applications?user=me
```

**Структура карточки**:
- Заголовок
- Город
- Сумма
- Статус (новая, в работе, завершена)
- Дата

---

### 11. AppsScreenPro.js (Мои заказы - специалист)
**Статус**: 🔄 Требует API

**Аналогично AppsScreen.js**

---

## 🔍 Каталог компоненты

### 12. CatalogScreen.js (Поиск заказов - клиент)
**Статус**: 🔄 Требует API

**UI**:
- Поисковая строка
- Фильтры (город, бюджет, категория)
- Список результатов (FlatList)
- Каждый элемент → ViewAccount специалиста

**API Calls** (нужно добавить):
```javascript
GET /api/applications?city=...&mode=...&search=...
```

---

### 13. CatalogScreenPro.js (Поиск заказов - специалист)
**Статус**: 🔄 Требует API

**UI** похожа на CatalogScreen, но:
- Кнопка "Откликнуться" на каждой карточке
- Фильтр специально для специалистов

**API Calls** (нужно добавить):
```javascript
GET /api/applications?status=new&mode=...
POST /api/responses/:applicationId/respond
```

---

### 14. FilterScreenPro.js (Фильтр)
**Статус**: ✅ UI готов

**Фильтры**:
- По городу
- По режиму (Design, Development, etc)
- По бюджету (min-max)
- По статусу

---

## 💬 Чат компоненты

### 15. ChatScreen.js (Чат)
**Статус**: 🔄 Требует WebSocket

**UI**:
- Список сообщений (FlatList, авто-скролл вниз)
- Input поле для ввода
- Кнопка отправки
- Показывает кто пишет (typing indicator)

**API/Socket Calls** (нужно добавить):
```javascript
GET /api/conversations/:conversationId
GET /api/messages/:conversationId
POST /api/messages { conversationId, text }
// WebSocket:
socket.on('message', (msg) => {...})
socket.emit('send_message', { conversationId, text })
```

---

### 16. Message.js (Входящие заказы - Pro)
**Статус**: 🔄 Требует API

**UI**:
- Список входящих заказов (уведомления)
- Кнопка "Ответить"

---

## ⭐ Рейтинг/Отзывы компоненты

### 17. rating.js (Мои отзывы - Pro)
**Статус**: 🔄 Требует API

**UI**:
- Список отзывов от клиентов
- Звезды рейтинг
- Текст отзыва
- Среднее значение рейтинга (заголовок)

**API Calls** (нужно добавить):
```javascript
GET /api/reviews/specialist/:specialistId
GET /api/users/stats/:specialistId (среднее рейтинг)
```

---

### 18. SpecialistProfile.js (Профиль специалиста)
**Статус**: 🔄 Требует API

**UI**:
- Avatar + имя
- Рейтинг (звезды)
- Список услуг (категории)
- "Написать" кнопка (чат)
- "Посмотреть отзывы" кнопка

---

## 🎛️ Сервисные компоненты

### 19. catalogItems.js и catalogItems2.js
**Статус**: 🔄 Требует API

**Функция**: Отображение каталога услуг (при выборе из Home/Catalog)

---

### 20. SplashScreen.js
**Статус**: ✅ Готов

**Функция**: 
- Показывает логотип/название при загрузке
- Проверяет наличие токена в AsyncStorage
- Если есть → переходит в TabNav/TabPro
- Если нет → переходит в Main

---

### 21. Main.js
**Статус**: ✅ Готов

**UI**: 
- Кнопка "Войти"
- Кнопка "Регистрация"

---

### 22. CommunicationMode.js, Cities.js, mode.js
**Статус**: 🔄 Инфра компоненты

**Функция**: Modals для выбора города, режима, способа общения

---

## 🚨 Статус синтаксиса

### ✅ Проверено и исправлено:
- ✅ Auth.js — исправлены missing commas, return placement
- ✅ Reg.js — исправлены try/catch блоки
- ✅ AccountScreen.js — исправлены missing commas
- ✅ AccountScreenPro.js — удалены дубликаты imports (ImagePicker, LogoutModal, EditProfileModal)
- ✅ Все component файлы прошли node --check

### Дубликаты (УДАЛЕНЫ):
- ❌ 2x LogoutModal → Переименованы в LogoutModalClient/LogoutModalPro
- ❌ 2x EditProfileModal → Переименованы в EditProfileModalClient/EditProfileModalPro
- ❌ 2x ImagePicker import → Оставлен один в начале файла

---

## 📊 Таблица статусов всех компонентов

| # | Компонент | Статус | API готово | WebSocket | Примечание |
|----|-----------|--------|-----------|-----------|-----------|
| 1 | Auth | ✅ | ✅ | - | Работает |
| 2 | Reg | ✅ | ✅ | - | Работает |
| 3 | Role | ✅ | - | - | Работает |
| 4 | AccountScreen | ✅ | ✅ | - | Готов |
| 5 | AccountScreenPro | ✅ | ✅ | - | Готов |
| 6 | viewAccount | 🔄 | ✅ | - | Нужна полировка |
| 7 | Home | 🔄 | ❌ | - | Требует API |
| 8 | HomePro | 🔄 | ❌ | - | Требует API |
| 9 | AddScreen | 🔄 | ❌ | - | Требует API |
| 10 | AppsScreen | 🔄 | ❌ | - | Требует API |
| 11 | AppsScreenPro | 🔄 | ❌ | - | Требует API |
| 12 | CatalogScreen | 🔄 | ❌ | - | Требует API |
| 13 | CatalogScreenPro | 🔄 | ❌ | - | Требует API |
| 14 | FilterScreenPro | ✅ | - | - | UI готов |
| 15 | ChatScreen | 🔄 | ❌ | ❌ | Требует API + WebSocket |
| 16 | Message | 🔄 | ❌ | - | Требует API |
| 17 | rating | 🔄 | ❌ | - | Требует API |
| 18 | SpecialistProfile | 🔄 | ❌ | - | Требует API |
| 19 | SplashScreen | ✅ | - | - | Работает |
| 20 | Main | ✅ | - | - | Работает |

---

## 🔧 Инфраструктура

### Utils
- ✅ **apiClient.js** — Axios wrapper с JWT refresh, upload progress
- ✅ **toast.js** — Toast notifications
- ✅ **validate-account-api.js** — Валидация функции (если нужны)

### Config
- ✅ **config.js** — API_URL (Firebase/Supabase удалены)
- ✅ **supabase.js** — Заглушка (не используется)
- ✅ **package.json** — Firebase/Supabase удалены

---

## 🎯 Готовность к продакшену

**Зелёные флаги** ✅:
- Синтаксис чистый (no errors)
- Auth работает
- Profile работает
- Структура логична

**Concerns** ⚠️:
- 60% компонентов требуют API интеграции
- ChatScreen требует WebSocket
- Нет loading skeletons (показываются пустые списки)
- Нет offline-first стратегии для критичных данных

