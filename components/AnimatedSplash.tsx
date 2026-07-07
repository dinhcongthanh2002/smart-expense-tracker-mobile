import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { colors } from "@/theme/colors";

// Minimum time the branded splash stays on screen, so a fast session-restore
// doesn't make it flash for a single frame.
const MIN_VISIBLE_MS = 1200;

/**
 * Full-screen branded splash shown over the app while the session restores.
 * It renders the same logo as the native splash (assets/splash-icon.png) so the
 * hand-off from the OS splash is seamless, then fades the app in.
 *
 * `hold` keeps it visible (true while the app is still bootstrapping). When it
 * turns false — and the minimum time has elapsed — the overlay fades out and
 * calls `onFinish` so the parent can unmount it.
 */
export function AnimatedSplash({
  hold,
  onFinish,
}: {
  hold: boolean;
  onFinish: () => void;
}) {
  const { t } = useTranslation();
  const startRef = useRef(Date.now());
  const [exiting, setExiting] = useState(false);

  const containerOpacity = useSharedValue(1);
  const logoScale = useSharedValue(1);
  const textOpacity = useSharedValue(0);
  const textShift = useSharedValue(14);

  // Entrance: gentle logo "breathing" + text rising into place.
  useEffect(() => {
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 950, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 950, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    textOpacity.value = withDelay(180, withTiming(1, { duration: 520 }));
    textShift.value = withDelay(
      180,
      withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once bootstrapping is done (and min time passed), trigger the exit.
  useEffect(() => {
    if (hold || exiting) return;
    const elapsed = Date.now() - startRef.current;
    const timer = setTimeout(
      () => setExiting(true),
      Math.max(0, MIN_VISIBLE_MS - elapsed),
    );
    return () => clearTimeout(timer);
  }, [hold, exiting]);

  // Exit: subtle zoom + fade, then notify the parent.
  useEffect(() => {
    if (!exiting) return;
    logoScale.value = withTiming(1.12, { duration: 450, easing: Easing.in(Easing.quad) });
    containerOpacity.value = withTiming(
      0,
      { duration: 450, easing: Easing.in(Easing.quad) },
      (finished) => {
        if (finished) runOnJS(onFinish)();
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exiting]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.value }] }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textShift.value }],
  }));

  return (
    <Animated.View
      pointerEvents={exiting ? "none" : "auto"}
      style={[StyleSheet.absoluteFill, styles.container, containerStyle]}
    >
      <Animated.View style={logoStyle}>
        <Image
          source={require("@/assets/splash-icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.textWrap, textStyle]}>
        <Text style={styles.title}>Smart Expense</Text>
        <Text style={styles.tagline}>{t("auth.signIn.tagline")}</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotMid]} />
        <View style={styles.dot} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 200, height: 200 },
  textWrap: { marginTop: 8, alignItems: "center" },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  tagline: { color: colors.muted, fontSize: 14, marginTop: 6 },
  footer: {
    position: "absolute",
    bottom: 64,
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.glassBorder,
  },
  dotMid: { backgroundColor: colors.primary },
});
