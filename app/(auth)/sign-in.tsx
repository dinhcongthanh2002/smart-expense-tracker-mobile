import { useEffect, useRef, useState } from "react";
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
import { authenticateBiometric, getBiometricLabel } from "@/lib/biometric";
import { colors } from "@/theme/colors";

export default function SignInScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { login, isSubmitting, biometricLocked, pendingAuth, unlockBiometric } =
    GlobalFacade();
  const [bioLabel, setBioLabel] = useState("Face ID");
  const promptedRef = useRef(false);

  const handleBiometric = async () => {
    const ok = await authenticateBiometric(t("auth.biometric.prompt"));
    if (ok) unlockBiometric();
  };

  useEffect(() => {
    getBiometricLabel().then(setBioLabel);
  }, []);

  // Auto-prompt biometric once when arriving at a locked session.
  useEffect(() => {
    if (biometricLocked && !promptedRef.current) {
      promptedRef.current = true;
      handleBiometric();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricLocked]);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  const validate = () => {
    const e: { identifier?: string; password?: string } = {};
    if (!identifier.trim()) e.identifier = t("auth.errors.identifierRequired");
    if (!password) e.password = t("auth.errors.passwordRequired");
    else if (password.length < 6) e.password = t("auth.errors.passwordMin");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
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
              {t("auth.signIn.tagline")}
            </Text>
          </View>

          {biometricLocked ? (
            <View className="mb-6 items-center">
              <Text className="text-sm text-muted">{t("auth.signIn.welcomeBack")}</Text>
              <Text className="mb-4 text-lg font-bold text-ink">
                {pendingAuth?.userModel?.name ?? pendingAuth?.userModel?.email}
              </Text>
              <Pressable
                onPress={handleBiometric}
                className="h-24 w-24 items-center justify-center rounded-full bg-primary/20 active:opacity-70"
              >
                <Ionicons name="finger-print" size={48} color={colors.primary} />
              </Pressable>
              <Text className="mt-3 text-base font-semibold text-primary">
                {t("auth.biometric.signInWith", { method: bioLabel })}
              </Text>
              <Text className="mt-6 text-xs text-muted">{t("auth.signIn.orUsePassword")}</Text>
            </View>
          ) : null}

          <GlassCard className="gap-4 p-5">
            <Input
              label={t("auth.fields.identifier")}
              placeholder={t("auth.placeholders.identifier")}
              autoCapitalize="none"
              autoCorrect={false}
              value={identifier}
              onChangeText={setIdentifier}
              error={errors.identifier}
              leftIcon={
                <Ionicons name="person-outline" size={20} color={colors.muted} />
              }
            />
            <Input
              label={t("auth.fields.password")}
              placeholder={t("auth.placeholders.password")}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={onSubmit}
              returnKeyType="go"
              error={errors.password}
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

            <Pressable
              onPress={() => router.push("/(auth)/forgot-password")}
              hitSlop={8}
              className="-mt-1 self-end"
            >
              <Text className="text-sm font-medium text-primary">{t("auth.links.forgotPassword")}</Text>
            </Pressable>

            <Button
              title={t("auth.actions.signIn")}
              onPress={onSubmit}
              loading={isSubmitting}
              className="mt-2"
            />
          </GlassCard>

          <View className="mt-6 flex-row items-center justify-center gap-1">
            <Text className="text-muted">{t("auth.links.noAccount")}</Text>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable hitSlop={8}>
                <Text className="font-semibold text-primary">{t("auth.actions.signUp")}</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
