module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background-dark': 'rgb(var(--background-dark))',
        'neon-cyan': 'rgb(var(--neon-cyan))',
        'neon-magenta': 'rgb(var(--neon-magenta))',
        'neon-lime': 'rgb(var(--neon-lime))',
        
        border: 'rgb(var(--border))',
        input: 'rgb(var(--input))',
        ring: 'rgb(var(--ring))',
        background: 'rgb(var(--background))',
        foreground: 'rgb(var(--foreground))',
        primary: {
          DEFAULT: 'rgb(var(--primary))',
          foreground: 'rgb(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary))',
          foreground: 'rgb(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive))',
          foreground: 'rgb(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'rgb(var(--card))',
          foreground: 'rgb(var(--card-foreground))',
        },
      },
      borderColor: theme => ({
        ...theme('colors'),
        DEFAULT: 'rgb(var(--border))',
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
  plugins: [],
};