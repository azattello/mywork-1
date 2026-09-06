# mywork Backend (Express + MongoDB)

Минимальный scaffold серверной части для мобильного приложения mywork.

Файлы и инструкции здесь просты — после создания вы можете установить зависимости и запустить сервер.

Основные команды (в PowerShell):

```powershell
cd backend
npm install
npm run dev
```

Переменные окружения см. файл `.env.example`.

Что реализовано в этом scaffold:
- Express приложение
- Подключение к MongoDB (mongoose)
- Модели: User, Conversation, Message
- Роуты: /api/auth (register, login, refresh, logout), /api/conversations, /api/messages
- JWT авторизация (access + refresh token поддержка)
 - Refresh tokens сохраняются в БД (модель `RefreshToken`) — это позволяет инвалидацию при logout.
 - Socket.IO добавлен для realtime сообщений (сервер выступает relay — клиент может и через REST сохранять сообщения в БД).
