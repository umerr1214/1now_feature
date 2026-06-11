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
          primary: '#1a1a1a',    // Dark background from 1Now
          accent: '#ff6b35',     // Orange accent color from 1Now
          surface: '#0f0f0f',    // Very dark surface
          border: '#2a2a2a',     // Dark border
          card: '#1e1e1e',       // Card background
          text: {
            primary: '#ffffff',   // White text
            secondary: '#a0a0a0', // Gray text
            muted: '#666666',     // Muted gray
          },
          success: '#22c55e',     // Green for success states
          warning: '#f59e0b',     // Amber for warnings
          danger: '#ef4444',      // Red for critical states
          live: '#10b981',        // Live indicator green
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    },
  },
  plugins: [],
} satisfies Config