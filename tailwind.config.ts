import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#111827',  // TODO: replace with 1Now's primary button color
          accent:  '#16a34a',  // TODO: replace with 1Now's accent/link color
          surface: '#f9fafb',  // TODO: replace with their page background
          border:  '#e5e7eb',  // TODO: replace with their card border gray
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    },
  },
  plugins: [],
} satisfies Config