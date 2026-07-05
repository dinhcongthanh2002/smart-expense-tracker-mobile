import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "./constants";
import type { UserViewModel } from "@/store/user/model";

// SecureStore is unavailable on web; fall back to AsyncStorage there.
const isWeb = Platform.OS === "web";

async function secureGet(key: string): Promise<string | null> {
  if (isWeb) return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}
async function secureSet(key: string, value: string): Promise<void> {
  if (isWeb) return AsyncStorage.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
}
async function secureDelete(key: string): Promise<void> {
  if (isWeb) return AsyncStorage.removeItem(key);
  return SecureStore.deleteItemAsync(key);
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
  ]);
}
