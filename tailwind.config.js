/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ec4899',
          50: '#fdf2f8',
          100: '#fce7f3',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
        },
        secondary: {
          DEFAULT: '#8b5cf6',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        bg: {
          DEFAULT: '#0f172a',
          elevated: '#16213a',
        },
        card: {
          DEFAULT: '#1e293b',
          hover: '#243248',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(0,0,0,0.35)',
        glow: '0 0 24px rgba(236,72,153,0.35)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.4 },
        },
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        pulseDot: 'pulseDot 2s ease-in-out infinite',
        fadeIn: 'fadeIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
