import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { GlassSurface } from "@/components/ui/GlassSurface";
import { GlobalFacade } from "@/store/global";
import { NotificationFacade } from "@/store/notification";
import type { NotificationViewModel } from "@/store/notification/model";
import { API } from "@/lib/api";
import { routerLinks } from "@/lib/router-links";
import type { Pagination } from "@/models/api.model";
import { playNotificationAlert } from "@/lib/notification-sound";
import { colors } from "@/theme/colors";

const POLL_MS = 25_000;

interface Banner {
  id: number;
  title: string;
  body?: string;
}

/**
 * Global, in-app notification watcher. While the app is open and the user is
 * signed in, it polls the unread count; when it rises, it plays the chime,
 * fires a haptic, and shows a tappable banner. No OS/push notifications.
 * Mount once at the app root.
 */
export function NotificationWatcher() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = GlobalFacade();
  const noti = NotificationFacade();

  const prevCount = useRef<number | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showBanner = (b: Omit<Banner, "id">) => {
    setBanner({ id: Date.now(), ...b });
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), 5000);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      prevCount.current = null;
      return;
    }

    let cancelled = false;

    const pollOnce = async () => {
      let count: number | null = null;
      try {
        const res = await noti.getUnreadCount().unwrap();
        count = res?.data ?? 0;
      } catch {
        return; // network hiccup — try again next tick
      }
      if (cancelled || count === null) return;

      // First reading just sets the baseline (don't alert for existing unread).
      if (prevCount.current === null) {
        prevCount.current = count;
        return;
      }
      if (count > prevCount.current) {
        prevCount.current = count;
        playNotificationAlert();
        try {
          const res = await API.get<Pagination<NotificationViewModel>>(
            routerLinks("Notification"),
            { page: 1, size: 1, sort: "-createdOnDate" },
          );
          const latest = res.data?.content?.[0];
          showBanner({
            title: latest?.title || t("notifications.newTitle"),
            body: latest?.body,
          });
        } catch {
          showBanner({ title: t("notifications.newTitle") });
        }
      } else {
        prevCount.current = count;
      }
    };

    pollOnce();
    const interval = setInterval(pollOnce, POLL_MS);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") pollOnce();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(
    () => () => {
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    },
    [],
  );

  if (!banner) return null;

  const openNotifications = () => {
    setBanner(null);
    router.push("/notifications");
  };

  return (
    <View
      style={{ position: "absolute", top: insets.top + 8, left: 16, right: 16 }}
    >
      <Animated.View
        key={banner.id}
        entering={FadeInDown.springify().damping(18)}
        exiting={FadeOutUp}
      >
        <Pressable onPress={openNotifications} className="active:opacity-80">
          <GlassSurface radius={18}>
            <View className="flex-row items-center gap-3 px-4 py-3">
              <View
                className="h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: `${colors.primary}26` }}
              >
                <Ionicons name="notifications" size={18} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>
                  {banner.title}
                </Text>
                {banner.body ? (
                  <Text className="mt-0.5 text-xs text-muted" numberOfLines={2}>
                    {banner.body}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
          </GlassSurface>
        </Pressable>
      </Animated.View>
    </View>
  );
}
