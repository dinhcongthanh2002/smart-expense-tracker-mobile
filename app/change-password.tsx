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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const { user, forgotPassword, resetPassword, isSubmitting } = GlobalFacade();
  const email = user?.userModel?.email ?? "";

  const [sent, setSent] = useState(false);
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const sendCode = async () => {
    if (!email) {
      notify.error(t("changePassword.noEmail"));
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
    if (token.trim().length < 4) e.token = t("changePassword.validation.token");
    if (newPassword.length < 6) e.newPassword = t("changePassword.validation.minLength");
    if (confirmPassword !== newPassword) e.confirmPassword = t("changePassword.validation.mismatch");
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
      notify.success(t("changePassword.success"));
      router.back();
    } catch {
      // toast surfaced by API layer
    }
  };

  return (
    <Screen orbs={false} className="px-5" edges={["top"]}>
      <KeyboardAvoidingView
        behavior="padding"
        className="flex-1"
      >
        <View className="mb-2 mt-1 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text className="text-base text-muted">{t("common.cancel")}</Text>
          </Pressable>
          <Text className="text-lg font-bold text-ink">{t("changePassword.title")}</Text>
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
                ? t("changePassword.instructionsSent", { email })
                : t("changePassword.instructionsInitial", {
                    email: email || t("changePassword.emailFallback"),
                  })}
            </Text>
          </View>

          {!sent ? (
            <Button title={t("changePassword.sendCode")} onPress={sendCode} loading={isSubmitting} />
          ) : (
            <GlassCard className="gap-4 p-5">
              <Input
                label={t("changePassword.fields.token")}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                value={token}
                onChangeText={setToken}
                error={errors.token}
                leftIcon={<Ionicons name="key-outline" size={20} color={colors.muted} />}
              />
              <Input
                label={t("changePassword.fields.newPassword")}
                placeholder={t("changePassword.placeholders.newPassword")}
                secureTextEntry
                autoCapitalize="none"
                value={newPassword}
                onChangeText={setNewPassword}
                error={errors.newPassword}
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.muted} />}
              />
              <Input
                label={t("changePassword.fields.confirmPassword")}
                placeholder={t("changePassword.placeholders.confirmPassword")}
                secureTextEntry
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={errors.confirmPassword}
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.muted} />}
              />
              <Button
                title={t("changePassword.title")}
                onPress={onSubmit}
                loading={isSubmitting}
                className="mt-2"
              />
              <Pressable onPress={sendCode} hitSlop={8} className="items-center">
                <Text className="font-semibold text-primary">{t("changePassword.resendCode")}</Text>
              </Pressable>
            </GlassCard>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
