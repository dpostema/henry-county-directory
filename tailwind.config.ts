import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Accent Colors (Primary Brand Red/Coral)
        brandRed: {
          DEFAULT: "#E8505B",
          hover: "#CF3641",
          muted: "#FCEBEF",
        },
        // Custom background names matching our design tokens
        brandBg: {
          app: "#F8F9FA",
          card: "#FFFFFF",
        },
        // Typography Colors (Charcoal Scale)
        brandText: {
          dark: "#212529",
          medium: "#495057",
          light: "#6C757D",
        },
        // Border Colors
        brandBorder: {
          light: "#E9ECEF",
        },
        // Status Badge Colors (Featured, Best Rate, Most View, Ad, Verified, Star Ratings)
        badge: {
          featured: "#E8505B",
          bestrate: "#FF9F43",
          mostview: "#485460",
          ad: "#2E86DE",
          verified: "#28C76F",
          rating: "#FFB800",
        },
      },
      fontFamily: {
        heading: ["Outfit", "Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 2px 10px -2px rgba(0, 0, 0, 0.02)",
        search: "0 10px 40px -10px rgba(0, 0, 0, 0.08)",
      },
      borderRadius: {
        // Smooth containers
        "base-container": "1rem", // 16px
        // Cards roundedness
        "card": "0.75rem", // 12px
        // Buttons and Inputs roundedness
        "btn": "0.5rem", // 8px
      },
      transitionTimingFunction: {
        "custom-ease": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
