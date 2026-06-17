import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
        'c-bg':      'var(--c-bg)',
        'c-surface': 'var(--c-surface)',
        'c-subtle':  'var(--c-subtle)',
        'c-border':  'var(--c-border)',
        'c-text':    'var(--c-text)',
        'c-text-2':  'var(--c-text-2)',
        'c-text-3':  'var(--c-text-3)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
