/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#00f0ff',
          pink: '#ff00e5',
          green: '#39ff14',
          yellow: '#f0ff00',
          purple: '#bf00ff',
        },
        dark: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a2e',
          600: '#252540',
          500: '#2d2d4a',
        },
        fever: {
          warm: '#ff9500',
          hot: '#ff4400',
          fire: '#ff0044',
          inferno: '#ff0066',
          neon: '#ff2200',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        display: ['"Orbitron"', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 5px #00f0ff, 0 0 20px rgba(0,240,255,0.3), 0 0 40px rgba(0,240,255,0.1)',
        'neon-pink': '0 0 5px #ff00e5, 0 0 20px rgba(255,0,229,0.3), 0 0 40px rgba(255,0,229,0.1)',
        'neon-green': '0 0 5px #39ff14, 0 0 20px rgba(57,255,20,0.3), 0 0 40px rgba(57,255,20,0.1)',
        'neon-red': '0 0 5px #ff3333, 0 0 20px rgba(255,51,51,0.3)',
        'neon-fire': '0 0 10px #ff4400, 0 0 30px rgba(255,68,0,0.4), 0 0 60px rgba(255,68,0,0.2), 0 0 100px rgba(255,0,68,0.1)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
        'fever-pulse': 'fever-pulse 0.5s ease-in-out infinite',
        'fever-shake': 'fever-shake 0.1s ease-in-out infinite',
        'particle-rise': 'particle-rise 1.5s ease-out forwards',
        'screen-pulse': 'screen-pulse 0.8s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'fever-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.02)', opacity: '0.9' },
        },
        'fever-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-1px)' },
          '75%': { transform: 'translateX(1px)' },
        },
        'particle-rise': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-80px) scale(0)', opacity: '0' },
        },
        'screen-pulse': {
          '0%, 100%': { opacity: '0.03' },
          '50%': { opacity: '0.08' },
        },
      },
    },
  },
  plugins: [],
};
