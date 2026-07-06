import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

import { colors } from "@/theme/colors";

// iOS 15–25 UITabBar is transparent at the scroll edge, so give it a blur
// material. iOS 26+ gets Liquid Glass automatically (leave blurEffect unset).
const iosVersion =
  Platform.OS === "ios" ? parseInt(String(Platform.Version), 10) || 0 : 0;
const legacyBlurEffect =
  Platform.OS === "ios" && iosVersion < 26 ? "systemChromeMaterialDark" : undefined;

/**
 * Native iOS tab bar (real UITabBar). iOS 26+ renders it with Liquid Glass;
 * older iOS gets a dark blur material so it isn't transparent.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <NativeTabs tintColor={colors.primary}>
      <NativeTabs.Trigger name="index">
        <Label>{t("tabs.dashboard")}</Label>
        <Icon sf="chart.pie.fill" drawable="ic_dashboard" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="transactions">
        <Label>{t("tabs.transactions")}</Label>
        <Icon sf="list.bullet.rectangle.fill" drawable="ic_list" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="budgets">
        <Label>{t("tabs.budgets")}</Label>
        <Icon sf="chart.bar.fill" drawable="ic_budget" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="wallets">
        <Label>{t("tabs.wallets")}</Label>
        <Icon sf="creditcard.fill" drawable="ic_wallet" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>{t("tabs.profile")}</Label>
        <Icon sf="person.crop.circle.fill" drawable="ic_person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
