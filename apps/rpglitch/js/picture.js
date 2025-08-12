(function ensurePictureHelper() {
  // Resolve a safe global + document in Perchance and browsers
  const ROOT = typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
      ? window
      : this;

  function getDoc(context) {
    const fromCtx = context && (context.ownerDocument || context.document);
    if (fromCtx) return fromCtx;
    if (typeof document !== 'undefined' && document) return document;
    if (ROOT && ROOT.document) return ROOT.document;
    return null;
  }

  const __PAL_CACHE = new Map();

  function __getDefaultBrandColor(context) {
    const doc = getDoc(context);
    if (doc && doc.documentElement && ROOT.getComputedStyle) {
      return (
        ROOT.getComputedStyle(doc.documentElement)
          .getPropertyValue('--brand-default')
          .trim() || '#777'
      );
    }
    return '#777';
  }

  function __getProbe(context) {
    const doc = getDoc(context);
    if (!doc) return null;
    let p = doc.getElementById('palette-probe');
    if (!p) {
      p = doc.createElement('div');
      p.id = 'palette-probe';
      p.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;visibility:hidden;';
      doc.body && doc.body.appendChild(p);
    }
    return p;
  }

  function readCssBrand(name, context) {
    if (!name) return null;
    if (__PAL_CACHE.has(name)) return __PAL_CACHE.get(name);
    const probe = __getProbe(context);
    if (!probe) return null;
    probe.className = `palette--${name}`;
    const cs = ROOT.getComputedStyle ? ROOT.getComputedStyle(probe) : null;
    const brand = (cs?.getPropertyValue('--brand') || '').trim();
    const contrast = (cs?.getPropertyValue('--brand-contrast') || '').trim() || '#fff';
    const out = { brand: brand || __getDefaultBrandColor(context), contrast };
    __PAL_CACHE.set(name, out);
    return out;
  }

  function resolveBrandColors(subject = {}, paletteObj = null, context) {
    if (subject.signatureColor) return { brand: subject.signatureColor, contrast: '#fff' };
    if (subject.colorPalette?.primary) return { brand: subject.colorPalette.primary, contrast: '#fff' };

    if (subject.palette) {
      const css = readCssBrand(subject.palette, context);
      if (css?.brand) return css;
    }

    if (paletteObj?.primary) return { brand: paletteObj.primary, contrast: '#fff' };

    return { brand: __getDefaultBrandColor(context), contrast: '#fff' };
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

  function getPictureHTML(item = {}, palette = null, context = null) {
    const doc = getDoc(context);
    if (!doc) {
      console.warn('getPictureHTML: no document available; returning null');
      return null;
    }
    const img = doc.createElement('img');
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
      ROOT.attachBrokenImageFallback?.(img, item, palette, context);
    } else {
      const initials = getInitials(displayName);
      const { brand, contrast } = resolveBrandColors(item, palette, context);
      img.src = makeInitialsPlaceholderDataURI(initials, brand, contrast, 256);
      img.dataset.isPlaceholder = 'true';
    }

    img.alt = `${type} picture for ${displayName}`;
    return img;
  }

  function attachBrokenImageFallback(
    img,
    seedItem = {},
    palette = null,
    context = ''
  ) {
    if (!(img instanceof HTMLImageElement)) return;
    if (img.dataset.isPlaceholder === 'false') {
      img.onerror = () => {
        const replacement = getPictureHTML(seedItem, palette, context);

        img.replaceWith(replacement);
        replacement.classList.toggle('empty', replacement.dataset.isPlaceholder === 'true');
      };
    }
  }

  ROOT.getPictureHTML = getPictureHTML;
  ROOT.attachBrokenImageFallback = attachBrokenImageFallback;
  ROOT.resolveBrandColors = resolveBrandColors;
})();

