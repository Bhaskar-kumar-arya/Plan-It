/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Define your color palette using CSS variables
        'background': 'var(--background)',
        'background-secondary': 'var(--background-secondary)',
        'foreground': 'var(--foreground)',
        'foreground-secondary': 'var(--foreground-secondary)',
        'accent': 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'border': 'var(--border)',
      },
    },
  },
  plugins: [],
}