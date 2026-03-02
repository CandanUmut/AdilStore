import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // AdilStore design tokens — matching existing palette
        bg: {
          DEFAULT: "#020617",
          soft: "#020617",
        },
        panel: {
          DEFAULT: "rgba(15,23,42,0.92)",
          soft: "rgba(15,23,42,0.88)",
          strong: "rgba(15,23,42,0.97)",
        },
        accent: {
          DEFAULT: "#38bdf8",
          soft: "rgba(56,189,248,0.16)",
          strong: "#0ea5e9",
        },
        danger: "#f97373",
        chip: "#0b1120",
        border: {
          DEFAULT: "#1f2937",
          soft: "rgba(148,163,184,0.16)",
          medium: "rgba(148,163,184,0.35)",
          strong: "rgba(148,163,184,0.55)",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl2: "18px",
      },
      boxShadow: {
        soft: "0 18px 40px rgba(15,23,42,0.6)",
        accent: "0 10px 25px rgba(56,189,248,0.6)",
        "accent-lg": "0 14px 32px rgba(56,189,248,0.9)",
      },
      backgroundImage: {
        "page-gradient":
          "radial-gradient(circle at 10% 10%, rgba(14,165,233,0.18), transparent 35%), radial-gradient(circle at 80% 0%, rgba(236,72,153,0.16), transparent 32%), linear-gradient(135deg, rgba(8,47,73,0.9), rgba(2,6,23,0.95))",
        "ambient-glow":
          "radial-gradient(circle, rgba(56,189,248,0.08) 0, transparent 40%), radial-gradient(circle at 80% 20%, rgba(94,234,212,0.08) 0, transparent 35%), radial-gradient(circle at 20% 80%, rgba(59,130,246,0.08) 0, transparent 35%)",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%": { boxShadow: "0 0 0 0 rgba(56,189,248,0.7)" },
          "100%": { boxShadow: "0 0 0 18px rgba(56,189,248,0)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
        "pulse-ring": "pulse 1.2s ease",
      },
    },
  },
  plugins: [],
};

export default config;
