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
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlobalFacade } from "@/store/global";
import { colors } from "@/theme/colors";

interface Errors {
  name?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
}

export default function SignUpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { register, isSubmitting } = GlobalFacade();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Errors>({});

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const e: Errors = {};
    if (!form.name.trim()) e.name = t("auth.errors.nameRequired");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = t("auth.errors.invalidEmail");
    if (form.phoneNumber && !/^\d{10}$/.test(form.phoneNumber))
      e.phoneNumber = t("auth.errors.phoneInvalid");
    if (form.password.length < 6) e.password = t("auth.errors.passwordMin");
    if (form.confirmPassword !== form.password)
      e.confirmPassword = t("auth.errors.confirmPasswordMismatch");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber || undefined,
        password: form.password,
        confirmPassword: form.confirmPassword,
      }).unwrap();
      router.replace({
        pathname: "/(auth)/verify-email",
        params: { email: form.email.trim() },
      });
    } catch {
      // error surfaced by the global toast
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
          <View className="mb-6">
            <Text className="text-3xl font-bold text-ink">{t("auth.signUp.title")}</Text>
            <Text className="mt-2 text-base text-muted">
              {t("auth.signUp.subtitle")}
            </Text>
          </View>

          <GlassCard className="gap-4 p-5">
            <Input
              label={t("auth.fields.name")}
              placeholder={t("auth.placeholders.name")}
              value={form.name}
              onChangeText={set("name")}
              error={errors.name}
              leftIcon={<Ionicons name="person-outline" size={20} color={colors.muted} />}
            />
            <Input
              label={t("auth.fields.email")}
              placeholder={t("auth.placeholders.email")}
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={set("email")}
              error={errors.email}
              leftIcon={<Ionicons name="mail-outline" size={20} color={colors.muted} />}
            />
            <Input
              label={t("auth.fields.phoneOptional")}
              placeholder={t("auth.placeholders.phone")}
              keyboardType="number-pad"
              maxLength={10}
              value={form.phoneNumber}
              onChangeText={set("phoneNumber")}
              error={errors.phoneNumber}
              leftIcon={<Ionicons name="call-outline" size={20} color={colors.muted} />}
            />
            <Input
              label={t("auth.fields.password")}
              placeholder={t("auth.placeholders.passwordMin")}
              secureTextEntry
              autoCapitalize="none"
              value={form.password}
              onChangeText={set("password")}
              error={errors.password}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.muted} />}
            />
            <Input
              label={t("auth.fields.confirmPassword")}
              placeholder={t("auth.placeholders.confirmPassword")}
              secureTextEntry
              autoCapitalize="none"
              value={form.confirmPassword}
              onChangeText={set("confirmPassword")}
              error={errors.confirmPassword}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.muted} />}
            />

            <Button
              title={t("auth.actions.signUp")}
              onPress={onSubmit}
              loading={isSubmitting}
              className="mt-2"
            />
          </GlassCard>

          <View className="mt-6 flex-row items-center justify-center gap-1">
            <Text className="text-muted">{t("auth.links.hasAccount")}</Text>
            <Link href="/(auth)/sign-in" asChild>
              <Pressable hitSlop={8}>
                <Text className="font-semibold text-primary">{t("auth.actions.signIn")}</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
