/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sidebar': '#F7F7F7',
        'primary': '#1A1A1A',
        'warning': '#FFA500',
      },
    },
  },
  plugins: [],
}