import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand: black -> blue gradient system (see docs/01-brand-brief.md)
        ink: {
          DEFAULT: "#0A0F1F", // brand black
          900: "#0A0F1F",
          950: "#05080F",
        },
        brand: {
          DEFAULT: "#0B5FFF", // primary blue
          dark: "#0A2540",
          bright: "#3B82F6",
          glow: "#60A5FA",
        },
        whatsapp: "#25D366",
        warning: "#F59E0B",
        danger: "#DC2626",
      },
      backgroundImage: {
        // Signature gradient
        "brand-gradient": "linear-gradient(135deg, #0A0F1F 0%, #0B5FFF 100%)",
        "brand-gradient-deep": "linear-gradient(135deg, #000000 0%, #0A2540 100%)",
        "brand-gradient-vivid": "linear-gradient(135deg, #0B5FFF 0%, #3B82F6 100%)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
