/** @type {import('@bacons/apple-targets/app.plugin').Config} */
// App Group must match app.json ios.entitlements, lib/widget.ts and index.swift.
const APP_GROUP = "group.vn.vdcd.smartexpense";

module.exports = {
  type: "widget",
  name: "SmartExpenseWidget",
  displayName: "Smart Expense",
  icon: "../../assets/icon.png",
  deploymentTarget: "16.0",
  frameworks: ["SwiftUI", "WidgetKit"],
  colors: {
    $accent: "#1d9e75",
    $widgetBackground: { color: "#FFFFFF", darkColor: "#0B1020" },
  },
  entitlements: {
    "com.apple.security.application-groups": [APP_GROUP],
  },
};
