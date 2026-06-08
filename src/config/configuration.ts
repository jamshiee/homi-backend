export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10) || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    name: process.env.DB_NAME,
    ssl: process.env.SSL_ALLOWED === 'true',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d',
  },
  admin: {
    numbers: (process.env.ADMIN_NUMBERS || '')
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean),
  },
  otp: {
    terminalTest: process.env.TERMINAL_TEST === 'true',
    expirySeconds: parseInt(process.env.OTP_EXPIRY_SECONDS ?? '600', 10) || 600,
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? '3', 10) || 3,
  },
  whatsapp: {
    providerUrl: process.env.WHATSAPP_PROVIDER_URL,
    apiKey: process.env.WHATSAPP_API_KEY,
    templateName: process.env.WHATSAPP_TEMPLATE_NAME,
  },
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY,
    templateId: process.env.MSG91_TEMPLATE_ID,
    senderId: process.env.MSG91_SENDER_ID,
  },
  storage: {
    baseUrl: process.env.STORAGE_BASE_URL || 'http://localhost:3000/uploads',
    maxFileSizeBytes:
      parseInt(process.env.MAX_FILE_SIZE_BYTES ?? '10485760', 10) || 10485760,
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'gemini',
    geminiApiKey: process.env.GEMINI_API_KEY,
  },
});
