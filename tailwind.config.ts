import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fortis: {
          dark: '#111110',
          ink: '#1a1a18',
          gold: '#b8975a',
          goldLight: '#d4b483',
          paper: '#f5f0e8',
          soft: '#4a4a45',
          faint: '#8a8a80',
        },
      },
      fontFamily: {
        serif: ['var(--font-bodoni)', 'serif'],
        sans: ['var(--font-montserrat)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
