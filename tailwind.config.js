/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080808",
        panel: "#131313",
        soft: "#1b1b1b",
        line: "#2a2a2a",
        fog: "#a0a0a0",
        paper: "#f0efec",
        gold: { DEFAULT: "#C6A15B", bright: "#D4AF37", deep: "#B8954F", dim: "rgba(198,161,91,0.35)" }
      },
      fontFamily: {
        display: ["'Space Grotesk'", "Inter", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
