import { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import {
  authenticateBiometric,
  getBiometricLabel,
  isBiometricAvailable,
} from "@/lib/biometric";
import { getBiometricEnabled, setBiometricEnabled } from "@/lib/secure-storage";
import { notify } from "@/lib/notify";
import { colors } from "@/theme/colors";

function NavRow({
  icon,
  label,
  sub,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 py-3.5 active:opacity-60">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-white/8">
        <Ionicons name={icon} size={20} color={danger ? colors.expense : colors.primarySoft} />
      </View>
      <View className="flex-1">
        <Text className={`font-medium ${danger ? "text-expense" : "text-ink"}`}>{label}</Text>
        {sub ? <Text className="text-xs text-muted">{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function ToggleRow({
  icon,
  label,
  sub,
  value,
  onValueChange,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-3 py-3.5">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-white/8">
        <Ionicons name={icon} size={20} color={colors.primarySoft} />
      </View>
      <View className="flex-1">
        <Text className="font-medium text-ink">{label}</Text>
        {sub ? <Text className="text-xs text-muted">{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: colors.primary, false: "rgba(255,255,255,0.15)" }}
        thumbColor="#fff"
      />
    </View>
  );
}

const Divider = () => <View className="border-t border-white/[0.05]" />;

export default function SettingsScreen() {
  const router = useRouter();
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState("Face ID");
  const [hideBalance, setHideBalance] = useState(false);

  useEffect(() => {
    (async () => {
      setAvailable(await isBiometricAvailable());
      setEnabled(await getBiometricEnabled());
      setLabel(await getBiometricLabel());
      setHideBalance((await AsyncStorage.getItem("hideBalance")) === "1");
    })();
  }, []);

  const onToggleBiometric = async (next: boolean) => {
    if (next) {
      if (!available) {
        notify.error("Thiết bị chưa thiết lập sinh trắc học");
        return;
      }
      const ok = await authenticateBiometric(`Bật đăng nhập bằng ${label}`);
      if (!ok) return;
      await setBiometricEnabled(true);
      setEnabled(true);
      notify.success(`Đã bật đăng nhập bằng ${label}`);
    } else {
      await setBiometricEnabled(false);
      setEnabled(false);
    }
  };

  const onToggleHideBalance = (next: boolean) => {
    setHideBalance(next);
    AsyncStorage.setItem("hideBalance", next ? "1" : "0");
  };

  return (
    <Screen className="px-5">
      <View className="mb-4 mt-1 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="-ml-2 h-10 w-10 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">Cài đặt</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-28">
        {/* Account */}
        <Text className="mb-2 ml-1 text-sm font-medium text-muted">Tài khoản</Text>
        <GlassSurface radius={22} className="px-5 py-1">
          <NavRow
            icon="person-circle-outline"
            label="Chỉnh sửa hồ sơ"
            sub="Tên, ảnh đại diện, thông tin liên hệ"
            onPress={() => router.push("/edit-profile")}
          />
          <Divider />
          <NavRow
            icon="key-outline"
            label="Đổi mật khẩu"
            sub="Gửi mã xác nhận qua email"
            onPress={() => router.push("/change-password")}
          />
        </GlassSurface>

        {/* Security */}
        <Text className="mb-2 ml-1 mt-6 text-sm font-medium text-muted">Bảo mật</Text>
        <GlassSurface radius={22} className="px-5 py-1">
          <ToggleRow
            icon="finger-print"
            label={`Đăng nhập bằng ${label}`}
            sub={
              available
                ? "Mở khoá phiên đăng nhập bằng sinh trắc học"
                : "Thiết bị chưa thiết lập sinh trắc học"
            }
            value={enabled}
            onValueChange={onToggleBiometric}
            disabled={!available}
          />
        </GlassSurface>

        {/* Display */}
        <Text className="mb-2 ml-1 mt-6 text-sm font-medium text-muted">Hiển thị</Text>
        <GlassSurface radius={22} className="px-5 py-1">
          <ToggleRow
            icon="eye-off-outline"
            label="Ẩn số dư"
            sub="Che số dư, thu nhập và chi tiêu ở màn hình chính"
            value={hideBalance}
            onValueChange={onToggleHideBalance}
          />
        </GlassSurface>

        {/* App */}
        <Text className="mb-2 ml-1 mt-6 text-sm font-medium text-muted">Ứng dụng</Text>
        <GlassSurface radius={22} className="px-5 py-1">
          <View className="flex-row items-center justify-between py-3.5">
            <Text className="text-muted">Phiên bản</Text>
            <Text className="font-medium text-ink">1.0.0</Text>
          </View>
        </GlassSurface>
      </ScrollView>
    </Screen>
  );
}
