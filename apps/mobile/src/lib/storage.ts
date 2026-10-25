import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Secrets live in the iOS Keychain / Android Keystore. The web has no equivalent, so there the
 * refresh token falls back to localStorage — keep the access token short-lived for that reason.
 */
export const secureStorage = {
  async get(key: string) {
    if (Platform.OS === 'web') {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {}
      return;
    }
    await SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
  },
  async remove(key: string) {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {}
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
