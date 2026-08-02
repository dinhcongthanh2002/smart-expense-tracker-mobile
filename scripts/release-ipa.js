// Tag the current app.json version as `v<version>` and push it, which triggers
// the "Build unsigned iOS IPA" GitHub Action. Re-tags in place if the tag already
// exists (so re-building the same version just works).
//
// Flow to ship a NEW version:
//   1. bump `expo.version` in app.json (and "version" in package.json to match)
//   2. commit + push dev
//   3. npm run release:ipa
const { execSync } = require("child_process");

const version = require("../app.json").expo.version;
if (!version) {
  console.error("No expo.version found in app.json");
  process.exit(1);
}
const tag = `v${version}`;

function run(cmd, { ignoreError = false } = {}) {
  console.log(`$ ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    if (!ignoreError) throw err;
    console.log(`  (ignored: ${tag} did not exist)`);
  }
}

// Delete any existing tag (local + remote) so the version always points at HEAD,
// then recreate and push it. The deletes are best-effort for brand-new versions.
run(`git tag -d ${tag}`, { ignoreError: true });
run(`git push origin :refs/tags/${tag}`, { ignoreError: true });
run(`git tag ${tag}`);
run(`git push origin ${tag}`);

console.log(`\n✓ Tagged ${tag} → CI build started. Watch the Actions tab.`);
