/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.25rem',
        sm: '2rem',
        lg: '2.5rem',
        xl: '3rem',
        '2xl': '4rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
    },
    extend: {
      colors: {
        zinc: {
          950: '#09090b',
          900: '#121215',
          850: '#18181b',
          800: '#27272a',
          700: '#3f3f46',
          600: '#52525b',
          500: '#71717a',
          400: '#a1a1aa',
          300: '#d4d4d8',
          200: '#e4e4e7',
          100: '#f4f4f5',
          50: '#fafafa',
        },
        brand: {
          emerald: '#10b981',
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          blue: '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['Geist Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(16, 185, 129, 0.15)',
        'glow-md': '0 0 25px -4px rgba(16, 185, 129, 0.25)',
        'glow-cyan': '0 0 25px -4px rgba(6, 182, 212, 0.25)',
        'glow-card': '0 0 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'glow-card-hover': '0 0 35px -8px rgba(16, 185, 129, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.05) 45%, transparent 70%)',
        'radial-glow-cyan': 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.18) 0%, rgba(59, 130, 246, 0.06) 45%, transparent 70%)',
        'subtle-grid': 'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: '#d4d4d8',
            a: {
              color: '#34d399',
              textDecoration: 'none',
              '&:hover': {
                color: '#6ee7b7',
                textDecoration: 'underline',
              },
            },
            h1: { color: '#fafafa', fontFamily: 'Geist Sans, Inter, sans-serif' },
            h2: { color: '#fafafa', fontFamily: 'Geist Sans, Inter, sans-serif' },
            h3: { color: '#f4f4f5', fontFamily: 'Geist Sans, Inter, sans-serif' },
            h4: { color: '#f4f4f5', fontFamily: 'Geist Sans, Inter, sans-serif' },
            code: {
              color: '#a7f3d0',
              backgroundColor: 'rgba(39, 39, 42, 0.6)',
              padding: '0.2rem 0.4rem',
              borderRadius: '0.375rem',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: '400',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            pre: {
              backgroundColor: '#121215',
              border: '1px solid rgba(39, 39, 42, 0.8)',
              borderRadius: '0.75rem',
            },
            blockquote: {
              color: '#a1a1aa',
              borderLeftColor: '#10b981',
            },
            strong: { color: '#fafafa' },
            th: { color: '#fafafa' },
            hr: { borderColor: 'rgba(39, 39, 42, 0.8)' },
          },
        },
      },
    },
  },
  plugins: [typography],
};
