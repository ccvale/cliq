import type { Db } from '../db.js';
import type { Hub } from '../realtime.js';

// Mirrored in apps/mobile/src/lib/catalog.ts (BADGES) — keep the ids in sync. Ids are stored, so never rename one.
export const BADGE_IDS = [
  'verified', 'first-match', 'first-message', 'first-block', 'all-about-me',
  'tastemaker', 'explorer', 'social-butterfly', 'chatterbox',
] as const;
export type BadgeId = (typeof BADGE_IDS)[number];

/**
 * Works out which badges a user has earned from what's already in the database, awards any new ones and tells
 * their devices. Deriving from data (rather than counting events) means it can be called from anywhere, any
 * number of times, and older accounts get their badges the first time it runs.
 */
export async function checkAchievements(db: Db, hub: Hub | null, userId: string): Promise<BadgeId[]> {
  const row = await db.one(
    `SELECT
       (SELECT email_verified_at IS NOT NULL FROM users WHERE id = $1) AS verified,
       (SELECT count(*)::int FROM matches WHERE user_a = $1 OR user_b = $1) AS matches,
       (SELECT count(*)::int FROM messages WHERE sender_id = $1) AS sent,
       (SELECT count(*)::int FROM blocks WHERE blocker_id = $1) AS blocks,
       (SELECT count(*)::int FROM swipes WHERE swiper_id = $1) AS swipes,
       p.bio <> '' AND jsonb_array_length(p.prompts) > 0 AND EXISTS (SELECT 1 FROM photos WHERE user_id = $1) AS complete,
       p.featured IS NOT NULL AS featured,
       (SELECT coalesce(array_agg(badge), '{}') FROM achievements WHERE user_id = $1) AS have
     FROM profiles p WHERE p.user_id = $1`,
    [userId],
  );
  if (!row) return [];
  const earned: Record<BadgeId, boolean> = {
    verified: row.verified,
    'first-match': row.matches >= 1,
    'first-message': row.sent >= 1,
    'first-block': row.blocks >= 1,
    'all-about-me': row.complete,
    tastemaker: row.featured,
    explorer: row.swipes >= 50,
    'social-butterfly': row.matches >= 5,
    chatterbox: row.sent >= 100,
  };
  const have = new Set<string>(row.have);
  const fresh = BADGE_IDS.filter((b) => earned[b] && !have.has(b));
  for (const badge of fresh) {
    await db.query('INSERT INTO achievements (user_id, badge) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, badge]);
    hub?.emit(userId, { type: 'achievement:new', badge });
  }
  return fresh;
}

/** Runs the check without making the request wait on it or fail because of it. */
export const awardLater = (db: Db, hub: Hub | null, ...userIds: string[]) => {
  for (const id of userIds) void checkAchievements(db, hub, id).catch((err) => console.warn('achievements', err));
};

/** SQL for a profile row's earned badges, oldest first. Expects the profile table aliased as `p`. */
export const BADGES_SQL = `(SELECT coalesce(array_agg(a.badge ORDER BY a.earned_at), '{}') FROM achievements a WHERE a.user_id = p.user_id) AS badges`;
