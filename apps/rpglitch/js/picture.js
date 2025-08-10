// --- Picture utils (place inside the existing picture module) ---

function pickBgColor(item = {}, palette = null) {
  return (palette && palette.primary) || item.color || '#777';
}

function getInitials(name = '') {
  const trimmed = String(name).trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/[\s\-_.]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  // fallback: first two codepoints so non-Latin works
  return [...trimmed].slice(0, 2).join('').toUpperCase();
}

function makeInitialsPlaceholderDataURI(initials, bgColor, size = 256) {
  const fontSize = Math.round(size * 0.42);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${initials} placeholder">` +
      `<rect width="100%" height="100%" fill="${bgColor}"/>` +
      `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" ` +
            `font-family="Inter, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#FFFFFF">` +
        `${initials}` +
      `</text>` +
    `</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Optional: simple object URL cache keyed by the File/Blob instance
const __objectUrlCache = new WeakMap();

function getObjectUrlForBlob(blob) {
  if (!blob) return null;
  let url = __objectUrlCache.get(blob);
  if (!url) {
    url = URL.createObjectURL(blob);
    __objectUrlCache.set(blob, url);
  }
  return url;
}

// Required by the app: create/return the <img> element
// context is 'storyboard' | 'chin-card' (ignore for now, but keep signature)
window.getPictureHTML = function getPictureHTML(item = {}, palette = null, _context = 'storyboard') {
  const img = document.createElement('img');
  img.className = 'profile-picture';
  img.loading = 'lazy';
  img.decoding = 'async';

  // 1) Uploaded file/blob wins
  if (item.pictureFile && (item.pictureFile instanceof Blob || (typeof File !== 'undefined' && item.pictureFile instanceof File))) {
    img.src = getObjectUrlForBlob(item.pictureFile);
    img.dataset.isPlaceholder = 'false';
  }
  // 2) URL string next
  else if (typeof item.picture === 'string' && item.picture.trim()) {
    img.src = item.picture.trim();
    img.dataset.isPlaceholder = 'false';
  }
  // 3) Fallback: SVG initials on color
  else {
    const name = item.name || item.title || 'Unknown';
    const initials = getInitials(name);
    const bg = pickBgColor(item, palette);
    img.src = makeInitialsPlaceholderDataURI(initials, bg, 256);
    img.dataset.isPlaceholder = 'true';
  }

  const type = (item.type || 'Character');
  const name = item.name || item.title || 'Unnamed';
  img.alt = `${type} picture for ${name}`;

  return img;
};

// (If the app needs to clean up object URLs on global teardown)
// window.addEventListener('beforeunload', () => {
//   for (const [blob, url] of __objectUrlCache) URL.revokeObjectURL(url);
// });

