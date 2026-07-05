import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  FadeInUp,
  FadeOutUp,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { subscribeToast, type ToastMessage } from "@/lib/notify";
import { colors } from "@/theme/colors";
import { GlassSurface } from "./GlassSurface";

const ICON: Record<ToastMessage["type"], keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "alert-circle",
  info: "information-circle",
};
const TINT: Record<ToastMessage["type"], string> = {
  success: colors.income,
  error: colors.expense,
  info: colors.primary,
};

/** Mount once at the app root; renders toasts pushed via notify.*. */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return subscribeToast((toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3200);
    });
  }, []);

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: insets.top + 8, left: 16, right: 16 }}
    >
      {toasts.map((toast) => (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.springify().damping(18)}
          exiting={FadeOutUp}
          style={{ marginBottom: 8 }}
        >
          <GlassSurface radius={18}>
            <View className="flex-row items-center gap-3 px-4 py-3">
              <Ionicons
                name={ICON[toast.type]}
                size={22}
                color={TINT[toast.type]}
              />
              <Text className="flex-1 text-sm font-medium text-ink">
                {toast.message}
              </Text>
            </View>
          </GlassSurface>
        </Animated.View>
      ))}
    </View>
  );
}
