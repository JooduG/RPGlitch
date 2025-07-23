/**
 * RPGlitch Utility Functions
 * Extracted utility functions for better modularity and maintainability
 */

// Configuration constants
const DEPENDENCY_CHECK_CONFIG = {
    maxChecks: 50, // 5 seconds max wait
    checkInterval: 100 // milliseconds between checks
};

// Dependency availability checks with retry mechanism
export function checkDependencies() {
    window.isDexieLoaded = typeof window.Dexie !== 'undefined';
    window.isDOMPurifyAvailable = typeof window.DOMPurify !== 'undefined';
    window.isHyperscriptLoaded = typeof window._hyperscript !== 'undefined';
    window.isCashDomLoaded = typeof window.$ !== 'undefined';
    
    return window.isDexieLoaded && window.isDOMPurifyAvailable && 
           window.isHyperscriptLoaded && window.isCashDomLoaded;
}

// Wait for dependencies to load with timeout
let dependencyCheckCount = 0;

export function waitForDependencies(initializeAppCallback) {
    if (checkDependencies()) {
        initializeAppCallback();
    } else if (dependencyCheckCount < DEPENDENCY_CHECK_CONFIG.maxChecks) {
        dependencyCheckCount++;
        setTimeout(() => waitForDependencies(initializeAppCallback), DEPENDENCY_CHECK_CONFIG.checkInterval);
    } else {
        // Log error without debug prefix for production
        console.error('Dependency load timed out.', {
            isDexieLoaded: window.isDexieLoaded,
            isHyperscriptLoaded: window.isHyperscriptLoaded,
            isCashDomLoaded: window.isCashDomLoaded,
            isDOMPurifyAvailable: window.isDOMPurifyAvailable
        });
        alert('Application failed to load: essential components missing. Please ensure all scripts loaded correctly.\n\nMissing: ' + 
              (!window.isDexieLoaded ? 'isDexieLoaded, ' : '') +
              (!window.isDOMPurifyAvailable ? 'isDOMPurifyAvailable, ' : '') +
              (!window.isHyperscriptLoaded ? 'isHyperscriptLoaded, ' : '') +
              (!window.isCashDomLoaded ? 'isCashDomLoaded, ' : '').slice(0, -2));
    }
}

// Utility function to get initials from a name
export function getInitials(name) {
    if (!name) return '?';
    
    // Remove quotation marks and split into words
    const cleanName = name.replace(/['"]/g, '');
    const words = cleanName.split(' ');
    
    // Common words to skip (lowercase for comparison)
    const skipWords = ['the', 'of', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'a', 'an'];
    
    // Filter out common words and get initials
    const filteredWords = words.filter(word => {
        const lowerWord = word.toLowerCase();
        return !skipWords.includes(lowerWord) && word.length > 0;
    });
    
    // Get initials from filtered words (allow up to 3 initials)
    const initials = filteredWords.map(w => w[0]).join('').toUpperCase().slice(0, 3);
    
    // If no initials found after filtering, fall back to original logic
    return initials || name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
}

// Utility function to get valid palette key
export function getValidPaletteKey(item) {
    const validPaletteKeys = [
        'tech_blue', 'ocean_blue', 'forest_green', 'crimson_red', 
        'sunset_orange', 'royal_purple', 'slate_gray', 'cyber_pink'
    ];
    
    if (item && item.colorPalette && validPaletteKeys.includes(item.colorPalette)) {
        return item.colorPalette;
    }
    
    return 'slate_gray'; // Default fallback
}

// Debounced search utility
export function debouncedSearch(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Profile picture placeholder cache
const profilePicturePlaceholderCache = {};

// Generate profile picture placeholder SVG
export function makeProfilePicturePlaceholderSVG(name, paletteKey, isPremade, itemId = null, fontFamily = "'Segoe UI', system-ui, sans-serif") {
    // Normalize the itemId for consistent cache keys
    let normalizedItemId = itemId;
    if (itemId && isPremade) {
        // Extract the actual ID from prefixed IDs like "premade_world:forest" -> "forest"
        if (itemId.includes(':')) {
            normalizedItemId = itemId.split(':')[1];
        }
    }
    
    const keyPart = normalizedItemId ? `id:${normalizedItemId}` : `name:${name}`;
    const cacheKey = `${keyPart}::${paletteKey}::${isPremade}`;
    
    if (profilePicturePlaceholderCache[cacheKey]) {
        return profilePicturePlaceholderCache[cacheKey];
    }
    
    const initials = getInitials(name);
    
    // Calculate font size based on number of initials
    let fontSize = 40; // Base size for 1 character
    if (initials.length === 2) {
        fontSize = 35; // Slightly smaller for 2 characters
    } else if (initials.length === 3) {
        fontSize = 25; // Much smaller for 3 characters
    }
    
    const svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="${paletteKey}"/>
            <text x="50%" y="50%" font-family="${fontFamily}" font-size="${fontSize}" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initials}</text>
        </svg>
    `;
    
    const dataUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`;
    profilePicturePlaceholderCache[cacheKey] = dataUrl;
    return dataUrl;
}

// Export all utilities
export default {
    checkDependencies,
    waitForDependencies,
    getInitials,
    getValidPaletteKey,
    debouncedSearch,
    makeProfilePicturePlaceholderSVG
};