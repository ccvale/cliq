import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { validate as zValidator } from '../lib/validate.js';
import { z } from 'zod';
import type { Db, Row } from '../db.js';
import { rateLimit, requireAuth, requireVerified, type AuthEnv } from '../auth/middleware.js';
import { photoUrl } from './photos.js';
import { ageBand, ageOn } from '../lib/age.js';
import { distanceLabel, distanceMiles } from '../lib/geo.js';
import { score } from '../lib/scoring.js';
import { sendPush, type Hub } from '../realtime.js';
import { BADGES_SQL, awardLater } from '../lib/achievements.js';
import type { FeaturedDto } from './search.js';

export type CardDto = {
  id: string;
  displayName: string;
  age: number;
  bio: string;
  gigTitle: string;
  gigPlace: string;
  interests: string[];
  sharedInterests: string[];
  palette: [string, string];
  city: string;
  distance: string;
  photoUrl: string | null;
  prompts: { id: string; answer: string }[];
  featured: FeaturedDto | null;
  badges: string[];
};

export function discoverRoutes(db: Db, hub: Hub) {
  const r = new Hono<AuthEnv>();
  // Mounted at the root, so guard only this router's paths (not /ws or /health).
  r.use('/discover', requireAuth);
  r.use('/swipes', requireAuth, requireVerified(db));
  r.use('/swipes/*', requireAuth);
  const swipeLimit = rateLimit({ limit: 120, windowMs: 60_000, perUser: true, message: 'Slow down a little. Take a minute to read some profiles.' });

  r.get('/discover', zValidator('query', z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) })), async (c) => {
    const me = await db.one('SELECT * FROM profiles WHERE user_id = $1', [c.var.userId]);
    if (!me?.onboarded) return c.json({ cards: [], reason: 'finish-profile' });
    const myAge = ageOn(me.birthday);
    const myBand = ageBand(myAge);
    const myInterests = new Set<string>(me.interests);

    // Coarse bounding box first so Postgres does the heavy filtering; exact distance is checked below.
    const latSpan = me.max_distance_mi / 69;
    const lngSpan = me.max_distance_mi / (69 * Math.max(0.1, Math.cos((me.lat * Math.PI) / 180)));
    const candidates = await db.query(
      `SELECT p.*, ph.updated_at AS photo_at, ${BADGES_SQL}, EXISTS (SELECT 1 FROM swipes s WHERE s.swiper_id = p.user_id AND s.target_id = $1 AND s.liked) AS liked_you
       FROM profiles p
       LEFT JOIN photos ph ON ph.user_id = p.user_id
       WHERE p.onboarded AND p.user_id <> $1
         AND p.lat BETWEEN $2 AND $3 AND p.lng BETWEEN $4 AND $5
         AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.swiper_id = $1 AND s.target_id = p.user_id)
         AND (p.snoozed_until IS NULL OR p.snoozed_until < now())
         AND (SELECT count(DISTINCT reporter_id) FROM reports WHERE target_id = p.user_id) < 3
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = $1 AND b.blocked_id = p.user_id) OR (b.blocker_id = p.user_id AND b.blocked_id = $1))
         AND NOT EXISTS (SELECT 1 FROM matches m WHERE (m.user_a = $1 AND m.user_b = p.user_id) OR (m.user_b = $1 AND m.user_a = p.user_id))
       LIMIT 500`,
      [c.var.userId, me.lat - latSpan, me.lat + latSpan, me.lng - lngSpan, me.lng + lngSpan],
    );

    const scored: { card: CardDto; score: number }[] = [];
    for (const p of candidates) {
      const age = ageOn(p.birthday);
      if (ageBand(age) !== myBand) continue;
      // Both people's preferences have to allow the pairing.
      if (age < me.age_min || age > me.age_max || myAge < p.age_min || myAge > p.age_max) continue;
      const miles = distanceMiles(me as any, p as any);
      if (miles > me.max_distance_mi || miles > p.max_distance_mi) continue;
      const shared = (p.interests as string[]).filter((i) => myInterests.has(i));
      scored.push({
        card: toCard(p, age, miles, shared),
        score: score({
          likedYou: p.liked_you,
          sharedInterests: shared.length,
          totalInterests: Math.min(myInterests.size, p.interests.length),
          ageGap: Math.abs(age - myAge),
          miles,
          maxMiles: me.max_distance_mi,
          samePlace: !!me.gig_place && me.gig_place.toLowerCase() === p.gig_place.toLowerCase(),
          sameTitle: !!me.gig_title && me.gig_title.toLowerCase() === p.gig_title.toLowerCase(),
          daysSinceActive: (Date.now() - new Date(p.last_active_at).getTime()) / 86_400_000,
        }),
      });
    }
    scored.sort((a, b) => b.score - a.score);
    return c.json({ cards: scored.slice(0, c.req.valid('query').limit).map((s) => s.card) });
  });

  r.post('/swipes', swipeLimit, zValidator('json', z.object({ targetId: z.string().uuid(), liked: z.boolean() })), async (c) => {
    const { targetId, liked } = c.req.valid('json');
    const me = c.var.userId;
    if (targetId === me) throw new HTTPException(400, { message: 'You can’t swipe on yourself' });
    const target = await db.one(
      `SELECT display_name FROM profiles WHERE user_id = $1 AND onboarded
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = $1 AND b.blocked_id = $2) OR (b.blocker_id = $2 AND b.blocked_id = $1))`,
      [targetId, me],
    );
    if (!target) throw new HTTPException(404, { message: 'That person is no longer on Cliq' });

    const match = await db.tx(async (t) => {
      await t.query(
        `INSERT INTO swipes (swiper_id, target_id, liked) VALUES ($1, $2, $3)
         ON CONFLICT (swiper_id, target_id) DO UPDATE SET liked = EXCLUDED.liked, created_at = now()`,
        [me, targetId, liked],
      );
      if (!liked) return null;
      const mutual = await t.one('SELECT 1 FROM swipes WHERE swiper_id = $1 AND target_id = $2 AND liked', [targetId, me]);
      if (!mutual) return null;
      const [a, b] = me < targetId ? [me, targetId] : [targetId, me];
      return t.one<{ id: string }>(
        `INSERT INTO matches (user_a, user_b) VALUES ($1, $2) ON CONFLICT (user_a, user_b) DO NOTHING RETURNING id`,
        [a, b],
      );
    });

    if (match) {
      const mine = await db.one('SELECT display_name FROM profiles WHERE user_id = $1', [me]);
      hub.emit(targetId, { type: 'match:new', matchId: match.id, withUserId: me });
      hub.emit(me, { type: 'match:new', matchId: match.id, withUserId: targetId });
      if (!hub.isOnline(targetId)) {
        void sendPush(db, targetId, {
          title: 'You clicked with someone ✨',
          body: `You and ${mine?.display_name} both want to hang out. Say hi!`,
          data: { matchId: match.id },
          kind: 'match',
        });
      }
    }
    if (match) awardLater(db, hub, me, targetId);
    else awardLater(db, hub, me);
    return c.json({ matchId: match?.id ?? null });
  });

  // Takes back your most recent swipe, within a few minutes and only if it didn't make a match.
  r.post('/swipes/undo', async (c) => {
    const me = c.var.userId;
    const last = await db.one<{ target_id: string }>(
      `SELECT target_id FROM swipes WHERE swiper_id = $1 AND created_at > now() - interval '10 minutes' ORDER BY created_at DESC LIMIT 1`,
      [me],
    );
    if (!last) throw new HTTPException(404, { message: 'Nothing to undo' });
    const matched = await db.one(
      `SELECT 1 FROM matches WHERE (user_a = $1 AND user_b = $2) OR (user_a = $2 AND user_b = $1)`,
      [me, last.target_id],
    );
    if (matched) throw new HTTPException(409, { message: 'You already clicked with them, so that one stays' });
    await db.query('DELETE FROM swipes WHERE swiper_id = $1 AND target_id = $2', [me, last.target_id]);
    return c.json({ targetId: last.target_id });
  });

  return r;
}

export function toCard(p: Row, age: number, miles: number, shared: string[]): CardDto {
  return {
    id: p.user_id,
    displayName: p.display_name,
    age,
    bio: p.bio,
    gigTitle: p.gig_title,
    gigPlace: p.gig_place,
    interests: p.interests,
    sharedInterests: shared,
    palette: p.palette,
    city: p.city,
    distance: distanceLabel(miles),
    photoUrl: photoUrl(p.user_id, p.photo_at),
    prompts: p.prompts ?? [],
    featured: p.featured ?? null,
    badges: p.badges ?? [],
  };
}
