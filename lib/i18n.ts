import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "./constants";
import { setLanguage } from "./api";
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

/** Apply a language locally: i18n, persisted storage, and the API Accept-Language header.
 * Server-side persistence + the confirmation toast live in the `changeLanguage` store thunk. */
export async function applyLanguage(lng: AppLanguage) {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(STORAGE_KEYS.language, lng);
  setLanguage(lng);
}

export default i18n;
