import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette derived from the Fundi logo: navy blue + orange.
        ink: {
          DEFAULT: "#0A2240", // deep navy ink (text)
          900: "#0A2240",
          950: "#061629",
        },
        brand: {
          DEFAULT: "#0A2C5E", // logo navy (primary)
          dark: "#06203F",
          bright: "#16498F",
          glow: "#4E7BC0",
        },
        accent: {
          DEFAULT: "#F4731C", // logo orange (accent / CTA)
          dark: "#D8610F",
          light: "#FF8A3D",
        },
        whatsapp: "#25D366",
        warning: "#F59E0B",
        danger: "#DC2626",
      },
      backgroundImage: {
        // Navy gradient (signature) + a navy->orange variant for highlights
        "brand-gradient": "linear-gradient(135deg, #0A2C5E 0%, #16498F 100%)",
        "brand-gradient-deep": "linear-gradient(135deg, #06203F 0%, #0A2C5E 100%)",
        "brand-gradient-vivid": "linear-gradient(135deg, #0A2C5E 0%, #F4731C 100%)",
      },
      fontFamily: {
        // Native system stack — no web-font download (low-bandwidth friendly).
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
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
