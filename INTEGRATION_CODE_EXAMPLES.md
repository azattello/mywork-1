# 🔗 ПРИМЕРЫ ИНТЕГРАЦИИ: Города и Категории

## 📋 Содержание
1. [Обновление Reg.js](#reg-обновление)
2. [Обновление AccountScreenPro.js](#accountpro-обновление)
3. [Обновление AddScreen.js](#addscreen-обновление)
4. [Обновление Application модели](#application-модель)
5. [Backend фильтрация](#backend-фильтрация)

---

## Reg.js - Обновление <a id="reg-обновление"></a>

### Текущий код (примерно)
```javascript
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import CategorySelector from './CategorySelector';
import CityPicker from './CityPicker';

export default class Reg extends React.Component {
  state = {
    step: 0, // 0: phone, 1: password, 2: role, 3: categories (NEW), 4: profile
    phone: '',
    password: '',
    role: 'user',
    selectedCategories: [], // ← НОВОЕ
    selectedCity: null, // ← НОВОЕ
    name: '',
    surname: ''
  }

  // ... существующие методы

  handleRoleSelect = (role) => {
    this.setState({ role, step: role === 'specialist' ? 3 : 4 });
  }

  handleCategoriesSelect = (categoryIds) => {
    this.setState({ selectedCategories: categoryIds });
  }

  handleRegister = async () => {
    try {
      const { phone, password, role, selectedCategories, selectedCity, name, surname } = this.state;
      
      const registerData = {
        phone,
        password,
        name,
        surname,
        role,
        categories: selectedCategories, // ← НОВОЕ
        city: selectedCity // ← НОВОЕ
      };

      const response = await apiClient.post('/auth/register', registerData);
      
      if (response.data.success) {
        // ... сохранить токены
        this.props.navigation.navigate('Home');
      }
    } catch (error) {
      Toast.show(error.response?.data?.message || 'Ошибка регистрации');
    }
  }

  render() {
    const { step, role } = this.state;

    return (
      <ScrollView style={styles.container}>
        {/* Step 0: Ввод телефона */}
        {step === 0 && (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Номер телефона"
              value={this.state.phone}
              onChangeText={(phone) => this.setState({ phone })}
            />
            <TouchableOpacity onPress={() => this.setState({ step: 1 })}>
              <Text style={styles.button}>Далее</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 1: Ввод пароля */}
        {step === 1 && (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Пароль"
              secureTextEntry
              value={this.state.password}
              onChangeText={(password) => this.setState({ password })}
            />
            <TouchableOpacity onPress={() => this.setState({ step: 2 })}>
              <Text style={styles.button}>Далее</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Выбор роли */}
        {step === 2 && (
          <View>
            <Text style={styles.title}>Кто вы?</Text>
            <TouchableOpacity 
              style={styles.roleButton}
              onPress={() => this.handleRoleSelect('user')}
            >
              <Text style={styles.roleButtonText}>Клиент</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.roleButton}
              onPress={() => this.handleRoleSelect('specialist')}
            >
              <Text style={styles.roleButtonText}>Специалист</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ← НОВОЕ: Step 3: Выбор категорий (только для специалистов) */}
        {step === 3 && role === 'specialist' && (
          <View>
            <Text style={styles.title}>Выберите вашу нишу</Text>
            <Text style={styles.subtitle}>Вы можете выбрать несколько категорий</Text>
            
            <CategorySelector
              onSelect={this.handleCategoriesSelect}
              allowMultiple={true}
            />

            <TouchableOpacity 
              style={styles.nextButton}
              onPress={() => {
                if (this.state.selectedCategories.length === 0) {
                  Toast.show('Выберите хотя бы одну категорию');
                  return;
                }
                this.setState({ step: 4 });
              }}
            >
              <Text style={styles.nextButtonText}>Далее → ({this.state.selectedCategories.length} выбрано)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => this.setState({ step: 2 })}
            >
              <Text style={styles.backButtonText}>← Назад</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Профиль */}
        {step === 4 && (
          <View>
            <Text style={styles.title}>Профиль</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Имя"
              value={this.state.name}
              onChangeText={(name) => this.setState({ name })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Фамилия"
              value={this.state.surname}
              onChangeText={(surname) => this.setState({ surname })}
            />

            {/* ← НОВОЕ: Выбор города для клиентов */}
            {role === 'user' && (
              <CityPicker 
                onSelect={(cityId) => this.setState({ selectedCity: cityId })}
              />
            )}

            <TouchableOpacity 
              style={styles.registerButton}
              onPress={this.handleRegister}
            >
              <Text style={styles.registerButtonText}>Зарегистрироваться</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => this.setState({ step: 3 })}
            >
              <Text style={styles.backButtonText}>← Назад</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, marginBottom: 12, borderRadius: 8 },
  button: { padding: 12, backgroundColor: '#0066cc', color: '#fff', textAlign: 'center', borderRadius: 8 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  roleButton: { padding: 16, backgroundColor: '#f0f0f0', marginBottom: 12, borderRadius: 8 },
  roleButtonText: { textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
  nextButton: { padding: 12, backgroundColor: '#0066cc', borderRadius: 8, marginBottom: 12 },
  nextButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  backButton: { padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  backButtonText: { color: '#666', textAlign: 'center' },
  registerButton: { padding: 12, backgroundColor: '#28a745', borderRadius: 8, marginBottom: 12 },
  registerButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});
```

---

## AccountScreenPro.js - Обновление <a id="accountpro-обновление"></a>

### Добавить методы и состояние
```javascript
import CategorySelector from './CategorySelector';

export default class AccountScreenPro extends React.Component {
  state = {
    // ... существующее состояние
    userCategories: [],
    showCategoryModal: false,
  }

  componentDidMount() {
    this.loadUserProfile();
  }

  loadUserProfile = async () => {
    try {
      const response = await apiClient.get('/users/me');
      if (response.data.success) {
        const user = response.data.data;
        this.setState({
          userCategories: user.categories || []
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  handleUpdateCategories = async (categoryIds) => {
    try {
      this.setState({ loading: true });
      
      const response = await apiClient.put('/users/me', {
        categories: categoryIds
      });

      if (response.data.success) {
        this.setState({
          userCategories: categoryIds,
          showCategoryModal: false
        });
        Toast.show('Категории успешно обновлены');
      }
    } catch (error) {
      Toast.show(error.response?.data?.message || 'Ошибка обновления категорий');
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    return (
      <ScrollView style={styles.container}>
        {/* ... существующие блоки профиля */}

        {/* ← НОВОЕ: Блок "Мои категории" */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Специализация</Text>
          
          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => this.setState({ showCategoryModal: true })}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Мои категории</Text>
              <Text style={styles.settingValue}>
                {this.state.userCategories?.length || 0} {
                  this.state.userCategories?.length === 1 ? 'выбрана' : 'выбрано'
                }
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {/* Показать выбранные категории */}
          {this.state.userCategories?.length > 0 && (
            <View style={styles.categoriesList}>
              {this.state.userCategories.slice(0, 3).map((catId, index) => (
                <Text key={index} style={styles.categoryBadge}>
                  • {catId} {/* На самом деле показывать название */}
                </Text>
              ))}
              {this.state.userCategories.length > 3 && (
                <Text style={styles.categoryBadge}>
                  + ещё {this.state.userCategories.length - 3}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ← НОВОЕ: Modal для выбора категорий */}
        <Modal
          visible={this.state.showCategoryModal}
          animationType="slide"
          onRequestClose={() => this.setState({ showCategoryModal: false })}
        >
          <CategorySelector
            onSelect={this.handleUpdateCategories}
            selectedCategories={this.state.userCategories}
            allowMultiple={true}
          />
        </Modal>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  // ... существующие стили
  sectionContainer: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  settingButton: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#f9f9f9', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 8 
  },
  settingContent: { flex: 1 },
  settingLabel: { fontSize: 14, color: '#999', marginBottom: 4 },
  settingValue: { fontSize: 16, fontWeight: '600', color: '#333' },
  chevron: { fontSize: 24, color: '#ddd' },
  categoriesList: { marginTop: 8, paddingLeft: 4 },
  categoryBadge: { fontSize: 13, color: '#0066cc', marginVertical: 2 },
});
```

---

## AddScreen.js - Обновление <a id="addscreen-обновление"></a>

### Добавить выбор города
```javascript
import CityPicker from './CityPicker';

export default class AddScreen extends React.Component {
  state = {
    // ... существующие поля
    title: '',
    description: '',
    budget: '',
    category: '',
    selectedCity: null, // ← НОВОЕ
  }

  handleCreateApplication = async () => {
    try {
      const { title, description, budget, category, selectedCity } = this.state;

      if (!title || !description || !budget || !category || !selectedCity) {
        Toast.show('Заполните все поля');
        return;
      }

      const applicationData = {
        title,
        description,
        summ: parseFloat(budget),
        category, // ID категории (если также нужен выбор)
        city: selectedCity, // ← НОВОЕ: ID города
      };

      const response = await apiClient.post('/applications', applicationData);

      if (response.data.success) {
        Toast.show('Заказ создан успешно');
        this.props.navigation.goBack();
      }
    } catch (error) {
      Toast.show(error.response?.data?.message || 'Ошибка создания заказа');
    }
  }

  render() {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Новый заказ</Text>

        <TextInput
          style={styles.input}
          placeholder="Название заказа"
          value={this.state.title}
          onChangeText={(title) => this.setState({ title })}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Описание"
          multiline
          numberOfLines={4}
          value={this.state.description}
          onChangeText={(description) => this.setState({ description })}
        />

        <TextInput
          style={styles.input}
          placeholder="Бюджет"
          keyboardType="numeric"
          value={this.state.budget}
          onChangeText={(budget) => this.setState({ budget })}
        />

        {/* ← НОВОЕ: Выбор города */}
        <CityPicker
          onSelect={(cityId) => this.setState({ selectedCity: cityId })}
          selectedCityId={this.state.selectedCity}
        />

        {/* Существующий выбор категории */}
        <TouchableOpacity
          style={styles.input}
          onPress={() => {/* открыть выбор категории */}}
        >
          <Text>{this.state.category || 'Выберите категорию'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createButton}
          onPress={this.handleCreateApplication}
        >
          <Text style={styles.createButtonText}>Создать заказ</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
}
```

---

## Application модель - Обновление <a id="application-модель"></a>

### backend/src/models/Application.js
```javascript
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  summ: {
    type: Number,
    required: true
  },
  info: String,
  
  // ← НОВЫЕ ПОЛЯ
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  // ← КОНЕЦ НОВЫХ ПОЛЕЙ
  
  status: {
    type: String,
    enum: ['new', 'in_progress', 'completed', 'cancelled'],
    default: 'new'
  },
  currentSpecialist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
```

### backend/src/validation/application.js
```javascript
const Joi = require('joi');

const createSchema = Joi.object({
  title: Joi.string().required().max(100),
  summ: Joi.number().required().positive(),
  info: Joi.string().max(2000).allow('', null),
  
  // ← НОВЫЕ ВАЛИДАЦИИ
  city: Joi.string()
    .regex(/^[0-9a-f]{24}$/)
    .required()
    .messages({ 'string.pattern.base': 'Выберите город' }),
  category: Joi.string()
    .regex(/^[0-9a-f]{24}$/)
    .required()
    .messages({ 'string.pattern.base': 'Выберите категорию' })
  // ← КОНЕЦ НОВЫХ ВАЛИДАЦИЙ
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('new', 'in_progress', 'completed', 'cancelled').required()
});

module.exports = { createSchema, updateStatusSchema };
```

---

## Backend - Фильтрация <a id="backend-фильтрация"></a>

### backend/src/controllers/applicationController.js
```javascript
exports.getApplications = async (req, res) => {
  const { city, category, status, userId } = req.query;
  
  let query = { active: true };

  // ← НОВОЕ: Фильтр по городу
  if (city) {
    query.city = mongoose.Types.ObjectId(city);
  }

  // ← НОВОЕ: Фильтр по категории
  if (category) {
    query.category = mongoose.Types.ObjectId(category);
  }

  // Фильтр по статусу
  if (status) {
    query.status = status;
  }

  // Если передан userId - только свои заказы
  if (userId) {
    query.user = mongoose.Types.ObjectId(userId);
  }

  try {
    const applications = await Application.find(query)
      .populate('user', 'name surname avatarUrl')
      .populate('city', 'name region')  // ← НОВОЕ
      .populate('category', 'name icon') // ← НОВОЕ
      .sort('-createdAt')
      .limit(50);

    res.json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении заказов',
      error: error.message
    });
  }
};
```

---

## 🧪 Тестирование в Postman

### 1️⃣ Получить города
```
GET http://172.20.10.2:4000/api/cities
GET http://172.20.10.2:4000/api/cities?search=Алма
```

### 2️⃣ Получить категории
```
GET http://172.20.10.2:4000/api/categories
GET http://172.20.10.2:4000/api/categories/tree
```

### 3️⃣ Регистрация со специальностью
```
POST http://172.20.10.2:4000/api/auth/register
Content-Type: application/json

{
  "phone": "+7701234567",
  "password": "password123",
  "name": "Иван",
  "surname": "Петров",
  "role": "specialist",
  "categories": ["63c9a1b2c3d4e5f6g7h8i9j0", "63c9a1b2c3d4e5f6g7h8i9j1"],
  "city": "63c9a1b2c3d4e5f6g7h8i9j2"
}
```

### 4️⃣ Обновить профиль со специальностью
```
PUT http://172.20.10.2:4000/api/users/me
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "categories": ["id1", "id2", "id3"],
  "city": "id_города"
}
```

### 5️⃣ Создать заказ с городом
```
POST http://172.20.10.2:4000/api/applications
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "title": "Разработка сайта",
  "summ": 50000,
  "info": "Нужна разработка сайта",
  "city": "63c9a1b2c3d4e5f6g7h8i9j0",
  "category": "63c9a1b2c3d4e5f6g7h8i9j1"
}
```

### 6️⃣ Получить заказы с фильтром
```
GET http://172.20.10.2:4000/api/applications?city=id&category=id&status=new
```

---

## ✅ Чек-лист обновления

- [ ] Запустить `node seeds.js` в backend
- [ ] Обновить Reg.js: добавить Step 3 для специалистов
- [ ] Обновить AccountScreenPro.js: добавить "Мои категории"
- [ ] Обновить AddScreen.js: добавить CityPicker
- [ ] Обновить Application модель: добавить city и category
- [ ] Обновить validation/application.js
- [ ] Обновить applicationController.js для фильтрации
- [ ] Протестировать в Postman (6 запросов выше)
- [ ] Протестировать на эмуляторе

