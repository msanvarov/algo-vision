import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0a0b10',
          panel: '#13151c',
          elevated: '#1a1d27',
          border: '#262a35',
        },
        accent: {
          DEFAULT: '#7c5cff',
          glow: '#a78bfa',
          mute: '#3d2b80',
        },
        viz: {
          idle: '#3a3f4d',
          active: '#fbbf24',
          compare: '#38bdf8',
          done: '#22c55e',
          warn: '#f472b6',
          path: '#a3e635',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 8px rgba(124, 92, 255, 0.4)' },
          '100%': { boxShadow: '0 0 24px rgba(124, 92, 255, 0.9)' },
        },
      },
      boxShadow: {
        'panel': '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
