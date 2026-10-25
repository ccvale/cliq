const list = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const env = process.env;
const isProd = env.NODE_ENV === 'production';

if (isProd && (!env.JWT_SECRET || env.JWT_SECRET === 'change-me' || env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be set to a random string of at least 32 characters in production');
}

export const config = {
  port: Number(env.PORT ?? 4000),
  databaseUrl: env.DATABASE_URL || undefined,
  dataDir: env.DATA_DIR ?? './data/pglite',
  jwtSecret: new TextEncoder().encode(env.JWT_SECRET || 'dev-only-secret-dev-only-secret-dev-only'),
  accessTokenTtlSeconds: 15 * 60,
  refreshTokenTtlDays: 30,
  corsOrigins: list(env.CORS_ORIGINS ?? 'http://localhost:8081,http://localhost:19006'),
  appleAudiences: list(env.APPLE_AUDIENCES),
  googleAudiences: list(env.GOOGLE_AUDIENCES),
  smtpUrl: env.SMTP_URL || undefined,
  mailFrom: env.MAIL_FROM ?? 'Cliq <hello@cliq.fi>',
  isProd,
};
