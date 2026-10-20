/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/client/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#F6F4EF',
        card: '#FFFEFA',
        primary: {
          DEFAULT: '#68745D',
          hover: '#56604C',
          light: '#EBEFE8',
        },
        secondary: {
          DEFAULT: '#B87956',
          hover: '#9E6445',
          light: '#F8EFE9',
        },
        ink: {
          DEFAULT: '#292824',
          muted: '#77746C',
          light: '#A39F95',
        },
        border: {
          DEFAULT: '#E7E2D8',
          subtle: '#EFECE6',
        }
      },
      fontFamily: {
        sans: [
          '"Noto Sans TC"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ]
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(41, 40, 36, 0.04)',
        'soft-lg': '0 10px 25px -5px rgba(41, 40, 36, 0.06), 0 8px 10px -6px rgba(41, 40, 36, 0.04)'
      }
    },
  },
  plugins: [],
}
