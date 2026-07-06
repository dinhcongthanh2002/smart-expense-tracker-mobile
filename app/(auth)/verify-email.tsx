import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlobalFacade } from "@/store/global";
import { colors } from "@/theme/colors";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ email?: string }>();
  const { confirmEmail, verifyEmail, isSubmitting } = GlobalFacade();

  const [email, setEmail] = useState(params.email ?? "");
  const [token, setToken] = useState("");

  const onConfirm = async () => {
    if (!email.trim() || token.length < 4) return;
    try {
      await confirmEmail({ email: email.trim(), token: token.trim() }).unwrap();
      router.replace("/(auth)/sign-in");
    } catch {
      // toast surfaced by API layer
    }
  };

  const onResend = () => {
    if (email.trim()) verifyEmail(email.trim());
  };

  return (
    <Screen className="px-6" edges={["top", "bottom"]}>
      <View className="flex-1 justify-center">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="mb-6 h-11 w-11 items-center justify-center rounded-full"
        >
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>

        <View className="mb-6 items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-primary/20">
            <Ionicons name="mail-open" size={40} color={colors.primary} />
          </View>
          <Text className="text-2xl font-bold text-ink">{t("auth.verifyEmail.title")}</Text>
          <Text className="mt-2 px-6 text-center text-base text-muted">
            {t("auth.verifyEmail.subtitle")}
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
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.muted} />}
          />
          <Input
            label={t("auth.fields.verificationCode")}
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            value={token}
            onChangeText={setToken}
            leftIcon={<Ionicons name="key-outline" size={20} color={colors.muted} />}
          />
          <Button
            title={t("common.confirm")}
            onPress={onConfirm}
            loading={isSubmitting}
            className="mt-2"
          />
        </GlassCard>

        <View className="mt-6 flex-row items-center justify-center gap-1">
          <Text className="text-muted">{t("auth.links.noCode")}</Text>
          <Pressable onPress={onResend} hitSlop={8}>
            <Text className="font-semibold text-primary">{t("auth.links.resend")}</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
