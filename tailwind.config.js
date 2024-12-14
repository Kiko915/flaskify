module.exports = {
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSlowly: {
          '0%, 100%': { transform: 'translateY(-10%)' },
          '50%': { transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 1s ease-in-out',
        slideDown: 'slideDown 0.5s ease-out forwards',
        'bounce-slow': 'bounceSlowly 3s ease-in-out infinite',
        'slideIn': 'slideIn 0.5s ease-out forwards',
      },
    },
  },
} 