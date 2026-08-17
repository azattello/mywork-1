# 🔧 КОНФИГУРАЦИЯ ДЛЯ PRODUCTION

## 📋 ПОЛНЫЙ СПИСОК ПЕРЕМЕННЫХ ДЛЯ ИЗМЕНЕНИЯ

---

## 🖥️ BACKEND КОНФИГУРАЦИЯ

### Файл: `backend/.env`

**Текущие значения (для разработки):**
```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/mywork
JWT_SECRET=change_this_to_a_secure_random_string
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

**Для PRODUCTION нужно изменить:**

#### 1️⃣ PORT
```
ТЕКУЩЕЕ:  PORT=4000
ИЗМЕНИТЕ НА:  PORT=5000  (или любой другой свободный порт)
```

#### 2️⃣ MONGO_URI (СРОЧНО!)
```
ТЕКУЩЕЕ:
MONGO_URI=mongodb://127.0.0.1:27017/mywork

ИЗМЕНИТЕ НА (MongoDB Atlas облако):
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/mywork?retryWrites=true&w=majority

ИЛИ (Self-hosted MongoDB):
MONGO_URI=mongodb://<username>:<password>@<host>:<port>/mywork
```

**Как получить MONGO_URI:**
- Создайте аккаунт на https://www.mongodb.com/cloud/atlas
- Создайте cluster
- Скопируйте connection string
- Замените `<username>`, `<password>`, `<cluster>` на реальные значения

#### 3️⃣ JWT_SECRET (СРОЧНО!)
```
ТЕКУЩЕЕ:  JWT_SECRET=change_this_to_a_secure_random_string

ИЗМЕНИТЕ НА: JWT_SECRET=<сгенерировать_сложную_строку>

Как сгенерировать безопасный ключ:
- Linux/Mac: openssl rand -base64 32
- Windows PowerShell: [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
- Или используйте: https://generate-random.org/

Пример результата:
JWT_SECRET=a7F3mK9zL2qW5xC8vN1bP6jH4dE7rT0sQ9uY2aZ5bX8
```

#### 4️⃣ JWT_EXPIRES_IN
```
ТЕКУЩЕЕ:  JWT_EXPIRES_IN=15m
РЕКОМЕНДУЕМОЕ:  JWT_EXPIRES_IN=7d (или 24h)
```

#### 5️⃣ REFRESH_TOKEN_EXPIRES_IN
```
ТЕКУЩЕЕ:  REFRESH_TOKEN_EXPIRES_IN=7d
РЕКОМЕНДУЕМОЕ:  REFRESH_TOKEN_EXPIRES_IN=30d
```

**Финальный .env для production:**
```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mywork?retryWrites=true&w=majority
JWT_SECRET=a7F3mK9zL2qW5xC8vN1bP6jH4dE7rT0sQ9uY2aZ5bX8
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
```

---

### Файл: `backend/src/index.js` (Socket.IO CORS)

**СТРОКА 20:**
```javascript
const io = new Server(server, { cors: { origin: '*' } });
```

**ИЗМЕНИТЕ НА:**
```javascript
const io = new Server(server, {
  cors: {
    origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
    credentials: true
  }
});
```

---

### Файл: `backend/src/app.js` (Express CORS)

**СТРОКА 12:**
```javascript
app.use(cors());
```

**ИЗМЕНИТЕ НА:**
```javascript
app.use(cors({
  origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### Файл: `backend/src/app.js` (morgan logging)

**СТРОКА 11:**
```javascript
app.use(morgan('dev'));
```

**ИЗМЕНИТЕ НА (для production):**
```javascript
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));
```

---

## 📱 FRONTEND КОНФИГУРАЦИЯ

### Файл: `config.js` (ГЛАВНОЕ ИЗМЕНЕНИЕ!)

**ТЕКУЩЕЕ (строка 5):**
```javascript
export const API_URL = process.env.API_URL || 'http://192.168.0.102:4000';
```

**ИЗМЕНИТЕ НА:**
```javascript
export const API_URL = process.env.API_URL || 'https://api.yourdomain.com';
```

**Примеры для разных сценариев:**

**Локальная разработка:**
```javascript
export const API_URL = process.env.API_URL || 'http://192.168.0.102:4000';
```

**Эмулятор Android:**
```javascript
export const API_URL = process.env.API_URL || 'http://10.0.2.2:4000';
```

**Тестирование на реальном устройстве:**
```javascript
export const API_URL = process.env.API_URL || 'http://192.168.1.100:4000';
```

**Production (облако):**
```javascript
export const API_URL = process.env.API_URL || 'https://api.mywork.kz';
```

---

### Файл: `app.json` (Expo конфиг - опционально)

**НАЙДИТЕ И ИЗМЕНИТЕ:**
```json
{
  "expo": {
    "name": "MyWork",
    "slug": "mywork",
    "version": "1.0.0",
    "scheme": "mywork",
    "icon": "./assets/icon.png",
    "backgroundColor": "#ffffff"
  }
}
```

---

## 🌐 PRODUCTION DEPLOYMENT ПЕРЕМЕННЫЕ

### Если используете Heroku

**Файл: `Procfile` (создать если нет):**
```
web: cd backend && npm start
```

**Heroku переменные окружения:**
```bash
heroku config:set PORT=5000
heroku config:set MONGO_URI=mongodb+srv://...
heroku config:set JWT_SECRET=...
heroku config:set NODE_ENV=production
```

### Если используете AWS / Google Cloud / Azure

**Переменные окружения в контейнере:**
```bash
export PORT=5000
export MONGO_URI=mongodb+srv://...
export JWT_SECRET=...
export NODE_ENV=production
```

---

## 🚀 QUICK START ДЛЯ PRODUCTION

### Шаг 1: Подготовьте backend .env
```bash
cd backend
# Отредактируйте .env файл
nano .env  # или используйте VS Code
```

### Шаг 2: Установите зависимости
```bash
npm install
```

### Шаг 3: Стартуйте backend
```bash
npm start  # или npm run dev для разработки
```

### Шаг 4: Измените frontend config.js
```bash
cd ..
# Отредактируйте config.js
nano config.js  # или используйте VS Code
# Измените API_URL на ваш production сервер
```

### Шаг 5: Соберите и экспортируйте приложение
```bash
# Для Android
eas build --platform android

# Для iOS
eas build --platform ios

# Для web
npm run build
```

---

## ✅ ПОЛНЫЙ ЧЕКЛИСТ CONFIGURATION

### Backend
- [ ] Создан MongoDB cluster на Atlas
- [ ] Скопирован connection string в `MONGO_URI`
- [ ] Сгенерирован безопасный `JWT_SECRET`
- [ ] Установлен `PORT` (не 4000)
- [ ] Обновлен CORS в `index.js` с вашим доменом
- [ ] Обновлен CORS в `app.js` с вашим доменом
- [ ] Установлен `NODE_ENV=production`
- [ ] Проверены права доступа к `/uploads` папке

### Frontend
- [ ] Измен `config.js` - `API_URL` указывает на production
- [ ] Проверен `app.json` - правильное имя приложения
- [ ] Удалены все console.log из production сборки (опционально)
- [ ] Обновлены все deep links если используются
- [ ] Проверена версия `app.json` (version number)

### Server/Hosting
- [ ] Выбран хостинг (Heroku, AWS, Google Cloud, Azure, Digital Ocean)
- [ ] Настроены SSL/TLS сертификаты
- [ ] Открыты нужные порты в firewall
- [ ] Настроена резервная копия MongoDB
- [ ] Настроен мониторинг ошибок (опционально Sentry)
- [ ] Настроен логирование
- [ ] Проверены логи при запуске

---

## 🧪 ТЕСТИРОВАНИЕ PRODUCTION КОНФИГА

### Локально перед загрузкой в облако

```bash
# 1. Убедитесь что backend запускается
cd backend
npm install
npm start
# Должно вывести: Server running on port 5000

# 2. Проверьте подключение к MongoDB
# Откройте MongoDB Compass и попробуйте подключиться с вашим MONGO_URI

# 3. Проверьте что API работает
curl -X GET http://localhost:5000/api/cities
# Должно вернуть список городов в JSON

# 4. Проверьте что Auth работает
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
# Должен вернуть успешный ответ с токеном
```

---

## 🔐 SECURITY RECOMMENDATIONS

### На production ОБЯЗАТЕЛЬНО:

1. **Используйте HTTPS** (не HTTP)
   - Получите SSL сертификат (Let's Encrypt бесплатный)
   - Редиректьте HTTP → HTTPS

2. **Защитите JWT_SECRET**
   - Никогда не коммитьте в GitHub
   - Используйте environment variables
   - Регулярно ротируйте

3. **Ограничьте CORS**
   - Не используйте `origin: '*'` на production
   - Укажите точные домены

4. **Включите rate limiting**
   - Установите express-rate-limit
   - Ограничьте 100 requests в 15 minutes на auth endpoints

5. **Используйте helmet.js**
   ```bash
   npm install helmet
   ```
   ```javascript
   const helmet = require('helmet');
   app.use(helmet());
   ```

6. **Логируйте все попытки входа**
   - Отслеживайте неудачные попытки
   - Блокируйте после N попыток

---

## 📞 TROUBLESHOOTING

### "Cannot connect to MongoDB"
```
✓ Проверьте MONGO_URI в .env
✓ Убедитесь что IP адрес в whitelist в Atlas
✓ Проверьте username и password
```

### "CORS Error"
```
✓ Обновите origin в cors конфиге
✓ Убедитесь что вы используете HTTPS (не HTTP)
✓ Проверьте что API_URL в config.js совпадает с CORS origin
```

### "JWT Token Invalid"
```
✓ Проверьте JWT_SECRET совпадает
✓ Проверьте что токен не истек (проверьте JWT_EXPIRES_IN)
✓ Убедитесь что token сохранен в AsyncStorage
```

### "Connection Refused"
```
✓ Убедитесь что backend запущен
✓ Проверьте правильный PORT
✓ Убедитесь что firewall не блокирует порт
```

---

## 📊 SUMMARY - ЧТО МЕНЯТЬ

| Компонент | Файл | Текущее | Production | Приоритет |
|-----------|------|---------|-----------|-----------|
| API URL | `config.js` | `192.168.0.102:4000` | `api.yourdomain.com` | 🔴 СРОЧНО |
| MongoDB | `backend/.env` | `localhost:27017` | `mongodb+srv://...` | 🔴 СРОЧНО |
| JWT Secret | `backend/.env` | `change_this_...` | `<random_secure>` | 🔴 СРОЧНО |
| CORS Origin | `backend/src/index.js` | `*` | `['yourdomain.com']` | 🟡 Важно |
| CORS Origin | `backend/src/app.js` | `*` | `['yourdomain.com']` | 🟡 Важно |
| PORT | `backend/.env` | `4000` | `5000` | 🟡 Важно |
| Morgan log | `backend/src/app.js` | `dev` | `combined` | 🟢 Опционально |

---

**После всех изменений готово к запуску на production!** 🚀

