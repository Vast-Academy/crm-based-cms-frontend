/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',
        secondary: '#f97316',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  extend: {
        animation: {
          'slideIn': 'slideIn 0.3s ease-out forwards',
        },
        keyframes: {
          slideIn: {
            '0%': { transform: 'translateX(100%)', opacity: 0 },
            '100%': { transform: 'translateX(0)', opacity: 1 },
          }
        }
      }
    }

