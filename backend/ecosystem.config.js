module.exports = {
  apps: [
    {
      name: 'mywork-api',
      script: './src/index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
      // Автоматический перезапуск если процесс упадет
      autorestart: true,
      // Максимальное время на перезагрузку (ms)
      max_restarts: 10,
      // Минимальное время между перезагрузками (ms)
      min_uptime: '10s',
      // Задержка перед перезагрузкой (ms)
      restart_delay: 4000,
      // Максимум памяти перед перезагрузкой
      max_memory_restart: '500M',
      // Логирование
      merge_logs: true,
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'uploads'],
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
