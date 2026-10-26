import { secureStorage } from '@/lib/storage';

export type Appearance = 'system' | 'light' | 'dark';
const KEY = 'cliq.appearance';

export const appearanceStore = {
  async get(): Promise<Appearance> {
    const v = await secureStorage.get(KEY).catch(() => null);
    return v === 'light' || v === 'dark' ? v : 'system';
  },
  set: (v: Appearance) => secureStorage.set(KEY, v),
};
