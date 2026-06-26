/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        primary: {
          50:  '#fdf8f0',
          100: '#fbefd9',
          200: '#f6ddb1',
          300: '#f0c47e',
          400: '#e9a44a',
          500: '#e08c2a',
          600: '#c97520',
          700: '#a75d1c',
          800: '#874a1d',
          900: '#6e3e1a',
        },
        forest: {
          50:  '#f2f7f2',
          100: '#e0ece0',
          200: '#c2d9c3',
          300: '#97bc99',
          400: '#669769',
          500: '#457a48',
          600: '#346237',
          700: '#2a4f2d',
          800: '#234025',
          900: '#1d3520',
        },
        cream: {
          50:  '#fdfcf9',
          100: '#faf7f0',
          200: '#f4ede0',
          300: '#ecdece',
          400: '#e0cab0',
          500: '#d4b591',
        },
        charcoal: {
          800: '#1c1917',
          900: '#0f0d0b',
        },
      },
      boxShadow: {
        'card':        '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-md':     '0 4px 12px -2px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.06)',
        'card-lg':     '0 12px 28px -4px rgba(0,0,0,0.14), 0 4px 8px -4px rgba(0,0,0,0.08)',
        'inner-glow':  'inset 0 1px 0 rgba(255,255,255,0.8)',
        'primary-glow':'0 0 0 3px rgba(224,140,42,0.25)',
        'forest-glow': '0 0 0 3px rgba(69,122,72,0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backgroundImage: {
        'grain':     "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        'dot-pattern': "radial-gradient(circle, #d4b591 1px, transparent 1px)",
        'primary-gradient': 'linear-gradient(135deg, #e08c2a 0%, #c97520 100%)',
        'forest-gradient':  'linear-gradient(135deg, #457a48 0%, #2a4f2d 100%)',
        'hero-gradient':    'linear-gradient(160deg, #fdf8f0 0%, #f4ede0 40%, #e0ece0 100%)',
      },
      animation: {
        'fade-in':      'fadeIn 0.4s ease forwards',
        'slide-up':     'slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down':   'slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in':     'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer':      'shimmer 1.8s ease-in-out infinite',
        'float':        'float 3s ease-in-out infinite',
        'pulse-ring':   'pulseRing 2s ease-out infinite',
        'bounce-soft':  'bounceSoft 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.94)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        pulseRing: {
          '0%':   { transform: 'scale(1)',    opacity: '0.6' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '40%':      { transform: 'translateY(-6px)' },
          '70%':      { transform: 'translateY(-3px)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
};
