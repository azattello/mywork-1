// Для разработки используйте IP вашего компьютера в локальной сети
// чтобы мобильное приложение могло подключиться к API.
// На телефоне должен быть тот же Wi‑Fi, что и на компьютере.
// export const API_URL = process.env.API_URL || 'http://172.20.10.2:4000';
// export const API_URL = process.env.API_URL || 'https://mywork.kz:4000';

// Для тестирования на эмуляторе Android:
// export const API_URL = 'http://10.0.2.2:4000';

// Для реального устройства:
// замените IP на IP-адрес вашего компьютера в локальной сети

// Для продакшена (разработка - прямое подключение):
// export const API_URL = 'http://mywork.kz:4000';

// Для production с HTTPS (когда Nginx настроен):
export const API_URL = 'https://mywork.kz';