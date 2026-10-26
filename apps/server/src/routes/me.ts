import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { validate as zValidator } from '../lib/validate.js';
import { z } from 'zod';
import type { Db, Row } from '../db.js';
import { rateLimit, requireAuth, type AuthEnv } from '../auth/middleware.js';
import { GENDERS, INTERESTS, PALETTE_IDS } from '../lib/catalog.js';
import { ageOn, bandBounds } from '../lib/age.js';
import { coarsen } from '../lib/geo.js';
import { photoUrl } from './photos.js';
import { describeDevice } from '../lib/device.js';
import { checkSecondFactor } from '../auth/second-factor.js';
import { featuredSchema, searchCatalog, type Featured } from '../lib/featured.js';
import { achievementsFor } from '../lib/achievements.js';
import { config } from '../config.js';
import { checkTotp, hashBackupCode, newBackupCodes, newTotpSecret, openSecret, otpauthUri, sealSecret } from '../auth/totp.js';

export const toProfile = (p: Row) => ({
  displayName: p.display_name as string,
  bio: p.bio as string,
  birthday: p.birthday ? new Date(p.birthday).toISOString().slice(0, 10) : null,
  age: p.birthday ? ageOn(p.birthday) : null,
  gender: (p.gender as string | null) ?? null,
  gigTitle: p.gig_title as string,
  gigPlace: p.gig_place as string,
  interests: p.interests as string[],
  palette: p.palette as [string, string],
  city: p.city as string,
  hasLocation: p.lat != null,
  ageMin: p.age_min as number,
  ageMax: p.age_max as number,
  maxDistanceMi: p.max_distance_mi as number,
  onboarded: p.onboarded as boolean,
  photoUrl: photoUrl(p.user_id, p.photo_at),
  prompts: (p.prompts as { question: string; answer: string }[] | undefined) ?? [],
  featured: (p.featured as Featured | null | undefined) ?? null,
});

const profilePatch = z
  .object({
    displayName: z.string().trim().min(1).max(40),
    bio: z.string().trim().max(300),
    birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    gender: z.enum(GENDERS),
    gigTitle: z.string().trim().max(60),
    gigPlace: z.string().trim().max(60),
    interests: z.array(z.enum(INTERESTS)).max(5).refine((a) => new Set(a).size === a.length, 'Duplicate interest'),
    palette: z.tuple([z.enum(PALETTE_IDS), z.enum(PALETTE_IDS)]),
    location: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), city: z.string().trim().max(80) }),
    ageMin: z.number().int().min(13).max(120),
    ageMax: z.number().int().min(13).max(120),
    maxDistanceMi: z.number().int().min(1).max(150),
    prompts: z
      .array(z.object({ question: z.string().trim().min(1).max(100), answer: z.string().trim().min(1).max(160) }))
      .max(3)
      .refine((a) => new Set(a.map((p) => p.question)).size === a.length, 'Pick different questions'),
    featured: featuredSchema.nullable(),
  })
  .partial();

export function meRoutes(db: Db) {
  const r = new Hono<AuthEnv>();
  r.use('*', requireAuth);

  const load = (userId: string) =>
    db.one(
      'SELECT p.*, ph.updated_at AS photo_at FROM profiles p LEFT JOIN photos ph ON ph.user_id = p.user_id WHERE p.user_id = $1',
      [userId],
    );

  r.get('/', async (c) => {
    const user = await db.one('SELECT id, email, password_hash IS NOT NULL AS has_password, apple_sub IS NOT NULL AS apple, google_sub IS NOT NULL AS google, email_verified_at IS NOT NULL AS verified, notify_matches, notify_messages, live_location, show_activity, totp_enabled_at IS NOT NULL AS mfa FROM users WHERE id = $1', [
      c.var.userId,
    ]);
    if (!user) throw new HTTPException(401, { message: 'Account no longer exists' });
    await db.query('UPDATE profiles SET last_active_at = now() WHERE user_id = $1', [c.var.userId]);
    const stats = await db.one(
      `SELECT
        (SELECT count(*)::int FROM swipes WHERE swiper_id = $1 AND liked) AS likes_sent,
        (SELECT count(*)::int FROM swipes WHERE swiper_id = $1) AS swipes,
        (SELECT count(*)::int FROM matches WHERE (user_a = $1 OR user_b = $1)) AS matches`,
      [c.var.userId],
    );
    const profile = (await load(c.var.userId))!;
    return c.json({
      settings: {
        notifyMatches: user.notify_matches,
        notifyMessages: user.notify_messages,
        liveLocation: user.live_location,
        showActivity: user.show_activity,
        snoozedUntil: profile.snoozed_until && new Date(profile.snoozed_until) > new Date() ? new Date(profile.snoozed_until).toISOString() : null,
      },
      id: user.id,
      email: user.email,
      hasPassword: user.has_password,
      linkedApple: user.apple,
      linkedGoogle: user.google,
      emailVerified: user.verified,
      twoFactorEnabled: user.mfa,
      features: { gifs: !!config.giphyApiKey },
      profile: toProfile(profile),
      stats: { likesSent: stats!.likes_sent, swipes: stats!.swipes, matches: stats!.matches },
    });
  });

  r.patch('/profile', zValidator('json', profilePatch), async (c) => {
    const body = c.req.valid('json');
    const current = (await load(c.var.userId))!;
    const next: Row = { ...current };

    if (body.displayName !== undefined) next.display_name = body.displayName;
    if (body.bio !== undefined) next.bio = body.bio;
    if (body.gender !== undefined) next.gender = body.gender;
    if (body.gigTitle !== undefined) next.gig_title = body.gigTitle;
    if (body.gigPlace !== undefined) next.gig_place = body.gigPlace;
    if (body.interests !== undefined) next.interests = body.interests;
    if (body.palette !== undefined) next.palette = body.palette;
    if (body.location) {
      next.lat = coarsen(body.location.lat);
      next.lng = coarsen(body.location.lng);
      next.city = body.location.city;
    }
    if (body.birthday !== undefined) {
      const age = ageOn(body.birthday);
      if (Number.isNaN(age) || age > 120) throw new HTTPException(400, { message: 'Enter a valid birthday' });
      if (age < 13) throw new HTTPException(400, { message: 'You need to be at least 13 to use Cliq' });
      // Birthdays can be set once. Changing it later would let someone hop between the teen and adult pools.
      if (current.birthday && new Date(current.birthday).toISOString().slice(0, 10) !== body.birthday) {
        throw new HTTPException(400, { message: 'Contact support to change your birthday' });
      }
      next.birthday = body.birthday;
    }
    if (body.prompts !== undefined) next.prompts = body.prompts;
    if (body.featured !== undefined) next.featured = body.featured;
    if (body.maxDistanceMi !== undefined) next.max_distance_mi = body.maxDistanceMi;
    if (body.ageMin !== undefined) next.age_min = body.ageMin;
    if (body.ageMax !== undefined) next.age_max = body.ageMax;

    // Age preferences always stay inside the user's own band.
    if (next.birthday) {
      const band = bandBounds(ageOn(next.birthday));
      next.age_min = Math.min(Math.max(next.age_min, band.min), band.max);
      next.age_max = Math.min(Math.max(next.age_max, next.age_min), band.max);
    }

    next.onboarded = Boolean(
      next.display_name && next.birthday && next.lat != null && (next.interests as string[]).length > 0,
    );

    const saved = await db.one(
      `UPDATE profiles SET display_name=$2, bio=$3, birthday=$4, gender=$5, gig_title=$6, gig_place=$7, interests=$8,
        palette=$9, lat=$10, lng=$11, city=$12, age_min=$13, age_max=$14, max_distance_mi=$15, onboarded=$16,
        prompts=$17, featured=$18, updated_at=now()
       WHERE user_id=$1 RETURNING *, (SELECT updated_at FROM photos WHERE user_id = $1) AS photo_at`,
      [
        c.var.userId, next.display_name, next.bio, next.birthday, next.gender, next.gig_title, next.gig_place,
        next.interests, next.palette, next.lat, next.lng, next.city, next.age_min, next.age_max, next.max_distance_mi, next.onboarded,
        JSON.stringify(next.prompts ?? []), next.featured ? JSON.stringify(next.featured) : null,
      ],
    );
    return c.json(toProfile(saved!));
  });

  r.post(
    '/push-token',
    zValidator('json', z.object({ token: z.string().min(10).max(200), platform: z.enum(['ios', 'android', 'web']) })),
    async (c) => {
      const { token, platform } = c.req.valid('json');
      await db.query(
        `INSERT INTO push_tokens (token, user_id, platform) VALUES ($1, $2, $3)
         ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, updated_at = now()`,
        [token, c.var.userId, platform],
      );
      return c.body(null, 204);
    },
  );

  r.patch(
    '/settings',
    zValidator(
      'json',
      z
        .object({
          notifyMatches: z.boolean(),
          notifyMessages: z.boolean(),
          liveLocation: z.boolean(),
          showActivity: z.boolean(),
          // Days to stay hidden from Discover; 0 shows you again. 3650 is "until I turn it off".
          snoozeDays: z.number().int().min(0).max(3650),
        })
        .partial(),
    ),
    async (c) => {
      const body = c.req.valid('json');
      if (body.notifyMatches !== undefined || body.notifyMessages !== undefined) {
        await db.query(
          'UPDATE users SET notify_matches = coalesce($2, notify_matches), notify_messages = coalesce($3, notify_messages) WHERE id = $1',
          [c.var.userId, body.notifyMatches ?? null, body.notifyMessages ?? null],
        );
      }
      if (body.liveLocation !== undefined || body.showActivity !== undefined) {
        await db.query(
          'UPDATE users SET live_location = coalesce($2, live_location), show_activity = coalesce($3, show_activity) WHERE id = $1',
          [c.var.userId, body.liveLocation ?? null, body.showActivity ?? null],
        );
      }
      if (body.snoozeDays !== undefined) {
        await db.query(
          `UPDATE profiles SET snoozed_until = CASE WHEN $2::int = 0 THEN NULL ELSE now() + make_interval(days => $2::int) END WHERE user_id = $1`,
          [c.var.userId, body.snoozeDays],
        );
      }
      return c.body(null, 204);
    },
  );

  r.get('/achievements', async (c) => {
    const all = await achievementsFor(db, [c.var.userId]);
    return c.json({ achievements: all.get(c.var.userId) ?? [] });
  });

  // Search for a song, show or movie to feature on your profile.
  r.get(
    '/featured-search',
    rateLimit({ limit: 40, windowMs: 60_000, perUser: true }),
    zValidator('query', z.object({ kind: z.enum(['song', 'show', 'movie']), q: z.string().trim().min(1).max(80) })),
    async (c) => {
      const { kind, q } = c.req.valid('query');
      try {
        return c.json({ results: await searchCatalog(kind, q) });
      } catch {
        throw new HTTPException(502, { message: 'Search isn’t working right now. Try again in a moment.' });
      }
    },
  );

  // Two-step verification. Setup stores a pending secret; it only takes effect once a code from the app checks out.
  r.post('/2fa/setup', async (c) => {
    const user = await db.one<{ email: string | null; mfa: boolean }>('SELECT email, totp_enabled_at IS NOT NULL AS mfa FROM users WHERE id = $1', [c.var.userId]);
    if (user?.mfa) throw new HTTPException(409, { message: 'Two-step verification is already on' });
    const secret = newTotpSecret();
    await db.query('UPDATE users SET totp_pending_secret = $2 WHERE id = $1', [c.var.userId, sealSecret(secret)]);
    return c.json({ secret, uri: otpauthUri(secret, user?.email ?? 'account') });
  });

  r.post('/2fa/enable', zValidator('json', z.object({ code: z.string().trim().length(6) })), async (c) => {
    const user = await db.one<{ totp_pending_secret: string | null }>('SELECT totp_pending_secret FROM users WHERE id = $1', [c.var.userId]);
    if (!user?.totp_pending_secret) throw new HTTPException(400, { message: 'Start setup again' });
    const step = checkTotp(openSecret(user.totp_pending_secret), c.req.valid('json').code);
    if (step === null) throw new HTTPException(400, { message: 'That code isn’t right. Check the time on your phone and try the newest code.' });
    const codes = newBackupCodes();
    await db.tx(async (t) => {
      await t.query(
        'UPDATE users SET totp_secret = totp_pending_secret, totp_pending_secret = NULL, totp_enabled_at = now(), totp_last_step = $2 WHERE id = $1',
        [c.var.userId, step],
      );
      await t.query('DELETE FROM backup_codes WHERE user_id = $1', [c.var.userId]);
      for (const code of codes) await t.query('INSERT INTO backup_codes (user_id, code_hash) VALUES ($1, $2)', [c.var.userId, hashBackupCode(code)]);
    });
    return c.json({ backupCodes: codes });
  });

  // Turning it off needs a code too, so someone holding an unlocked phone can't quietly remove it.
  r.post('/2fa/disable', zValidator('json', z.object({ code: z.string().trim().min(6).max(20) })), async (c) => {
    if (!(await checkSecondFactor(db, c.var.userId, c.req.valid('json').code))) throw new HTTPException(400, { message: 'That code isn’t right' });
    await db.query(
      'UPDATE users SET totp_secret = NULL, totp_pending_secret = NULL, totp_enabled_at = NULL, totp_last_step = NULL WHERE id = $1',
      [c.var.userId],
    );
    await db.query('DELETE FROM backup_codes WHERE user_id = $1', [c.var.userId]);
    return c.body(null, 204);
  });

  /** Devices signed in to this account: one entry per session family, newest activity first. */
  r.get('/sessions', async (c) => {
    const rows = await db.query(
      `SELECT family_id, min(created_at) AS signed_in_at, max(created_at) AS last_seen_at,
              (array_agg(user_agent ORDER BY created_at DESC))[1] AS user_agent
       FROM sessions WHERE user_id = $1
       GROUP BY family_id
       HAVING bool_or(revoked_at IS NULL AND expires_at > now())
       ORDER BY max(created_at) DESC`,
      [c.var.userId],
    );
    return c.json({
      sessions: rows.map((s) => ({
        id: s.family_id,
        device: describeDevice(s.user_agent),
        signedInAt: new Date(s.signed_in_at).toISOString(),
        lastSeenAt: new Date(s.last_seen_at).toISOString(),
        current: s.family_id === c.var.family,
      })),
    });
  });

  r.delete('/sessions/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    await db.query('UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND family_id = $2 AND revoked_at IS NULL', [
      c.var.userId,
      c.req.valid('param').id,
    ]);
    return c.body(null, 204);
  });

  /** Everything Cliq stores about you, as one JSON file. Other people's messages to you are included; their profiles aren't. */
  r.get('/export', async (c) => {
    const me = c.var.userId;
    const [account, profile, swipes, matches, messages, blocks, reports] = await Promise.all([
      db.one('SELECT email, email_verified_at, created_at, notify_matches, notify_messages, apple_sub IS NOT NULL AS apple, google_sub IS NOT NULL AS google FROM users WHERE id = $1', [me]),
      load(me),
      db.query('SELECT target_id, liked, created_at FROM swipes WHERE swiper_id = $1 ORDER BY created_at', [me]),
      db.query(
        `SELECT m.id, m.created_at, m.ended_at, p.display_name AS with_name FROM matches m
         JOIN profiles p ON p.user_id = CASE WHEN m.user_a = $1 THEN m.user_b ELSE m.user_a END
         WHERE m.user_a = $1 OR m.user_b = $1 ORDER BY m.created_at`,
        [me],
      ),
      db.query(
        `SELECT x.match_id, x.sender_id = $1 AS from_me, x.body, x.created_at, x.read_at FROM messages x
         JOIN matches m ON m.id = x.match_id WHERE m.user_a = $1 OR m.user_b = $1 ORDER BY x.created_at`,
        [me],
      ),
      db.query('SELECT blocked_id, created_at FROM blocks WHERE blocker_id = $1', [me]),
      db.query('SELECT target_id, reason, created_at FROM reports WHERE reporter_id = $1', [me]),
    ]);
    c.header('Content-Disposition', 'attachment; filename="cliq-data.json"');
    return c.json({
      exportedAt: new Date().toISOString(),
      account,
      profile: profile && { ...toProfile(profile), lat: profile.lat, lng: profile.lng },
      swipes,
      matches: matches.map((m) => ({ ...m, messages: messages.filter((x) => x.match_id === m.id) })),
      blocks,
      reports,
    });
  });

  return r;
}
