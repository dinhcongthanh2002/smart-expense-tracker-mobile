import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { cn } from "@/lib/cn";
import { colors, gradients } from "@/theme/colors";

interface ScreenProps {
  children: React.ReactNode;
  className?: string;
  edges?: Edge[];
  /** Decorative colored orbs behind the content give the glass something to
   * refract. Turn off for very content-dense screens. */
  orbs?: boolean;
}

export function Screen({
  children,
  className,
  edges = ["top"],
  orbs = true,
}: ScreenProps) {
  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={gradients.screen}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {orbs ? (
        <>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -80,
              right: -60,
              width: 260,
              height: 260,
              borderRadius: 130,
              backgroundColor: colors.primary,
              opacity: 0.35,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 120,
              left: -90,
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: "#8B5CF6",
              opacity: 0.25,
            }}
          />
        </>
      ) : null}
      <SafeAreaView edges={edges} style={{ flex: 1 }}>
        <View className={cn("flex-1", className)}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
