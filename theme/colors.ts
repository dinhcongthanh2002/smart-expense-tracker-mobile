import { vars } from "nativewind";

import {
    dark,
    light,
    gradients as themeGradients,
    themes,
    type ThemeColors,
    type ThemeGradients,
    type ThemeScheme,
} from "./themes";

let activeScheme: ThemeScheme = "dark";
let activeColors: ThemeColors = dark;
let activeGradients: ThemeGradients = themeGradients.dark;

export function setActiveThemeScheme(scheme: ThemeScheme) {
  if (scheme === activeScheme) return;
  activeScheme = scheme;
  activeColors = themes[scheme];
  activeGradients = themeGradients[scheme];
}

export function getActiveThemeScheme(): ThemeScheme {
  return activeScheme;
}

function getThemeValue<T extends object>(current: T, key: keyof T) {
  return current[key];
}

export const colors = new Proxy({} as ThemeColors, {
  get(_target, prop: string | symbol) {
    if (typeof prop !== "string") return undefined;
    return getThemeValue(activeColors, prop as keyof ThemeColors);
  },
}) as ThemeColors;

export const gradients = new Proxy({} as ThemeGradients, {
  get(_target, prop: string | symbol) {
    if (typeof prop !== "string") return undefined;
    return getThemeValue(activeGradients, prop as keyof ThemeGradients);
  },
}) as ThemeGradients;

export function themeToVars(theme: ThemeColors) {
  return vars({
    "--background": theme.background,
    "--surface": theme.surface,
    "--scrim": theme.scrim,
    "--primary": theme.primary,
    "--primary-soft": theme.primarySoft,
    "--primary-dark": theme.primaryDark,
    "--income": theme.income,
    "--expense": theme.expense,
    "--transfer": theme.transfer,
    "--warning": theme.warning,
    "--ink": theme.ink,
    "--muted": theme.muted,
    "--glass-surface": theme.glassSurface,
    "--glass-border": theme.glassBorder,
    "--glass-tint": theme.glassTint,
  });
}

export type { ThemeColors, ThemeGradients, ThemeScheme } from "./themes";
export { dark, light, themes };

