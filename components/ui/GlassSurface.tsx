import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";

import { colors } from "@/theme/colors";

// Resolve once — whether the OS can render Apple's real Liquid Glass (iOS 26+).
const canUseLiquidGlass = isLiquidGlassAvailable();

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  /** NativeWind classes applied to the inner content wrapper (e.g. padding). */
  className?: string;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  /** iOS 26 glass style. */
  glassStyle?: "regular" | "clear";
  /** Enables the interactive (touch-reactive) liquid glass on iOS 26. */
  interactive?: boolean;
  tintColor?: string;
  /** Blur strength for the non-iOS-26 fallback. */
  blurIntensity?: number;
  bordered?: boolean;
}

/**
 * Core Liquid Glass surface. On iOS 26+ it uses the native `GlassView`
 * (Apple's UIGlassEffect — same material as system apps). Elsewhere it falls
 * back to a translucent BlurView so the UI stays consistent.
 */
export function GlassSurface({
  children,
  className,
  style,
  radius = 24,
  glassStyle = "regular",
  interactive = false,
  tintColor,
  blurIntensity = 40,
  bordered = true,
}: GlassSurfaceProps) {
  return (
    <View
      style={[
        { borderRadius: radius, overflow: "hidden" },
        bordered && {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.glassBorder,
        },
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
        <>
          <BlurView
            intensity={blurIntensity}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: tintColor ?? colors.glassTint },
            ]}
          />
        </>
      )}
      <View className={className}>{children}</View>
    </View>
  );
}
