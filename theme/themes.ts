// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for every app color.
// Edit the palettes below to re-theme the whole app.
// The runtime layer reads from these tokens and exposes them to NativeWind and
// imperative consumers.
// ─────────────────────────────────────────────────────────────────────────────

export type ThemeScheme = "light" | "dark";
export type ThemePreference = ThemeScheme | "system";

export type ThemeColors = {
  background: string;
  surface: string;
  scrim: string;
  primary: string;
  primarySoft: string;
  primaryDark: string;
  income: string;
  expense: string;
  transfer: string;
  warning: string;
  ink: string;
  muted: string;
  /** Solid card background used when Apple Liquid Glass isn't available. */
  glassSurface: string;
  glassBorder: string;
  glassTint: string;
};

export type ThemeGradients = {
  screen: readonly [string, string, string];
  primary: readonly [string, string];
  income: readonly [string, string];
  expense: readonly [string, string];
  card: readonly [string, string];
};

// Brand accent — the jade "đ" logo colour. Shared by both schemes.
const brand = {
  primary: "#1D9E75",
  primarySoft: "#3FBF94",
  primaryDark: "#15795A",
} as const;

export const dark: ThemeColors = {
  background: "#0B1020",
  surface: "#141A2E",
  scrim: "rgba(7, 10, 20, 0.64)",
  ...brand,
  income: "#34D399",
  expense: "#FB7185",
  transfer: "#38BDF8",
  warning: "#FBBF24",
  ink: "#F5F7FF",
  muted: "#9AA3BE",
  glassSurface: "#171E36",
  glassBorder: "rgba(255,255,255,0.08)",
  glassTint: "rgba(255,255,255,0.06)",
};

export const light: ThemeColors = {
  background: "#F2F6FA",
  surface: "#FFFFFF",
  scrim: "rgba(15, 23, 41, 0.46)",
  ...brand,
  income: "#059669",
  expense: "#E11D48",
  transfer: "#0284C7",
  warning: "#D97706",
  ink: "#0F1729",
  muted: "#5B6478",
  glassSurface: "#FFFFFF",
  glassBorder: "rgba(15,23,41,0.08)",
  glassTint: "rgba(15,23,41,0.04)",
};

export const gradients: Record<ThemeScheme, ThemeGradients> = {
  dark: {
    screen: ["#0B1020", "#0E1A24", "#0B1020"],
    primary: ["#1D9E75", "#12B886"],
    income: ["#34D399", "#10B981"],
    expense: ["#FB7185", "#F43F5E"],
    card: ["rgba(29,158,117,0.22)", "rgba(18,184,134,0.08)"],
  },
  light: {
    screen: ["#F2F6FA", "#E8F1EE", "#F2F6FA"],
    primary: ["#1D9E75", "#12B886"],
    income: ["#10B981", "#059669"],
    expense: ["#F43F5E", "#E11D48"],
    card: ["rgba(29,158,117,0.12)", "rgba(18,184,134,0.05)"],
  },
};

export const themes: Record<ThemeScheme, ThemeColors> = { light, dark };
