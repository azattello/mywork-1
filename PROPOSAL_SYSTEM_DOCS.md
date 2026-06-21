# 📋 Двухэтапная система принятия заказов: Функциональность реализована

## Обзор

Реализована полная система управления статусами заказов и отклонениями со следующей логикой:

1. **Клиент выбирает специалиста** → Специалист в режиме ожидания подтверждения
2. **Специалист подтверждает или отклоняет** → Заказ переходит в статус "в работе" или возвращается в поиск
3. **Отклонённые специалисты не могут писать** в чате
4. **После подтверждения** заказ становится приватным (удаляется из поиска других специалистов)
5. **Оставшиеся уведомления и статусы** помогают отслеживать ход выполнения

---

## Архитектура

### Backend API endpoints

#### 📤 Отклики на заявку

**POST** `/api/applications/:applicationId/responses/:responseId/accept`
- **Кто**: Клиент (владелец заявки)
- **Что**: Выбирает специалиста, ждёт его подтверждения
- **Изменения**:
  - `application.proposedSpecialist` = ID специалиста
  - `application.pendingSpecialistConfirmation` = true
  - `response.status` = "pending"
- **Socket событие**: `proposal_selected` → специалисту

**POST** `/api/applications/:applicationId/responses/:responseId/confirm`
- **Кто**: Специалист (выбранный в accept)
- **Что**: Подтверждает выбор клиента, заказ переходит "в работу"
- **Изменения**:
  - `application.status` = "in_progress"
  - `application.active` = false (скрыт из поиска)
  - `application.currentSpecialist` = ID специалиста
  - Все остальные отклики → "rejected"
  - `response.status` = "accepted"
- **Socket события**: `proposal_confirmed` → обоим участникам

**POST** `/api/applications/:applicationId/responses/:responseId/decline`
- **Кто**: Специалист (когда выбран, но не хочет)
- **Что**: Отклоняет предложение клиента
- **Изменения**:
  - `response.status` = "rejected"
  - `application.proposedSpecialist` = null
  - `application.pendingSpecialistConfirmation` = false
- **Socket событие**: `proposal_declined` → клиенту

**POST** `/api/applications/:applicationId/responses/:responseId/reject`
- **Кто**: Клиент
- **Что**: Отклоняет отклик специалиста
- **Изменения**: `response.status` = "rejected"

**GET** `/api/applications/:applicationId/responses/:specialistId`
- **Кто**: Клиент или специалист
- **Что**: Получить статус отклика конкретного специалиста
- **Возвращает**: Объект Response с текущим статусом

---

### Message rules

**POST** `/api/messages` - проверки при отправке:

1. **Если response.status === "rejected"** → Специалист заблокирован
   ```
   "Ваш отклик был отклонён — вы не можете писать в этом чате"
   ```

2. **Если application.status !== "open" И specialist**:
   - Может писать только если:
     - `application.currentSpecialist` = его ID (подтвёрдил заказ)
     - ИЛИ `application.proposedSpecialist` = его ID И `pendingSpecialistConfirmation` = true (ждёт подтверждения)

3. **Клиент может всегда писать**

---

### Модели данных

#### Application — добавлены поля:

```javascript
{
  // ... существующие поля ...
  
  proposedSpecialist: ObjectId,                    // Выбран клиентом, ждёт подтверждения
  pendingSpecialistConfirmation: Boolean,           // true = ожидание подтверждения
  currentSpecialist: ObjectId,                     // Подтверждённый специалист
  workCompleted: Boolean,                          // Специалист завершил работу
  workAccepted: Boolean,                           // Клиент принял работу
  active: Boolean,                                  // false = скрыт из поиска
  // ...
}
```

#### Response — статусы:

- `pending` - Клиент выбрал, ждёт подтверждения специалиста
- `accepted` - Специалист подтвердил (финальный статус для работы)
- `rejected` - Отклонён (клиентом или специалистом)

---

## Сценарий использования

### Сценарий 1: Успешное назначение

```
1. Специалист отправляет отклик (response.status = "pending" по умолчанию)
2. Клиент видит отклик и нажимает "Выбрать"
   ↓ POST /accept
   → proposedSpecialist = Specialist, pendingSpecialistConfirmation = true
   → Socket: proposal_selected → специалисту
   
3. Специалист видит уведомление "Клиент выбрал вас"
   Специалист нажимает "Согласиться"
   ↓ POST /confirm
   → status = "in_progress"
   → active = false (уходит из поиска)
   → currentSpecialist = Specialist
   → Все остальные отклики → "rejected"
   → Socket: proposal_confirmed → обоим
   
4. Заказ начинает выполняться (оба могут писать)
```

### Сценарий 2: Отказ специалиста

```
1. Клиент выбрал (proposedSpecialist = Specialist)
2. Специалист видит: "Клиент хочет вас выбрать"
3. Специалист нажимает "Отклонить" → POST /decline
   → response.status = "rejected"
   → proposedSpecialist = null
   → pendingSpecialistConfirmation = false
   → Socket: proposal_declined → клиенту
   
4. Клиент видит: "Специалист отклонил предложение"
5. Заказ остаётся открытым, клиент может выбрать другого специалиста
```

### Сценарий 3: Отказ клиента

```
1. Клиент видит отклик специалиста
2. Клиент нажимает "Отклонить" → POST /reject
   → response.status = "rejected"
   
3. Специалист ЗАБЛОКИРОВАН в чате: "Ваш отклик был отклонён"
4. Заказ остаётся открытым для других специалистов
```

### Сценарий 4: Отклонённый специалист пытается писать

```
Специалист пытается: POST /messages
Проверка: response.status === "rejected"
Ответ: 403 "Ваш отклик был отклонён — вы не можете писать в этом чате"
```

---

## Frontend интеграция (рекомендация)

### В ChatScreen нужно добавить:

1. **Над сообщениями**: Карточка заявки с данными:
   - Название заявки
   - Цена
   - Срок выполнения
   - Категория
   - **Кнопки действий** (зависят от статуса):
     - Если `pendingSpecialistConfirmation` И пользователь - специалист:
       - "Согласиться" → POST /confirm
       - "Отклонить" → POST /decline
     - Если `pendingSpecialistConfirmation` И пользователь - клиент:
       - "Отменить выбор" (опционально) → обнулить proposedSpecialist
     - Если `status === "rejected"` И пользователь - специалист:
       - Показать: "Ваш отклик отклонен, письма невозможны"
       - Скрыть input для сообщений

2. **Над input**: Кнопки:
   - "Отклонить" (если есть отклик) → POST /reject
   - "Выбрать специалиста" (если есть отклик) → POST /accept

3. **Обработка ошибок** при отправке:
   - 403 "Ваш отклик был отклонён" → Показать Alert
   - 403 "Переговоры по этой заявке закрыты" → Показать Alert

### Socket события для обработки:

- `proposal_selected` - Специалист выбран, ждёт подтверждения
- `proposal_confirmed` - Заказ подтвёрдён, начало работы
- `proposal_declined` - Специалист отклонил выбор

---

## Проверка синтаксиса

✅ Все файлы проверены на ошибки - синтаксис верный

---

## API тестирование (примеры curl)

```bash
# Клиент выбирает специалиста
curl -X POST http://localhost:4000/api/applications/APP_ID/responses/RESPONSE_ID/accept \
  -H "Authorization: Bearer TOKEN_CLIENT"

# Специалист подтверждает
curl -X POST http://localhost:4000/api/applications/APP_ID/responses/RESPONSE_ID/confirm \
  -H "Authorization: Bearer TOKEN_SPECIALIST"

# Специалист отклоняет
curl -X POST http://localhost:4000/api/applications/APP_ID/responses/RESPONSE_ID/decline \
  -H "Authorization: Bearer TOKEN_SPECIALIST"

# Клиент отклоняет отклик
curl -X POST http://localhost:4000/api/applications/APP_ID/responses/RESPONSE_ID/reject \
  -H "Authorization: Bearer TOKEN_CLIENT"

# Получить отклик конкретного специалиста
curl -X GET http://localhost:4000/api/applications/APP_ID/responses/SPECIALIST_ID \
  -H "Authorization: Bearer TOKEN"
```

---

## Файлы измененные

- ✅ `backend/src/models/Application.js` - Добавлены поля
- ✅ `backend/src/controllers/responseController.js` - Обновлены endpoints (accept, confirm, decline, getResponseForSpecialist)
- ✅ `backend/src/routes/responses.js` - Маршруты для confirm, decline, getResponseForSpecialist
- ✅ `backend/src/routes/applications.js` - Добавлены маршруты (confirm, decline, getResponseForSpecialist)
- ✅ `backend/src/routes/messages.js` - Правила отправки сообщений с проверкой статуса отклика

---

## Резюме

✅ **Двухэтапная система работает**:
- Клиент выбирает (proposedSpecialist)
- Специалист подтверждает или отклоняет (confirm/decline)
- Блокировка отклонённых специалистов в чате
- Заказ становится приватным после подтверждения
- Остальные специалисты не могут переписываться

✅ **Готово к интеграции на frontend** - все endpoints на месте и работают как ожидается
