import type { WSContext } from 'hono/ws';
import type { Db } from './db.js';

export type ServerEvent =
  | { type: 'match:new'; matchId: string; withUserId: string }
  | { type: 'match:ended'; matchId: string }
  | { type: 'message:new'; message: MessageDto }
  | { type: 'message:read'; matchId: string; readerId: string; at: string }
  | { type: 'typing'; matchId: string; userId: string }
  | { type: 'presence'; userId: string; online: boolean; lastActiveAt: string };

export type MediaDto = { url: string; width: number; height: number };
export type MessageDto = {
  id: string;
  matchId: string;
  senderId: string;
  kind: 'text' | 'image' | 'gif';
  body: string;
  media: MediaDto | null;
  createdAt: string;
  readAt: string | null;
};

/** Tracks live sockets per user. A user can be connected from several devices at once. */
export class Hub {
  private sockets = new Map<string, Set<WSContext>>();

  /** Returns true when this is the user's first live socket, i.e. they just came online. */
  add(userId: string, ws: WSContext) {
    let set = this.sockets.get(userId);
    const first = !set;
    if (!set) this.sockets.set(userId, (set = new Set()));
    set.add(ws);
    return first;
  }

  /** Returns true when that was the user's last socket, i.e. they just went offline. */
  remove(userId: string, ws: WSContext) {
    const set = this.sockets.get(userId);
    if (!set?.delete(ws)) return false;
    if (set.size === 0) {
      this.sockets.delete(userId);
      return true;
    }
    return false;
  }

  isOnline(userId: string) {
    return this.sockets.has(userId);
  }

  emit(userId: string, event: ServerEvent) {
    const payload = JSON.stringify(event);
    for (const ws of this.sockets.get(userId) ?? []) {
      try {
        ws.send(payload);
      } catch {
        // A socket that died mid-send is cleaned up by its close handler.
      }
    }
  }
}

/**
 * Tells everyone someone is matched with that they came online or went offline.
 * People who switched off "Show when I'm active" are never announced.
 */
export async function announcePresence(db: Db, hub: Hub, userId: string, online: boolean) {
  const me = await db.one<{ show_activity: boolean; last_active_at: string }>(
    'UPDATE profiles p SET last_active_at = now() FROM users u WHERE u.id = p.user_id AND p.user_id = $1 RETURNING u.show_activity, p.last_active_at',
    [userId],
  );
  if (!me?.show_activity) return;
  const friends = await db.query<{ other: string }>(
    `SELECT CASE WHEN user_a = $1 THEN user_b ELSE user_a END AS other FROM matches WHERE (user_a = $1 OR user_b = $1) AND ended_at IS NULL`,
    [userId],
  );
  const lastActiveAt = new Date(me.last_active_at).toISOString();
  for (const { other } of friends) hub.emit(other, { type: 'presence', userId, online, lastActiveAt });
}

type Push = { title: string; body: string; data?: Record<string, unknown>; kind: 'match' | 'message' };

/** Sends Expo push notifications to every device the user registered. Failures are logged, never thrown. */
export async function sendPush(db: Db, userId: string, push: Push) {
  if (process.env.DISABLE_PUSH === '1') return;
  const prefs = await db.one<{ notify_matches: boolean; notify_messages: boolean }>(
    'SELECT notify_matches, notify_messages FROM users WHERE id = $1',
    [userId],
  );
  if (!prefs || !(push.kind === 'match' ? prefs.notify_matches : prefs.notify_messages)) return;
  const tokens = await db.query<{ token: string }>('SELECT token FROM push_tokens WHERE user_id = $1', [userId]);
  if (!tokens.length) return;
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(tokens.map(({ token }) => ({ to: token, sound: 'default', title: push.title, body: push.body, data: push.data }))),
    });
    const json: any = await res.json().catch(() => ({}));
    // Drop tokens Expo reports as no longer registered so we stop sending to uninstalled apps.
    for (const [i, ticket] of (json?.data ?? []).entries()) {
      if (ticket?.details?.error === 'DeviceNotRegistered') {
        await db.query('DELETE FROM push_tokens WHERE token = $1', [tokens[i]?.token]);
      }
    }
  } catch (err) {
    console.warn('push failed', err);
  }
}
