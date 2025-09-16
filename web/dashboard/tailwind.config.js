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
        
        // Neobrutalism Color Palette
        'brutal-black': '#000000',
        'brutal-white': '#FFFFFF',
        'brutal-yellow': '#FFFF00',
        'brutal-red': '#FF0000',
        'brutal-blue': '#0000FF',
        'brutal-green': '#00FF00',
        'brutal-pink': '#FF00FF',
        'brutal-orange': '#FF8000',
        
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
        
        // Neobrutalism Shadows
        'brutal': '8px 8px 0px #000000',
        'brutal-lg': '12px 12px 0px #000000',
        'brutal-xl': '16px 16px 0px #000000',
        'brutal-cyan': '8px 8px 0px rgb(var(--neon-cyan))',
        'brutal-magenta': '8px 8px 0px rgb(var(--neon-magenta))',
        'brutal-lime': '8px 8px 0px rgb(var(--neon-lime))',
        
        // Glassmorphism Shadows
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 12px 48px 0 rgba(31, 38, 135, 0.37)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'brutal': '0px', // Sharp corners for neobrutalism
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
        '5': '5px',
        '6': '6px',
        '8': '8px',
      },
    },
  },
  plugins: [],
};