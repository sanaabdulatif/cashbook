/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#65081F',
          dark: '#41000F',
          container: '#65081F',
          fixed: '#FFDADB',
        },
        secondary: {
          DEFAULT: '#5D5F5F',
          container: '#DFE0E0',
        },
        surface: {
          DEFAULT: '#F8F9FA',
          dim: '#D9DADB',
          bright: '#F8F9FA',
          container: {
            lowest: '#FFFFFF',
            low: '#F3F4F5',
            DEFAULT: '#EDEEEF',
            high: '#E7E8E9',
            highest: '#E1E3E4',
          }
        },
        'on-primary': '#FFFFFF',
        'on-surface': '#191C1D',
        'on-surface-variant': '#564243',
        outline: '#897172',
        'outline-variant': '#DCC0C1',
        cashin: {
          DEFAULT: '#00AE79',
          bg: '#E6F4EA',
          border: '#34A853',
        },
        cashout: {
          DEFAULT: '#BA1A1A',
          bg: '#FCE8E6',
          border: '#EA4335',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        ambient: '0 4px 12px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
