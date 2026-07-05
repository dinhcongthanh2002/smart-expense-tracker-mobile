// Kept in sync with tailwind.config.js. Used where a raw color value is needed
// (charts, gradients, vector icons, native props) instead of a className.
export const colors = {
  background: "#0B1020",
  surface: "#141A2E",
  primary: "#6C7CFF",
  primarySoft: "#8B96FF",
  primaryDark: "#4C5BD4",
  income: "#34D399",
  expense: "#FB7185",
  transfer: "#38BDF8",
  warning: "#FBBF24",
  ink: "#F5F7FF",
  muted: "#9AA3BE",
  glassTint: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.14)",
} as const;

export const gradients = {
  screen: ["#0B1020", "#131A33", "#0B1020"] as const,
  primary: ["#6C7CFF", "#8B5CF6"] as const,
  income: ["#34D399", "#10B981"] as const,
  expense: ["#FB7185", "#F43F5E"] as const,
  card: ["rgba(108,124,255,0.25)", "rgba(139,92,246,0.10)"] as const,
};
