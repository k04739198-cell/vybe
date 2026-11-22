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
        vybe: {
          dark: "#0B0B0F",
          card: "#14141E",
          surface: "#1A1A28",
          purple: "#7C3AED",
          purpleLight: "#9061F9",
          neon: "#A855F7",
          pink: "#EC4899",
          gray: "#2A2A3C",
          textMuted: "#9CA3AF"
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(124, 58, 237, 0.4)' },
          '100%': { boxShadow: '0 0 30px rgba(124, 58, 237, 0.8), 0 0 50px rgba(168, 85, 247, 0.4)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
