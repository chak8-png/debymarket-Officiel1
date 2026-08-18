import type { Config } from "tailwindcss";

// Design system : fond crème, texte encre, couleurs de base BLEU + VERT.
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/frontend/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bleu — couleur principale (actions, liens, promos)
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
          800: "#1e3a8a",
          900: "#152c68",
          950: "#0c1b45",
        },
        ink: {
          DEFAULT: "#0b0f14",
          50: "#f6f7f8",
          100: "#ebecee",
          200: "#d8dbdf",
          300: "#b6bcc3",
          400: "#8e97a1",
          500: "#6b7480",
          600: "#4d5560",
          700: "#384049",
          800: "#21262e",
          900: "#141a21",
          950: "#0b0f14",
        },
        cream: "#fafaf7",
        sand: "#f3f2ee",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      borderColor: {
        DEFAULT: "#e7e5df", // bordures chaudes sur fond crème
      },
    },
  },
  plugins: [],
};

export default config;
