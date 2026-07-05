/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // App base (dark, so Liquid Glass reads best)
        background: "#0B1020",
        surface: "#141A2E",
        // Brand
        primary: {
          DEFAULT: "#6C7CFF",
          soft: "#8B96FF",
          dark: "#4C5BD4",
        },
        // Semantic finance colors
        income: "#34D399",
        expense: "#FB7185",
        transfer: "#38BDF8",
        warning: "#FBBF24",
        // Text
        ink: "#F5F7FF",
        muted: "#9AA3BE",
        // Glass tints
        glass: {
          light: "rgba(255,255,255,0.10)",
          border: "rgba(255,255,255,0.18)",
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
