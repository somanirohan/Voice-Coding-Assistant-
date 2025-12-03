import tailwindcssNoScrollbar from 'tailwindcss-no-scrollbar';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // This line is crucial
  ],
  theme: {
    extend: {
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '.2' },
          '50%': { opacity: '.1' },
        }
      },
      animation: {
        'pulse-slow': 'pulse-slow 10s ease-in-out infinite',
      }
    },
  },
  plugins: [
    tailwindcssNoScrollbar
  ],
}