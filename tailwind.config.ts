import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#05060a",
        // Translucent surfaces — the parallax aurora shows through; add
        // `backdrop-blur` for the frosted-glass effect.
        panel: "rgba(255,255,255,0.05)",
        panel2: "rgba(255,255,255,0.09)",
        border: "rgba(255,255,255,0.12)",
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        accent2: "rgb(var(--accent2-rgb) / <alpha-value>)",
        danger: "#ef4444",
        muted: "#9aa0b4",
      },
      fontFamily: { sans: ["-apple-system", "SF Pro Text", "Inter", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;
