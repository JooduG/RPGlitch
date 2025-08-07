<<<<<<< HEAD

/**
 * Returns HTML for a picture, using a real picture if available, otherwise a placeholder SVG.
 * @param {Object} item - The item with picture, name, colorPalette, and itemType.
 * @param {Object} palette - The color palette object.
 * @param {string} [context='profile'] - UI context: 'profile', 'storyboard.card', 'chin-card', 'card'.
 * @param {string} [fontFamily='Segoe UI, system-ui, sans-serif'] - Optional font family for placeholder.
 * @returns {string} HTML string for the picture element.
 */

function getPictureHTML(item, palette, context = 'profile', fontFamily = 'Segoe UI, system-ui, sans-serif') {
  if (window.App && window.App.debug) {
    console.debug('[Picture] getPictureHTML called:', { item, context });
  }
  
  // Validate inputs
  if (!item) {
    // No item provided, using fallback
    return createFallbackPicture('?', palette, context, fontFamily);
  }
  
  const name = (item.name && typeof item.name === 'string') ? item.name.trim() : '?';
  const hasPicture = item.picture && typeof item.picture === 'string' && item.picture.trim().length > 0;
  
  // Get initials using main app function if available, otherwise use simple fallback
  const initials = getInitials(name);
  
  // For card context, return only initials
  if (context === 'card') {
    return createInitialsOnlyHTML(initials, palette);
  }
  
  // Determine picture source
  const pictureSrc = hasPicture 
    ? item.picture.trim() 
    : createPicturePlaceholder(name, palette, fontFamily);
  
  // Create fallback placeholder for error handling
  const placeholderDataUrl = createPicturePlaceholder(name, palette, fontFamily);
  
  // Generate CSS class based on context
  const pictureClass = getPictureClass(context);
  
  // Create safe name for alt text
  const safeName = (name || 'Profile').replace(/"/g, '&quot;');
  
  return `<img src='${pictureSrc}' alt='${safeName} picture' class='${pictureClass}' onerror="this.onerror=null;this.src='${placeholderDataUrl}'">`;
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
 * Creates CSS class for picture based on context.
 * @param {string} context - The UI context.
 * @returns {string} The CSS class.
 */

  function getPictureClass(context) {
    return ['profile-picture', context].filter(Boolean).join(' ');
  }

/**
 * Creates initials-only HTML for card context.
 * @param {string} initials - The initials to display.
 * @param {Object} palette - The color palette object.
 * @returns {string} HTML for initials display.
 */

function createInitialsOnlyHTML(initials, palette) {
  const safePalette = getSafePalette(palette);
  return `<div class="picture-initials" style="--palette-medium: ${safePalette.colors.medium}; --palette-light: ${safePalette.colors.light}">${initials}</div>`;
}

/**
 * Creates a fallback picture when no item is provided.
 * @param {string} name - The name to use.
 * @param {Object} palette - The color palette object.
 * @param {string} context - The UI context.
 * @param {string} fontFamily - The font family.
 * @returns {string} HTML for fallback picture.
 */

function createFallbackPicture(name, palette, context, fontFamily) {
  const placeholderDataUrl = createPicturePlaceholder(name, palette, fontFamily);
  const pictureClass = getPictureClass(context);
  return `<img src='${placeholderDataUrl}' alt='picture' class='${pictureClass}'>`;
}

/**
 * Creates a picture placeholder - uses main app's function if available, otherwise local fallback.
 * @param {string} name - The name to extract initials from.
 * @param {Object} palette - The color palette object.
 * @param {string} fontFamily - The font family.
 * @returns {string} Data URL for the SVG picture.
 */

function createPicturePlaceholder(name, palette, fontFamily) {
  // Try to use main app's function first
  if (window.App && typeof window.App._makePicturePlaceholderSVG === 'function') {
    const paletteKey = getPaletteKey(palette);
    return window.App._makePicturePlaceholderSVG(name, paletteKey, false, null, fontFamily);
  }
  
  // Try to use utils function if available
  if (typeof window.makePicturePlaceholderSVG === 'function') {
    const paletteKey = getPaletteKey(palette);
    return window.makePicturePlaceholderSVG(name, paletteKey, false, null, fontFamily);
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
  // Use Perchance text-to-image plugin for pictures
  const safePalette = getSafePalette(palette);
  const prompt = `picture for ${name || 'Unknown'}, minimalist flat design, ${safePalette.colors.medium} background, ${safePalette.colors.light} text`;
  
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
        if (window.App && window.App.debug) {
          console.debug('[Picture] Matched palette key:', key, 'for colors:', palette.colors);
        }
        return key;
      }
    }
  }
  
  // Could not determine palette key, using default slate_gray
  return 'slate_gray'; // Final fallback
}

// Export for global access

window.getPictureHTML = getPictureHTML;
=======
function getPictureHTML(e,t,i="profile",r="Segoe UI, system-ui, sans-serif"){if(window.App&&window.App.debug&&console.debug("[Picture] getPictureHTML called:",{item:e,context:i}),!e)return createFallbackPicture("?",t,i,r);const n=e.name&&"string"==typeof e.name?e.name.trim():"?",o=e.picture&&"string"==typeof e.picture&&e.picture.trim().length>0,l=getInitials(n);if("card"===i)return createInitialsOnlyHTML(l,t);const c=o?e.picture.trim():createPicturePlaceholder(n,t,r),a=createPicturePlaceholder(n,t,r),s=getPictureClass(i);return`<img src='${c}' alt='${(n||"Profile").replace(/"/g,"&quot;")} picture' class='${s}' onerror="this.onerror=null;this.src='${a}'">`}function getInitials(e){if(window.App&&"function"==typeof window.App._getInitials)return window.App._getInitials(e);if(!e)return"?";const t=e.replace(/['"]/g,"").split(" "),i=["the","of","and","or","but","in","on","at","to","for","with","by","from","a","an"];return t.filter(e=>{const t=e.toLowerCase();return!i.includes(t)&&e.length>0}).map(e=>e[0]).join("").toUpperCase().slice(0,3)||e.split(" ").map(e=>e[0]).join("").toUpperCase().slice(0,3)}function getPictureClass(e){return"profile-picture"+(e?` ${e}`:"")}function createInitialsOnlyHTML(e,t){const i=getSafePalette(t);return`<div class="picture-initials" style="--palette-medium: ${i.colors.medium}; --palette-light: ${i.colors.light}">${e}</div>`}function createFallbackPicture(e,t,i,r){return`<img src='${createPicturePlaceholder(e,t,r)}' alt='picture' class='${getPictureClass(i)}'>`}function createPicturePlaceholder(e,t,i){if(window.App&&"function"==typeof window.App._makePicturePlaceholderSVG){const r=getPaletteKey(t);return window.App._makePicturePlaceholderSVG(e,r,!1,null,i)}if("function"==typeof window.makePicturePlaceholderSVG){const r=getPaletteKey(t);return window.makePicturePlaceholderSVG(e,r,!1,null,i)}return createLocalPlaceholderSVG(e,t,i)}function createLocalPlaceholderSVG(e,t,i){const r=getSafePalette(t),n=`picture for ${e||"Unknown"}, minimalist flat design, ${r.colors.medium} background, ${r.colors.light} text`;try{if("undefined"!=typeof textToImage&&textToImage.generate)return textToImage.generate(n,{size:"768x768",style:"flat-art",colorPalette:r.colors})}catch(e){console.error("Error generating image with Perchance plugin:",e)}const o=getInitials(e||"?"),l=`\n    <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\n      <rect width="100%" height="100%" fill="${r.colors.medium}"/>\n      <text x="50%" y="50%" font-family="${i}" font-size="2.5" fill="${r.colors.light}" \n            text-anchor="middle" dominant-baseline="middle">${o}</text>\n    </svg>\n  `;try{return`data:image/svg+xml;base64,${btoa(l)}`}catch{return`data:image/svg+xml;base64,${btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#607d8b"/><text x="50" y="50" font-family="Arial" font-size="2.5" fill="#cfd8dc" text-anchor="middle" dominant-baseline="middle">?</text></svg>')}`}}function getSafePalette(e){return e&&e.colors?e:{colors:{medium:"#607d8b",light:"#cfd8dc",dark:"#455a64",neutral:"#90a4ae"}}}function getPaletteKey(e){if(e&&e.key)return e.key;if(e&&e.colors&&window.App&&window.App.CONSTANTS&&window.App.CONSTANTS.COLOR_PALETTES)for(const[t,i]of Object.entries(window.App.CONSTANTS.COLOR_PALETTES))if(i.colors.medium===e.colors.medium)return window.App&&window.App.debug&&console.debug("[Picture] Matched palette key:",t,"for colors:",e.colors),t;return"slate_gray"}window.getPictureHTML=getPictureHTML;
>>>>>>> 58fac1ef9dbb0c3de479d6d9ce84a281a385a066
