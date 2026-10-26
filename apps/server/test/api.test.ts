import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openDb, type Db } from '../src/db.js';
import { createApp } from '../src/app.js';
import { seed, DEMO_EMAIL, DEMO_PASSWORD } from '../src/seed.js';
import { outbox } from '../src/lib/mailer.js';
import { currentStep, totpAt } from '../src/auth/totp.js';
import { searchCatalog } from '../src/lib/featured.js';
import { Hub } from '../src/realtime.js';

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

describe('safety and settings', () => {
  const fresh = async (email: string, extra: object = {}) => {
    const s = (await call('POST', '/auth/signup', { email, password: 'a-strong-pass-1' })).json;
    await db.query('UPDATE users SET email_verified_at = now() WHERE lower(email) = $1', [email]);
    await call('PATCH', '/me/profile', {
      displayName: email.split('@')[0], birthday: '1998-03-03', interests: ['Coffee'],
      location: { lat: 41.09, lng: -74.15, city: 'Mahwah, NJ' }, ...extra,
    }, s.accessToken);
    const me = (await call('GET', '/me', undefined, s.accessToken)).json;
    return { token: s.accessToken as string, refresh: s.refreshToken as string, id: me.id as string };
  };
  const sees = async (token: string, id: string) =>
    (await call('GET', '/discover?limit=50', undefined, token)).json.cards.some((c: any) => c.id === id);

  it('blocks and unblocks without reporting', async () => {
    const a = await fresh('block-a@x.com');
    const b = await fresh('block-b@x.com');
    expect(await sees(a.token, b.id)).toBe(true);
    expect((await call('POST', `/blocks/${b.id}`, undefined, a.token)).status).toBe(204);
    expect(await sees(a.token, b.id)).toBe(false);
    expect(await sees(b.token, a.id)).toBe(false);
    expect((await call('POST', '/swipes', { targetId: a.id, liked: true }, b.token)).status).toBe(404);
    const list = (await call('GET', '/blocks', undefined, a.token)).json.blocks;
    expect(list.map((x: any) => x.id)).toEqual([b.id]);
    expect((await call('DELETE', `/blocks/${b.id}`, undefined, a.token)).status).toBe(204);
    expect(await sees(a.token, b.id)).toBe(true);
  });

  it('snoozes a profile out of Discover and back', async () => {
    const a = await fresh('snooze-a@x.com');
    const b = await fresh('snooze-b@x.com');
    expect((await call('PATCH', '/me/settings', { snoozeDays: 7 }, b.token)).status).toBe(204);
    expect((await call('GET', '/me', undefined, b.token)).json.settings.snoozedUntil).toBeTruthy();
    expect(await sees(a.token, b.id)).toBe(false);
    await call('PATCH', '/me/settings', { snoozeDays: 0 }, b.token);
    expect(await sees(a.token, b.id)).toBe(true);
  });

  it('saves notification preferences', async () => {
    const a = await fresh('notify@x.com');
    await call('PATCH', '/me/settings', { notifyMessages: false }, a.token);
    const settings = (await call('GET', '/me', undefined, a.token)).json.settings;
    expect(settings).toMatchObject({ notifyMatches: true, notifyMessages: false });
  });

  it('hides a profile reported by three different people', async () => {
    const target = await fresh('reported@x.com');
    const watcher = await fresh('watcher@x.com');
    for (const n of [1, 2, 3]) {
      const r = await fresh(`reporter${n}@x.com`);
      await call('POST', '/reports', { targetId: target.id, reason: 'spam' }, r.token);
    }
    expect(await sees(watcher.token, target.id)).toBe(false);
  });

  it('lists devices and signs one out immediately', async () => {
    const a = await fresh('devices@x.com');
    const phone = (await call('POST', '/auth/signin', { email: 'devices@x.com', password: 'a-strong-pass-1' })).json;
    const { sessions } = (await call('GET', '/me/sessions', undefined, a.token)).json;
    expect(sessions).toHaveLength(2);
    const other = sessions.find((s: any) => !s.current);
    expect((await call('DELETE', `/me/sessions/${other.id}`, undefined, a.token)).status).toBe(204);
    // The access token stops working right away, not after it expires.
    expect((await call('GET', '/me', undefined, phone.accessToken)).status).toBe(401);
    expect((await call('GET', '/me', undefined, a.token)).status).toBe(200);
  });

  it('undoes the last swipe unless it made a match', async () => {
    const a = await fresh('undo-a@x.com');
    const b = await fresh('undo-b@x.com');
    await call('POST', '/swipes', { targetId: b.id, liked: false }, a.token);
    expect(await sees(a.token, b.id)).toBe(false);
    expect((await call('POST', '/swipes/undo', undefined, a.token)).json.targetId).toBe(b.id);
    expect(await sees(a.token, b.id)).toBe(true);
    await call('POST', '/swipes', { targetId: a.id, liked: true }, b.token);
    expect((await call('POST', '/swipes', { targetId: b.id, liked: true }, a.token)).json.matchId).toBeTruthy();
    expect((await call('POST', '/swipes/undo', undefined, a.token)).status).toBe(409);
  });

  it('exports my data', async () => {
    const s = (await call('POST', '/auth/signin', { email: 'ava@demo.cliq.app', password: DEMO_PASSWORD })).json;
    const data = (await call('GET', '/me/export', undefined, s.accessToken)).json;
    expect(data.account.email).toBe('ava@demo.cliq.app');
    expect(data.profile.displayName).toBe('Ava');
    expect(data.matches.length).toBeGreaterThan(0);
  });

  it('asks for the password before deleting an account', async () => {
    const a = await fresh('delete-me@x.com');
    expect((await call('DELETE', '/auth/account', { password: 'wrong-password-9' }, a.token)).status).toBe(403);
    expect((await call('DELETE', '/auth/account', { password: 'a-strong-pass-1' }, a.token)).status).toBe(204);
    expect((await call('POST', '/auth/signin', { email: 'delete-me@x.com', password: 'a-strong-pass-1' })).status).toBe(401);
  });
});

describe('more ways to sign in', () => {
  it('signs in with an emailed code instead of a password', async () => {
    await call('POST', '/auth/signup', { email: 'codeonly@x.com', password: 'a-strong-pass-1' });
    expect((await call('POST', '/auth/code/send', { email: 'nobody-at-all@x.com' })).status).toBe(204);
    await db.query(`UPDATE email_codes SET created_at = now() - interval '1 minute'`);
    expect((await call('POST', '/auth/code/send', { email: 'codeonly@x.com' })).status).toBe(204);
    const mail = [...outbox].reverse().find((m) => m.to === 'codeonly@x.com')!;
    expect(mail.text).toContain('sign in');
    const code = mail.text.match(/(\d{6})/)![1]!;
    const res = await call('POST', '/auth/code/verify', { email: 'codeonly@x.com', code });
    expect(res.status).toBe(200);
    expect(res.json.accessToken).toBeTruthy();
    expect((await call('POST', '/auth/code/verify', { email: 'codeonly@x.com', code })).status).toBe(400);
  });

  it('emails an alert when a new device signs in', async () => {
    await app.request('/auth/signup', { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Cliq/1 CFNetwork Darwin iPhone' }, body: JSON.stringify({ email: 'alerts@x.com', password: 'a-strong-pass-1' }) });
    const before = outbox.filter((m) => m.to === 'alerts@x.com' && m.subject.startsWith('New sign in')).length;
    await app.request('/auth/signin', { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Cliq/1 CFNetwork Darwin iPhone' }, body: JSON.stringify({ email: 'alerts@x.com', password: 'a-strong-pass-1' }) });
    await app.request('/auth/signin', { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/140.0' }, body: JSON.stringify({ email: 'alerts@x.com', password: 'a-strong-pass-1' }) });
    const alerts = outbox.filter((m) => m.to === 'alerts@x.com' && m.subject.startsWith('New sign in'));
    expect(alerts.length - before).toBe(1);
    expect(alerts.at(-1)!.text).toContain('Chrome on Windows');
  });

  it('turns on two-step verification and requires it at sign in', async () => {
    const email = 'twostep@x.com';
    const s = (await call('POST', '/auth/signup', { email, password: 'a-strong-pass-1' })).json;
    const setup = (await call('POST', '/me/2fa/setup', undefined, s.accessToken)).json;
    expect(setup.uri).toMatch(/^otpauth:\/\/totp\/Cliq/);
    expect((await call('POST', '/me/2fa/enable', { code: '000000' === totpAt(setup.secret, currentStep()) ? '111111' : '000000' }, s.accessToken)).status).toBe(400);
    const enabled = await call('POST', '/me/2fa/enable', { code: totpAt(setup.secret, currentStep()) }, s.accessToken);
    expect(enabled.json.backupCodes).toHaveLength(10);
    expect((await call('GET', '/me', undefined, s.accessToken)).json.twoFactorEnabled).toBe(true);

    // Password alone now only gets a short-lived challenge, which is no good as an access token.
    const first = (await call('POST', '/auth/signin', { email, password: 'a-strong-pass-1' })).json;
    expect(first.accessToken).toBeUndefined();
    expect(first.mfaRequired).toBe(true);
    expect((await call('GET', '/me', undefined, first.mfaToken)).status).toBe(401);

    // The code used to enable can't be replayed; the next step's code works once.
    expect((await call('POST', '/auth/2fa', { mfaToken: first.mfaToken, code: totpAt(setup.secret, currentStep()) })).status).toBe(400);
    const next = totpAt(setup.secret, currentStep() + 1);
    const ok = await call('POST', '/auth/2fa', { mfaToken: first.mfaToken, code: next });
    expect(ok.json.accessToken).toBeTruthy();
    expect((await call('POST', '/auth/2fa', { mfaToken: first.mfaToken, code: next })).status).toBe(400);

    // Backup codes work once each.
    const backup = enabled.json.backupCodes[0];
    expect((await call('POST', '/auth/2fa', { mfaToken: first.mfaToken, code: backup.toUpperCase() })).status).toBe(200);
    expect((await call('POST', '/auth/2fa', { mfaToken: first.mfaToken, code: backup })).status).toBe(400);

    // Turning it off needs a code.
    expect((await call('POST', '/me/2fa/disable', { code: '123456' }, ok.json.accessToken)).status).toBe(400);
    expect((await call('POST', '/me/2fa/disable', { code: enabled.json.backupCodes[1] }, ok.json.accessToken)).status).toBe(204);
    expect((await call('POST', '/auth/signin', { email, password: 'a-strong-pass-1' })).json.accessToken).toBeTruthy();
  });
});

describe('wishlist', () => {
  const fresh = async (email: string, extra: object = {}) => {
    const s = (await call('POST', '/auth/signup', { email, password: 'a-strong-pass-1' })).json;
    await db.query('UPDATE users SET email_verified_at = now() WHERE lower(email) = $1', [email]);
    await call('PATCH', '/me/profile', {
      displayName: email.split('@')[0], birthday: '1997-05-05', interests: ['Film'],
      location: { lat: 41.2, lng: -74.3, city: 'Somewhere, NJ' }, ...extra,
    }, s.accessToken);
    const me = (await call('GET', '/me', undefined, s.accessToken)).json;
    return { token: s.accessToken as string, id: me.id as string };
  };
  const pair = async (a: string, b: string) => {
    const x = await fresh(a);
    const y = await fresh(b);
    await call('POST', '/swipes', { targetId: y.id, liked: true }, x.token);
    const { matchId } = (await call('POST', '/swipes', { targetId: x.id, liked: true }, y.token)).json;
    return { x, y, matchId: matchId as string };
  };
  const song = {
    kind: 'song', title: 'Dreams', subtitle: 'Fleetwood Mac',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/a/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/a.m4a',
    link: 'https://music.apple.com/us/album/dreams/1',
  };

  it('saves prompts and a featured song, and shows them on cards', async () => {
    const a = await fresh('prompt-a@x.com');
    const prompts = [{ question: 'My ideal Saturday', answer: 'Farmers market, then a long hike' }];
    expect((await call('PATCH', '/me/profile', { prompts, featured: song }, a.token)).status).toBe(200);
    const tooMany = Array.from({ length: 4 }, (_, i) => ({ question: `Q${i}`, answer: 'a' }));
    expect((await call('PATCH', '/me/profile', { prompts: tooMany }, a.token)).status).toBe(400);
    expect((await call('PATCH', '/me/profile', { featured: { ...song, artworkUrl: 'https://evil.example/pixel.gif' } }, a.token)).status).toBe(400);
    const me = (await call('GET', '/me', undefined, a.token)).json;
    expect(me.profile.prompts).toEqual(prompts);
    expect(me.profile.featured.title).toBe('Dreams');

    const b = await fresh('prompt-b@x.com');
    const card = (await call('GET', '/discover?limit=50', undefined, b.token)).json.cards.find((c: any) => c.id === a.id);
    expect(card.prompts).toEqual(prompts);
    expect(card.featured.subtitle).toBe('Fleetwood Mac');
    expect((await call('PATCH', '/me/profile', { featured: null }, a.token)).status).toBe(200);
  });

  it('turns Apple catalog results into safe featured items', async () => {
    const fake = (async () =>
      new Response(JSON.stringify({ results: [
        { trackName: 'Dreams', artistName: 'Fleetwood Mac', artworkUrl100: 'https://is1-ssl.mzstatic.com/x/100x100bb.jpg', previewUrl: song.previewUrl, trackViewUrl: song.link },
        { trackName: 'Dreams', artistName: 'Fleetwood Mac' },
        { trackName: 'Bad', artistName: 'X', artworkUrl100: 'http://elsewhere.com/a.jpg' },
      ] }))) as unknown as typeof fetch;
    const results = await searchCatalog('song', 'dreams', fake);
    expect(results).toHaveLength(2);
    expect(results[0]!.artworkUrl).toBe('https://is1-ssl.mzstatic.com/x/600x600bb.jpg');
    expect(results[1]!.artworkUrl).toBeNull();
  });

  it('sends photos and GIFs in chat', async () => {
    const { x, y, matchId } = await pair('media-a@x.com', 'media-b@x.com');
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 2, 3]);
    const upload = (body: Uint8Array) =>
      app.request(`/matches/${matchId}/images?w=1080&h=1350`, { method: 'POST', headers: { authorization: `Bearer ${x.token}` }, body: body.slice().buffer });
    expect((await upload(new TextEncoder().encode('<svg/>'))).status).toBe(415);
    const res = await upload(jpeg);
    expect(res.status).toBe(201);
    const msg = await res.json();
    expect(msg.kind).toBe('image');
    expect(msg.media).toMatchObject({ width: 1080, height: 1350 });
    const img = await app.request(msg.media.url);
    expect(img.headers.get('content-type')).toBe('image/jpeg');
    expect(new Uint8Array(await img.arrayBuffer())).toEqual(jpeg);

    const gif = { url: 'https://media2.giphy.com/media/abc/200w.gif', width: 200, height: 150 };
    expect((await call('POST', `/matches/${matchId}/messages`, { gif: { ...gif, url: 'https://evil.example/a.gif' } }, x.token)).status).toBe(400);
    expect((await call('POST', `/matches/${matchId}/messages`, { gif }, y.token)).json.kind).toBe('gif');

    const history = (await call('GET', `/matches/${matchId}/messages`, undefined, y.token)).json.messages;
    expect(history.map((m: any) => m.kind)).toEqual(['image', 'gif']);
    const list = (await call('GET', '/matches', undefined, x.token)).json.matches;
    expect(list.find((m: any) => m.id === matchId).lastMessage.body).toBe('GIF');

    // Unmatching takes the photos down too.
    await call('DELETE', `/matches/${matchId}`, undefined, x.token);
    expect((await app.request(msg.media.url)).status).toBe(404);
  });

  it('works out achievements and shows earned badges to friends', async () => {
    const { x, y, matchId } = await pair('badge-a@x.com', 'badge-b@x.com');
    await call('POST', `/matches/${matchId}/messages`, { body: 'hey!' }, x.token);
    const { achievements } = (await call('GET', '/me/achievements', undefined, x.token)).json;
    const earned = (id: string) => achievements.find((a: any) => a.id === id);
    expect(earned('first-click').earnedAt).toBeTruthy();
    expect(earned('icebreaker').earnedAt).toBeTruthy();
    expect(earned('verified').earnedAt).toBeTruthy();
    expect(earned('inner-circle')).toMatchObject({ progress: 1, target: 5, earnedAt: null });
    const friend = (await call('GET', '/matches', undefined, y.token)).json.matches.find((m: any) => m.id === matchId);
    expect(friend.person.badges).toEqual(expect.arrayContaining(['first-click', 'icebreaker', 'verified']));
    expect(friend.person.badges).not.toContain('inner-circle');
  });

  it('respects activity and location settings', async () => {
    const { x, y, matchId } = await pair('active-a@x.com', 'active-b@x.com');
    const seen = async () => (await call('GET', '/matches', undefined, y.token)).json.matches.find((m: any) => m.id === matchId);
    expect((await seen()).lastActiveAt).toBeTruthy();
    expect((await call('PATCH', '/me/settings', { showActivity: false, liveLocation: false }, x.token)).status).toBe(204);
    expect((await seen())).toMatchObject({ online: false, lastActiveAt: null });
    expect((await call('GET', '/me', undefined, x.token)).json.settings).toMatchObject({ showActivity: false, liveLocation: false });
  });

  it('knows when someone comes online and goes offline', () => {
    const hub = new Hub();
    const a = { send() {} } as any;
    const b = { send() {} } as any;
    expect(hub.add('u', a)).toBe(true);
    expect(hub.add('u', b)).toBe(false);
    expect(hub.remove('u', a)).toBe(false);
    expect(hub.remove('u', b)).toBe(true);
    expect(hub.remove('u', b)).toBe(false);
  });
});

describe('routing', () => {
  it('leaves public paths open', async () => {
    expect((await call('GET', '/health')).status).toBe(200);
  });
});
