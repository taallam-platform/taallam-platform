import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: '#e8ad3c', light: '#ffd878' },
        navy: '#071221',
        card: '#081728',
        line: '#1b3049',
        muted: '#91a0b7',
        brand: '#1677ff',
      },
      fontFamily: {
        cairo: ['Cairo', 'Tahoma', 'sans-serif'],
      },
      borderRadius: {
        xl2: '17px',
      },
    },
  },
  plugins: [],
};
export default config;
