import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        // Hassan Khel brand palette — Pashtun textiles & KP landscape
        forest: {
          DEFAULT: "#1B4332",
          50: "#EAF1ED",
          100: "#CADED4",
          600: "#22543D",
          700: "#1B4332",
          800: "#143427",
          900: "#0E241B",
        },
        terracotta: {
          DEFAULT: "#C97B5C",
          50: "#F9EEE8",
          100: "#F0D6C8",
          500: "#C97B5C",
          600: "#B5613F",
          700: "#8F4A2F",
        },
        cream: {
          DEFAULT: "#F5EFE6",
          50: "#FBF8F2",
          100: "#F5EFE6",
          200: "#EAE0CF",
          300: "#DCCDB2",
        },
        gold: {
          DEFAULT: "#C89B3C",
          400: "#D7B25E",
          500: "#C89B3C",
          600: "#A87E2A",
        },
        charcoal: {
          DEFAULT: "#1A1A1A",
          muted: "#4A4A46",
        },
        // shadcn semantic tokens (mapped to brand)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        nastaliq: ["var(--font-nastaliq)", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // soft, no harsh drop shadows
        soft: "0 2px 10px -4px rgba(27, 67, 50, 0.18)",
        card: "0 1px 3px rgba(26,26,26,0.06), 0 6px 18px -10px rgba(27,67,50,0.15)",
      },
      backgroundImage: {
        "paper-texture":
          "radial-gradient(rgba(27,67,50,0.025) 1px, transparent 1px)",
      },
      backgroundSize: {
        paper: "18px 18px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.35s ease-out both",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
