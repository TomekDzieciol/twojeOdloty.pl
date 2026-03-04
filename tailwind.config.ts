import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf4f6",
          100: "#fce7eb",
          200: "#f9d0da",
          300: "#f4aabb",
          400: "#ec7a94",
          500: "#e04d6e",
          600: "#cb2f54",
          700: "#ab2245",
          800: "#8f1f3d",
          900: "#7b1d38",
          950: "#450b1a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
