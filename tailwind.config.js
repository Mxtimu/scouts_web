/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        scout: {
          // Semantic backgrounds — CSS variable RGB tuples, support opacity modifiers
          bg:            'rgb(var(--scout-bg-rgb) / <alpha-value>)',
          surface:       'rgb(var(--scout-surface-rgb) / <alpha-value>)',
          card:          'rgb(var(--scout-card-rgb) / <alpha-value>)',
          border:        'rgb(var(--scout-border-rgb) / <alpha-value>)',
          muted:         'rgb(var(--scout-muted-rgb) / <alpha-value>)',
          // Fixed brand colors
          accent:        '#FF6B35',
          'accent-light':'#FF9060',
          // Semantic text — plain CSS variables (no opacity modifier needed)
          text:          'var(--scout-text)',
          'text-sub':    'var(--scout-text-sub)',
          'text-muted':  'var(--scout-text-muted)',
          // Status colors
          green:         '#10b981',
          amber:         '#f59e0b',
          rose:          '#f43f5e',
        },
      },
      animation: {
        'pulse-slow':     'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':        'fadeIn 0.2s ease-out',
        'slide-up':       'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':       'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn:      { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:     { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        scaleIn:     { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        slideInRight:{ '0%': { transform: 'translateX(100%)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
