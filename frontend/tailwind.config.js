/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        eco: {
          green:  '#10B981',
          blue:   '#3B82F6',
          dark:   '#0F172A',
          card:   '#1E293B',
          border: '#334155',
        },
      },
    },
  },
  plugins: [],
}
