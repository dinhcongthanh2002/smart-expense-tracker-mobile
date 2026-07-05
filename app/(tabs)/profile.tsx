import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Button } from "@/components/ui/Button";
import { GlobalFacade } from "@/store/global";
import { colors } from "@/theme/colors";

function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 py-3.5 active:opacity-60"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-white/8">
        <Ionicons name={icon} size={20} color={colors.primarySoft} />
      </View>
      <Text className="flex-1 font-medium text-ink">{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
}) {
  return (
    <View className="flex-row items-center gap-3 py-3">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-white/8">
        <Ionicons name={icon} size={20} color={colors.primarySoft} />
      </View>
      <Text className="flex-1 text-muted">{label}</Text>
      <Text className="font-medium text-ink">{value || "—"}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = GlobalFacade();
  const u = user?.userModel;

  return (
    <Screen className="px-5">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-28"
      >
        <Text className="mb-5 mt-2 text-2xl font-bold text-ink">Cá nhân</Text>

        <GlassSurface radius={28} className="items-center p-6">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-primary/20">
            <Ionicons name="person" size={48} color={colors.primary} />
          </View>
          <Text className="mt-3 text-xl font-bold text-ink">
            {u?.name ?? "Người dùng"}
          </Text>
          <Text className="text-sm text-muted">{u?.email}</Text>
        </GlassSurface>

        <GlassSurface radius={24} className="px-5 py-2" style={{ marginTop: 20 }}>
          <Row icon="person-outline" label="Tên đăng nhập" value={u?.userName} />
          <Row icon="call-outline" label="Số điện thoại" value={u?.phoneNumber} />
          <Row icon="mail-outline" label="Email" value={u?.email} />
          <Row
            icon="shield-checkmark-outline"
            label="Xác thực email"
            value={u?.isEmailVerified ? "Đã xác thực" : "Chưa"}
          />
        </GlassSurface>

        <Text className="mb-2 ml-1 mt-6 text-sm font-medium text-muted">
          Quản lý
        </Text>
        <GlassSurface radius={24} className="px-5 py-1">
          <MenuRow
            icon="albums-outline"
            label="Quản lý danh mục"
            onPress={() => router.push("/categories")}
          />
          <View className="border-t border-white/[0.05]" />
          <MenuRow
            icon="cash-outline"
            label="Khoản nợ / Cho vay"
            onPress={() => router.push("/debts")}
          />
          <View className="border-t border-white/[0.05]" />
          <MenuRow
            icon="flag-outline"
            label="Mục tiêu tiết kiệm"
            onPress={() => router.push("/goals")}
          />
          <View className="border-t border-white/[0.05]" />
          <MenuRow
            icon="repeat-outline"
            label="Giao dịch định kỳ"
            onPress={() => router.push("/recurring")}
          />
        </GlassSurface>

        <View className="mt-8">
          <Button
            title="Đăng xuất"
            variant="danger"
            leftIcon={<Ionicons name="log-out-outline" size={20} color="#fff" />}
            onPress={() => logout()}
          />
        </View>

        <Text className="mt-6 text-center text-xs text-muted">
          Smart Expense • v1.0.0
        </Text>
      </ScrollView>
    </Screen>
  );
}
