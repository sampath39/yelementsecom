/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#0f172a",

        // 🌿 DMART GREEN THEME
        primary: "#16a34a",               // main green
        "primary-foreground": "#ffffff",

        secondary: "#dcfce7",             // light green bg
        "secondary-foreground": "#14532d",

        muted: "#f0fdf4",                 // very light green
        "muted-foreground": "#166534",

        border: "#bbf7d0",                // soft green border

        // optional extras (nice UI boost)
        accent: "#22c55e",
        success: "#15803d",
      },
    },
  },
  plugins: [],
};