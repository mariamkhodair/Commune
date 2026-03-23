/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F2",
        "cream-dark": "#EDE8DF",
        brown: {
          900: "#4A3728",
          700: "#6B5040",
          500: "#8B7355",
          300: "#A09080",
          200: "#C4B9AA",
          100: "#D9CFC4",
        },
        rust: "#A0624A",
      },
    },
  },
  plugins: [],
};
