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
        // Backed by the same --brand-* CSS variables as `brand.*` below, so
        // every existing `bg-blue-600` etc. call site (200+ across the repo)
        // repaints automatically when a white-label theme changes the brand
        // colors, instead of staying hardcoded to OB Brokers' navy forever.
        //
        // NOTE: Tailwind's `/NN` opacity modifier (`text-blue-100/70`,
        // `bg-blue-500/20`, ...) cannot parse these color-mix() strings and
        // silently produces broken output (dark text instead of light, or
        // fully transparent backgrounds). A `withOpacity()` function-color
        // wrapper was tried here to fix that centrally, but it broke color
        // generation for the *unmodified* utilities too (`bg-blue-600` came
        // out fully transparent) — reverted. Until a real fix is found, avoid
        // the `/NN` opacity modifier on any `blue-*` class; use `white/NN`,
        // `black/NN`, or a solid shade instead.
        blue: {
          50: 'color-mix(in srgb, var(--brand-primary, #0C094E) 6%, white)',
          100: 'color-mix(in srgb, var(--brand-primary, #0C094E) 12%, white)',
          200: 'color-mix(in srgb, var(--brand-primary, #0C094E) 22%, white)',
          300: 'color-mix(in srgb, var(--brand-primary, #0C094E) 38%, white)',
          400: 'color-mix(in srgb, var(--brand-primary, #0C094E) 60%, white)',
          500: 'var(--brand-secondary, #24207A)',
          600: 'var(--brand-primary, #0C094E)',
          700: 'color-mix(in srgb, var(--brand-primary, #0C094E) 85%, black)',
          800: 'color-mix(in srgb, var(--brand-primary, #0C094E) 70%, black)',
          900: 'color-mix(in srgb, var(--brand-primary, #0C094E) 55%, black)',
          950: 'color-mix(in srgb, var(--brand-primary, #0C094E) 40%, black)',
        },
        brand: {
          primary: 'var(--brand-primary, #0C094E)',
          secondary: 'var(--brand-secondary, #24207A)',
          accent: 'var(--brand-accent, #E8E8F7)',
          surface: 'var(--brand-surface, #F8F9FD)',
          dark: 'var(--brand-dark, #07052F)',
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;
