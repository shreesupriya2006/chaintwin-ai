/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Status design tokens
        status: {
          healthy: '#10b981', // green = healthy / done
          inProgress: '#3b82f6', // blue = in progress
          waiting: '#9ca3af', // grey = not started / waiting
          atRisk: '#f97316', // orange = at risk
          disrupted: '#ef4444', // red = disrupted / will be late
          recovery: '#14b8a6', // teal = recovery route (plans only)
          simulation: '#8b5cf6', // purple = simulation
          assumption: '#f59e0b', // amber = assumption
        },
        navy: {
          800: '#0f172a',
          900: '#0b0f19',
          950: '#05070d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};
