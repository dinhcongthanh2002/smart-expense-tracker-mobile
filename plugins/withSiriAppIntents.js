const {
  withDangerousMod,
  withXcodeProject,
  IOSConfig,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Swift sources (kept in plugins/ios/) that define the Siri App Intents. They
// are compiled INTO the main app target so AppShortcutsProvider is registered
// at install time and the intents run in the app's process (with App Group
// access to the shared session). @bacons/apple-targets only builds extensions,
// so the main-target injection is done here by hand during `expo prebuild`.
const SWIFT_FILES = ["ExpenseSiriIntents.swift"];
const SRC_DIR = path.join(__dirname, "ios");

// 1. Copy the Swift sources into ios/<projectName>/ on every prebuild.
const withCopiedSources = (config) =>
  withDangerousMod(config, [
    "ios",
    (config) => {
      const { platformProjectRoot, projectName } = config.modRequest;
      const destDir = path.join(platformProjectRoot, projectName);
      fs.mkdirSync(destDir, { recursive: true });
      for (const file of SWIFT_FILES) {
        fs.copyFileSync(path.join(SRC_DIR, file), path.join(destDir, file));
      }
      return config;
    },
  ]);

// 2. Register them in the main app target's "Compile Sources" build phase.
const withLinkedSources = (config) =>
  withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = config.modRequest.projectName;
    for (const file of SWIFT_FILES) {
      const filepath = `${projectName}/${file}`;
      // Idempotent — addBuildSourceFileToGroup would duplicate on re-run.
      if (!project.hasFile(filepath)) {
        IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
          filepath,
          groupName: projectName,
          project,
        });
      }
    }
    return config;
  });

/** @param {import('@expo/config-plugins').ConfigPlugin} */
const withSiriAppIntents = (config) => {
  config = withCopiedSources(config);
  config = withLinkedSources(config);
  return config;
};

module.exports = withSiriAppIntents;
