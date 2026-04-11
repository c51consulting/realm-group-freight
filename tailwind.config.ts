import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // REALM brand palette — earthy agricultural tones
        brand: {
          50:  '#f5f7ee',
          100: '#e8edcf',
          200: '#d2dca2',
          300: '#b5c46c',
          400: '#97ac3f',
          500: '#7a9228',  // primary green
          600: '#5f7320',
          700: '#48571a',
          800: '#343e14',
          900: '#1f250c',
        },
        earth: {
          50:  '#faf6f0',
          100: '#f0e6d3',
          200: '#e0cba8',
          300: '#cba876',
          400: '#b8874e',
          500: '#9e6b35',  // warm brown
          600: '#7d5229',
          700: '#5e3c1e',
          800: '#3f2814',
          900: '#20140a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
