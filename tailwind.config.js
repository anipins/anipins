/** @type {import('tailwindcss').Config} */
const themed = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: themed("ink"),
        panel: themed("panel"),
        soft: themed("soft"),
        line: themed("line"),
        fog: themed("fog"),
        paper: themed("paper"),
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
