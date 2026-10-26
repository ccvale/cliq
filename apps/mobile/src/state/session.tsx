import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { api, session } from '@/lib/api';
import { realtime } from '@/lib/realtime';
import { registerForPush } from '@/lib/push';
import { secureStorage } from '@/lib/storage';
import { router } from 'expo-router';
import type { AuthResult, Me, Profile } from '@/lib/types';

type Status = 'loading' | 'signedOut' | 'signedIn';

type SessionValue = {
  status: Status;
  me: Me | null;
  locked: boolean;
  biometricLock: boolean;
  completeSignIn: (result: AuthResult) => Promise<void>;
  signOut: () => Promise<void>;
  reload: () => Promise<void>;
  setProfile: (profile: Profile) => void;
  setBiometricLock: (on: boolean) => Promise<void>;
  unlock: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);
const BIOMETRIC_KEY = 'cliq.biometricLock';
const LOCK_AFTER_MS = 30_000;

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [me, setMe] = useState<Me | null>(null);
  const [biometricLock, setBiometricLockState] = useState(false);
  const [locked, setLocked] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  const reset = useCallback(async () => {
    realtime.stop();
    await session.clear();
    setMe(null);
    setStatus('signedOut');
  }, []);

  const loadMe = useCallback(async () => {
    const next = await api.me();
    setMe(next);
    setStatus('signedIn');
    realtime.start();
    if (next.profile.onboarded) void registerForPush({ prompt: false });
  }, []);

  useEffect(() => {
    session.onSignedOut(() => void reset());
    (async () => {
      const lockOn = Platform.OS !== 'web' && (await secureStorage.get(BIOMETRIC_KEY)) === '1';
      setBiometricLockState(lockOn);
      if (await session.restore()) {
        setLocked(lockOn);
        await loadMe().catch(() => reset());
      } else {
        setStatus('signedOut');
      }
    })();
  }, []);

  // Lock again when the app has been in the background for a while.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') backgroundedAt.current = Date.now();
      if (state === 'active' && backgroundedAt.current) {
        if (biometricLock && Date.now() - backgroundedAt.current > LOCK_AFTER_MS) setLocked(true);
        backgroundedAt.current = null;
      }
    });
    return () => sub.remove();
  }, [biometricLock]);

  const value: SessionValue = {
    status,
    me,
    locked: locked && status === 'signedIn',
    biometricLock,
    async completeSignIn(result) {
      // Two-step verification is on: ask for the authenticator code first.
      if ('mfaRequired' in result) {
        router.push({ pathname: '/two-factor', params: { token: result.mfaToken } });
        return;
      }
      await session.save(result);
      await loadMe();
    },
    async signOut() {
      await api.signOut().catch(() => {});
      await reset();
    },
    reload: loadMe,
    setProfile: (profile) => setMe((m) => (m ? { ...m, profile } : m)),
    async setBiometricLock(on) {
      if (on) {
        const ok = await LocalAuthentication.authenticateAsync({ promptMessage: 'Turn on Face ID for Cliq' });
        if (!ok.success) return;
      }
      await secureStorage.set(BIOMETRIC_KEY, on ? '1' : '0');
      setBiometricLockState(on);
    },
    async unlock() {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Cliq' });
      if (result.success) setLocked(false);
    },
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
