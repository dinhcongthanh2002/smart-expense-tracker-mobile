import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Button } from "@/components/ui/Button";
import { GlobalFacade } from "@/store/global";
import { colors } from "@/theme/colors";

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

        <GlassSurface radius={24} className="mt-5 px-5 py-2">
          <Row icon="person-outline" label="Tên đăng nhập" value={u?.userName} />
          <Row icon="call-outline" label="Số điện thoại" value={u?.phoneNumber} />
          <Row icon="mail-outline" label="Email" value={u?.email} />
          <Row
            icon="shield-checkmark-outline"
            label="Xác thực email"
            value={u?.isEmailVerified ? "Đã xác thực" : "Chưa"}
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
