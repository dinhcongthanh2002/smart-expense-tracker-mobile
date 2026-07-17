import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { colors } from "@/theme/colors";

/**
 * Native tab bar. iOS renders a real UITabBar with SF Symbols (Liquid Glass on
 * iOS 26+). Android has no SF Symbols and the previous `drawable="ic_*"` names
 * pointed at resources that don't exist, so icons were blank — we supply
 * Ionicons via `androidSrc` instead. (NativeTabs' web fallback renders labels
 * only and cannot show icons — a library limitation.)
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <NativeTabs tintColor={colors.primary} disableTransparentOnScrollEdge>
      <NativeTabs.Trigger name="index">
        <Label>{t("tabs.dashboard")}</Label>
        <Icon
          sf="chart.pie.fill"
          androidSrc={<VectorIcon family={Ionicons} name="pie-chart" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="transactions">
        <Label>{t("tabs.transactions")}</Label>
        <Icon
          sf="list.bullet.rectangle.fill"
          androidSrc={<VectorIcon family={Ionicons} name="list" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="wallets">
        <Label>{t("tabs.wallets")}</Label>
        <Icon
          sf="creditcard.fill"
          androidSrc={<VectorIcon family={Ionicons} name="wallet" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>{t("tabs.profile")}</Label>
        <Icon
          sf="person.crop.circle.fill"
          androidSrc={<VectorIcon family={Ionicons} name="person-circle" />}
        />
      </NativeTabs.Trigger>
      {/* iOS 26+ renders role="search" as a dedicated, separated search tab. */}
      <NativeTabs.Trigger name="search" role="search">
        <Label>{t("movies.tab")}</Label>
        <Icon
          sf="magnifyingglass"
          androidSrc={<VectorIcon family={Ionicons} name="search" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
