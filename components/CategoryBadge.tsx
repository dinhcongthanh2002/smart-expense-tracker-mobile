import { View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "@/theme/colors";

interface CategoryBadgeProps {
  icon?: string;
  color?: string;
  size?: number;
}

/**
 * Circular category chip. The backend stores a Material Icons name in
 * Category.icon; we render it tinted by Category.color.
 */
export function CategoryBadge({
  icon,
  color = colors.primary,
  size = 44,
}: CategoryBadgeProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        backgroundColor: `${color}26`, // ~15% alpha
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MaterialIcons
        name={(icon as keyof typeof MaterialIcons.glyphMap) || "category"}
        size={size * 0.5}
        color={color}
      />
    </View>
  );
}
