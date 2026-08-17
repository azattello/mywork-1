#!/bin/bash

# Скрипт быстрого развертывания на VPS
# Использование: ./deploy.sh

set -e

echo "📦 Развертывание MyWork Backend..."

# Переменные
SERVER_IP="194.32.142.33"
APP_PATH="/var/www/mywork-backend"
APP_NAME="mywork-api"

echo "🔗 Подключение к серверу $SERVER_IP..."

# Функция для выполнения команд на сервере
run_on_server() {
    ssh root@$SERVER_IP "$@"
}

# Загрузка файлов (если используешь не Git)
echo "📤 Загрузка файлов..."
scp -r backend/* root@$SERVER_IP:$APP_PATH/ 2>/dev/null || true

# Установка зависимостей
echo "📥 Установка зависимостей..."
run_on_server "cd $APP_PATH && npm install --production"

# Проверка и перезагрузка приложения
echo "🔄 Перезагрузка приложения..."
run_on_server "cd $APP_PATH && pm2 restart $APP_NAME || pm2 start ecosystem.config.js"

# Сохранение конфига PM2
echo "💾 Сохранение конфига PM2..."
run_on_server "pm2 save"

# Проверка статуса
echo "✅ Проверка статуса..."
run_on_server "pm2 status"

echo "🎉 Развертывание завершено!"
echo "📝 Логи: ssh root@$SERVER_IP 'pm2 logs mywork-api'"
