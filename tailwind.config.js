/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./.storybook/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "Open Sans",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      // Glass morphism color palette with transparency variants
      glass: {
        light: "rgba(255, 255, 255, 0.1)",
        medium: "rgba(255, 255, 255, 0.2)",
        heavy: "rgba(255, 255, 255, 0.3)",
        dark: "rgba(0, 0, 0, 0.1)",
        "dark-medium": "rgba(0, 0, 0, 0.2)",
        "dark-heavy": "rgba(0, 0, 0, 0.3)",
        highlight: "rgba(255, 255, 255, 0.75)",
        border: "rgba(255, 255, 255, 0.3)",
        "border-dark": "rgba(0, 0, 0, 0.3)",
      },
      // Glass-specific spacing and sizing scales
      glassBlur: {
        xs: "2px",
        sm: "4px",
        md: "12px",
        lg: "20px",
        xl: "40px",
      },
      // Animation timing functions for liquid feel
      transitionTimingFunction: {
        "liquid": "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
        "glass": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
        "bounce-in": "bounceIn 0.6s ease-out",
        "glass-hover": "glassHover 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "liquid-bounce": "liquidBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 2.2)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        glassHover: {
          "0%": { transform: "scale(1)", filter: "brightness(1)" },
          "100%": { transform: "scale(1.02)", filter: "brightness(1.1)" },
        },
        liquidBounce: {
          "0%": { transform: "scale(0.95)", opacity: "0.8" },
          "50%": { transform: "scale(1.05)", opacity: "0.9" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [
    // Glass morphism utilities plugin
    function({ addUtilities, theme }) {
      const glassUtilities = {
        // Glass blur utilities
        '.glass-blur-xs': {
          'backdrop-filter': `blur(${theme('glassBlur.xs')})`,
          '-webkit-backdrop-filter': `blur(${theme('glassBlur.xs')})`,
        },
        '.glass-blur-sm': {
          'backdrop-filter': `blur(${theme('glassBlur.sm')})`,
          '-webkit-backdrop-filter': `blur(${theme('glassBlur.sm')})`,
        },
        '.glass-blur-md': {
          'backdrop-filter': `blur(${theme('glassBlur.md')})`,
          '-webkit-backdrop-filter': `blur(${theme('glassBlur.md')})`,
        },
        '.glass-blur-lg': {
          'backdrop-filter': `blur(${theme('glassBlur.lg')})`,
          '-webkit-backdrop-filter': `blur(${theme('glassBlur.lg')})`,
        },
        '.glass-blur-xl': {
          'backdrop-filter': `blur(${theme('glassBlur.xl')})`,
          '-webkit-backdrop-filter': `blur(${theme('glassBlur.xl')})`,
        },
        // Glass background utilities
        '.glass-bg-light': {
          'background': theme('glass.light'),
        },
        '.glass-bg-medium': {
          'background': theme('glass.medium'),
        },
        '.glass-bg-heavy': {
          'background': theme('glass.heavy'),
        },
        '.glass-bg-dark': {
          'background': theme('glass.dark'),
        },
        '.glass-bg-dark-medium': {
          'background': theme('glass.dark-medium'),
        },
        '.glass-bg-dark-heavy': {
          'background': theme('glass.dark-heavy'),
        },
        // Glass border utilities
        '.glass-border': {
          'border': `1px solid ${theme('glass.border')}`,
        },
        '.glass-border-dark': {
          'border': `1px solid ${theme('glass.border-dark')}`,
        },
        // Complete glass effect utilities
        '.glass-effect': {
          'background': theme('glass.medium'),
          'backdrop-filter': `blur(${theme('glassBlur.lg')})`,
          '-webkit-backdrop-filter': `blur(${theme('glassBlur.lg')})`,
          'border': `1px solid ${theme('glass.border')}`,
          'box-shadow': `
            0 6px 6px rgba(0, 0, 0, 0.2),
            0 0 20px rgba(0, 0, 0, 0.1),
            inset 1px 1px 0 ${theme('glass.highlight')}
          `,
        },
        '.glass-effect-dark': {
          'background': theme('glass.dark-medium'),
          'backdrop-filter': `blur(${theme('glassBlur.lg')})`,
          '-webkit-backdrop-filter': `blur(${theme('glassBlur.lg')})`,
          'border': `1px solid ${theme('glass.border-dark')}`,
          'box-shadow': `
            0 6px 6px rgba(255, 255, 255, 0.1),
            0 0 20px rgba(255, 255, 255, 0.05),
            inset 1px 1px 0 rgba(255, 255, 255, 0.2)
          `,
        },
        // Accessibility utilities
        '@media (prefers-reduced-motion: reduce)': {
          '.glass-effect, .glass-effect-dark': {
            'transition': 'none',
            'animation': 'none',
          },
        },
        '@media (prefers-contrast: high)': {
          '.glass-effect': {
            'background': 'rgba(255, 255, 255, 0.9)',
            'backdrop-filter': 'none',
            'border': '2px solid #000',
          },
          '.glass-effect-dark': {
            'background': 'rgba(0, 0, 0, 0.9)',
            'backdrop-filter': 'none',
            'border': '2px solid #fff',
          },
        },
      };

      addUtilities(glassUtilities);
    },
  ],
};
