import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";

import { colors } from "@/theme/colors";

// Whether the OS can render Apple's real Liquid Glass (iOS 26+, dev build).
const canUseLiquidGlass = isLiquidGlassAvailable();

/** Clean solid card used where Apple Liquid Glass isn't available. */
const SURFACE = "#171E36";
const BORDER = "rgba(255,255,255,0.08)";

/**
 * Split className into margin utilities (applied to the OUTER container so they
 * space this surface from siblings) and the rest (padding/layout for the inner
 * content). This makes `className="mb-5 p-4"` behave intuitively.
 */
function splitMargins(className?: string): { margin: string; rest: string } {
  if (!className) return { margin: "", rest: "" };
  const margin: string[] = [];
  const rest: string[] = [];
  for (const cls of className.split(/\s+/)) {
    if (/^-?m[tblrxyes]?-/.test(cls)) margin.push(cls);
    else if (cls) rest.push(cls);
  }
  return { margin: margin.join(" "), rest: rest.join(" ") };
}

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  /**
   * NativeWind classes. Padding/layout (p-*, gap-*, items-*, flex-row) apply to
   * the inner content; margin utilities (m*-) are auto-routed to the OUTER
   * container so they space this surface from its siblings as expected.
   */
  className?: string;
  /** Extra style for the OUTER container. */
  style?: StyleProp<ViewStyle>;
  radius?: number;
  /** iOS 26 glass style. */
  glassStyle?: "regular" | "clear";
  /** Enables the interactive (touch-reactive) liquid glass on iOS 26. */
  interactive?: boolean;
  /** iOS 26 glass tint. */
  tintColor?: string;
  bordered?: boolean;
  /** Solid background for the non-glass fallback (defaults to the card color). */
  surfaceColor?: string;
}

/**
 * A surface that is Apple's native Liquid Glass on iOS 26+, and a clean solid
 * card everywhere else (Android, older iOS, Expo Go). No custom/emulated glass.
 */
export function GlassSurface({
  children,
  className,
  style,
  radius = 24,
  glassStyle = "regular",
  interactive = false,
  tintColor,
  bordered = true,
  surfaceColor,
}: GlassSurfaceProps) {
  const { margin, rest } = splitMargins(className);
  return (
    <View
      className={margin || undefined}
      style={[
        { borderRadius: radius, overflow: "hidden" },
        bordered && { borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER },
        style,
      ]}
    >
      {canUseLiquidGlass ? (
        <GlassView
          style={StyleSheet.absoluteFill}
          glassEffectStyle={glassStyle}
          isInteractive={interactive}
          tintColor={tintColor}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: surfaceColor ?? SURFACE },
          ]}
        />
      )}
      <View className={rest || undefined}>{children}</View>
    </View>
  );
}

export { colors };
