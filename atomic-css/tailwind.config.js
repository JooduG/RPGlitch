module.exports = {
    theme: {
        extend: {
            // Custom color palette based on RPGlitch design
            colors: {
                'rpg-primary': '#3498db',
                'rpg-secondary': '#2ecc71',
                'rpg-background': '#f0f0f0',
                'rpg-text': '#333333',
                'rpg-accent': '#9b59b6'
            },
            // Custom spacing scale
            spacing: {
                '0.5': '0.125rem',
                '1.5': '0.375rem',
                '2.5': '0.625rem',
                '3.5': '0.875rem'
            },
            // Custom border radius
            borderRadius: {
                'rpg-sm': '0.25rem',
                'rpg-md': '0.5rem',
                'rpg-lg': '1rem'
            }
        }
    },
    // Utility classes generation
    variants: {
        extend: {
            // Add hover, focus states for interactive elements
            opacity: ['hover', 'focus'],
            transform: ['hover', 'focus']
        }
    },
    // Atomic utility classes
    utilities: {
        // Layout utilities
        '.flex-center': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        // Typography utilities
        '.text-truncate': {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        }
    }
}; 