// Loaded as a Metro polyfill (see metro.config.js) so it runs before any module.
// Defines `globalThis.DOMException` if the runtime lacks it (harmless no-op on a
// dev/release build where RN 0.81 already installs it; needed only on runtimes
// that don't, such as older Expo Go Hermes). Runs in global scope (no imports).

/* eslint-disable no-undef */
(function () {
  if (typeof globalThis.DOMException === "undefined") {
    function DOMException(message, name) {
      var err = Error.call(this, message);
      this.message = message || "";
      this.name = name || "Error";
      this.code = 0;
      this.stack = err.stack;
    }
    DOMException.prototype = Object.create(Error.prototype);
    DOMException.prototype.constructor = DOMException;
    globalThis.DOMException = DOMException;
  }
})();
