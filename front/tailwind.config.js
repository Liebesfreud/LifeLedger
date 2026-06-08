/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: '#E5E7EB',
        background: '#F8FAFC',
        foreground: '#111827',
        primary: '#2563EB',
        muted: '#64748B',
        card: '#FFFFFF'
      }
    }
  },
  plugins: []
};
