import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlobalFacade } from "@/store/global";
import { notify } from "@/lib/notify";
import { colors } from "@/theme/colors";

interface Errors {
  token?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { user, forgotPassword, resetPassword, isSubmitting } = GlobalFacade();
  const email = user?.userModel?.email ?? "";

  const [sent, setSent] = useState(false);
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const sendCode = async () => {
    if (!email) {
      notify.error("Tài khoản chưa có email");
      return;
    }
    try {
      await forgotPassword(email).unwrap();
      setSent(true);
    } catch {
      // toast surfaced by API layer
    }
  };

  const validate = () => {
    const e: Errors = {};
    if (token.trim().length < 4) e.token = "Nhập mã xác nhận";
    if (newPassword.length < 6) e.newPassword = "Mật khẩu tối thiểu 6 ký tự";
    if (confirmPassword !== newPassword) e.confirmPassword = "Mật khẩu không khớp";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    try {
      await resetPassword({
        email,
        token: token.trim(),
        newPassword,
        confirmPassword,
      }).unwrap();
      notify.success("Đổi mật khẩu thành công");
      router.back();
    } catch {
      // toast surfaced by API layer
    }
  };

  return (
    <Screen orbs={false} className="px-5" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="mb-2 mt-1 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text className="text-base text-muted">Huỷ</Text>
          </Pressable>
          <Text className="text-lg font-bold text-ink">Đổi mật khẩu</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="my-6 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-primary/20">
              <Ionicons name="key" size={40} color={colors.primary} />
            </View>
            <Text className="px-4 text-center text-base text-muted">
              {sent
                ? `Nhập mã xác nhận đã gửi tới ${email} và mật khẩu mới`
                : `Chúng tôi sẽ gửi mã xác nhận tới ${email || "email của bạn"}`}
            </Text>
          </View>

          {!sent ? (
            <Button title="Gửi mã xác nhận" onPress={sendCode} loading={isSubmitting} />
          ) : (
            <GlassCard className="gap-4 p-5">
              <Input
                label="Mã xác nhận"
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                value={token}
                onChangeText={setToken}
                error={errors.token}
                leftIcon={<Ionicons name="key-outline" size={20} color={colors.muted} />}
              />
              <Input
                label="Mật khẩu mới"
                placeholder="Tối thiểu 6 ký tự"
                secureTextEntry
                autoCapitalize="none"
                value={newPassword}
                onChangeText={setNewPassword}
                error={errors.newPassword}
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.muted} />}
              />
              <Input
                label="Xác nhận mật khẩu"
                placeholder="Nhập lại mật khẩu"
                secureTextEntry
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={errors.confirmPassword}
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.muted} />}
              />
              <Button
                title="Đổi mật khẩu"
                onPress={onSubmit}
                loading={isSubmitting}
                className="mt-2"
              />
              <Pressable onPress={sendCode} hitSlop={8} className="items-center">
                <Text className="font-semibold text-primary">Gửi lại mã</Text>
              </Pressable>
            </GlassCard>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
