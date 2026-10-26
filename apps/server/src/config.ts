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
  // In development, also accept tokens minted for Expo Go (host.exp.Exponent) so Sign in with Apple works there.
  appleAudiences: env.APPLE_AUDIENCES ? list(env.APPLE_AUDIENCES) : isProd ? [] : ['fi.cliq.app', 'host.exp.Exponent'],
  googleAudiences: list(env.GOOGLE_AUDIENCES),
  smtpUrl: env.SMTP_URL || undefined,
  mailFrom: env.MAIL_FROM ?? 'Cliq <hello@cliq.fi>',
  // Set when the API sits behind exactly one reverse proxy (Render, Fly, Railway) that appends the client IP
  // to X-Forwarded-For. Otherwise the header is ignored, since any client can send it.
  trustProxy: env.TRUST_PROXY === '1',
  // GIF search in chat. Free key from developers.giphy.com; the GIF button stays hidden without one.
  giphyApiKey: env.GIPHY_API_KEY || undefined,
  isProd,
};
