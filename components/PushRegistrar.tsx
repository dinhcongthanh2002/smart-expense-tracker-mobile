import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";

import { GlobalFacade } from "@/store/global";
import { NotificationFacade } from "@/store/notification";
import { syncPushToken } from "@/lib/push";

/**
 * Registers this device's Expo push token with the backend after sign-in and
 * wires OS push handling:
 *  - foreground push → refresh the unread badge (NotificationWatcher shows the banner)
 *  - tapping a push (foreground/background/cold start) → open the notifications screen
 * Mount once at the app root. Renders nothing.
 */
export function PushRegistrar() {
  const { isAuthenticated } = GlobalFacade();
  const noti = NotificationFacade();
  const router = useRouter();

  // Upload the push token once the user is signed in.
  useEffect(() => {
    if (!isAuthenticated) return;
    syncPushToken();
  }, [isAuthenticated]);

  // OS notification listeners (independent of auth state).
  // expo-notifications native methods (listeners, getLastNotificationResponse)
  // aren't implemented on web and throw — skip the whole wiring there.
  useEffect(() => {
    if (Platform.OS === "web") return;

    const openNotifications = () => router.push("/notifications");

    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      // A push arrived while the app is open — keep the bell badge in sync.
      noti.getUnreadCount();
    });
    const responseSub =
      Notifications.addNotificationResponseReceivedListener(openNotifications);

    // App launched by tapping a notification while it was killed.
    Notifications.getLastNotificationResponseAsync().then((res) => {
      if (res) openNotifications();
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
