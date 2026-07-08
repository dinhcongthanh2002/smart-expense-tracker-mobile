/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  // Colors resolve from CSS variables so the app can switch between system,
  // light and dark without changing component classNames.
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        primary: {
          DEFAULT: "var(--primary)",
          soft: "var(--primary-soft)",
          dark: "var(--primary-dark)",
        },
        income: "var(--income)",
        expense: "var(--expense)",
        transfer: "var(--transfer)",
        warning: "var(--warning)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        glass: {
          light: "var(--glass-tint)",
          border: "var(--glass-border)",
        },
      },
      borderRadius: {
        xl2: "20px",
        xl3: "28px",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
