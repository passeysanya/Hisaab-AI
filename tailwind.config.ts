import type { Config } from "tailwindcss";

// Design system tokens (see CLAUDE.md). "paper" rather than "base" so it
// doesn't collide with Tailwind's `text-base` font-size utility.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FFFFFF",
        ink: "#0A0A0A",
        accent: "#FF5A1F",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        label: "0.14em",
      },
    },
  },
  plugins: [],
};

export default config;
