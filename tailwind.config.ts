import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--rf-background)",
        foreground: "var(--rf-foreground)",
        primary: {
          DEFAULT: "#0F2D5E",
          light: "#1B3A6B",
          dark: "#091D3E",
        },
        accent: {
          DEFAULT: "#2563EB",
          light: "#EFF6FF",
          dark: "#1D4ED8",
        },
        fox: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
        },
        success: "#15803D",
        warning: "#D97706",
        danger: "#DC2626",
        surface: "#F8FAFF",
        muted: "#64748B",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
