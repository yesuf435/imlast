module.exports = {
  apps: [{
    name: 'im-backend',
    script: 'app_production.js',
    instances: 'max', // 使用所有CPU核心
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001,
      MONGO_URL: 'mongodb://localhost:27017',
      DB_NAME: 'im_production',
      JWT_SECRET: 'your_super_secure_jwt_secret_key_2024',
      JWT_EXPIRES_IN: '7d',
      FRONTEND_URL: 'http://localhost:3000'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      MONGO_URL: 'mongodb://localhost:27017',
      DB_NAME: 'im_production',
      JWT_SECRET: process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key_2024',
      JWT_EXPIRES_IN: '7d',
      FRONTEND_URL: 'http://8.148.77.51'
    },
    // 日志配置
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 自动重启配置
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    max_memory_restart: '1G',
    
    // 错误处理
    min_uptime: '10s',
    max_restarts: 10,
    
    // 集群配置
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // 健康检查
    health_check_grace_period: 3000,
    
    // 环境变量
    env_file: '.env'
  }]
};
