/** Tailwind configuration for STEMAIDE Web Studio */
module.exports = {
  content: ["./app/**/*.{ts,tsx,js,jsx}", "./pages/**/*.{ts,tsx,js,jsx}", "./components/**/*.{ts,tsx,js,jsx}", "./src/**/*.{ts,tsx,js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#e6ecff',
          200: '#cbdcff',
          300: '#9fbaff',
          400: '#5c86ff',
          500: '#3558e6',
          600: '#2b46bf',
          700: '#20318f',
          800: '#15215f',
          900: '#0a1230',
        }
      }
    }
  },
  plugins: [],
}
