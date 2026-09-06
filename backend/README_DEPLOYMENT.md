# 🚀 Развертывание MyWork Backend на VPS

## 📚 Файлы подготовки к развертыванию

Я создал несколько файлов для облегчения процесса развертывания:

### 1. **DEPLOYMENT.md** - Полное руководство по развертыванию
Содержит пошаговые инструкции:
- Подключение к VPS
- Установка Node.js, PM2, Git
- Создание MongoDB Atlas БД
- Настройка переменных окружения
- Запуск приложения через PM2
- Конфигурация Nginx (опционально)
- Установка SSL сертификата

### 2. **CHECKLIST.md** - Чек-лист развертывания
Использует перед развертыванием:
- Проверка локального запуска
- Подготовка VPS
- Загрузка кода
- Настройка БД
- Финальная проверка
- Решение проблем

### 3. **.env.production.example** - Шаблон для production переменных
Копируй в `.env` на сервере и заполни значениями:
```
PORT=4000
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
```

### 4. **ecosystem.config.js** - PM2 конфигурация
Используется для управления процессом:
```bash
pm2 start ecosystem.config.js
```

### 5. **generate-secrets.js** - Генератор безопасных ключей
Используется для создания JWT Secret:
```bash
node generate-secrets.js
```

### 6. **deploy.sh** - Скрипт быстрого развертывания (опционально)
Автоматизирует загрузку и перезагрузку приложения.

---

## ⚡ Быстрое начало (TL;DR)

### Шаг 1: Подключиться к серверу
```bash
ssh root@194.32.142.33
```

### Шаг 2: Установить зависимости
```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs git
npm install -g pm2
pm2 startup && pm2 save
```

### Шаг 3: Загрузить код
```bash
mkdir -p /var/www/mywork-backend
cd /var/www/mywork-backend
# Вариант 1: git clone (если есть репо)
git clone <your-repo-url> .
# Вариант 2: scp с локальной машины
# scp -r backend/* root@194.32.142.33:/var/www/mywork-backend/
```

### Шаг 4: Установить зависимости
```bash
cd /var/www/mywork-backend
npm install --production
```

### Шаг 5: Создать MongoDB Atlas БД
https://www.mongodb.com/cloud/atlas - создай кластер, добавь IP 194.32.142.33, получи CONNECTION STRING

### Шаг 6: Настроить .env
```bash
nano .env
```
Вставь:
```
PORT=4000
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mywork?retryWrites=true&w=majority
JWT_SECRET=<output из node generate-secrets.js>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

### Шаг 7: Запустить приложение
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 logs mywork-api
```

### Шаг 8: Обновить фронтенд
В фронтенд коде измени API endpoint на:
```javascript
export const API_URL = 'http://194.32.142.33:4000';
// или
export const API_URL = 'https://your-domain.com'; // если есть Nginx + домен
```

---

## 🔄 Обновление приложения

```bash
cd /var/www/mywork-backend
git pull origin main  # если используешь Git
npm install           # если добавлены новые зависимости
pm2 restart mywork-api
```

---

## 📊 Мониторинг

```bash
# Смотреть статус
pm2 status

# Смотреть логи в реальном времени
pm2 logs mywork-api

# Мониторинг ресурсов
pm2 monit
```

---

## 🆘 Поддержка SSL/Домена (опционально)

Если хочешь привязать доменное имя и SSL:

1. Купи домен (если еще нет)
2. Установи Nginx:
   ```bash
   apt install -y nginx certbot python3-certbot-nginx
   ```
3. Следуй инструкциям в DEPLOYMENT.md (Шаг 8-9)

---

## 📝 Проверка работы

```bash
# Локальная проверка (с VPS)
curl http://localhost:4000/api/health

# Внешняя проверка
curl http://194.32.142.33:4000/api/health

# Если есть Nginx + домен
curl https://your-domain.com/api/health
```

---

## 🎯 Итог файлов для development

```
backend/
├── src/              # Исходный код приложения
├── package.json      # Зависимости Node.js
├── ecosystem.config.js     # ⭐ PM2 конфиг (новый)
├── .env.example      # Пример переменных (старый)
├── .env.production.example # ⭐ Production переменные (новый)
├── DEPLOYMENT.md     # ⭐ Полное руководство (новый)
├── CHECKLIST.md      # ⭐ Чек-лист (новый)
├── generate-secrets.js     # ⭐ Генератор ключей (новый)
└── deploy.sh         # ⭐ Скрипт развертывания (новый)
```

---

## ✅ Краткое резюме

**Создал 6 новых файлов для развертывания:**
1. `DEPLOYMENT.md` - полное руководство
2. `CHECKLIST.md` - пошаговый чек-лист
3. `.env.production.example` - шаблон переменных
4. `ecosystem.config.js` - PM2 конфиг
5. `generate-secrets.js` - генератор ключей
6. `deploy.sh` - автоматический скрипт

**Процесс простой:**
1. Подключиться к VPS через SSH
2. Установить Node.js, PM2, Git
3. Загрузить код
4. Создать MongoDB Atlas БД
5. Настроить .env
6. Запустить через PM2
7. Обновить фронтенд с новым API адресом

**Сервер готов:** 194.32.142.33:4000 ✅

Начни с файла `CHECKLIST.md` - там пошагово всё расписано!
