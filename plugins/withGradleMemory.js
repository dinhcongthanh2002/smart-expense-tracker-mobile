/**
 * Expo config plugin: raise the Gradle JVM heap/metaspace so the Android
 * release build (KSP + many native modules) doesn't fail with
 * `java.lang.OutOfMemoryError: Metaspace`. Applied on every `expo prebuild`,
 * so the setting survives `--clean` (unlike hand-editing gradle.properties).
 */
const { withGradleProperties } = require("@expo/config-plugins");

const JVM_ARGS = "-Xmx4096m -XX:MaxMetaspaceSize=2048m -Dfile.encoding=UTF-8";

module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (cfg) => {
    const key = "org.gradle.jvmargs";
    const existing = cfg.modResults.find(
      (item) => item.type === "property" && item.key === key,
    );
    if (existing) {
      existing.value = JVM_ARGS;
    } else {
      cfg.modResults.push({ type: "property", key, value: JVM_ARGS });
    }
    return cfg;
  });
};
