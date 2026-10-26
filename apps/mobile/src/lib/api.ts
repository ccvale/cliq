import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { secureStorage } from './storage';
import { demoApi } from './demo';
import type { Achievement, AuthResult, BlockedPerson, Card, Device, Featured, FeaturedKind, Gif, MatchSummary, Me, Media, Message, Profile, ProfilePatch } from './types';

/** In development the API runs on the same machine as Metro, so reuse the host the device already reaches. */
function resolveBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (Platform.OS === 'web') return `${globalThis.location?.protocol ?? 'http:'}//${globalThis.location?.hostname ?? 'localhost'}:4000`;
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:4000`;
}

/** Demo builds run entirely in the browser against seeded data (see demo.ts). */
export const DEMO = process.env.EXPO_PUBLIC_DEMO === '1';
export const API_URL = resolveBaseUrl();
const REFRESH_KEY = 'cliq.refresh';

export class ApiError extends Error {
  /** Machine-readable reason from the server, such as 'verify-email'. */
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

/** Photo URLs from the API are relative; demo photos are already absolute (data: or blob:). */
export const photoSource = (url: string | null | undefined) => (url ? { uri: url.startsWith('/') ? `${API_URL}${url}` : url } : null);

type Tokens = { accessToken: string; refreshToken: string };
let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
let onSignedOut: (() => void) | null = null;

export const session = {
  async restore() {
    if (DEMO) return false;
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
  const raw = body instanceof Blob;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'content-type': raw ? body.type || 'image/jpeg' : 'application/json' } : {}),
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
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
    throw new ApiError(res.status, typeof data?.error === 'string' ? data.error : 'Something went wrong', data?.code);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const realApi = {
  signUp: (email: string, password: string) => request<Tokens>('POST', '/auth/signup', { email, password }),
  signIn: (email: string, password: string) => request<AuthResult>('POST', '/auth/signin', { email, password }),
  sendSignInCode: (email: string) => request<void>('POST', '/auth/code/send', { email }),
  signInWithCode: (email: string, code: string) => request<AuthResult>('POST', '/auth/code/verify', { email, code }),
  verifyTwoFactor: (mfaToken: string, code: string) => request<Tokens>('POST', '/auth/2fa', { mfaToken, code }),
  signInWithApple: (identityToken: string, givenName?: string) =>
    request<AuthResult>('POST', '/auth/apple', { identityToken, givenName }),
  signInWithGoogle: (idToken: string) => request<AuthResult>('POST', '/auth/google', { idToken }),
  sendVerification: () => request<void>('POST', '/auth/email/send-verification'),
  verifyEmail: (code: string) => request<void>('POST', '/auth/email/verify', { code }),
  forgotPassword: (email: string) => request<void>('POST', '/auth/password/forgot', { email }),
  resetPassword: (email: string, code: string, password: string) =>
    request<AuthResult>('POST', '/auth/password/reset', { email, code, password }),
  signOut: () => request<void>('POST', '/auth/signout'),
  changePassword: (current: string | undefined, next: string) => request<void>('POST', '/auth/password', { current, next }),
  deleteAccount: (password?: string) => request<void>('DELETE', '/auth/account', { password }),

  me: () => request<Me>('GET', '/me'),
  updateProfile: (patch: ProfilePatch) => request<Profile>('PATCH', '/me/profile', patch),
  uploadPhoto: (photo: Blob) => request<{ photoUrl: string }>('PUT', '/me/photo', photo),
  deletePhoto: () => request<void>('DELETE', '/me/photo'),
  updateSettings: (patch: { notifyMatches?: boolean; notifyMessages?: boolean; liveLocation?: boolean; showActivity?: boolean; snoozeDays?: number }) =>
    request<void>('PATCH', '/me/settings', patch),
  achievements: () => request<{ achievements: Achievement[] }>('GET', '/me/achievements'),
  searchFeatured: (kind: FeaturedKind, q: string) =>
    request<{ results: Featured[] }>('GET', `/me/featured-search?kind=${kind}&q=${encodeURIComponent(q)}`),
  twoFactorSetup: () => request<{ secret: string; uri: string }>('POST', '/me/2fa/setup'),
  twoFactorEnable: (code: string) => request<{ backupCodes: string[] }>('POST', '/me/2fa/enable', { code }),
  twoFactorDisable: (code: string) => request<void>('POST', '/me/2fa/disable', { code }),
  devices: () => request<{ sessions: Device[] }>('GET', '/me/sessions'),
  signOutDevice: (id: string) => request<void>('DELETE', `/me/sessions/${id}`),
  exportData: () => request<unknown>('GET', '/me/export'),
  blocked: () => request<{ blocks: BlockedPerson[] }>('GET', '/blocks'),
  block: (id: string) => request<void>('POST', `/blocks/${id}`),
  unblock: (id: string) => request<void>('DELETE', `/blocks/${id}`),
  undoSwipe: () => request<{ targetId: string }>('POST', '/swipes/undo'),
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
  sendGif: (matchId: string, gif: Media) =>
    request<Message>('POST', `/matches/${matchId}/messages`, { gif: { url: gif.url, width: gif.width, height: gif.height } }),
  sendImage: (matchId: string, image: Blob, width: number, height: number) =>
    request<Message>('POST', `/matches/${matchId}/images?w=${Math.round(width)}&h=${Math.round(height)}`, image),
  searchGifs: (q: string) => request<{ gifs: Gif[] }>('GET', `/gifs?q=${encodeURIComponent(q)}`),
  markRead: (matchId: string) => request<void>('POST', `/matches/${matchId}/read`),
  unmatch: (matchId: string) => request<void>('DELETE', `/matches/${matchId}`),
  report: (targetId: string, reason: string) => request<void>('POST', '/reports', { targetId, reason }),
};

export const api: typeof realApi = DEMO ? (demoApi as unknown as typeof realApi) : realApi;
