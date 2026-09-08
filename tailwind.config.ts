import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", lg: "2rem" },
      screens: { "2xl": "1380px" },
    },
    extend: {
      colors: {
        // Brend paleta PlugekS
        brand: {
          DEFAULT: "#1B5E20", // duboka zelena
          600: "#2E7D32",
          500: "#388E3C",
          400: "#4CAF50",
          50: "#EAF3EB",
        },
        cream: "#FAFAF7", // topla off-white
        // Prljavo bela — podloga kartica prikolica. Kartica se odvaja od krem
        // strane, a ostaje dovoljno svetla da se bela pozadina fotografije
        // proizvoda ne vidi kao zaseban beli pravougaonik u njoj.
        bone: "#EFF0EA",
        charcoal: "#101411", // ugljeno za tamne sekcije
        accent: {
          DEFAULT: "#E0A106", // amber CTA
          600: "#C98B04",
          400: "#F1B82E",
        },
        border: "hsl(120 6% 82%)",
        input: "hsl(120 6% 82%)",
        ring: "#2E7D32",
        background: "#FAFAF7",
        foreground: "#101411",
        muted: { DEFAULT: "#ECEEE8", foreground: "#30372F" },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "2rem",
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgb(16 20 17 / 0.08), 0 8px 24px -8px rgb(16 20 17 / 0.10)",
        card: "0 1px 3px rgb(16 20 17 / 0.06), 0 12px 32px -12px rgb(16 20 17 / 0.14)",
        lift: "0 8px 16px -8px rgb(16 20 17 / 0.12), 0 24px 48px -16px rgb(27 94 32 / 0.20)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgb(16 20 17 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgb(16 20 17 / 0.04) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "marquee": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        "marquee": "marquee 28s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
