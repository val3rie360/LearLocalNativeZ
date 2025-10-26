/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Karla"],
        karla: ["Karla", "sans-serif"],
        "karla-bold": ["Karla-Bold", "sans-serif"],
        "karla-italic": ["Karla-Italic", "sans-serif"],
      },
      colors: {
        logo: "#FFF065",
        secondary: "#4B1EB4",
        primaryg: "#A1A1AA",
      },
      borderColor: {
        primaryg: "#A1A1AA",
      },
    },
  },
  plugins: [],
};
