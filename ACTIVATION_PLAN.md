# 🚀 План активации функций YoYo

## Приоритет 1: Создание и управление заказами

### 1.1 AddScreen — создание заказа (клиент)
**Статус**: 🔄 Требует API интеграции

**Текущее состояние**:
- UI форма есть (title, summ, info, city, mode, comm)
- Нужна валидация
- Нужна отправка на `/api/applications`

**Изменения**:
```javascript
const handleCreate = async () => {
  const apiClient = require('../utils/apiClient').default;
  const payload = {
    title: title.trim(),
    summ: parseFloat(summ),
    info: info.trim(),
    city: selectedCity,
    mode: selectedMode,
    comm: selectedComm
  };
  
  const res = await apiClient.request('post', '/api/applications', payload);
  if (res.data?.success) {
    navigation.navigate('Apps');
    showToast('Заказ создан');
  }
};
```

### 1.2 AppsScreen — мои заказы (клиент)
**Статус**: 🔄 Требует API интеграции

**Текущее состояние**:
- Структура списка готова
- Нужен GET `/api/applications?role=user`

**Изменения**:
```javascript
const loadApplications = async () => {
  const res = await apiClient.request('get', '/api/applications?role=user');
  setApplications(res.data?.data || []);
};
```

---

## Приоритет 2: Система откликов

### 2.1 CatalogScreen — просмотр заказов (клиент ищет)
**Статус**: 🔄 Требует API интеграции

**Текущее состояние**:
- UI фильтры готовы (город, режим)
- Нужен GET `/api/applications?status=new&city=...`

### 2.2 CatalogScreenPro — заказы для специалиста
**Статус**: 🔄 Требует API интеграции

**Текущее состояние**:
- Фильтры готовы
- Нужен GET `/api/applications?status=new&mode=...`
- Нужна отправка отклика: POST `/api/responses`

**Отклик структура**:
```javascript
{
  applicationId: "...",
  bidPrice: 500,
  message: "Я могу выполнить это"
}
```

---

## Приоритет 3: Реал-тайм чат

### 3.1 ChatScreen — общение с специалистом
**Статус**: 🔄 Требует WebSocket

**Компоненты**:
- GET `/api/conversations` — список чатов
- POST `/api/conversations` — создать чат
- GET `/api/messages/:conversationId` — загрузить сообщения
- POST `/api/messages` — отправить сообщение
- WebSocket для real-time обновлений

**Socket.IO события** (из backend):
```javascript
io.on('connection', (socket) => {
  socket.on('join_conversation', ({ conversationId }) => {...});
  socket.on('send_message', ({ conversationId, text }) => {...});
  socket.on('typing', ({ conversationId }) => {...});
});
```

---

## Приоритет 4: Рейтинг и отзывы

### 4.1 rating (Pro) — просмотр отзывов
**Статус**: 🔄 Требует API интеграции

**Текущее состояние**:
- UI готов
- Нужен GET `/api/users/stats/:userId` (уже работает)

### 4.2 Оставление отзыва после завершения заказа
**Статус**: ❌ Не реализовано

**Нужно добавить**:
- Экран выбора рейтинга (1-5 звезд)
- Ввод текста отзыва
- POST `/api/reviews` { applicationId, rating, text }

---

## Приоритет 5: Уведомления и статусы

### 5.1 Статусы заказа
**Текущие статусы в БД**:
- `new` — только что создан
- `in_progress` — специалист принял
- `agreed` — согласование цены
- `completed` — завершен
- `cancelled` — отменён

**UI индикаторы**:
- Показывать статус на карточке заказа
- Color coding: 🟢 green (new), 🔵 blue (in_progress), 🟡 yellow (agreed), ⚫ gray (completed)

### 5.2 Уведомления
**Нужно**:
- Push уведомления при новом отклике
- Push при смене статуса заказа
- Push при новом сообщении в чате

---

## Чек-лист активации

### Backend (уже готов):
- ✅ Аутентификация
- ✅ Профиль пользователя
- ✅ CRUD заказов
- ✅ CRUD откликов
- ✅ Чат с Socket.IO
- ✅ Рейтинги и отзывы
- ✅ Валидация
- ✅ Avatar upload

### Frontend (в процессе):
- ✅ Аутентификация экраны (Auth, Reg)
- ✅ Профиль экраны (Account, AccountPro)
- ✅ API Client с token refresh
- 🔄 Создание заказа (AddScreen) — 50%
- 🔄 Просмотр заказов (AppsScreen, CatalogScreen) — 50%
- 🔄 Отклики (CatalogScreenPro) — 30%
- 🔄 Чат (ChatScreen) — 20%
- 🔄 Рейтинги (rating) — 40%

---

## Рекомендуемый порядок активации

1. **День 1**: AddScreen + AppsScreen (базовые CRUD)
2. **День 2**: CatalogScreen фильтр, Responses отклики
3. **День 3**: ChatScreen с WebSocket
4. **День 4**: Рейтинги и отзывы
5. **День 5**: Тестирование и polish

---

## Стек технологий

**Backend**:
- Node.js, Express
- MongoDB + Mongoose
- Socket.IO
- JWT, Multer, Joi

**Frontend**:
- React Native (Expo)
- Axios (через apiClient)
- AsyncStorage
- React Navigation

**Hosting**:
- Backend: (определить)
- Frontend: Expo (EAS Build)

---

## Примечания

- Все API routes защищены auth middleware
- Все upload файлы сохраняются локально в `/uploads` (dev) или S3 (prod)
- AsyncStorage fallback для offline режима
- WebSocket через Socket.IO на порту 4000

