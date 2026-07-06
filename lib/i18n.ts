import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "./constants";
import { API, setLanguage } from "./api";
import { getAuthTokenSync } from "./secure-storage";
import { routerLinks } from "./router-links";
import { resources } from "@/locales";

export const SUPPORTED_LANGUAGES = ["vi", "en"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  vi: "Tiếng Việt",
  en: "English",
};

/** Read the device locale via core React Native modules (no extra native dep). */
function deviceLanguage(): AppLanguage {
  try {
    const raw =
      Platform.OS === "ios"
        ? NativeModules.SettingsManager?.settings?.AppleLocale ??
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;
    if (typeof raw === "string" && raw.toLowerCase().startsWith("en")) return "en";
  } catch {
    // fall through to default
  }
  return "vi";
}

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage(),
  fallbackLng: "vi",
  supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
  // Hermes lacks Intl.PluralRules; v3 uses i18next's built-in plural resolver
  // (plural keys use the `_plural` suffix, not `_one`/`_other`).
  compatibilityJSON: "v3",
  interpolation: { escapeValue: false },
  returnNull: false,
});

// A persisted choice overrides the device default once storage is read.
AsyncStorage.getItem(STORAGE_KEYS.language).then((saved) => {
  if (saved && saved !== i18n.language && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) {
    i18n.changeLanguage(saved);
  }
  setLanguage(i18n.language);
});

/** Change the app language, persist it, and update the API Accept-Language header. */
export async function changeLanguage(lng: AppLanguage) {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(STORAGE_KEYS.language, lng);
  setLanguage(lng);
  // Persist to the server (best-effort) so background jobs — budget alerts and the
  // monthly summary email — are sent in the chosen language. Every request already
  // carries the Accept-Language header, so this only needs to run when logged in.
  if (getAuthTokenSync()) {
    try {
      await API.put(`${routerLinks("User")}/language`, { language: lng });
    } catch {
      // ignore — the header still localizes live responses; jobs sync on next login
    }
  }
}

export default i18n;
