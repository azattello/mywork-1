# ✅ Чек-лист развертывания MyWork Backend на VPS

## 📋 Пред-развертывание (локально)

- [ ] Убедись что backend работает локально: `npm run dev`
- [ ] Проверь все API endpoints через Postman или cURL
- [ ] Проверь что структура проекта правильная (src/index.js есть)
- [ ] Сгенерируй JWT Secret: `node generate-secrets.js`
- [ ] Приготовь пароли для MongoDB Atlas

## 🚀 Подготовка VPS (194.32.142.33)

### Подключение к серверу
```bash
ssh root@194.32.142.33
# Логин: root
# Пароль: [введи пароль от VPS]
```

- [ ] Обнови систему: `apt update && apt upgrade -y`
- [ ] Установи Node.js: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && apt install -y nodejs`
- [ ] Установи PM2: `npm install -g pm2`
- [ ] Установи Git: `apt install -y git`
- [ ] Активируй PM2 автозапуск: `pm2 startup && pm2 save`

## 📦 Развертывание кода

- [ ] Создай директорию: `mkdir -p /var/www/mywork-backend`
- [ ] Загрузи файлы:
  ```bash
  # Вариант 1: Если есть Git репозиторий
  cd /var/www/mywork-backend && git clone <repo-url> .
  
  # Вариант 2: Если загружаешь файлы локально
  # На локальной машине:
  scp -r backend/ root@194.32.142.33:/var/www/mywork-backend/
  ```
- [ ] Установи зависимости: `cd /var/www/mywork-backend && npm install --production`

## 🗄️ MongoDB Atlas (Cloud DB)

- [ ] Зарегистрируйся на https://www.mongodb.com/cloud/atlas
- [ ] Создай новый проект и кластер (F0 - бесплатный)
- [ ] Добавь IP адрес 194.32.142.33 в IP Whitelist
- [ ] Создай пользователя БД (запомни логин и пароль)
- [ ] Получи Connection String
- [ ] Скопируй строку подключения (MONGO_URI)

## ⚙️ Конфигурация на сервере

На сервере в `/var/www/mywork-backend/.env`:

```bash
nano /var/www/mywork-backend/.env
```

Добавь:
```
PORT=4000
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mywork?retryWrites=true&w=majority
JWT_SECRET=<вставь сгенерированный ключ>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

- [ ] Сохрани: Ctrl+O, Enter, Ctrl+X

## 🎯 Запуск приложения через PM2

На сервере:
```bash
cd /var/www/mywork-backend
pm2 start ecosystem.config.js
pm2 save
```

- [ ] Проверь статус: `pm2 status`
- [ ] Просмотри логи: `pm2 logs mywork-api`
- [ ] Проверь ответ: `curl http://localhost:4000/api/health`

## 🌐 Настройка Nginx + SSL (опционально, если есть домен)

Если хочешь использовать доменное имя:

- [ ] Установи Nginx: `apt install -y nginx`
- [ ] Установи SSL: `apt install -y certbot python3-certbot-nginx`
- [ ] Скопируй конфиг из DEPLOYMENT.md в `/etc/nginx/sites-available/mywork`
- [ ] Активируй: `ln -s /etc/nginx/sites-available/mywork /etc/nginx/sites-enabled/`
- [ ] Получи SSL сертификат: `certbot --nginx -d your-domain.com`
- [ ] Перезагрузи Nginx: `systemctl restart nginx`

## 🔐 Финальная проверка

- [ ] Приложение запущено через PM2: `pm2 status`
- [ ] Логи без ошибок: `pm2 logs mywork-api`
- [ ] API отвечает: `curl http://194.32.142.33:4000/api/health`
- [ ] Если Nginx включен: `curl https://your-domain.com/api/health`
- [ ] Фронтенд может подключиться к API

## 📱 Обновление фронтенда (React Native)

В файле `frontend/config.js` или `constants.js` измени API endpoint:

```javascript
// Было:
export const API_URL = 'http://172.20.10.2:4000';

// Стало:
export const API_URL = 'http://194.32.142.33:4000';
// или если есть домен и SSL:
export const API_URL = 'https://your-domain.com';
```

## 🛠️ Полезные команды на сервере

```bash
# Статус процесса
pm2 status

# Логи приложения
pm2 logs mywork-api

# Перезагрузка приложения
pm2 restart mywork-api

# Остановка приложения
pm2 stop mywork-api

# Удаление процесса
pm2 delete mywork-api

# Мониторинг процессов
pm2 monit

# Обновление приложения (если используешь Git)
cd /var/www/mywork-backend && git pull && npm install && pm2 restart mywork-api
```

## 🚨 Решение проблем

### Приложение не запускается
```bash
pm2 logs mywork-api  # Посмотреть ошибки в логах
```

### MongoDB не подключается
```bash
# Проверь:
# 1. MONGO_URI в .env правильный
# 2. IP адрес (194.32.142.33) добавлен в IP Whitelist на Atlas
# 3. Пароль БД правильный (без спецсимволов или правильно экранирован)
```

### Порт уже занят
```bash
# Найти процесс, занимающий порт 4000
lsof -i :4000

# Убить процесс
kill -9 <PID>
```

### Недостаточно памяти
```bash
# Проверить память
free -h

# Перезагрузить приложение с ограничением памяти
pm2 start ecosystem.config.js --max-memory-restart 500M
```

## 📊 Мониторинг в продакшене

```bash
# Установи pm2-web для веб-интерфейса (опционально)
pm2 web

# Потом доступно по адресу: http://194.32.142.33:9615
```

---

## ✨ Всё готово!

После выполнения всех пунктов чек-листа твой бэкенд будет запущен в продакшене! 🎉

Если есть проблемы:
1. Посмотри логи: `pm2 logs mywork-api`
2. Проверь переменные окружения: `cat /var/www/mywork-backend/.env`
3. Убедись что MongoDB подключена: `curl http://194.32.142.33:4000/api/health`
