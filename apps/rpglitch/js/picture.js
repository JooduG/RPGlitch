(function ensurePictureHelper() {
  const __PAL_CACHE = new Map();

  function __getDefaultBrandColor() {
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue('--brand-default')
        .trim() || '#777'
    );
  }

  function __getProbe() {
    let p = document.getElementById('palette-probe');
    if (!p) {
      p = document.createElement('div');
      p.id = 'palette-probe';
      p.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;visibility:hidden;';
      document.body.appendChild(p);
    }
    return p;
  }

  function readCssBrand(name) {
    if (!name) return null;
    if (__PAL_CACHE.has(name)) return __PAL_CACHE.get(name);
    const probe = __getProbe();
    probe.className = `palette--${name}`;
    const cs = getComputedStyle(probe);
    const brand = (cs.getPropertyValue('--brand') || '').trim();
    const contrast = (cs.getPropertyValue('--brand-contrast') || '').trim() || '#fff';
    const out = { brand: brand || __getDefaultBrandColor(), contrast };
    __PAL_CACHE.set(name, out);
    return out;
  }

  function resolveBrandColors(subject = {}, paletteObj = null) {
    if (subject.signatureColor) return { brand: subject.signatureColor, contrast: '#fff' };
    if (subject.colorPalette?.primary) return { brand: subject.colorPalette.primary, contrast: '#fff' };

    if (subject.palette) {
      const css = readCssBrand(subject.palette);
      if (css?.brand) return css;
    }

    if (paletteObj?.primary) return { brand: paletteObj.primary, contrast: '#fff' };

    return { brand: __getDefaultBrandColor(), contrast: '#fff' };
  }

  function getInitials(name = '') {
    const s = String(name).trim();
    if (!s) return '?';
    const parts = s.split(/[\s\-_.]+/).filter(Boolean);
    const two =
      parts.length >= 2
        ? parts[0][0] + parts[1][0]
        : [...s].slice(0, 2).join('');
    return two.toUpperCase();
  }

  function makeInitialsPlaceholderDataURI(initials, bg, fg, size = 256) {
    const fontSize = Math.round(size * 0.42);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${initials} placeholder">` +
      `<rect width="100%" height="100%" fill="${bg}"/>` +
      `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="Inter, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="${fg}">${initials}</text>` +
      `</svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  const urlCache = new WeakMap();
  function blobUrl(blob) {
    if (!blob) return null;
    let url = urlCache.get(blob);
    if (!url) {
      url = URL.createObjectURL(blob);
      urlCache.set(blob, url);
    }
    return url;
  }

  window.getPictureHTML = function getPictureHTML(item = {}, palette = null, context = '') {
    const img = document.createElement('img');
    img.className = `profile-picture ${context}`.trim();
    img.loading = 'lazy';
    img.decoding = 'async';

    const src =
      item.image instanceof Blob ||
      (typeof File !== 'undefined' && item.image instanceof File)
        ? blobUrl(item.image)
        : typeof item.image === 'string' && item.image.trim()
          ? item.image.trim()
          : null;

    const type = item?.type || 'Character';
    const displayName = item?.title || item?.name || 'Unnamed';

    if (src) {
      img.src = src;
      img.dataset.isPlaceholder = 'false';
      window.attachBrokenImageFallback(img, item, palette, context);
    } else {
      const initials = getInitials(displayName);
      const { brand, contrast } = resolveBrandColors(item, palette);
      img.src = makeInitialsPlaceholderDataURI(initials, brand, contrast, 256);
      img.dataset.isPlaceholder = 'true';
    }

    img.alt = `${type} picture for ${displayName}`;
    return img;
  };

  window.attachBrokenImageFallback = function attachBrokenImageFallback(
    img,
    seedItem = {},
    palette = null,
    context = ''
  ) {
    if (!(img instanceof HTMLImageElement)) return;
    if (img.dataset.isPlaceholder === 'false') {
      const type = seedItem.type || 'Character';
      const displayName = seedItem.title || seedItem.name || '';
      img.onerror = () => {
        const replacement = window.getPictureHTML(
          { title: displayName, type, palette: seedItem.palette },
          palette,
          context
        );
        img.replaceWith(replacement);
        replacement.classList.toggle('empty', replacement.dataset.isPlaceholder === 'true');
      };
    }
  };
})();

