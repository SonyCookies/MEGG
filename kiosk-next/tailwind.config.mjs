/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },

      keyframes: {
        'loading-square': {
          '0%, 50%': { transform: 'scale(1)', opacity: 1 },
          '25%': { transform: 'scale(0.8)', opacity: 0.8 },
          '75%': { transform: 'scale(1.1)', opacity: 0.9 },
        },
      },
      animation: {
        'loading-square': 'loading-square 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
