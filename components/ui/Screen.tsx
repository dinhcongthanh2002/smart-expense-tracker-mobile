import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
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
    // A per-screen provider so sheets render inside this screen's view — the
    // root provider sits behind native modal screens (transaction-form, etc.),
    // which would leave the sheet hidden under the form.
    <BottomSheetModalProvider>
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
              backgroundColor: colors.primarySoft,
              opacity: 0.18,
            }}
          />
        </>
      ) : null}
      <SafeAreaView edges={edges} style={{ flex: 1 }}>
        <View className={cn("flex-1", className)}>{children}</View>
      </SafeAreaView>
    </View>
    </BottomSheetModalProvider>
  );
}
