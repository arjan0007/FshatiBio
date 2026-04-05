/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0faf4',
          100: '#d8f3dc',
          200: '#b7e4c7',
          300: '#95d5b2',
          400: '#74c69d',
          500: '#52b788',
          600: '#40916c',
          700: '#2d6a4f',
          800: '#1b4332',
          900: '#081c15',
        },
        honey: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdba8',
          300: '#fec272',
          400: '#fca03a',
          500: '#f4a261',
          600: '#e76f51',
          700: '#c1440e',
          800: '#9a3812',
          900: '#7c2f14',
        },
        cream: {
          50: '#fffef7',
          100: '#fefae0',
          200: '#fdf3c0',
          300: '#fbe89a',
        },
        earth: {
          100: '#f5ede6',
          200: '#e8d5c4',
          300: '#d4b896',
          400: '#b8896a',
          500: '#8b5e3c',
          600: '#6b4423',
          700: '#4a2f17',
          800: '#2c1a0e',
        },
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'warm':       '0 4px 24px rgba(29,78,53,0.08)',
        'warm-md':    '0 8px 32px rgba(29,78,53,0.12)',
        'card':       '0 2px 16px rgba(29,78,53,0.07), 0 1px 4px rgba(29,78,53,0.04)',
        'card-hover': '0 8px 32px rgba(29,78,53,0.13)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in':  'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity:'0', transform:'translateY(12px)' }, '100%': { opacity:'1', transform:'translateY(0)' } },
        slideUp: { '0%': { opacity:'0', transform:'translateY(24px)' }, '100%': { opacity:'1', transform:'translateY(0)' } },
      },
    },
  },
  plugins: [],
}

