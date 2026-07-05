import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlobalFacade } from "@/store/global";
import { colors } from "@/theme/colors";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword, isSubmitting } = GlobalFacade();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();

  const onSubmit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email không hợp lệ");
      return;
    }
    setError(undefined);
    try {
      await forgotPassword(email.trim()).unwrap();
      router.push({ pathname: "/(auth)/reset-password", params: { email: email.trim() } });
    } catch {
      // toast surfaced by API layer
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="mb-6 h-11 w-11 items-center justify-center rounded-full"
          >
            <Ionicons name="chevron-back" size={26} color={colors.ink} />
          </Pressable>

          <View className="mb-6 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-primary/20">
              <Ionicons name="lock-open" size={40} color={colors.primary} />
            </View>
            <Text className="text-2xl font-bold text-ink">Quên mật khẩu</Text>
            <Text className="mt-2 px-4 text-center text-base text-muted">
              Nhập email đăng ký để nhận mã đặt lại mật khẩu
            </Text>
          </View>

          <GlassCard className="gap-4 p-5">
            <Input
              label="Email"
              placeholder="email@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              error={error}
              leftIcon={<Ionicons name="mail-outline" size={20} color={colors.muted} />}
            />
            <Button
              title="Gửi mã đặt lại"
              onPress={onSubmit}
              loading={isSubmitting}
              className="mt-2"
            />
          </GlassCard>

          <View className="mt-6 flex-row items-center justify-center gap-1">
            <Text className="text-muted">Nhớ mật khẩu rồi?</Text>
            <Pressable onPress={() => router.replace("/(auth)/sign-in")} hitSlop={8}>
              <Text className="font-semibold text-primary">Đăng nhập</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
