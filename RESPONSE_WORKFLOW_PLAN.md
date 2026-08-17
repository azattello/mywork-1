# 📋 ПОЛНЫЙ ПЛАН: Workflow Отклики & Мессенджер

## 🎯 Текущие Проблемы

### ❌ **Проблема 1: Создание Отклика**
- Минимальные данные в предложении (нужно пошагово как заказ)
- Нет структуры, нет UX
- Поля не заполняются правильно

### ❌ **Проблема 2: Ленты Заказов**
- Предложенные заказы выводятся в ленте доступных (не должны!)
- Нужна фильтрация по `active: true` + `status: 'open'`
- Специалист видит заказы, которые уже выбраны (ошибка)

### ❌ **Проблема 3: УХ/УI "Мои Заказы" (Responses)**
- Отклики внизу страницы - неудобно
- Нужна красивая карточка специалиста с возможностью быстро открыть чат
- Нет визуального разделения состояний отклика

### ❌ **Проблема 4: Чат & Доступ**
- Нет логики управления доступом к чату
- Первое сообщение должно открыть доступ спец. к чату
- После выбора спец. - другие теряют доступ
- Нет UI для управления доступом

---

## ✅ ПЛАН РЕШЕНИЯ: 6 Этапов

### **ЭТАП 1: Пошаговое Создание Отклика (CreateResponseWizard)**
```
Шаг 1: Основная информация
  - Цена предложения (фиксированная или диапазон)
  - Оценка сроков (дни)
  
Шаг 2: Описание
  - Краткое описание подхода (200+ символов)
  - Примеры работ (опционально)

Шаг 3: Опыт
  - Рейтинг специалиста (показать)
  - Количество завершенных (показать)
  - Описание опыта (опционально)

Шаг 4: Портфолио
  - Выбор фото для демонстрации (до 3)
  
Шаг 5: Проверка & Отправка
  - Preview всех данных
  - Кнопка "Отправить предложение"

Инструменты:
- Новый компонент: CreateResponseWizard.js
- Использовать в: AvailableApplicationsScreen + ApplicationDetailScreen
```

---

### **ЭТАП 2: Фильтрация Ленты Заказов**
```
Где: AvailableApplicationsScreen (ленту всех заказов)
Что изменить:

API Query:
  POST /api/applications
  Параметры:
    - status: 'open' ✓
    - active: true ✓ ← ДОБАВИТЬ ЭТОТ ФИЛЬТР!
    - NOT proposedSpecialist: null ← Исключить выбранные

Frontend:
  - Добавить фильтр при загрузке
  - Исключить заказы где proposedSpecialist установлен
  - Исключить заказы где currentSpecialist установлен
  - Показать только active: true

Код место:
  /components/AvailableApplicationsScreen.js
  В методе loadData() добавить проверку
```

---

### **ЭТАП 3: Красивый UI Откликов в "Мои Заказы"**
```
Компонент: ResponseCard.js (новый)

Структура карточки:
┌─────────────────────────┐
│ [AVATAR] ФИ Специалиста │
│ ⭐ 4.9 (23 отзывов)     │
│ 💼 45 завершенных заказов│
├─────────────────────────┤
│ Предложение: 5000 ₸     │
│ Срок: 5 дней           │
│ "Короткое описание..." │
├─────────────────────────┤
│ [🗨️ Чат] [👁️ Профиль]│
│ [Принять ✓] [Отклонить]│
└─────────────────────────┘

Состояния:
  - pending: обычный вид + [Принять] [Отклонить]
  - accepted: зелёный фон + [Чат] (подтверждение ждет спец.)
  - confirmed: зелёный + "В работе" 
  - declined: серый + "Отклонено"

Место: MyApplicationsScreen
  - Вместо простого списка внизу
  - Красивая секция "Отклики на этот заказ" с карточками
```

---

### **ЭТАП 4: Логика Доступа к Чату**

#### **Таблица Доступа:**

| Состояние | Заказчик→Спец | Спец→Заказчик | Notes |
|-----------|--------------|---------------|-------|
| **Response: pending** | ❌ Нет доступа | ❌ Нет доступа | Спец предложил, ждет |
| **→ Заказчик писал** | ✅ ОТКРЫТЬ | ✅ ОТКРЫТЬ | 1-е сообщение = разблокировка |
| **Response: accepted** | ✅ Есть | ❌ Ждет | Спец подтверждает |
| **→ Спец подтвердил** | ✅ Есть | ✅ ОТКРЫТЬ | Оба могут писать |
| **Другие responses** | ✅ Есть | ❌ Заблокировано | Отклонены после выбора |

#### **Механика:**

```javascript
// Проверка доступа к чату:
function canSendMessage(currentUserId, otherUserId, applicationId) {
  const response = getResponse(applicationId, currentUserId, otherUserId);
  
  if (!response) return false;
  
  // Если текущий = заказчик и есть хотя бы 1 его сообщение
  if (currentUser.role === 'user' && response.hasCustomerMessage) return true;
  
  // Если текущий = спец и response confirmed
  if (currentUser.role === 'specialist' && response.status === 'confirmed') return true;
  
  return false;
}

// При первом сообщении заказчика:
async sendMessage(text) {
  await createMessage(...);
  
  // Разблокировать спец
  await updateResponse({ hasCustomerMessage: true });
  
  // Отправить уведомление спец
  notifySpecialist("Клиент написал! Теперь вы можете ответить");
}
```

#### **Код место:**
- `/backend/src/models/Response.js` - добавить `hasCustomerMessage` поле
- `/backend/src/controllers/applicationChatController.js` - проверка доступа
- `/components/ChatScreen.js` - показывать/скрывать input

---

### **ЭТАП 5: Скрытие Заказа После Выбора Специалиста**

#### **Логика:**

```javascript
// Когда заказчик выбирает спец (нажимает "Принять" → спец подтверждает):

1. Response.status = 'confirmed'
2. Application.currentSpecialist = specialistId
3. Application.active = false ← СКРЫТЬ ИЗ ЛЕНТЫ
4. Application.status = 'in_progress'

5. Другие responses этого приложения:
   - status = 'declined'
   - hasSpecialistMessage = false (заблокировать доступ)
   
6. Уведомления:
   - Выбранному спец: "Ваше предложение принято! Начинайте работу"
   - Другим спец: "Заказчик выбрал другого специалиста"
```

#### **Фильтр Ленты:**
```javascript
// AvailableApplicationsScreen: Загружать только:
- status: 'open'
- active: true
- currentSpecialist: null
- proposedSpecialist: null

// Исключать:
- Мои собственные отклики
- Заказы где уже есть confirmed response
```

#### **Код место:**
- `/backend/src/controllers/responseController.js` - метод `confirmResponse()`
- `/components/AvailableApplicationsScreen.js` - фильтрация при загрузке

---

### **ЭТАП 6: Интеграция в Навигацию**

#### **Точки входа для CreateResponseWizard:**

1. **Из AvailableApplicationsScreen:**
   - Нажать кнопку "Предложить" на карточке заказа
   ```javascript
   onPress={() => navigation.navigate('CreateResponse', { applicationId: item._id })}
   ```

2. **Из ApplicationDetailScreen:**
   - Кнопка "Отправить предложение" внизу экрана
   ```javascript
   <Button onPress={() => navigation.navigate('CreateResponse', { applicationId })} />
   ```

3. **Из Route в Main.js:**
   ```javascript
   Stack.Screen(
     name: 'CreateResponse',
     component: CreateResponseWizard,
     options: { headerShown: false }
   )
   ```

---

## 🛠️ СПИСОК ФАЙЛОВ ДЛЯ СОЗДАНИЯ/ИЗМЕНЕНИЯ

### Новые файлы:
- `components/CreateResponseWizard.js` ← Пошаговое создание отклика
- `components/ResponseCard.js` ← Карточка отклика

### Изменяемые файлы:

**Backend:**
- `backend/src/models/Response.js` ← Добавить `hasCustomerMessage`
- `backend/src/controllers/responseController.js` ← Логика confirmResponse, blockAccess
- `backend/src/controllers/applicationController.js` ← Логика скрытия заказа
- `backend/src/controllers/applicationChatController.js` ← Проверка доступа
- `backend/src/routes/applications.js` ← Может быть новый эндпоинт для фильтров

**Frontend:**
- `components/Main.js` ← Добавить маршруты
- `components/MyApplicationsScreen.js` ← Новый UI для откликов
- `components/AvailableApplicationsScreen.js` ← Фильтрация, кнопка "Предложить"
- `components/ApplicationDetailScreen.js` ← Кнопка "Отправить предложение"
- `components/ChatScreen.js` ← Проверка доступа, unlock для спец

---

## 📊 ПОРЯДОК ВНЕДРЕНИЯ

1. ✅ Создать CreateResponseWizard (пошаговый мастер)
2. ✅ Создать ResponseCard (красивая карточка)
3. ✅ Обновить Backend: Response модель + логика
4. ✅ Фильтрация ленты заказов (active + currentSpecialist)
5. ✅ Интеграция в UI (кнопки, навигация)
6. ✅ Логика чата (доступ, разблокировка, уведомления)
7. ✅ Тестирование E2E

---

## 💡 КЛЮЧЕВЫЕ МОМЕНТЫ

- **Никогда** не показывать in_progress заказы в ленте
- **Никогда** не давать спец доступ к чату пока заказчик не напишет
- **Всегда** закрывать доступ отклоненным специалистам
- **После** подтверждения спец - заказ исчезает из ленты
- **Уведомления** на каждом ключевом переходе
- **Валидация** всех данных перед отправкой

