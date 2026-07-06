import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { NotificationFacade } from "@/store/notification";
import type { NotificationViewModel } from "@/store/notification/model";
import { formatDateTime } from "@/lib/format";
import { colors } from "@/theme/colors";

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationViewModel;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <GlassSurface
        radius={18}
        className="mb-2.5 flex-row items-start gap-3 p-4"
        surfaceColor={item.isRead ? undefined : "#1B2440"}
      >
        <View
          className="mt-0.5 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: item.isRead ? "rgba(255,255,255,0.06)" : `${colors.primary}26` }}
        >
          <Ionicons
            name="notifications"
            size={20}
            color={item.isRead ? colors.muted : colors.primary}
          />
        </View>
        <View className="flex-1">
          <Text
            className={`text-[15px] ${item.isRead ? "font-medium text-ink" : "font-bold text-ink"}`}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {item.body ? (
            <Text className="mt-0.5 text-sm text-muted" numberOfLines={3}>
              {item.body}
            </Text>
          ) : null}
          <Text className="mt-1 text-xs text-muted">
            {formatDateTime(item.createdOnDate)}
          </Text>
        </View>
        {!item.isRead ? (
          <View className="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
        ) : null}
      </GlassSurface>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const noti = NotificationFacade();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const FILTERS: { label: string; unreadOnly: boolean }[] = [
    { label: t("common.all"), unreadOnly: false },
    { label: t("notifications.unread"), unreadOnly: true },
  ];

  useFocusEffect(
    useCallback(() => {
      const params = unreadOnly ? { filter: { isRead: false } } : {};
      noti.get({ page: 1, size: 50, ...params });
      noti.getUnreadCount();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unreadOnly]),
  );

  const items = noti.pagination?.content ?? [];

  return (
    <Screen className="px-5">
      <View className="mb-4 mt-1 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="-ml-2 h-10 w-10 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t("notifications.title")}</Text>
        {noti.unreadCount > 0 ? (
          <Pressable onPress={() => noti.markAllRead()} hitSlop={8}>
            <Text className="text-sm font-semibold text-primary">{t("notifications.markAllRead")}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <View className="mb-3 flex-row gap-2">
        {FILTERS.map((f) => {
          const active = unreadOnly === f.unreadOnly;
          return (
            <Pressable
              key={f.label}
              onPress={() => setUnreadOnly(f.unreadOnly)}
              className={`rounded-full px-4 py-2 ${active ? "bg-primary" : "bg-white/[0.06]"}`}
            >
              <Text className={`text-sm font-medium ${active ? "text-white" : "text-muted"}`}>
                {f.label}
                {f.unreadOnly && noti.unreadCount > 0 ? ` (${noti.unreadCount})` : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-28">
        {items.length === 0 && !noti.isLoading ? (
          <GlassSurface radius={24} className="mt-8 items-center p-10">
            <Ionicons name="notifications-off-outline" size={40} color={colors.muted} />
            <Text className="mt-3 text-muted">{t("notifications.empty")}</Text>
          </GlassSurface>
        ) : (
          items.map((item) => (
            <NotificationRow
              key={item.id}
              item={item}
              onPress={() => !item.isRead && noti.markRead(item.id!)}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
