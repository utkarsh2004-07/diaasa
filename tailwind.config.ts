import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fdf8f2",
          100: "#faefd9",
          200: "#f5ddb3",
          300: "#efc47f",
          400: "#e8a34b",
          500: "#e08a28",
          600: "#c4701e",
          700: "#a3541b",
          800: "#84431d",
          900: "#6c3819",
          950: "#3a1b0b",
        },
        cream: {
          50:  "#fefdfb",
          100: "#fdf9f3",
          200: "#faf3e8",
          300: "#f5e9d4",
          400: "#eed8b8",
          500: "#e4c49a",
        },
        charcoal: {
          900: "#1a1714",
          800: "#2d2925",
          700: "#413d38",
          600: "#56514b",
          500: "#6b665f",
          400: "#8a847d",
          300: "#aaa49d",
          200: "#cac5be",
          100: "#e5e1dc",
          50:  "#f5f3f0",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-up": "fadeUp 0.6s ease-out",
        "fade-down": "fadeDown 0.5s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
        "slide-in-left": "slideInLeft 0.4s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "shimmer": "shimmer 2s infinite",
        "spin-slow": "spin 3s linear infinite",
        "bounce-soft": "bounceSoft 1s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeDown: {
          "0%": { opacity: "0", transform: "translateY(-16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      backdropBlur: {
        xs: "2px",
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "soft": "0 2px 20px rgba(0,0,0,0.06)",
        "medium": "0 4px 40px rgba(0,0,0,0.1)",
        "strong": "0 8px 60px rgba(0,0,0,0.15)",
        "brand": "0 4px 20px rgba(224,138,40,0.3)",
        "inner-soft": "inset 0 1px 4px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
