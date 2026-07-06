import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlobalFacade } from "@/store/global";
import { colors } from "@/theme/colors";

interface Errors {
  email?: string;
  token?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ email?: string }>();
  const { resetPassword, forgotPassword, isSubmitting } = GlobalFacade();

  const [email, setEmail] = useState(params.email ?? "");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const validate = () => {
    const e: Errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t("auth.errors.invalidEmail");
    if (token.trim().length < 4) e.token = t("auth.errors.tokenRequired");
    if (newPassword.length < 6) e.newPassword = t("auth.errors.passwordMin");
    if (confirmPassword !== newPassword) e.confirmPassword = t("auth.errors.passwordMismatch");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    try {
      await resetPassword({
        email: email.trim(),
        token: token.trim(),
        newPassword,
        confirmPassword,
      }).unwrap();
      router.replace("/(auth)/sign-in");
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
              <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
            </View>
            <Text className="text-2xl font-bold text-ink">{t("auth.resetPassword.title")}</Text>
            <Text className="mt-2 px-4 text-center text-base text-muted">
              {t("auth.resetPassword.subtitle")}
            </Text>
          </View>

          <GlassCard className="gap-4 p-5">
            <Input
              label={t("auth.fields.email")}
              placeholder={t("auth.placeholders.email")}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              leftIcon={<Ionicons name="mail-outline" size={20} color={colors.muted} />}
            />
            <Input
              label={t("auth.fields.resetCode")}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              value={token}
              onChangeText={setToken}
              error={errors.token}
              leftIcon={<Ionicons name="key-outline" size={20} color={colors.muted} />}
            />
            <Input
              label={t("auth.fields.newPassword")}
              placeholder={t("auth.placeholders.passwordMin")}
              secureTextEntry
              autoCapitalize="none"
              value={newPassword}
              onChangeText={setNewPassword}
              error={errors.newPassword}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.muted} />}
            />
            <Input
              label={t("auth.fields.confirmPassword")}
              placeholder={t("auth.placeholders.confirmPassword")}
              secureTextEntry
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.muted} />}
            />
            <Button
              title={t("auth.actions.resetPassword")}
              onPress={onSubmit}
              loading={isSubmitting}
              className="mt-2"
            />
          </GlassCard>

          <View className="mt-6 flex-row items-center justify-center gap-1">
            <Text className="text-muted">{t("auth.links.noCode")}</Text>
            <Pressable onPress={() => email.trim() && forgotPassword(email.trim())} hitSlop={8}>
              <Text className="font-semibold text-primary">{t("auth.links.resend")}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
