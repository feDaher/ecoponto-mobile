import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { logger } from '@/core/logger';

/** Minimal key/value storage contract used by the infrastructure. */
export interface KeyValueStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/**
 * Secure storage for credentials and session.
 *
 * Native: Keychain (iOS) / EncryptedSharedPreferences (Android) via
 * `expo-secure-store`. Web: `AsyncStorage` (localStorage) — the browser offers
 * no encrypted equivalent, so **never** store anything here beyond the token
 * and the user's already-public profile.
 *
 * Every operation is failure tolerant: unavailable storage drops the
 * session, not the app.
 */
class SecureStorage implements KeyValueStorage {
  private readonly usesSecureStore = Platform.OS !== 'web';

  async get(key: string): Promise<string | null> {
    try {
      return this.usesSecureStore
        ? await SecureStore.getItemAsync(key)
        : await AsyncStorage.getItem(key);
    } catch (cause) {
      logger.warn('Falha ao ler do armazenamento seguro', { key, cause: String(cause) });
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      if (this.usesSecureStore) await SecureStore.setItemAsync(key, value);
      else await AsyncStorage.setItem(key, value);
    } catch (cause) {
      logger.warn('Falha ao gravar no armazenamento seguro', { key, cause: String(cause) });
    }
  }

  async remove(key: string): Promise<void> {
    try {
      if (this.usesSecureStore) await SecureStore.deleteItemAsync(key);
      else await AsyncStorage.removeItem(key);
    } catch (cause) {
      logger.warn('Falha ao remover do armazenamento seguro', { key, cause: String(cause) });
    }
  }
}

export const secureStorage: KeyValueStorage = new SecureStorage();

export const STORAGE_KEYS = {
  session: 'ecoponto.session',
  token: 'ecoponto.token',
  lgpdConsent: 'ecoponto.lgpd.consent',
} as const;
