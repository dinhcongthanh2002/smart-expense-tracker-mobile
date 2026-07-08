import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { useMemo } from "react";

import { useTypedSelector } from "@/store/hooks";
import {
    colors,
    gradients,
    setActiveThemeScheme,
    themeToVars,
} from "@/theme/colors";
import {
    themes,
    type ThemePreference,
    type ThemeScheme,
} from "@/theme/themes";

export type { ThemePreference, ThemeScheme } from "@/theme/themes";

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

export function resolveThemeScheme(
  preference: ThemePreference,
  deviceScheme: ThemeScheme | null | undefined,
): ThemeScheme {
  if (preference === "system") return deviceScheme === "dark" ? "dark" : "light";
  return preference;
}

export function useThemePalette() {
  const preference = useTypedSelector((state) => state.global.themeMode);
  const { colorScheme: deviceScheme } = useNativeWindColorScheme();
  const scheme = resolveThemeScheme(preference, deviceScheme);
  const palette = themes[scheme];
  const themeVars = useMemo(() => themeToVars(palette), [palette]);

  return {
    preference,
    scheme,
    isDark: scheme === "dark",
    colors,
    gradients,
    palette,
    themeVars,
    setActiveThemeScheme,
  };
}