(function (global) {
  const App = global.App || (global.App = {});
  const doc = global.document;
  const storeMap = { character: "characters", world: "worlds" };
  const STORAGE_VERSION = 1;

  // --- NEW: safe string sanitize (no-op if DOMPurify missing) ---
  function sanitizeStr(s) {
    const v = typeof s === "string" ? s : String(s ?? "");
    try {
      return global.DOMPurify ? global.DOMPurify.sanitize(v) : v;
    } catch {
      return v;
    }
  }

  function getDeterministicColor(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++)
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 40%, 60%)`;
  }

  function getContrast(color) {
    const hex = color.startsWith("#") ? color.slice(1) : null;
    if (hex && (hex.length === 3 || hex.length === 6)) {
      const full =
        hex.length === 3
          ? hex
              .split("")
              .map((c) => c + c)
              .join("")
          : hex;
      const num = parseInt(full, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      return yiq >= 128 ? "#000" : "#fff";
    }
    return "#000";
  }

  function getBrand(entity = {}) {
    if (entity.palette?.brand) return entity.palette.brand;
    const seed = [
      entity.name || entity.title || "",
      ...(entity.tags || []),
    ].join(",");
    return getDeterministicColor(seed || entity.id || entity.kind || "");
  }

  const PLACEHOLDER_ICONS = {
    character:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-3.33 0-8 1.67-8 5v3h16v-3c0-3.33-4.67-5-8-5z"/></svg>',
    world:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 010-16 8 8 0 010 16zm0-14a6 6 0 00-5.29 3h10.58A6 6 0 0012 6zm-5.29 5a6 6 0 000 2h10.58a6 6 0 000-2H6.71zm.42 3a6 6 0 005.29 3 6 6 0 005.29-3H7.13z"/></svg>',
    default:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>',
  };

  function getPictureHTML(entity = {}, options = {}) {
    const { cover, neutralPlaceholder = false } = options;
    const title = entity.title || entity.name || "Empty";
    const kind = entity.kind || "default";
    const src =
      typeof entity.imageUrl === "string" && entity.imageUrl.trim()
        ? entity.imageUrl.trim()
        : "";
    const brand = getBrand(entity);
    const contrast = getContrast(brand);

    const wrap = doc.createElement("div");
    wrap.className = `picture${cover ? " picture--cover" : ""}`;
    wrap.style.setProperty("--brand", brand);
    wrap.style.setProperty("--brand-contrast", contrast);

    if (src) {
      const img = doc.createElement("img");
      img.alt = `${kind} image for ${title}`;
      img.src = src;
      // --- NEW: non-intrusive perf hints ---
      img.loading = "lazy";
      img.decoding = "async";
      wrap.appendChild(img);
      return wrap;
    }

    const ph = doc.createElement("div");
    ph.className = "placeholder-image";
    // Neutralize placeholder tinting only when explicitly requested (e.g., truly empty slots)
    const useNeutral = !!neutralPlaceholder;
    if (!useNeutral) {
      ph.style.backgroundColor = "var(--brand)";
      ph.style.color = "var(--brand-contrast)";
    }
    ph.innerHTML = sanitizeStr(
      PLACEHOLDER_ICONS[kind] || PLACEHOLDER_ICONS.default
    );
    ph.setAttribute("role", "img");
    ph.setAttribute("aria-label", `${kind} placeholder for ${title}`);
    wrap.appendChild(ph);
    return wrap;
  }

  App.getPictureHTML = getPictureHTML;
  global.getPictureHTML = getPictureHTML;

  function read(type) {
    const key = storeMap[type];
    try {
      const raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function write(type, items) {
    const key = storeMap[type];
    global.localStorage.setItem(key, JSON.stringify(items));
  }

  // --- UPDATED: normalize now sanitizes strings and trims ---
  function normalize(base = {}) {
    const nameOrTitle = sanitizeStr(base.name || base.title || "").trim();
    const summaryOrDesc = sanitizeStr(
      base.summary || base.description || ""
    ).trim();
    const image = sanitizeStr(base.imageUrl || base.image || "").trim();

    const sections = base.sections || {};
    const safeSections = {
      forever: sanitizeStr(sections.forever || "").trim(),
      past: sanitizeStr(sections.past || "").trim(),
      present: sanitizeStr(sections.present || "").trim(),
      future: sanitizeStr(sections.future || "").trim(),
    };

    const rawTags = Array.isArray(base.tags)
      ? base.tags
      : base.tags
      ? String(base.tags).split(",")
      : [];
    const safeTags = rawTags
      .map((s) => sanitizeStr(String(s).trim()))
      .filter(Boolean);

    return {
      name: nameOrTitle,
      title: nameOrTitle,
      summary: summaryOrDesc,
      description: summaryOrDesc,
      imageUrl: image,
      image,
      tags: safeTags,
      sections: safeSections,
    };
  }

  function merge(type, custom) {
    const key = storeMap[type];
    const premade = (App.getPremadeItems ? App.getPremadeItems(key) : []).map(
      (e) => ({
        ...e,
        kind: type,
        isPremade: true,
        isCustom: false,
        version: STORAGE_VERSION,
        ...normalize(e),
      })
    );
    const normal = custom.map((e) => ({
      ...e,
      kind: type,
      isPremade: false,
      isCustom: true,
      version: STORAGE_VERSION,
      ...normalize(e),
    }));
    return premade.concat(normal);
  }

  function _writeAndCache(type, items) {
    write(type, items);
    const key = storeMap[type];
    App._allItemsCache = App._allItemsCache || Object.create(null);
    App._allItemsCache[key] = merge(type, items);
  }

  App.entities = {
    list(type) {
      App._allItemsCache = App._allItemsCache || Object.create(null);
      const key = storeMap[type];
      if (Array.isArray(App._allItemsCache[key]))
        return App._allItemsCache[key];
      const data = merge(type, read(type));
      App._allItemsCache[key] = data;
      return data;
    },
    get(type, id) {
      return this.list(type).find((e) => e.id === id) || null;
    },
    upsert(type, entity) {
      const items = read(type);
      const id =
        entity.id || global.crypto?.randomUUID?.() || `${type}-${Date.now()}`;
      const idx = items.findIndex((e) => e.id === id);
      const base = idx >= 0 ? items[idx] : {};
      const saved = {
        id,
        kind: type,
        isCustom: true,
        isPremade: false,
        version: STORAGE_VERSION,
        ...base,
        ...normalize({ ...base, ...entity }),
      };
      if (idx >= 0) items[idx] = saved;
      else items.push(saved);
      _writeAndCache(type, items);
      return saved;
    },
    update(type, id, entity) {
      const items = read(type);
      const idx = items.findIndex((e) => e.id === id);
      if (idx < 0) return null;
      const base = items[idx];
      const saved = {
        ...base,
        ...normalize({ ...base, ...entity }),
      };
      items[idx] = saved;
      _writeAndCache(type, items);
      return saved;
    },
    remove(type, id) {
      const remaining = read(type).filter((e) => e.id !== id);
      _writeAndCache(type, remaining);
    },
    copy(type, id) {
      const item = this.get(type, id);
      if (!item) return null;
      return { ...item, sections: { ...item.sections } };
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
