/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // `media` follows the system theme automatically, with no extra state in the
  // app. To offer a manual theme picker, switch to 'class' and use
  // `colorScheme` from 'nativewind'.
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // EcoPonto identity — recycling green as the primary color.
        brand: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        // Electronics / e-waste — supporting color to tell categories apart.
        tech: {
          100: '#DBEAFE',
          300: '#93C5FD',
          500: '#3B82F6',
          700: '#1D4ED8',
        },
        surface: {
          light: '#FFFFFF',
          'light-muted': '#F4F6F5',
          dark: '#0B0F0E',
          'dark-muted': '#151B19',
        },
        content: {
          light: '#0B0F0E',
          'light-muted': '#5A655F',
          dark: '#F4F6F5',
          'dark-muted': '#9AA7A0',
        },
        state: {
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
          info: '#0284C7',
        },
      },
      borderRadius: {
        card: '16px',
        pill: '999px',
      },
      fontSize: {
        // Fixed type scale — prevents text outside the system.
        display: ['30px', { lineHeight: '36px', fontWeight: '700' }],
        title: ['22px', { lineHeight: '28px', fontWeight: '700' }],
        heading: ['17px', { lineHeight: '24px', fontWeight: '600' }],
        body: ['15px', { lineHeight: '22px' }],
        caption: ['13px', { lineHeight: '18px' }],
        overline: ['11px', { lineHeight: '14px', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
};
