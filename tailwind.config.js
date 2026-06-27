/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        sanctuary: {
          bg: "#0a0e17",
          surface: "rgba(255, 255, 255, 0.06)",
          border: "rgba(255, 255, 255, 0.1)",
        },
        accent: {
          DEFAULT: "#6366f1",
          soft: "#818cf8",
        },
      },
    },
  },
  plugins: [],
};
