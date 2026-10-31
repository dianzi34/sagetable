/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#fbfaf6',
          100: '#f6f3eb',
          200: '#ede6d6',
          300: '#e1d4bc',
          400: '#d1bd9d',
          500: '#be9f7d',
          600: '#aa8667',
          700: '#8b6c52',
          800: '#725745',
          900: '#5e483b',
        },
        sage: {
          50: '#f4f7f4',
          100: '#e6ede6',
          200: '#ceddce',
          300: '#a7c2a7',
          400: '#7fa27f',
          500: '#5c845c',
          600: '#486848',
          700: '#3a533a',
          800: '#314331',
          900: '#2a382a',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
