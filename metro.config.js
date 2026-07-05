const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Inject our globals polyfill into Metro's polyfill list. Polyfills run BEFORE
// every module (including RN InitializeCore and Expo's winter runtime), which is
// the only reliable place to define `global.DOMException` — RN 0.81 webapis
// (Performance/structuredClone/geometry) reference it and Expo Go's Hermes does
// not provide it. Preserve the default RN polyfills.
const getDefaultPolyfills = config.serializer.getPolyfills
  ? config.serializer.getPolyfills.bind(config.serializer)
  : require("@react-native/js-polyfills");
config.serializer.getPolyfills = (...args) => [
  ...getDefaultPolyfills(...args),
  require.resolve("./polyfills.js"),
];

module.exports = withNativeWind(config, { input: "./global.css" });
