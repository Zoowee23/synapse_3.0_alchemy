/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        eco: {
          green:  '#10B981',
          blue:   '#3B82F6',
          dark:   '#0F172A',
          card:   '#1E293B',
          border: '#334155',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(16,185,129,0.3)',
        'glow-blue':  '0 0 20px rgba(59,130,246,0.3)',
      },
    },
  },
  plugins: [],
}
