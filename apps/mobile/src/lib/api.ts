import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { secureStorage } from './storage';
import type { Card, MatchSummary, Me, Message, Profile, ProfilePatch } from './types';

/** In development the API runs on the same machine as Metro, so reuse the host the device already reaches. */
function resolveBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (Platform.OS === 'web') return `${globalThis.location?.protocol ?? 'http:'}//${globalThis.location?.hostname ?? 'localhost'}:4000`;
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:4000`;
}

export const API_URL = resolveBaseUrl();
const REFRESH_KEY = 'cliq.refresh';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Tokens = { accessToken: string; refreshToken: string };
let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
let onSignedOut: (() => void) | null = null;

export const session = {
  async restore() {
    return (await secureStorage.get(REFRESH_KEY)) ? refresh() : false;
  },
  async save(tokens: Tokens) {
    accessToken = tokens.accessToken;
    await secureStorage.set(REFRESH_KEY, tokens.refreshToken);
  },
  async clear() {
    accessToken = null;
    await secureStorage.remove(REFRESH_KEY);
  },
  token: () => accessToken,
  refresh: () => refresh(),
  onSignedOut(fn: () => void) {
    onSignedOut = fn;
  },
};

/** One refresh at a time: refresh tokens are single-use, so parallel refreshes would trip reuse detection. */
function refresh(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const refreshToken = await secureStorage.get(REFRESH_KEY);
      if (!refreshToken) return false;
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (res.status === 401) {
        await session.clear();
        return false;
      }
      if (!res.ok) return false;
      await session.save(await res.json());
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => (refreshing = null), 0);
    }
  })();
  return refreshing;
}

async function request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Can’t reach Cliq right now. Check your connection.');
  }
  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    if (await refresh()) return request<T>(method, path, body, false);
    onSignedOut?.();
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, typeof data?.error === 'string' ? data.error : 'Something went wrong');
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const api = {
  signUp: (email: string, password: string) => request<Tokens>('POST', '/auth/signup', { email, password }),
  signIn: (email: string, password: string) => request<Tokens>('POST', '/auth/signin', { email, password }),
  signInWithApple: (identityToken: string, givenName?: string) =>
    request<Tokens>('POST', '/auth/apple', { identityToken, givenName }),
  signOut: () => request<void>('POST', '/auth/signout'),
  changePassword: (current: string | undefined, next: string) => request<void>('POST', '/auth/password', { current, next }),
  deleteAccount: () => request<void>('DELETE', '/auth/account'),

  me: () => request<Me>('GET', '/me'),
  updateProfile: (patch: ProfilePatch) => request<Profile>('PATCH', '/me/profile', patch),
  registerPushToken: (token: string, platform: string) => request<void>('POST', '/me/push-token', { token, platform }),

  discover: () => request<{ cards: Card[]; reason?: string }>('GET', '/discover'),
  swipe: (targetId: string, liked: boolean) => request<{ matchId: string | null }>('POST', '/swipes', { targetId, liked }),

  matches: () => request<{ matches: MatchSummary[] }>('GET', '/matches'),
  messages: (matchId: string, before?: string) =>
    request<{ messages: Message[]; hasMore: boolean }>(
      'GET',
      `/matches/${matchId}/messages${before ? `?before=${encodeURIComponent(before)}` : ''}`,
    ),
  send: (matchId: string, body: string) => request<Message>('POST', `/matches/${matchId}/messages`, { body }),
  markRead: (matchId: string) => request<void>('POST', `/matches/${matchId}/read`),
  unmatch: (matchId: string) => request<void>('DELETE', `/matches/${matchId}`),
  report: (targetId: string, reason: string) => request<void>('POST', '/reports', { targetId, reason }),
};
