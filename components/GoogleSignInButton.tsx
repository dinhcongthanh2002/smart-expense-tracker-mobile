import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import {
  GoogleCancelledError,
  isGoogleConfigured,
  signInWithGoogle,
} from "@/lib/google-auth";
import { notify } from "@/lib/notify";
import { GlobalFacade } from "@/store/global";
import { colors } from "@/theme/colors";

/**
 * "Continue with Google" button + an "or" divider. Renders nothing until the
 * Google web client id is configured (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID), so the
 * screens degrade gracefully to email/password when Google isn't set up.
 */
export function GoogleSignInButton() {
  const { t } = useTranslation();
  const { googleLogin } = GlobalFacade();
  const [busy, setBusy] = useState(false);

  if (!isGoogleConfigured) return null;

  const onPress = async () => {
    if (busy) return;
    setBusy(true);
    let idToken: string;
    try {
      idToken = await signInWithGoogle();
    } catch (e) {
      // User dismissed the picker — stay silent; otherwise surface a message.
      if (!(e instanceof GoogleCancelledError)) {
        notify.error((e as Error)?.message || "Google Sign-In failed");
      }
      setBusy(false);
      return;
    }
    try {
      // The auth guard in the root navigator redirects to the tabs on success.
      // Backend errors are surfaced by the API layer.
      await googleLogin(idToken).unwrap();
    } catch {
      // handled by the API layer
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="mt-5">
      <View className="mb-5 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-glass-border" />
        <Text className="text-xs text-muted">{t("auth.or")}</Text>
        <View className="h-px flex-1 bg-glass-border" />
      </View>

      <Pressable
        onPress={onPress}
        disabled={busy}
        className="h-12 flex-row items-center justify-center gap-3 rounded-2xl border border-glass-border bg-white active:opacity-80"
      >
        {busy ? (
          <ActivityIndicator color="#4285F4" />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <Text className="text-base font-semibold" style={{ color: "#1F1F1F" }}>
              {t("auth.actions.continueWithGoogle")}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
