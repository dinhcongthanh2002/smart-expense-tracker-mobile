import "../global.css";
import "@/lib/i18n";

import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { Stack, useRouter, useSegments } from "expo-router";
import { Provider } from "react-redux";

import { store } from "@/store";
import { GlobalFacade } from "@/store/global";
import { setUnauthorizedHandler } from "@/lib/api";
import { colors } from "@/theme/colors";
import { ToastHost } from "@/components/ui/ToastHost";
import { NotificationWatcher } from "@/components/NotificationWatcher";
import { AnimatedSplash } from "@/components/AnimatedSplash";

// Keep the native splash up until our JS overlay is mounted, so the hand-off to
// the branded animated splash is seamless (no blank flash).
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const global = GlobalFacade();
  const { isAuthenticated, isAuthenticating } = global;
  const segments = useSegments();
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);

  // Restore the persisted session once, and wire the 401 -> logout handler.
  useEffect(() => {
    global.bootstrap();
    setUnauthorizedHandler(() => global.set({ user: null }));
    return () => setUnauthorizedHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Our overlay is now on screen (same look as the native splash) — hide the OS one.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticating) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isAuthenticating, segments, router]);

  return (
    <>
      {/* Don't mount routed screens until the session is restored — otherwise a
          screen can fire an authenticated request before the token is loaded
          into the sync cache, get a 401, and trigger a logout (e.g. web reload). */}
      {!isAuthenticating ? (
      <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "fade",
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="debts" />
      <Stack.Screen name="debt-detail" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="recurring" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="budget-invites" />
      <Stack.Screen name="day-transactions" />
      <Stack.Screen name="transaction-form" options={{ presentation: "modal" }} />
      <Stack.Screen name="category-form" options={{ presentation: "modal" }} />
      <Stack.Screen name="wallet-form" options={{ presentation: "modal" }} />
      <Stack.Screen name="budget-form" options={{ presentation: "modal" }} />
      <Stack.Screen name="debt-form" options={{ presentation: "modal" }} />
      <Stack.Screen name="debt-pay" options={{ presentation: "modal" }} />
      <Stack.Screen name="goal-form" options={{ presentation: "modal" }} />
      <Stack.Screen name="goal-contribute" options={{ presentation: "modal" }} />
      <Stack.Screen name="recurring-form" options={{ presentation: "modal" }} />
      <Stack.Screen name="edit-profile" options={{ presentation: "modal" }} />
      <Stack.Screen name="change-password" options={{ presentation: "modal" }} />
      </Stack>
      ) : null}
      {!splashDone ? (
        <AnimatedSplash hold={isAuthenticating} onFinish={() => setSplashDone(true)} />
      ) : null}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <RootNavigator />
          <NotificationWatcher />
          <ToastHost />
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
