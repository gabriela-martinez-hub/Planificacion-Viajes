/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Paleta de marca inspirada en una estética retro-botánica del trópico
      // (verde selva + ámbar/mostaza + papel crema + tinta marrón). No replica
      // ninguna obra concreta: son solo tonos y matices.
      colors: {
        // Verde de marca (antes se usaba emerald).
        selva: {
          50: '#f3f6ef',
          100: '#e4ebdb',
          200: '#c9d7b7',
          300: '#a6bc8c',
          400: '#7f9d61',
          500: '#5f8043',
          600: '#4a6734',
          700: '#3b522c',
          800: '#314227',
          900: '#2a3822',
          950: '#151f10',
        },
        // Ámbar/mostaza de acento (antes amber).
        ambar: {
          50: '#fdf7ec',
          100: '#f9e9c8',
          200: '#f2d08d',
          300: '#eab551',
          400: '#e39f2c',
          500: '#cf8518',
          600: '#b26a13',
          700: '#8e4e14',
          800: '#753e17',
          900: '#633417',
          950: '#391a09',
        },
        // Tinta marrón cálida para texto (antes slate).
        tinta: {
          50: '#f7f4ef',
          100: '#eee7db',
          200: '#dccdb8',
          300: '#c3ac8d',
          400: '#a98a66',
          500: '#8f6f4e',
          600: '#755843',
          700: '#5e4738',
          800: '#4e3c32',
          900: '#43342c',
          950: '#261c17',
        },
        // Fondos de "papel" crema.
        crema: {
          DEFAULT: '#f6efe2',
          claro: '#fbf7ee',
          oscuro: '#ece2cf',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'ui-serif', 'serif'],
        sans: ['"Nunito Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sello: '1.5rem',
      },
      boxShadow: {
        papel: '0 1px 2px rgba(38, 28, 23, 0.06), 0 8px 24px rgba(38, 28, 23, 0.07)',
      },
    },
  },
  plugins: [],
};
