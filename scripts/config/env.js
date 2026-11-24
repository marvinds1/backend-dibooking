const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const required = ['MONGODB_URI', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'];

function loadConfig() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
  return {
    mongoUri: process.env.MONGODB_URI,
    accessSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    accessTtl: process.env.ACCESS_TOKEN_TTL || '1h',
    refreshTtl: process.env.REFRESH_TOKEN_TTL || '7d',
    corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000')
      .split(',').map((o) => o.trim()).filter(Boolean),
    cronSecret: process.env.CRON_SECRET || '',
    slotUtcOffsetMinutes: Number(process.env.SLOT_UTC_OFFSET_MINUTES || 420),
    trustProxy: process.env.TRUST_PROXY !== undefined
      ? Number(process.env.TRUST_PROXY)
      : Number(Boolean(process.env.VERCEL)),
    isProduction: process.env.NODE_ENV === 'production',
    port: Number(process.env.PORT || 8000),
  };
}

module.exports = loadConfig();
