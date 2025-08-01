/* eslint-disable no-unused-vars */
// ProfilePictureComponent.js

/**
 * Returns HTML for a profile picture, using a real picture if available, otherwise a placeholder SVG.
 * @param {Object} item - The item with profile picture, name, colorPalette, and itemType.
 * @param {Object} palette - The color palette object.
 * @param {string} [context='profile'] - UI context: 'profile', 'storyboard', 'list-item', 'card'.
 * @param {string} [fontFamily='Segoe UI, system-ui, sans-serif'] - Optional font family for placeholder.
 * @returns {string} HTML string for the profile picture element.
 */
function getProfilePictureHTML(item, palette, context = 'profile', fontFamily = 'Segoe UI, system-ui, sans-serif') {
  console.debug('[ProfilePicture] getProfilePictureHTML called:', { item, context });
  
  // Validate inputs
  if (!item) {
    // No item provided, using fallback
    return createFallbackProfilePicture('?', palette, context, fontFamily);
  }
  
  const name = (item.name && typeof item.name === 'string') ? item.name.trim() : '?';
  const hasProfilePicture = item.profilePicture && typeof item.profilePicture === 'string' && item.profilePicture.trim().length > 0;
  
  // Get initials using main app function if available, otherwise use simple fallback
  const initials = getInitials(name);
  
  // For card context, return only initials
  if (context === 'card') {
    return createInitialsOnlyHTML(initials, palette);
  }
  
  // Determine profile picture source
  const profilePictureSrc = hasProfilePicture 
    ? item.profilePicture.trim() 
    : createProfilePicturePlaceholder(name, palette, fontFamily);
  
  // Create fallback placeholder for error handling
  const placeholderDataUrl = createProfilePicturePlaceholder(name, palette, fontFamily);
  
  // Generate CSS class based on context
  const profilePictureClass = getProfilePictureClass(context);
  
  // Create safe name for alt text
  const safeName = (name || 'Profile').replace(/"/g, '&quot;');
  
  return `<img src='${profilePictureSrc}' alt='${safeName} profile picture' class='${profilePictureClass}' onerror="this.onerror=null;this.src='${placeholderDataUrl}'">`;
}

/**
 * Gets initials from a name - uses main app's function if available, otherwise simple fallback.
 * @param {string} name - The name to extract initials from.
 * @returns {string} The initials (max 2 characters).
 */
function getInitials(name) {
  // Try to use main app's function first
  if (window.App && typeof window.App._getInitials === 'function') {
    return window.App._getInitials(name);
  }
  
  // Simple fallback implementation
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

/**
 * Creates CSS class for profile picture based on context.
 * @param {string} context - The UI context.
 * @returns {string} The CSS class.
 */
function getProfilePictureClass(context) {
  const baseClass = 'profile-picture';
  const contextClasses = {
    'profile': 'profile-picture-large',
    'storyboard': 'storyboard-card-profile-picture',
    'list-item': 'list-item-profile-picture'
  };
  
  return `${baseClass} ${contextClasses[context] || ''}`.trim();
}

/**
 * Creates initials-only HTML for card context.
 * @param {string} initials - The initials to display.
 * @param {Object} palette - The color palette object.
 * @returns {string} HTML for initials display.
 */
function createInitialsOnlyHTML(initials, palette) {
  const safePalette = getSafePalette(palette);
  return `<div class="profile-picture-initials-styled" style="--palette-medium: ${safePalette.colors.medium}; --palette-light: ${safePalette.colors.light}">${initials}</div>`;
}

/**
 * Creates a fallback profile picture when no item is provided.
 * @param {string} name - The name to use.
 * @param {Object} palette - The color palette object.
 * @param {string} context - The UI context.
 * @param {string} fontFamily - The font family.
 * @returns {string} HTML for fallback profile picture.
 */
function createFallbackProfilePicture(name, palette, context, fontFamily) {
  const placeholderDataUrl = createProfilePicturePlaceholder(name, palette, fontFamily);
  const profilePictureClass = getProfilePictureClass(context);
  return `<img src='${placeholderDataUrl}' alt='Profile picture' class='${profilePictureClass}'>`;
}

/**
 * Creates a profile picture placeholder - uses main app's function if available, otherwise local fallback.
 * @param {string} name - The name to extract initials from.
 * @param {Object} palette - The color palette object.
 * @param {string} fontFamily - The font family.
 * @returns {string} Data URL for the SVG profile picture.
 */
function createProfilePicturePlaceholder(name, palette, fontFamily) {
  // Try to use main app's function first
  if (window.App && typeof window.App._makeProfilePicturePlaceholderSVG === 'function') {
    const paletteKey = getPaletteKey(palette);
    return window.App._makeProfilePicturePlaceholderSVG(name, paletteKey, false, null, fontFamily);
  }
  
  // Try to use utils function if available
  if (typeof window.makeProfilePicturePlaceholderSVG === 'function') {
    const paletteKey = getPaletteKey(palette);
    return window.makeProfilePicturePlaceholderSVG(name, paletteKey, false, null, fontFamily);
  }
  
  // Local fallback implementation
  return createLocalPlaceholderSVG(name, palette, fontFamily);
}

/**
 * Creates a local placeholder SVG when main app is not available.
 * @param {string} name - The name to extract initials from.
 * @param {Object} palette - The color palette object.
 * @param {string} fontFamily - The font family.
 * @returns {string} Data URL for the SVG.
 */
function createLocalPlaceholderSVG(name, palette, fontFamily) {
  // Use Perchance text-to-image plugin for profile pictures
  const safePalette = getSafePalette(palette);
  const prompt = `profile picture for ${name || 'Unknown'}, minimalist flat design, ${safePalette.colors.medium} background, ${safePalette.colors.light} text`;
  
  try {
    if (typeof textToImage !== 'undefined' && textToImage.generate) {
      return textToImage.generate(prompt, {
        size: '768x768',
        style: 'flat-art',
        colorPalette: safePalette.colors
      });
    }
  } catch (error) {
    console.error('Error generating image with Perchance plugin:', error);
  }

  // Fallback to SVG if plugin isn't available
  const initials = getInitials(name || '?');
  const svg = `
    <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${safePalette.colors.medium}"/>
      <text x="50%" y="50%" font-family="${fontFamily}" font-size="2.5" fill="${safePalette.colors.light}" 
            text-anchor="middle" dominant-baseline="middle">${initials}</text>
    </svg>
  `;

  try {
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  } catch { // error parameter removed
    // Error encoding SVG
    // Return a simple fallback
    return `data:image/svg+xml;base64,${btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#607d8b"/><text x="50" y="50" font-family="Arial" font-size="2.5" fill="#cfd8dc" text-anchor="middle" dominant-baseline="middle">?</text></svg>')}`;
  }
}

/**
 * Gets a safe palette object with fallback values.
 * @param {Object} palette - The palette object.
 * @returns {Object} Safe palette object.
 */
function getSafePalette(palette) {
  if (palette && palette.colors) {
    return palette;
  }
  
  // Default fallback palette
  return {
    colors: {
      medium: '#607d8b',
      light: '#cfd8dc',
      dark: '#455a64',
      neutral: '#90a4ae'
    }
  };
}

/**
 * Extracts palette key from palette object by matching colors with main app's COLOR_PALETTES.
 * @param {Object} palette - The palette object.
 * @returns {string} The palette key.
 */
function getPaletteKey(palette) {
  // If palette has a key property, use it
  if (palette && palette.key) {
    return palette.key;
  }
  
  // Try to find the palette key by matching colors with main app's COLOR_PALETTES
  if (palette && palette.colors && window.App && window.App.CONSTANTS && window.App.CONSTANTS.COLOR_PALETTES) {
    for (const [key, definedPalette] of Object.entries(window.App.CONSTANTS.COLOR_PALETTES)) {
      if (definedPalette.colors.medium === palette.colors.medium) {
        console.debug('[ProfilePicture] Matched palette key:', key, 'for colors:', palette.colors);
        return key;
      }
    }
  }
  
  // Could not determine palette key, using default slate_gray
  return 'slate_gray'; // Final fallback
}

// Export for global access

