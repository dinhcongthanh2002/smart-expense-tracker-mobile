import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlobalFacade } from "@/store/global";
import { colors } from "@/theme/colors";

export default function SignInScreen() {
  const router = useRouter();
  const { login, isSubmitting } = GlobalFacade();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async () => {
    if (!identifier.trim() || !password) return;
    try {
      await login({ identifier: identifier.trim(), password, rememberMe: true }).unwrap();
      // Auth guard in the root navigator redirects to the tabs on success.
    } catch (e) {
      const err = e as { status?: number };
      if (err?.status === 403) {
        router.push({
          pathname: "/(auth)/verify-email",
          params: identifier.includes("@") ? { email: identifier.trim() } : {},
        });
      }
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
          <View className="mb-8 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-primary/20">
              <Ionicons name="wallet" size={40} color={colors.primary} />
            </View>
            <Text className="text-3xl font-bold text-ink">Smart Expense</Text>
            <Text className="mt-2 text-base text-muted">
              Quản lý chi tiêu thông minh
            </Text>
          </View>

          <GlassCard className="gap-4 p-5">
            <Input
              label="Email / Số điện thoại / Tên đăng nhập"
              placeholder="Nhập tài khoản"
              autoCapitalize="none"
              autoCorrect={false}
              value={identifier}
              onChangeText={setIdentifier}
              leftIcon={
                <Ionicons name="person-outline" size={20} color={colors.muted} />
              }
            />
            <Input
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={onSubmit}
              returnKeyType="go"
              leftIcon={
                <Ionicons name="lock-closed-outline" size={20} color={colors.muted} />
              }
              rightElement={
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              }
            />

            <Button
              title="Đăng nhập"
              onPress={onSubmit}
              loading={isSubmitting}
              className="mt-2"
            />
          </GlassCard>

          <View className="mt-6 flex-row items-center justify-center gap-1">
            <Text className="text-muted">Chưa có tài khoản?</Text>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable hitSlop={8}>
                <Text className="font-semibold text-primary">Đăng ký</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
