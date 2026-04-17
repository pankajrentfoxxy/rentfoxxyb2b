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
        navy: {
          DEFAULT: "#0A1628",
          light: "#0D1F3C",
          mid: "#0D2040",
          dark: "#060F1A",
        },
        amber: {
          DEFAULT: "#F59E0B",
          dark: "#D97706",
          bg: "#FFFBEB",
          border: "#FDE68A",
        },
        verified: {
          DEFAULT: "#10B981",
          bg: "#F0FDF4",
          border: "#BBF7D0",
          text: "#166534",
        },
        lot: {
          DEFAULT: "#1D4ED8",
          bg: "#EFF6FF",
          border: "#BFDBFE",
          text: "#1D4ED8",
        },
        asas: {
          DEFAULT: "#7C3AED",
          dark: "#6D28D9",
          bg: "#F5F3FF",
          border: "#DDD6FE",
          text: "#5B21B6",
        },
        surface: "#F8FAFC",
        card: "#FFFFFF",
        border: {
          DEFAULT: "#E2E8F0",
          light: "#F1F5F9",
          dark: "#CBD5E1",
        },
        ink: {
          primary: "#0A1628",
          secondary: "#475569",
          muted: "#94A3B8",
          hint: "#CBD5E1",
        },
        grade: {
          new: { bg: "#F0FDF4", text: "#166534" },
          aplus: { bg: "#EFF6FF", text: "#1D4ED8" },
          a: { bg: "#F5F3FF", text: "#5B21B6" },
          b: { bg: "#FEF9C3", text: "#92400E" },
          c: { bg: "#FEF3C7", text: "#B45309" },
          d: { bg: "#FEE2E2", text: "#991B1B" },
        },
        /** Pre–v1.7 class names — prefer navy / lot / amber; replace in P8 */
        primary: {
          DEFAULT: "#0A1628",
          light: "#0D1F3C",
          dark: "#060F1A",
        },
        accent: {
          DEFAULT: "#1D4ED8",
          light: "#EFF6FF",
          dark: "#1D4ED8",
        },
        fox: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
        },
        muted: "#64748B",
        success: "#15803D",
        warning: "#D97706",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
