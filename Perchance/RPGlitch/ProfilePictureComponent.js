// ProfilePictureComponent.js

/**
 * Generates a placeholder profile picture SVG as a data URL, using initials and a color palette.
 * @param string name - The name to extract initials from.
 * @param object palette - The color palette object with .colors.medium and .colors.light.
 * @param string [fontFamily] - Optional font family for the initials.
 * @returns string Data URL for the SVG profile picture.
 */
function createProfilePicturePlaceholder(name, palette, fontFamily = 'Segoe UI, system-ui, sans-serif') {
  // Use the main app's cached placeholder logic if available
  if (window.App && window.App._makeProfilePicturePlaceholderSVG) {
    // Extract palette key from palette object or use default
    // The palette object might not have a key property, so we need to find it
    let paletteKey = 'slate_gray'; // default
    if (palette && palette.key) {
      paletteKey = palette.key;
    } else if (window.currentProfilePictureItem && window.currentProfilePictureItem.colorPalette) {
      paletteKey = window.currentProfilePictureItem.colorPalette;
    }
    // Pass itemId if available from the item context
    const itemId = window.currentProfilePictureItemId || null;
    const isPremade = window.currentProfilePictureIsPremade || false;
    console.log('[DEBUG] ProfilePictureComponent calling main app with:', { name, paletteKey, isPremade, itemId });
    return window.App._makeProfilePicturePlaceholderSVG(name, paletteKey, isPremade, itemId);
  }
  
  // Fallback to local generation if main app not available
  let initials = '?';
  if (window.App && window.App._getInitials) {
    initials = window.App._getInitials(name || '?');
  } else {
    initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
  // Defensive fallback for palette
  const safePalette = palette && palette.colors ? palette : { colors: { medium: '#607d8b', light: '#cfd8dc' } };
  const bgColor = safePalette.colors.medium;
  const textColor = safePalette.colors.light;
  // No literal curly braces in SVG, so nothing to escape here
  const svg = `
    <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text x="50%" y="50%" font-family="${fontFamily}" font-size="40" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${initials}</text>
    </svg>
  `;
  try {
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  } catch (e) {
    console.error("Error encoding SVG:", e);
  }
}

/**
 * Returns HTML for an profile picture, using a real picture if available, otherwise a placeholder SVG.
 * @param object item - The item with profile picture, name, colorPalette, and itemType.
 * @param object palette - The color palette object.
 * @param string [context] - UI context: 'profile', 'storyboard', 'list-item', etc.
 * @param string [fontFamily] - Optional font family for placeholder.
 * @returns string HTML string for the profile picture <img> element.
 */
function getProfilePictureHTML(item, palette, context = 'profile', fontFamily = 'Segoe UI, system-ui, sans-serif') {
  console.debug('[ProfilePicture] getProfilePictureHTML called:', { item, context });
  let name = (item && typeof item.name === 'string') ? item.name.trim() : '';
  if (!name) {
    console.warn('[ProfilePicture] Item missing name, using ? for initials:', item);
    name = '?';
  }
  // Use the main app's _getInitials function if available, otherwise fallback
  let initials = '?';
  if (window.App && window.App._getInitials) {
    initials = window.App._getInitials(name);
  } else {
    initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  }
  const hasProfilePicture = item && typeof item.profilePicture === 'string' && item.profilePicture.trim().length > 0;
  const profilePictureSrc = hasProfilePicture
    ? item.profilePicture.trim()
    : createProfilePicturePlaceholder(name, palette, fontFamily);
  const placeholderDataUrl = createProfilePicturePlaceholder(name, palette, fontFamily);
  let profilePictureClass = 'profile-picture'; // dash-case
  if (context === 'profile') {
    profilePictureClass += ' profile-picture-large';
  } else if (context === 'storyboard') {
    profilePictureClass += ' storyboard-card-profile-picture';
  }  else if (context === 'list-item') {
    profilePictureClass += ' list-item-profile-picture'; // dash-case
  }
  const safeName = (name || 'Profile').replace(/"/g, '&quot;');
  // Harmonize alt text to always use "profile picture" (with a space)
  const profilePictureSvgOrImg = `<img src='${profilePictureSrc}' alt='${safeName} profile picture' class='${profilePictureClass}' onerror="this.onerror=null;this.src='${placeholderDataUrl}'">`;

  if (context === 'card') {
    // Only initials in profile picture, styled to fill 100% height, 40% width, centered, not italic, no border radius
    return `<div class="profile-picture-initials profile-picture-card-initials" class="profile-picture-initials-styled" style="--palette-medium: ${palette.colors.medium}; --palette-light: ${palette.colors.light}">${ initials }</div>`;
  }
  return profilePictureSvgOrImg;
} 
