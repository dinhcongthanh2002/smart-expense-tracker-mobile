import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";

import { colors } from "@/theme/colors";

/**
 * Native iOS tab bar (real UITabBar). On iOS 26+ the system automatically
 * renders it with Liquid Glass — identical to Apple's own apps. We only set a
 * tint so the bar stays translucent and adopts the system glass material.
 */
export default function TabsLayout() {
  return (
    <NativeTabs tintColor={colors.primary}>
      <NativeTabs.Trigger name="index">
        <Label>Tổng quan</Label>
        <Icon sf="chart.pie.fill" drawable="ic_dashboard" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="transactions">
        <Label>Giao dịch</Label>
        <Icon sf="list.bullet.rectangle.fill" drawable="ic_list" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="categories">
        <Label>Danh mục</Label>
        <Icon sf="square.grid.2x2.fill" drawable="ic_grid" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Cá nhân</Label>
        <Icon sf="person.crop.circle.fill" drawable="ic_person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
