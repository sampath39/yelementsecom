/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",

        // 🌿 DMART GREEN THEME
        primary: "var(--primary)",               // main green
        "primary-foreground": "var(--primary-foreground)",

        secondary: "var(--secondary)",             // light green bg
        "secondary-foreground": "var(--secondary-foreground)",

        muted: "var(--muted)",                 // very light green
        "muted-foreground": "var(--muted-foreground)",

        border: "var(--border)",                // soft green border

        // optional extras (nice UI boost)
        accent: "var(--accent)",
        success: "var(--success)",
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0))',
        'glass-gradient-dark': 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'neon': '0 0 10px rgba(22, 163, 74, 0.5), 0 0 20px rgba(22, 163, 74, 0.3)',
      }
    },
  },
  plugins: [],
};