export default () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_serviceops_minimum_32_characters_long',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_serviceops_minimum_32_characters_long',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cookieSecret: process.env.COOKIE_SECRET || 'dev_cookie_signing_secret_serviceops_2026',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.serviceops.local',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || 'no-reply@serviceops.local',
    pass: process.env.SMTP_PASS || 'secret',
    from: process.env.SMTP_FROM || 'ServiceOps IT Support Desk <no-reply@serviceops.local>',
  },
});
