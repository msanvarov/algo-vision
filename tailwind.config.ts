import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm, deliberately small palette. The interface should read more
        // like a printed page than a dashboard.
        ink: {
          DEFAULT: '#e8e6e1',      // primary text — warm off-white
          dim: '#9a958c',          // secondary text
          fade: '#5e5a52',         // tertiary / labels
          ghost: '#383530',        // very-low-contrast outlines
        },
        paper: {
          DEFAULT: '#0d0d0f',      // page background
          raised: '#141417',       // panel fill (used very sparingly)
          line: '#1f1e22',         // hairline border
          edge: '#2a2926',         // slightly stronger border for emphasis
        },
        // A single signature accent. Warm sand — feels considered, not loud.
        accent: {
          DEFAULT: '#c9a06b',
          dim: '#a4845a',
          fade: '#5b4a35',
        },
        viz: {
          idle: '#26262b',
          active: '#d4a363',       // warm gold
          compare: '#7e9ea2',      // muted teal
          done: '#8aa67a',         // muted sage
          warn: '#c47a8a',         // muted rose
          pivot: '#b889a6',        // muted plum
          path: '#cbb37e',         // cream
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        'caps': '0.14em',
      },
    },
  },
  plugins: [],
};

export default config;
