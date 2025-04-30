/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,html,css}",
    "./components/**/*.{js,ts,jsx,tsx,html,css}",
    "./public/**/*.{svg,png,jpg,jpeg}",
  ],
  darkMode: "class", // class方式でダークモードを有効化
  theme: {
    extend: {
      colors: {
        appleGray: "#f5f5f7",
        appleBlue: "#0071e3",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
