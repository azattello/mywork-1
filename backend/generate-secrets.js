#!/usr/bin/env node

/**
 * Генератор безопасных ключей для приложения
 * Использование: node generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('\n🔐 Генератор безопасных ключей\n');

// Генерируем JWT Secret
const jwtSecret = generateSecret(32);
console.log('JWT_SECRET:');
console.log(jwtSecret);

console.log('\n' + '='.repeat(70) + '\n');

//示例 .env
console.log('Скопируй это в твой .env файл:\n');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('JWT_EXPIRES_IN=15m');
console.log('REFRESH_TOKEN_EXPIRES_IN=7d');
console.log('PORT=4000');
console.log('NODE_ENV=production');
console.log('MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mywork?retryWrites=true&w=majority');

console.log('\n' + '='.repeat(70) + '\n');

console.log('✅ Ключ успешно сгенерирован!');
console.log('⚠️  Никогда не коммитьте .env файл в Git!');
console.log('💡 Добавьте .env в .gitignore\n');
