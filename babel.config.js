module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // NOTE: Do NOT add @babel/plugin-transform-class-properties with loose:true.
    // Loose mode assigns class fields via `this.x = ...`, which breaks classes
    // that have read-only constant accessors on the prototype (e.g. RN's DOM
    // `Event` with its read-only `NONE` constant) → "Cannot assign to read-only
    // property 'NONE'". babel-preset-expo already handles class fields correctly
    // for the Hermes target, and RN 0.81's Hermes supports #private natively.
  };
};
