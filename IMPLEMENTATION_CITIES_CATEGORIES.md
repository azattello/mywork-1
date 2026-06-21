# 🚀 IMPLEMENTATION GUIDE: Города и Категории

## 📋 Что было сделано

### Backend ✅
1. **Модели БД**:
   - `City.js` — города Казахстана
   - `Category.js` — категории с иерархией (parent-child)
   - `User.js` — обновлена (добавлены `city` и `categories` поля)

2. **API Routes**:
   - `GET /api/cities` — все города (с поиском)
   - `GET /api/cities/:id` — один город
   - `GET /api/categories` — главные категории
   - `GET /api/categories/:id` — категория + подкатегории
   - `GET /api/categories/tree` — полное дерево

3. **Controllers обновлены**:
   - `authController.js` — добавлена поддержка `city` и `categories` при регистрации
   - `userController.js` — обновлен `updateMe()` для сохранения категорий

4. **Валидация**:
   - `validation/auth.js` — добавлены поля `city` и `categories`

5. **Seed скрипт**:
   - `backend/seeds.js` — заполняет БД городами и категориями

### Frontend ✅
1. **Компоненты**:
   - `CategorySelector.js` — выбор категорий с иерархией (как Pro.ru)
   - `CityPicker.js` — выбор города из dropdown

---

## 🔧 ЭТАП 1: Инициализация БД

### Шаг 1.1: Запустить seed скрипт
```bash
cd backend
node seeds.js
```

**Ожидаемый вывод**:
```
📡 Подключение к БД успешно
🧹 Существующие данные удалены
✅ Добавлено 23 городов
✅ Добавлено 32 категорий
✨ Seed успешно завершён!
```

### Шаг 1.2: Проверить в MongoDB
```bash
# Города
db.cities.find().limit(3)

# Главные категории
db.categories.find({ parentId: null }).limit(3)

# Подкатегории
db.categories.find({ parentId: ObjectId("...") })
```

---

## 📱 ЭТАП 2: Обновление экрана регистрации (Reg.js)

### Текущая структура Reg.js
```javascript
Step 1: Ввод телефона и пароля
Step 2: Выбор роли (user / specialist)
Step 3: ... (профиль)
```

### Изменение:
```javascript
Step 1: Ввод телефона и пароля
Step 2: Выбор роли (user / specialist)
Step 3 (NEW): Если specialist → выбор категорий [ТУТ ИСПОЛЬЗУЕМ CategorySelector]
Step 4 (если был Step 3 профиль): Теперь Step 3 профиль или остаётся как есть
```

### Код для добавления в Reg.js (примерно в методе handleRoleSelect или в новом степе):

```javascript
import CategorySelector from './CategorySelector';
import CityPicker from './CityPicker';

// В render методе, после выбора роли:

{this.state.step === 2 && this.state.role === 'specialist' && (
  <View style={{ padding: 16 }}>
    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
      Выберите свою нишу
    </Text>
    
    <CategorySelector
      onSelect={(selectedIds) => {
        this.setState({ selectedCategories: selectedIds });
      }}
      allowMultiple={true}
    />

    <TouchableOpacity 
      style={styles.nextButton}
      onPress={() => this.setState({ step: 3 })}
    >
      <Text style={styles.nextButtonText}>Далее →</Text>
    </TouchableOpacity>
  </View>
)}
```

### После регистрации (в handleRegister):
```javascript
const registerData = {
  phone: this.state.phone,
  password: this.state.password,
  name: this.state.name,
  surname: this.state.surname,
  role: this.state.role,
  categories: this.state.selectedCategories, // ← НОВОЕ
  city: this.state.selectedCity // ← НОВОЕ
};

const response = await apiClient.post('/auth/register', registerData);
```

---

## 👤 ЭТАП 3: Обновление профиля специалиста (AccountScreenPro.js)

### Добавить секцию "Мои категории"

```javascript
<TouchableOpacity 
  style={styles.settingButton}
  onPress={() => this.setState({ showCategoryModal: true })}
>
  <Text style={styles.settingLabel}>Мои категории</Text>
  <Text style={styles.settingValue}>
    {this.state.userCategories?.length || 0} выбрано
  </Text>
</TouchableOpacity>

{/* Modal с выбором категорий */}
<Modal
  visible={this.state.showCategoryModal}
  animationType="slide"
  onRequestClose={() => this.setState({ showCategoryModal: false })}
>
  <CategorySelector
    onSelect={(selectedIds) => this.handleUpdateCategories(selectedIds)}
    selectedCategories={this.state.userCategories || []}
  />
</Modal>
```

### Метод обновления категорий:
```javascript
handleUpdateCategories = async (categoryIds) => {
  try {
    const response = await apiClient.put('/users/me', {
      categories: categoryIds
    });
    
    if (response.data.success) {
      this.setState({ 
        userCategories: categoryIds,
        showCategoryModal: false
      });
      Toast.show('Категории обновлены');
    }
  } catch (error) {
    Toast.show('Ошибка обновления категорий');
  }
};
```

---

## 🏙️ ЭТАП 4: Выбор города в разных местах

### 4.1 В AddScreen (при создании заказа):
```javascript
import CityPicker from './CityPicker';

// В форме создания заказа:
<CityPicker 
  onSelect={(cityId) => {
    this.setState({ applicationCity: cityId });
  }}
  selectedCityId={this.state.applicationCity}
/>
```

### 4.2 В Reg.js (при регистрации клиента):
```javascript
{this.state.step === 2 && this.state.role === 'user' && (
  <View>
    <CityPicker 
      onSelect={(cityId) => {
        this.setState({ selectedCity: cityId });
      }}
    />
  </View>
)}
```

### 4.3 В AccountScreen (профиль клиента):
```javascript
<CityPicker 
  onSelect={(cityId) => {
    this.handleUpdateProfile({ city: cityId });
  }}
  selectedCityId={this.state.userCity}
/>
```

---

## 🔍 ЭТАП 5: Фильтрация по городу и категории

### 5.1 В CatalogScreen (поиск заказов для специалиста):
```javascript
// Получить заказы с фильтром по категории специалиста
const response = await apiClient.get('/applications', {
  params: {
    city: userCity,
    categories: userCategories.join(','),
    status: 'new'
  }
});
```

### 5.2 В AppsScreen (мои заказы для клиента):
```javascript
const response = await apiClient.get('/applications', {
  params: {
    city: userCity,
    userId: userId // Заказы, созданные текущим пользователем
  }
});
```

---

## 📡 ЭТАП 6: Обновить Backend API для фильтрации

### В backend/src/controllers/applicationController.js:

```javascript
exports.getApplications = async (req, res) => {
  const { city, categories, status, userId } = req.query;
  
  let query = { active: true };

  if (city) {
    query.city = city;
  }

  if (categories) {
    const categoryIds = categories.split(',');
    query.category = { $in: categoryIds };
  }

  if (status) {
    query.status = status;
  }

  if (userId) {
    query.user = userId; // Для получения собственных заказов
  }

  try {
    const applications = await Application.find(query)
      .populate('user', 'name surname avatarUrl')
      .populate('city', 'name')
      .sort('-createdAt')
      .limit(50);

    res.json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 📊 ЭТАП 7: Обновить Application модель

### В backend/src/models/Application.js добавить:

```javascript
const applicationSchema = new mongoose.Schema({
  // ... существующие поля
  
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  
  // ... остальные поля
}, { timestamps: true });
```

### Обновить валидацию в backend/src/validation/application.js:

```javascript
const createSchema = Joi.object({
  // ... существующие поля
  city: Joi.string().regex(/^[0-9a-f]{24}$/).required(),
  category: Joi.string().regex(/^[0-9a-f]{24}$/).required(),
});
```

---

## 🧪 ЭТАП 8: Тестирование

### Тест 1: Регистрация специалиста с категориями
```
1. Открыть Reg.js
2. Выбрать роль "specialist"
3. Выбрать 2-3 категории
4. Зарегистрироваться
5. Проверить в БД: categories должны быть сохранены
```

### Тест 2: Обновление профиля с категориями
```
1. Войти как специалист
2. Открыть AccountScreenPro
3. Нажать "Мои категории"
4. Выбрать другие категории
5. Проверить: категории обновились в профиле
```

### Тест 3: Создание заказа с городом
```
1. Войти как клиент
2. Открыть AddScreen
3. Выбрать город из picker
4. Создать заказ
5. Проверить в БД: город сохранён
```

### Тест 4: Фильтрация по категории
```
1. Как специалист: открыть CatalogScreen
2. Должны видеть только заказы в своих категориях и городе
3. Проверить количество результатов
```

---

## 🎯 Приоритет реализации

### Неделя 1 (КРИТИЧНО):
- [ ] Запустить seed скрипт
- [ ] Обновить Reg.js для выбора категорий (specialist)
- [ ] Обновить AccountScreenPro для изменения категорий
- [ ] Обновить Application модель

### Неделя 2 (ВАЖНО):
- [ ] Добавить фильтр по городу/категории в API
- [ ] Обновить CatalogScreen с фильтрацией
- [ ] Добавить CityPicker в AddScreen

### Неделя 3 (NICE-TO-HAVE):
- [ ] Показывать иконки категорий
- [ ] Избранные категории в профиле
- [ ] Подсказка по расположению

---

## 🐛 Трубл-шутинг

### Проблема: "Город не найден после выбора"
```
✅ Решение: Убедиться, что seed.js успешно выполнен
✅ Решение: Проверить, что городов 23+ в БД
```

### Проблема: "Категории не отображаются"
```
✅ Решение: Проверить, что иерархия категорий правильная
✅ Решение: GET /api/categories должен вернуть главные категории
✅ Решение: GET /api/categories/tree должен вернуть полное дерево
```

### Проблема: "Фильтр не работает в CatalogScreen"
```
✅ Решение: Убедиться, что userCategories загружены из профиля
✅ Решение: Проверить параметры запроса к API
✅ Решение: Проверить, что категории в заказах совпадают с типом данных
```

---

## 📝 Чек-лист завершения

- [ ] Seed скрипт запущен (23+ города, 32+ категории)
- [ ] Reg.js: добавлено выбор категорий для specialist
- [ ] AccountScreenPro: добавлено изменение категорий
- [ ] Application модель: добавлены city и category поля
- [ ] Backend API: работает фильтрация по городу/категории
- [ ] CatalogScreen: фильтрует заказы по категориям специалиста
- [ ] AddScreen: позволяет выбрать город
- [ ] Все компоненты связаны через apiClient

---

## 🔗 Файлы для справки

- Backend: `CITIES_CATEGORIES_PLAN.md`
- Frontend компоненты: `CategorySelector.js`, `CityPicker.js`
- Модели: `backend/src/models/City.js`, `Category.js`
- Routes: `backend/src/routes/cities.js`, `categories.js`
- Seed: `backend/seeds.js`

