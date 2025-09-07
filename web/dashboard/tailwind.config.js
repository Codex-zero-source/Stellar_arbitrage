/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background-dark': 'rgb(var(--background-dark) / <alpha-value>)',
        'neon-cyan': 'rgb(var(--neon-cyan) / <alpha-value>)',
        'neon-magenta': 'rgb(var(--neon-magenta) / <alpha-value>)',
        'neon-lime': 'rgb(var(--neon-lime) / <alpha-value>)',
        
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
      },
      borderColor: theme => ({
        ...theme('colors'),
        DEFAULT: 'rgb(var(--border) / <alpha-value>)',
      }),
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 246, 255, 0.4)',
        'glow-magenta': '0 0 15px rgba(255, 0, 255, 0.4)',
        'glow-lime': '0 0 15px rgba(57, 255, 20, 0.4)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};