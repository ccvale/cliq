import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openDb, type Db } from '../src/db.js';
import { createApp } from '../src/app.js';
import { seed, DEMO_EMAIL, DEMO_PASSWORD } from '../src/seed.js';
import { outbox } from '../src/lib/mailer.js';

process.env.DISABLE_PUSH = '1';
process.env.RATE_LIMIT = 'off';
let db: Db;
let app: ReturnType<typeof createApp>['app'];

beforeAll(async () => {
  db = await openDb();
  app = createApp(db).app;
  await seed(db);
}, 60_000);
afterAll(() => db.close());

const call = async (method: string, path: string, body?: unknown, token?: string) => {
  const res = await app.request(path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
};

describe('auth', () => {
  it('signs up, rejects duplicates and weak passwords', async () => {
    expect((await call('POST', '/auth/signup', { email: 'new@x.com', password: 'short' })).status).toBe(400);
    const ok = await call('POST', '/auth/signup', { email: 'New@X.com', password: 'a-strong-pass-1' });
    expect(ok.status).toBe(201);
    expect(ok.json.accessToken).toBeTruthy();
    expect((await call('POST', '/auth/signup', { email: 'new@x.com', password: 'a-strong-pass-1' })).status).toBe(409);
  });

  it('signs in with the right password only', async () => {
    expect((await call('POST', '/auth/signin', { email: DEMO_EMAIL, password: 'wrong-password-1' })).status).toBe(401);
    expect((await call('POST', '/auth/signin', { email: 'nobody@x.com', password: 'whatever-123' })).status).toBe(401);
    expect((await call('POST', '/auth/signin', { email: DEMO_EMAIL, password: DEMO_PASSWORD })).status).toBe(200);
  });

  it('rotates refresh tokens and revokes the family on reuse', async () => {
    const first = (await call('POST', '/auth/signin', { email: DEMO_EMAIL, password: DEMO_PASSWORD })).json;
    const second = await call('POST', '/auth/refresh', { refreshToken: first.refreshToken });
    expect(second.status).toBe(200);
    // Reusing the old token is refused.
    expect((await call('POST', '/auth/refresh', { refreshToken: first.refreshToken })).status).toBe(401);
    // Outside the grace window, reuse kills the whole family.
    await db.query(`UPDATE sessions SET rotated_at = now() - interval '1 minute' WHERE rotated_at IS NOT NULL`);
    expect((await call('POST', '/auth/refresh', { refreshToken: first.refreshToken })).status).toBe(401);
    expect((await call('POST', '/auth/refresh', { refreshToken: second.json.refreshToken })).status).toBe(401);
  });

  it('signs out by revoking the session', async () => {
    const s = (await call('POST', '/auth/signin', { email: DEMO_EMAIL, password: DEMO_PASSWORD })).json;
    expect((await call('POST', '/auth/signout', undefined, s.accessToken)).status).toBe(204);
    expect((await call('POST', '/auth/refresh', { refreshToken: s.refreshToken })).status).toBe(401);
  });

  it('protects routes', async () => {
    expect((await call('GET', '/me')).status).toBe(401);
    expect((await call('GET', '/me', undefined, 'garbage')).status).toBe(401);
  });
});

describe('profiles and discovery', () => {
  const signup = async (email: string) =>
    (await call('POST', '/auth/signup', { email, password: 'a-strong-pass-1' })).json.accessToken as string;
  const onboard = (token: string, birthday: string, extra: object = {}) =>
    call('PATCH', '/me/profile', {
      displayName: 'Test',
      birthday,
      interests: ['Coffee', 'Hiking'],
      location: { lat: 41.0912345, lng: -74.1498765, city: 'Mahwah, NJ' },
      ...extra,
    }, token);

  it('rejects under-13s and coarsens location', async () => {
    const t = await signup('kid@x.com');
    expect((await onboard(t, '2020-01-01')).status).toBe(400);
    const res = await onboard(t, '2000-06-15');
    expect(res.status).toBe(200);
    expect(res.json.onboarded).toBe(true);
    const row = await db.one(`SELECT lat, lng FROM profiles p JOIN users u ON u.id = p.user_id WHERE u.email = 'kid@x.com'`);
    expect(row!.lat).toBe(41.09);
  });

  it('keeps teens and adults apart', async () => {
    const teen = await signup('teen@x.com');
    const year = new Date().getUTCFullYear() - 16;
    const res = await onboard(teen, `${year}-01-01`, { ageMin: 13, ageMax: 99 });
    expect(res.json.ageMax).toBe(17);
    const cards = (await call('GET', '/discover', undefined, teen)).json.cards;
    expect(cards).toEqual([]);
  });

  it('ranks people who liked you and share interests first, then matches on a mutual like', async () => {
    const s = (await call('POST', '/auth/signin', { email: DEMO_EMAIL, password: DEMO_PASSWORD })).json;
    const { cards } = (await call('GET', '/discover', undefined, s.accessToken)).json;
    expect(cards.length).toBeGreaterThan(5);
    expect(cards.map((c: any) => c.displayName)).not.toContain('Ava'); // already matched
    expect(cards[0].displayName).toBe('Maya'); // liked demo + shares hiking, coffee, film

    const pass = cards.find((c: any) => c.displayName === 'Nina');
    expect((await call('POST', '/swipes', { targetId: pass.id, liked: false }, s.accessToken)).json.matchId).toBeNull();

    const maya = cards[0];
    const swipe = await call('POST', '/swipes', { targetId: maya.id, liked: true }, s.accessToken);
    expect(swipe.json.matchId).toBeTruthy();

    const after = (await call('GET', '/discover', undefined, s.accessToken)).json.cards.map((c: any) => c.id);
    expect(after).not.toContain(maya.id);
    expect(after).not.toContain(pass.id);
  });
});

describe('chat', () => {
  it('lists matches, sends messages and marks them read', async () => {
    const s = (await call('POST', '/auth/signin', { email: DEMO_EMAIL, password: DEMO_PASSWORD })).json;
    const { matches } = (await call('GET', '/matches', undefined, s.accessToken)).json;
    const ava = matches.find((m: any) => m.person.displayName === 'Ava');
    expect(ava.unread).toBe(2);

    const sent = await call('POST', `/matches/${ava.id}/messages`, { body: '  See you Saturday!  ' }, s.accessToken);
    expect(sent.status).toBe(201);
    expect(sent.json.body).toBe('See you Saturday!');

    await call('POST', `/matches/${ava.id}/read`, undefined, s.accessToken);
    const history = (await call('GET', `/matches/${ava.id}/messages`, undefined, s.accessToken)).json.messages;
    expect(history).toHaveLength(4);
    expect(history.at(-1).body).toBe('See you Saturday!');
    const refreshed = (await call('GET', '/matches', undefined, s.accessToken)).json.matches;
    expect(refreshed[0].id).toBe(ava.id);
    expect(refreshed[0].unread).toBe(0);
  });

  it('hides a conversation from outsiders and after unmatching', async () => {
    const s = (await call('POST', '/auth/signin', { email: DEMO_EMAIL, password: DEMO_PASSWORD })).json;
    const outsider = (await call('POST', '/auth/signin', { email: 'priya@demo.cliq.app', password: DEMO_PASSWORD })).json;
    const { matches } = (await call('GET', '/matches', undefined, s.accessToken)).json;
    const id = matches[0].id;
    expect((await call('GET', `/matches/${id}/messages`, undefined, outsider.accessToken)).status).toBe(404);
    expect((await call('DELETE', `/matches/${id}`, undefined, s.accessToken)).status).toBe(204);
    expect((await call('POST', `/matches/${id}/messages`, { body: 'hi' }, s.accessToken)).status).toBe(404);
  });
});

const lastCode = (to: string) => {
  const mail = [...outbox].reverse().find((m) => m.to === to);
  return mail?.text.match(/\b(\d{6})\b/)?.[1] ?? '';
};

describe('email verification and password reset', () => {
  it('emails a code at sign up and gates swiping until it is confirmed', async () => {
    const s = (await call('POST', '/auth/signup', { email: 'verify@x.com', password: 'a-strong-pass-1' })).json;
    expect((await call('GET', '/me', undefined, s.accessToken)).json.emailVerified).toBe(false);
    const code = lastCode('verify@x.com');
    expect(code).toMatch(/^\d{6}$/);

    const blocked = await call('POST', '/swipes', { targetId: crypto.randomUUID(), liked: true }, s.accessToken);
    expect(blocked.status).toBe(403);
    expect(blocked.json.code).toBe('verify-email');

    // Resending right away is throttled.
    expect((await call('POST', '/auth/email/send-verification', undefined, s.accessToken)).status).toBe(400);
    const wrong = code === '000000' ? '111111' : '000000';
    expect((await call('POST', '/auth/email/verify', { code: wrong }, s.accessToken)).status).toBe(400);
    expect((await call('POST', '/auth/email/verify', { code }, s.accessToken)).status).toBe(204);
    expect((await call('GET', '/me', undefined, s.accessToken)).json.emailVerified).toBe(true);
    // Codes are single use.
    expect((await call('POST', '/auth/email/verify', { code }, s.accessToken)).status).toBe(400);
  });

  it('burns a code after five wrong guesses', async () => {
    const s = (await call('POST', '/auth/signup', { email: 'guess@x.com', password: 'a-strong-pass-1' })).json;
    const code = lastCode('guess@x.com');
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) await call('POST', '/auth/email/verify', { code: wrong }, s.accessToken);
    expect((await call('POST', '/auth/email/verify', { code }, s.accessToken)).status).toBe(400);
  });

  it('resets a forgotten password and signs out every device', async () => {
    const before = (await call('POST', '/auth/signup', { email: 'forgot@x.com', password: 'a-strong-pass-1' })).json;
    expect((await call('POST', '/auth/password/forgot', { email: 'nobody-here@x.com' })).status).toBe(204);
    await db.query(`UPDATE email_codes SET created_at = now() - interval '1 minute'`);
    expect((await call('POST', '/auth/password/forgot', { email: 'forgot@x.com' })).status).toBe(204);
    const code = lastCode('forgot@x.com');

    const reset = await call('POST', '/auth/password/reset', { email: 'forgot@x.com', code, password: 'brand-new-pass-2' });
    expect(reset.status).toBe(200);
    expect(reset.json.accessToken).toBeTruthy();
    expect((await call('POST', '/auth/refresh', { refreshToken: before.refreshToken })).status).toBe(401);
    expect((await call('POST', '/auth/signin', { email: 'forgot@x.com', password: 'a-strong-pass-1' })).status).toBe(401);
    expect((await call('POST', '/auth/signin', { email: 'forgot@x.com', password: 'brand-new-pass-2' })).status).toBe(200);
    expect((await call('GET', '/me', undefined, reset.json.accessToken)).json.emailVerified).toBe(true);
  });
});

describe('photos', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 2, 3]);
  const put = (token: string, body: Uint8Array) =>
    app.request('/me/photo', { method: 'PUT', headers: { authorization: `Bearer ${token}`, 'content-type': 'image/jpeg' }, body: body.slice().buffer });

  it('uploads, serves and removes a profile photo', async () => {
    const s = (await call('POST', '/auth/signin', { email: DEMO_EMAIL, password: DEMO_PASSWORD })).json;
    expect((await put(s.accessToken, new TextEncoder().encode('<svg onload=alert(1)>'))).status).toBe(415);
    const res = await put(s.accessToken, jpeg);
    expect(res.status).toBe(200);
    const { photoUrl } = await res.json();
    expect(photoUrl).toMatch(/^\/photos\/[0-9a-f-]+\?v=\d+$/);
    expect((await call('GET', '/me', undefined, s.accessToken)).json.profile.photoUrl).toBe(photoUrl);

    const img = await app.request(photoUrl);
    expect(img.headers.get('content-type')).toBe('image/jpeg');
    expect(img.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
    expect(new Uint8Array(await img.arrayBuffer())).toEqual(jpeg);

    // Other people see it on the demo account's card.
    const priya = (await call('POST', '/auth/signin', { email: 'priya@demo.cliq.app', password: DEMO_PASSWORD })).json;
    const { cards } = (await call('GET', '/discover', undefined, priya.accessToken)).json;
    expect(cards.find((c: any) => c.displayName === 'Chris').photoUrl).toBe(photoUrl);

    expect((await call('DELETE', '/me/photo', undefined, s.accessToken)).status).toBe(204);
    expect((await app.request(photoUrl)).status).toBe(404);
  });
});

describe('routing', () => {
  it('leaves public paths open', async () => {
    expect((await call('GET', '/health')).status).toBe(200);
  });
});
