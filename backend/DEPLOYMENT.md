# Развертывание на VPS 194.32.142.33

## Шаг 1: Подготовка VPS сервера

### Подключитесь к серверу:
```bash
ssh root@194.32.142.33
# или с ключом SSH
ssh -i your_key.pem root@194.32.142.33
```

### Обновите систему:
```bash
apt update && apt upgrade -y
```

## Шаг 2: Установка Node.js и PM2

### Установка Node.js (v18 или выше):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
node --version
npm --version
```

### Установка PM2 глобально:
```bash
npm install -g pm2
pm2 --version
```

### Включение PM2 автозапуска:
```bash
pm2 startup
pm2 save
```

## Шаг 3: Установка Git и клонирование проекта

```bash
apt install -y git

# Создаем директорию для приложения
mkdir -p /var/www/mywork-backend
cd /var/www/mywork-backend

# Клонируем репозиторий (если есть на GitHub/GitLab)
git clone <your_repo_url> .

# Или загружаем файлы через SCP:
# scp -r backend/ root@194.32.142.33:/var/www/mywork-backend/
```

## Шаг 4: Установка зависимостей

```bash
cd /var/www/mywork-backend
npm install --production
```

## Шаг 5: Создание MongoDB Atlas БД

1. Перейди на https://www.mongodb.com/cloud/atlas
2. Зарегистрируйся или войди
3. Создай новый проект и кластер
4. Добавь свой IP адрес (194.32.142.33) в IP Whitelist
5. Создай пользователя БД (логин и пароль)
6. Скопируй строку подключения (Connection String)
   - Должна выглядеть как: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/yoyo?retryWrites=true&w=majority`

## Шаг 6: Настройка .env на сервере

```bash
cd /var/www/mywork-backend
nano .env
```

Добавь следующее (замени на реальные значения):
```
PORT=4000
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/yoyo?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_min_32_chars_random_string_12345678
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
NODE_ENV=production
```

Сохрани: Ctrl+O, Enter, Ctrl+X

## Шаг 7: Запуск приложения через PM2

```bash
cd /var/www/mywork-backend

# Запустить приложение
pm2 start src/index.js --name "mywork-api"

# Проверить статус
pm2 status

# Просмотреть логи
pm2 logs mywork-api

# Сохранить конфиг PM2
pm2 save
```

## Шаг 8: Настройка Nginx как Reverse Proxy (опционально)

Если хочешь использовать доменное имя и SSL:

```bash
apt install -y nginx
```

Создай конфиг:
```bash
nano /etc/nginx/sites-available/mywork
```

Добавь:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируй:
```bash
ln -s /etc/nginx/sites-available/mywork /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## Шаг 9: SSL сертификат Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Шаг 10: Проверка работы

```bash
# Проверить статус приложения
pm2 status

# Проверить логи
pm2 logs mywork-api

# Проверить через curl
curl http://localhost:4000/api/health

# Если есть Nginx
curl https://your-domain.com/api/health
```

## Полезные команды PM2

```bash
pm2 start src/index.js --name "mywork-api"      # Запуск
pm2 stop mywork-api                               # Остановка
pm2 restart mywork-api                            # Перезагрузка
pm2 delete mywork-api                             # Удаление
pm2 logs mywork-api                               # Логи
pm2 logs mywork-api --lines 100                   # Последние 100 строк
pm2 monit                                         # Мониторинг
pm2 info mywork-api                               # Информация о процессе
```

## Обновление приложения

```bash
cd /var/www/mywork-backend
git pull origin main    # если используешь Git
npm install             # если добавлены новые зависимости
pm2 restart mywork-api
```

## Бэкап БД

MongoDB Atlas сам делает резервные копии, но можно вручную:

```bash
# Экспорт данных
mongodump --uri "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/yoyo" --out /var/backups/yoyo

# Импорт данных
mongorestore --uri "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/yoyo" /var/backups/yoyo
```
