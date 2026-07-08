import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MediaViewer } from "expo-media-viewer";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Button } from "@/components/ui/Button";
import { GlobalFacade } from "@/store/global";
import { resolveFileUrl } from "@/lib/upload";
import { useThemePalette } from "@/lib/theme";
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
  const { t } = useTranslation();
  const { user, logout } = GlobalFacade();
  const { scheme } = useThemePalette();
  const u = user?.userModel;
  const avatarUrl = resolveFileUrl(u?.avatar);

  return (
    <Screen className="px-5">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-28"
      >
        <Text className="mb-5 mt-2 text-2xl font-bold text-ink">{t("profile.title")}</Text>

        <GlassSurface radius={28} className="items-center p-6">
          {/* Avatar opens the full-screen preview; the rest of the card edits. */}
          {avatarUrl ? (
            <MediaViewer
              items={[{ type: "image", source: avatarUrl }]}
              config={{ theme: scheme }}
              renderLayout={({ renderItem }) =>
                renderItem(0, { frame: { width: 96, height: 96, borderRadius: 48 } })
              }
            />
          ) : (
            <Pressable
              onPress={() => router.push("/edit-profile")}
              className="h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary/20 active:opacity-80"
            >
              <Ionicons name="person" size={48} color={colors.primary} />
            </Pressable>
          )}
          <Pressable
            onPress={() => router.push("/edit-profile")}
            className="items-center active:opacity-80"
          >
            <Text className="mt-3 text-xl font-bold text-ink">
              {u?.name ?? t("profile.defaultName")}
            </Text>
            <Text className="text-sm text-muted">{u?.email}</Text>
            <View className="mt-3 flex-row items-center gap-1.5 rounded-full bg-glass-light px-4 py-1.5">
              <Ionicons name="create-outline" size={15} color={colors.primarySoft} />
              <Text className="text-xs font-medium text-primarySoft">{t("profile.editProfile")}</Text>
            </View>
          </Pressable>
        </GlassSurface>

        <GlassSurface radius={24} className="px-5 py-2" style={{ marginTop: 20 }}>
          <Row icon="person-outline" label={t("profile.username")} value={u?.userName} />
          <Row icon="call-outline" label={t("profile.phone")} value={u?.phoneNumber} />
          <Row icon="mail-outline" label={t("profile.email")} value={u?.email} />
          <Row
            icon="shield-checkmark-outline"
            label={t("profile.emailVerification")}
            value={u?.isEmailVerified ? t("profile.verified") : t("profile.notVerified")}
          />
        </GlassSurface>

        <Text className="mb-2 ml-1 mt-6 text-sm font-medium text-muted">
          {t("profile.manage")}
        </Text>
        <GlassSurface radius={24} className="px-5 py-1">
          <MenuRow
            icon="notifications-outline"
            label={t("profile.menu.notifications")}
            onPress={() => router.push("/notifications")}
          />
          <View className="border-t border-glass-border" />
          <MenuRow
            icon="albums-outline"
            label={t("profile.menu.categories")}
            onPress={() => router.push("/categories")}
          />
          <View className="border-t border-glass-border" />
          <MenuRow
            icon="cash-outline"
            label={t("profile.menu.debts")}
            onPress={() => router.push("/debts")}
          />
          <View className="border-t border-glass-border" />
          <MenuRow
            icon="flag-outline"
            label={t("profile.menu.goals")}
            onPress={() => router.push("/goals")}
          />
          <View className="border-t border-glass-border" />
          <MenuRow
            icon="repeat-outline"
            label={t("profile.menu.recurring")}
            onPress={() => router.push("/recurring")}
          />
          <View className="border-t border-glass-border" />
          <MenuRow
            icon="settings-outline"
            label={t("profile.menu.settings")}
            onPress={() => router.push("/settings")}
          />
        </GlassSurface>

        <View className="mt-8">
          <Button
            title={t("profile.logout")}
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
