# 🎯 Быстрый старт: Развертывание на VPS за 30 минут

## 📋 Что нужно сделать

### Локально (на твоем компе)
1. Сгенерировать JWT Secret
2. Обновить фронтенд с новым API адресом

### На VPS (194.32.142.33)
1. Подключиться по SSH
2. Установить необходимое ПО
3. Загрузить код приложения
4. Создать MongoDB Atlas БД
5. Запустить приложение через PM2

---

## 🔧 ШАГ 1: Генерация JWT Secret (локально)

Открой терминал в папке `backend/` и выполни:

```bash
cd backend
node generate-secrets.js
```

Ты увидишь вывод типа:
```
JWT_SECRET:
a3f8e9c2b1d7f4e6a9c2b1d7f4e6a9c2b1d7f4e6a9c2b1d7f4e6a9c2b1d7f4

Скопируй это в твой .env файл:
...
```

**⭐ ЗАПОМНИ эту строку - она понадобится при настройке на сервере!**

---

## 📱 ШАГ 2: Обновление фронтенда

### Где находится API_URL?

Найди в коде фронтенда (поиск `API_URL` или `172.20.10.2`):

```bash
# Linux/Mac:
grep -r "API_URL\|172.20.10.2" . --include="*.js"

# Windows PowerShell:
Get-ChildItem -Recurse -Include "*.js" | Select-String -Pattern "API_URL|172.20.10.2"
```

### Замени текущий адрес

Найди строку:
```javascript
// ДО:
const API_URL = 'http://172.20.10.2:4000';
// или
const API_URL = 'http://localhost:4000';
```

На:
```javascript
// ПОСЛЕ:
const API_URL = 'http://194.32.142.33:4000';
```

---

## 🖥️ ШАГ 3: Подключение к VPS

Открой PowerShell/Terminal и выполни:

```bash
ssh root@194.32.142.33
```

Введи пароль от VPS (который у тебя от хостера)

---

## ⚡ ШАГ 4: Установка ПО на сервере

После подключения выполни все команды по очереди:

```bash
# Обновление систему
apt update && apt upgrade -y

# Установка Node.js v18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Проверка версии (должно быть v18.x)
node --version

# Установка PM2 глобально
npm install -g pm2

# Установка Git
apt install -y git

# Активирация PM2 автозапуска при перезагрузке
pm2 startup
pm2 save
```

---

## 📂 ШАГ 5: Загрузка кода на сервер

### Вариант A: Если у тебя есть GitHub репо

```bash
# На сервере
mkdir -p /var/www/mywork-backend
cd /var/www/mywork-backend
git clone https://github.com/your-username/your-repo.git .
cd backend
```

### Вариант B: Если нет репо (загрузка файлов)

**На локальной машине** (в PowerShell/Terminal):
```bash
# Перейди в папку где находится backend
cd path/to/backend

# Загрузи на сервер
scp -r . root@194.32.142.33:/var/www/mywork-backend/
```

**На сервере:**
```bash
cd /var/www/mywork-backend
```

---

## 📥 ШАГ 6: Установка зависимостей

На сервере в папке `/var/www/mywork-backend/`:

```bash
npm install --production
```

---

## 🗄️ ШАГ 7: Создание MongoDB Atlas БД

1. Перейди на https://www.mongodb.com/cloud/atlas
2. Зарегистрируйся (если еще нет)
3. Создай новый проект (можно назвать "mywork")
4. Создай кластер (выбери тариф M0 - он бесплатный)
5. Нажми "Create Cluster" и подожди ~3 минуты
6. Нажми на созданный кластер → "Connect" → "Drivers" (Node.js)
7. Скопируй Connection String (похожа на):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mywork?retryWrites=true&w=majority
   ```

**ВАЖНО:**
- Перед созданием кластера добавь IP адрес сервера в "IP Access List":
  - Network Access → IP Whitelist
  - Add IP Address
  - 194.32.142.33

---

## ⚙️ ШАГ 8: Создание .env файла на сервере

На сервере:

```bash
cd /var/www/mywork-backend
nano .env
```

**Вставь следующее (замени на реальные значения):**

```
PORT=4000
NODE_ENV=production
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/mywork?retryWrites=true&w=majority
JWT_SECRET=<вставь значение из шага 1>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

**Как сохранить в nano:**
1. Ctrl+O (буква O, не ноль)
2. Enter
3. Ctrl+X

---

## 🚀 ШАГ 9: Запуск приложения через PM2

На сервере:

```bash
cd /var/www/mywork-backend

# Запустить приложение
pm2 start ecosystem.config.js

# Проверить что запустилось
pm2 status

# Посмотреть логи
pm2 logs mywork-api
```

Если в логах видишь ошибки - покажи их мне!

---

## ✅ ШАГ 10: Проверка работы

На сервере:

```bash
curl http://localhost:4000/api/health
```

Должно вернуть:
```json
{"status":"ok"}
```

Если видишь эту ошибку:
```
curl: (7) Failed to connect to port 4000: Connection refused
```

Это значит приложение не запустилось. Проверь логи:
```bash
pm2 logs mywork-api
```

---

## 📱 ШАГ 11: Проверка с фронтенда

Если все прошло успешно на VPS, теперь:

1. Убедись что обновил API_URL на 194.32.142.33 (ШАГ 2)
2. Перезагрузи Expo:
   - Нажми **r** в терминале где запущен Expo
3. Откройся приложение в Expo Go
4. Протестируй авторизацию и загрузку данных

---

## 🎯 Команды PM2 (полезно знать)

```bash
# Статус всех процессов
pm2 status

# Логи приложения
pm2 logs mywork-api

# Перезагрузить приложение
pm2 restart mywork-api

# Остановить приложение
pm2 stop mywork-api

# Удалить приложение
pm2 delete mywork-api

# Монитор использования ресурсов
pm2 monit
```

---

## 🆘 Если что-то не работает

### Приложение не запускается
```bash
pm2 logs mywork-api
# Посмотри ошибку и расскажи мне
```

### MongoDB не подключается
Проверь:
1. Строка MONGO_URI в .env правильная
2. IP адрес 194.32.142.33 добавлен в MongoDB Atlas IP Whitelist
3. Пароль БД правильный

### Фронтенд не подключается к API
```bash
# На локальной машине:
curl http://194.32.142.33:4000/api/health
# Если ошибка - проверь что приложение запущено на VPS
```

---

## 📝 Итоговый чек-лист

- [ ] Сгенерировал JWT Secret (локально)
- [ ] Обновил API_URL фронтенда на 194.32.142.33
- [ ] Подключился к VPS по SSH
- [ ] Установил Node.js и PM2
- [ ] Загрузил код на сервер
- [ ] Установил зависимости (npm install)
- [ ] Создал MongoDB Atlas БД и добавил IP адрес
- [ ] Создал .env файл с конфигом
- [ ] Запустил приложение через PM2 (pm2 start ecosystem.config.js)
- [ ] Проверил статус (pm2 status)
- [ ] Проверил логи (pm2 logs mywork-api)
- [ ] Проверил API с curl http://localhost:4000/api/health
- [ ] Обновил фронтенд и перезагрузил Expo
- [ ] Протестировал авторизацию в приложении

---

## 🎉 Готово!

Если всё прошло успешно, твой бэкенд теперь работает на VPS!

**Адрес API:** `http://194.32.142.33:4000`

Если будет домен - потом настроим SSL и Nginx для работы через HTTPS.

Удачи! 🚀
