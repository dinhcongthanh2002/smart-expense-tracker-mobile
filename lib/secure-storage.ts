import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "./constants";
import type { UserViewModel } from "@/store/user/model";

// SecureStore is unavailable on web; fall back to AsyncStorage there.
const isWeb = Platform.OS === "web";

// Auth tokens are kept in SecureStore (Keychain) as the primary store, but we
// MIRROR them to AsyncStorage. Sideloaded iOS builds (SideStore / AltStore) get
// re-signed with a temporary certificate and frequently lose their Keychain
// items across launches, which would silently log the user out on every cold
// start. The AsyncStorage mirror (app-sandboxed file) survives that, so the
// session is restored on relaunch. Read prefers SecureStore, falls back to it.
async function secureGet(key: string): Promise<string | null> {
  if (isWeb) return AsyncStorage.getItem(key);
  try {
    const v = await SecureStore.getItemAsync(key);
    if (v != null) return v;
  } catch {
    // Keychain read failed (e.g. re-signed sideload) — use the mirror.
  }
  return AsyncStorage.getItem(key);
}
async function secureSet(key: string, value: string): Promise<void> {
  if (isWeb) return AsyncStorage.setItem(key, value);
  await AsyncStorage.setItem(key, value);
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Keychain write failed — the AsyncStorage mirror still keeps the session.
  }
}
async function secureDelete(key: string): Promise<void> {
  if (isWeb) return AsyncStorage.removeItem(key);
  await AsyncStorage.removeItem(key);
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}

// In-memory cache so the fetch header builder can read the token synchronously.
let tokenCache: string | null = null;

export const getAuthTokenSync = (): string | null => tokenCache;

/** Load persisted token into the in-memory cache (call once on app start). */
export async function bootstrapToken(): Promise<string | null> {
  tokenCache = await secureGet(STORAGE_KEYS.accessToken);
  return tokenCache;
}

export async function setAuthTokens(tokens: {
  tokenString?: string;
  refreshToken?: string;
}): Promise<void> {
  if (tokens.tokenString) {
    tokenCache = tokens.tokenString;
    await secureSet(STORAGE_KEYS.accessToken, tokens.tokenString);
  }
  if (tokens.refreshToken) {
    await secureSet(STORAGE_KEYS.refreshToken, tokens.refreshToken);
  }
}

export async function getRefreshToken(): Promise<string | null> {
  return secureGet(STORAGE_KEYS.refreshToken);
}

export async function setUser(user: UserViewModel): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export async function getUser(): Promise<UserViewModel | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.user);
  return raw ? (JSON.parse(raw) as UserViewModel) : null;
}

export async function clearAuthStorage(): Promise<void> {
  tokenCache = null;
  await Promise.all([
    secureDelete(STORAGE_KEYS.accessToken),
    secureDelete(STORAGE_KEYS.refreshToken),
    AsyncStorage.removeItem(STORAGE_KEYS.user),
    AsyncStorage.removeItem(STORAGE_KEYS.biometric),
  ]);
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.biometric, enabled ? "1" : "0");
}

export async function getBiometricEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(STORAGE_KEYS.biometric)) === "1";
}
