# 🏗️ АРХИТЕКТУРНАЯ СХЕМА: Города и Категории

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Reg.js              AccountScreenPro.js      AddScreen.js   │
│  ───────────────────────────────────────────────────────     │
│  │                    │                          │           │
│  ├─ Step 3:           ├─ "Мои категории"        ├─ CityPicker
│  │  CategorySelector  │  button → Modal         │  |        │
│  │  (выбор ниши)      │  │                      │  |        │
│  │  ↓                 │  └─ CategorySelector    │  └─ onSelect
│  │  selectedCategories│     (изменение)         │     (cityId)
│  │                    │     ↓                   │     |       │
│  │                    │     handleUpdateCats    │     |       │
│  │                    │                         │     |       │
│  └─────────────────────────────────────────────┴────────────┘
│         (все компоненты используют)                         │
│                   ↓                                           │
│         CategorySelector.js                                 │
│         CityPicker.js                                       │
│         apiClient.js (axios)                                │
│                   ↓                                           │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTP Requests
                    │ (Bearer Token in headers)
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Routes                Controllers           Models         │
│  ──────────────────────────────────────────────────────     │
│                                                              │
│  POST /auth/register    authController      User            │
│  ├─ categories[]    ──→ register()    ─────→ city: ObjectId │
│  └─ city              (save user)           categories: []  │
│                                                              │
│  GET /categories        categoryController  Category        │
│  ├─ /                ──→ getCategories() ──→ name           │
│  ├─ /:id                (with tree)        parentId (null)  │
│  └─ /tree                                   subcategories   │
│                                             (virtual)       │
│  GET /cities            cityController      City            │
│  ├─ /                ──→ getCities()    ────→ name           │
│  └─ ?search=text        (with search)      region          │
│                                             active           │
│  PUT /users/me          userController      (update User)   │
│  ├─ categories[]    ──→ updateMe()    ─────→ categories    │
│  └─ city                (populate refs)     city            │
│                                                              │
│  GET /applications      appController       Application    │
│  └─ ?city=id            (with filters)      city: ref      │
│     ?category=id                            category: ref  │
│     ?status=                                                 │
│                                                              │
│  POST /applications     (new)               (новые поля)   │
│  ├─ city            ──→ create()            city (required) │
│  └─ category            (validate & save)   category (req)  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                    ↓ MongoDB Operations
                    │
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Collections:                                               │
│  ──────────────────────────────────────────────────────     │
│                                                              │
│  cities (23)                                                │
│  ├─ _id: ObjectId                                           │
│  ├─ name: "Алматы" (unique, indexed)                       │
│  ├─ region: "Алматы"                                       │
│  ├─ country: "Kazakhstan"                                   │
│  ├─ active: true                                            │
│  └─ timestamps                                              │
│                                                              │
│  categories (32)                                            │
│  ├─ _id: ObjectId                                           │
│  ├─ name: "Веб-разработка"                                 │
│  ├─ parentId: null (или ObjectId для подкатегорий)        │
│  ├─ icon: "💻"                                              │
│  ├─ description: "string"                                   │
│  ├─ active: true                                            │
│  └─ timestamps                                              │
│                                                              │
│  users (обновлена)                                          │
│  ├─ ... (все старые поля)                                  │
│  ├─ city: ObjectId (ref: City)               ← НОВОЕ       │
│  ├─ categories: [ObjectId] (ref: Category)  ← НОВОЕ        │
│  └─ timestamps                                              │
│                                                              │
│  applications (обновляется)                                │
│  ├─ ... (все старые поля)                                  │
│  ├─ city: ObjectId (ref: City, required)     ← НОВОЕ       │
│  ├─ category: ObjectId (ref: Category, req) ← НОВОЕ        │
│  └─ timestamps                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Communication

```
Регистрация Специалиста
═══════════════════════════════════════════════════════════

User Input (Reg.js)
    │
    ├─ Phone + Password → validate
    │
    ├─ Role Selection → "Specialist"
    │
    └─ Category Selection (NEW)
        │
        ├─ CategorySelector.js
        │   ├─ GET /api/categories
        │   │   └─ Display: родительские категории
        │   │
        │   ├─ User clicks parent
        │   │   └─ GET /api/categories/:id
        │   │       └─ Display: подкатегории
        │   │
        │   └─ User selects (checkboxes)
        │       └─ onSelect(selectedIds)
        │           └─ setState({ selectedCategories: [...] })
        │
        └─ POST /api/auth/register
            ├─ phone: "+7701234567"
            ├─ password: "hash"
            ├─ name: "Иван"
            ├─ role: "specialist"
            ├─ categories: ["id1", "id2"] ← НОВОЕ
            └─ city: "id" ← НОВОЕ (опционально)
                │
                ├─ Server validates
                ├─ Creates User doc
                ├─ Returns: { accessToken, refreshToken }
                └─ Store in AsyncStorage
                    │
                    └─ Navigate to Home
                        └─ User видит свой профиль с категориями


Обновление Профиля Специалиста
════════════════════════════════════════════════════════════

User Opens AccountScreenPro
    │
    ├─ GET /api/users/me
    │   └─ Load: user profile with categories
    │
    └─ "Мои категории" button
        │
        ├─ setModalVisible(true)
        │
        └─ CategorySelector.js
            ├─ GET /api/categories (tree)
            │
            ├─ Display current categories (pre-selected)
            │
            ├─ User changes selections
            │
            └─ PUT /api/users/me
                ├─ categories: ["id1", "id2", "id3"]
                ├─ city: "id" (опционально)
                └─ Response: updated user
                    │
                    ├─ Toast: "Категории обновлены"
                    ├─ setState({ userCategories: [...] })
                    └─ UI refresh


Создание Заказа с Городом
═══════════════════════════════════════════════════════════

User Opens AddScreen
    │
    ├─ CityPicker.js
    │   ├─ GET /api/cities
    │   ├─ Display: 23 города
    │   ├─ User selects one
    │   └─ onSelect(cityId) → setState({ selectedCity })
    │
    ├─ Category Picker (существующий)
    │   └─ Category selection
    │
    ├─ Form Fields
    │   ├─ title
    │   ├─ description
    │   └─ budget
    │
    └─ "Создать заказ" button
        │
        ├─ Validate: все поля заполнены + city + category
        │
        └─ POST /api/applications
            ├─ title: "Разработка сайта"
            ├─ summ: 50000
            ├─ info: "..."
            ├─ city: "id" ← НОВОЕ
            ├─ category: "id" ← НОВОЕ
            │
            ├─ Server validates (Joi schema)
            │   ├─ city: required MongoDB ObjectId
            │   ├─ category: required MongoDB ObjectId
            │   └─ Checks refs exist in DB
            │
            ├─ Creates Application doc
            │
            └─ Response: { _id, ... }
                │
                ├─ Toast: "Заказ создан"
                └─ Navigate to AppsScreen


Фильтрация Заказов Специалистом
═════════════════════════════════════════════════════════════

User Opens CatalogScreen (specialist)
    │
    ├─ GET /api/users/me
    │   └─ Load: { categories: [...], city: "..." }
    │
    └─ GET /api/applications
        ├─ params: {
        │   city: userCity,
        │   categories: userCategories.join(','),
        │   status: 'new'
        │ }
        │
        ├─ Server filters:
        │   ├─ query.city = cityId
        │   ├─ query.category = { $in: categoryIds }
        │   ├─ query.status = 'new'
        │   └─ query.active = true
        │
        ├─ populate('user', 'name surname avatar')
        ├─ populate('city', 'name region')
        ├─ populate('category', 'name icon')
        │
        └─ Response: [{ title, city, category, ... }]
            │
            └─ Display: applications in user's niche & city
                ├─ Show city name
                ├─ Show category name + icon
                └─ Specialist can bid
```

---

## State Management

```
User (Logged In)
═════════════════════════════════════════════════

AsyncStorage / Redux Store:
{
  user: {
    _id: "...",
    phone: "+7701234567",
    name: "Иван",
    surname: "Петров",
    role: "specialist",
    
    // ← НОВЫЕ ПОЛЯ
    city: {
      _id: "cityId",
      name: "Алматы",
      region: "Алматы"
    },
    categories: [
      { _id: "catId1", name: "Frontend", icon: "⚛️" },
      { _id: "catId2", name: "Backend", icon: "🔧" }
    ],
    
    avatarUrl: "https://...",
    isAvailable: true,
    createdAt: "2026-02-02T..."
  },
  
  accessToken: "eyJhbGc...",
  refreshToken: "eyJhbGc..."
}


Application Document (in DB)
═════════════════════════════════════════════════

{
  _id: ObjectId("..."),
  user: ObjectId("..."),  // ref: User
  title: "Разработка сайта",
  summ: 50000,
  info: "Нужна современная, ответственная разработка",
  
  // ← НОВЫЕ ПОЛЯ
  city: ObjectId("..."),      // ref: City (REQUIRED)
  category: ObjectId("..."),  // ref: Category (REQUIRED)
  
  status: "new",  // 'new', 'in_progress', 'completed'
  currentSpecialist: null,  // ObjectId or null
  active: true,
  
  createdAt: "2026-02-02T...",
  updatedAt: "2026-02-02T...",
  
  // Virtual populate (when fetched):
  responses: [ ],  // GET /api/applications/:id/responses
  review: null     // GET /api/reviews?application=:id
}


User Selection State (in Component)
═════════════════════════════════════════════════

Reg.js:
{
  step: 0-4,
  phone: "",
  password: "",
  role: "user" | "specialist",
  selectedCategories: ["id1", "id2"],  ← НОВОЕ
  selectedCity: "id",  ← НОВОЕ
  name: "",
  surname: ""
}

AccountScreenPro.js:
{
  userCategories: ["id1", "id2"],
  showCategoryModal: false,
  loading: false
}

AddScreen.js:
{
  title: "",
  description: "",
  budget: "",
  category: "id",
  selectedCity: "id",  ← НОВОЕ
  loading: false
}
```

---

## API Response Examples

```
GET /api/cities
────────────────────
200 OK
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Алматы",
      "region": "Алматы"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Нур-Султан",
      "region": "Акмола"
    }
  ]
}


GET /api/categories
─────────────────────
200 OK
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Веб-разработка",
      "icon": "💻",
      "description": "Разработка веб-приложений"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Дизайн",
      "icon": "🎨",
      "description": "Услуги дизайна"
    }
  ]
}


GET /api/categories/tree
────────────────────────
200 OK
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Веб-разработка",
      "icon": "💻",
      "subcategories": [
        { "_id": "507f...", "name": "Frontend", "icon": "⚛️" },
        { "_id": "507f...", "name": "Backend", "icon": "🔧" }
      ]
    }
  ]
}


PUT /api/users/me
─────────────────
Request:
{
  "categories": ["id1", "id2"],
  "city": "id"
}

Response 200:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Иван",
    "categories": [
      { "_id": "id1", "name": "Frontend", "icon": "⚛️" },
      { "_id": "id2", "name": "Backend", "icon": "🔧" }
    ],
    "city": {
      "_id": "id",
      "name": "Алматы",
      "region": "Алматы"
    }
  }
}


GET /api/applications?city=id&categories=id1,id2
────────────────────────────────────────────────
Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Разработка сайта",
      "summ": 50000,
      "city": {
        "_id": "...",
        "name": "Алматы",
        "region": "Алматы"
      },
      "category": {
        "_id": "...",
        "name": "Frontend",
        "icon": "⚛️"
      },
      "user": {
        "_id": "...",
        "name": "Иван",
        "surname": "Петров"
      },
      "status": "new",
      "createdAt": "..."
    }
  ]
}
```

---

## Database Schema

```
cities (Collection)
═══════════════════
index: { name: "text", region: "text" }

{
  _id: ObjectId,
  name: String (unique),
  region: String,
  country: String = "Kazakhstan",
  active: Boolean = true,
  createdAt: Date,
  updatedAt: Date
}


categories (Collection)
═══════════════════════
index: { name: "text" }

{
  _id: ObjectId,
  name: String,
  parentId: ObjectId | null,  // null = родительская
  icon: String,               // emoji
  description: String,
  active: Boolean = true,
  createdAt: Date,
  updatedAt: Date
}

Иерархия:
┌─ Веб-разработка (parentId: null)
│  ├─ Frontend (parentId: "Веб-разработка._id")
│  ├─ Backend (parentId: "Веб-разработка._id")
│  └─ Full Stack (parentId: "Веб-разработка._id")
│
├─ Дизайн (parentId: null)
│  ├─ UI/UX Design (parentId: "Дизайн._id")
│  └─ Графический дизайн (parentId: "Дизайн._id")
│
... и т.д.


users (Collection - обновлена)
═════════════════════════════════
{
  _id: ObjectId,
  phone: String (unique),
  passwordHash: String,
  name: String,
  surname: String,
  role: String enum('user', 'specialist', 'admin'),
  avatarUrl: String,
  
  city: ObjectId → cities,          ← НОВОЕ
  categories: [ObjectId] → categories, ← НОВОЕ
  
  isAvailable: Boolean = true,
  createdAt: Date,
  updatedAt: Date
}


applications (Collection - обновляется)
═════════════════════════════════════════
{
  _id: ObjectId,
  user: ObjectId → users,
  title: String,
  summ: Number,
  info: String,
  
  city: ObjectId → cities (REQUIRED),      ← НОВОЕ
  category: ObjectId → categories (REQUIRED), ← НОВОЕ
  
  status: String enum('new', 'in_progress', 'completed'),
  currentSpecialist: ObjectId → users | null,
  active: Boolean = true,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## Security & Validation

```
Input Validation (Joi)
══════════════════════

POST /auth/register:
- phone: required, string
- password: required, min 6 chars
- name: string, optional
- role: enum('user', 'specialist'), optional
- categories: array of valid ObjectIds (24-char hex), optional
- city: valid ObjectId, optional

PUT /api/users/me:
- categories: array of valid ObjectIds, optional
- city: valid ObjectId, optional

POST /api/applications:
- title: required, string, max 100
- summ: required, number, positive
- city: required, valid ObjectId
- category: required, valid ObjectId


Authorization
══════════════
- All routes require Authorization header: "Bearer <accessToken>"
- JWT verified & user extracted
- User ID stored in req.user._id
- Role-based access (if needed)


Data Sanitization
══════════════════
- Text inputs: trim(), escape
- ObjectIds: regex validation ^[0-9a-f]{24}$
- Numbers: parseFloat(), validation
- Dates: auto via Mongoose


CORS
════
- Allow: http://localhost:3000, mobile client
- Credentials: include


Rate Limiting
═════════════
- Already implemented for /auth/login
- Could extend to other endpoints
```

