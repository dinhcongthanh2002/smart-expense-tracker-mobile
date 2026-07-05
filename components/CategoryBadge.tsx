import { View } from "react-native";

import { getCategoryIcon } from "@/lib/category-icons";
import { colors } from "@/theme/colors";

interface CategoryBadgeProps {
  icon?: string;
  color?: string;
  size?: number;
}

/**
 * Circular category chip. `icon` is a Lucide icon name (kebab-case) stored on
 * Category.icon — the same names the web admin uses, so icons match everywhere.
 */
export function CategoryBadge({
  icon,
  color = colors.primary,
  size = 44,
}: CategoryBadgeProps) {
  const Icon = getCategoryIcon(icon);
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
      <Icon color={color} size={Math.round(size * 0.5)} strokeWidth={2} />
    </View>
  );
}
