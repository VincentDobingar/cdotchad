const typography = require('@tailwindcss/typography');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // <== Ajout ici pour activer le mode sombre
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#c8102e", // Rouge inspiré du logo
        'primary-dark': '#9a0d25',
        secondary: "#1a1a1a", // Gris clair
        accent: "#f3f4f6",
        // Palette « premium » (refonte du 19/10/2026)
        encre: "#1b1410",
        graphite: "#4a423c",
        ivoire: "#faf6ef",
        rouge: "#c8102e",
        rougeprofond: "#7a0a1c",
        sable: "#efe7db",
        sablefonce: "#e2d6c5",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      animation: {
        fadeIn: "fadeIn 1s ease-out",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
    },
  },
    plugins: [typography]
};
