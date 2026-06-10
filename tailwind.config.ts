import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        panel: "#13131a",
        panel2: "#1c1c26",
        border: "#2a2a36",
        accent: "#7c5cff",
        accent2: "#22d3ee",
        danger: "#ef4444",
        muted: "#8b8b9a",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;
