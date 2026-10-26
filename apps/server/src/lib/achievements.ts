import type { Db } from '../db.js';

/** Mirrored in apps/mobile/src/lib/achievements.ts (titles and icons) — keep the ids in sync. */
export const ACHIEVEMENTS = [
  { id: 'first-click', title: 'First Click', description: 'Make your first match', target: 1 },
  { id: 'icebreaker', title: 'Icebreaker', description: 'Send your first message', target: 1 },
  { id: 'open-book', title: 'Open Book', description: 'Add a photo, a bio and a prompt', target: 3 },
  { id: 'explorer', title: 'Explorer', description: 'Look at 50 profiles', target: 50 },
  { id: 'deep-talk', title: 'Deep Talk', description: 'Trade 25 messages with one friend', target: 25 },
  { id: 'inner-circle', title: 'Inner Circle', description: 'Make 5 friends', target: 5 },
  { id: 'verified', title: 'Verified', description: 'Confirm your email address', target: 1 },
] as const;

export type AchievementId = (typeof ACHIEVEMENTS)[number]['id'];
export type Achievement = { id: AchievementId; title: string; description: string; earnedAt: string | null; progress: number; target: number };

/**
 * Works achievements out from what people have actually done, so there is nothing to award, backfill or get out of sync.
 * One query covers any number of people, which keeps Discover and the friends list to a single round trip.
 */
export async function achievementsFor(db: Db, userIds: string[]): Promise<Map<string, Achievement[]>> {
  const out = new Map<string, Achievement[]>();
  if (!userIds.length) return out;
  const rows = await db.query(
    `SELECT u.id,
       u.email_verified_at AS verified_at,
       (SELECT count(*)::int FROM matches m WHERE m.user_a = u.id OR m.user_b = u.id) AS match_count,
       (SELECT min(created_at) FROM matches m WHERE m.user_a = u.id OR m.user_b = u.id) AS first_match_at,
       (SELECT created_at FROM matches m WHERE m.user_a = u.id OR m.user_b = u.id ORDER BY created_at OFFSET 4 LIMIT 1) AS fifth_match_at,
       (SELECT min(created_at) FROM messages x WHERE x.sender_id = u.id) AS first_message_at,
       (SELECT count(*)::int FROM swipes s WHERE s.swiper_id = u.id) AS swipe_count,
       (SELECT created_at FROM swipes s WHERE s.swiper_id = u.id ORDER BY created_at OFFSET 49 LIMIT 1) AS fiftieth_swipe_at,
       (SELECT max(n)::int FROM (SELECT count(*) AS n FROM messages x JOIN matches m ON m.id = x.match_id
          WHERE m.user_a = u.id OR m.user_b = u.id GROUP BY x.match_id) t) AS longest_chat,
       (SELECT min(at) FROM (SELECT (array_agg(x.created_at ORDER BY x.created_at))[25] AS at FROM messages x JOIN matches m ON m.id = x.match_id
          WHERE m.user_a = u.id OR m.user_b = u.id GROUP BY x.match_id) t) AS deep_talk_at,
       (p.bio <> '')::int + (jsonb_array_length(p.prompts) > 0)::int + (ph.user_id IS NOT NULL)::int AS profile_parts,
       greatest(p.updated_at, ph.updated_at) AS profile_at
     FROM users u
     JOIN profiles p ON p.user_id = u.id
     LEFT JOIN photos ph ON ph.user_id = u.id
     WHERE u.id = ANY($1::uuid[])`,
    [userIds],
  );
  const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);
  for (const r of rows) {
    const state: Record<AchievementId, [number, string | null]> = {
      'first-click': [Math.min(r.match_count, 1), iso(r.first_match_at)],
      icebreaker: [r.first_message_at ? 1 : 0, iso(r.first_message_at)],
      'open-book': [r.profile_parts, r.profile_parts === 3 ? iso(r.profile_at) : null],
      explorer: [Math.min(r.swipe_count, 50), iso(r.fiftieth_swipe_at)],
      'deep-talk': [Math.min(r.longest_chat ?? 0, 25), iso(r.deep_talk_at)],
      'inner-circle': [Math.min(r.match_count, 5), iso(r.fifth_match_at)],
      verified: [r.verified_at ? 1 : 0, iso(r.verified_at)],
    };
    out.set(
      r.id,
      ACHIEVEMENTS.map((a) => ({ id: a.id, title: a.title, description: a.description, target: a.target, progress: state[a.id][0], earnedAt: state[a.id][1] })),
    );
  }
  return out;
}

/** Earned badge ids for each person, newest first, for showing on cards. */
export async function badgesFor(db: Db, userIds: string[]) {
  const all = await achievementsFor(db, userIds);
  return (id: string) =>
    (all.get(id) ?? [])
      .filter((a) => a.earnedAt)
      .sort((a, b) => b.earnedAt!.localeCompare(a.earnedAt!))
      .map((a) => a.id);
}
