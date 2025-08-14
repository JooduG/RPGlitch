(function (global) {
  const App = global.App || (global.App = {});
  const doc = global.document;
  const storeMap = { character: 'characters', world: 'worlds' };
  const STORAGE_VERSION = 1;

  function getDeterministicColor(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 40%, 60%)`;
  }

  const PLACEHOLDER_ICONS = {
    character:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-3.33 0-8 1.67-8 5v3h16v-3c0-3.33-4.67-5-8-5z"/></svg>',
    world:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 010-16 8 8 0 010 16zm0-14a6 6 0 00-5.29 3h10.58A6 6 0 0012 6zm-5.29 5a6 6 0 000 2h10.58a6 6 0 000-2H6.71zm.42 3a6 6 0 005.29 3 6 6 0 005.29-3H7.13z"/></svg>',
    default:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>'
  };

  function getPictureHTML(entity = {}, options = {}) {
    const { cover } = options;
    const title = entity.title || entity.name || 'Empty';
    const kind = entity.kind || 'default';
    const src = typeof entity.imageUrl === 'string' && entity.imageUrl.trim() ? entity.imageUrl.trim() : null;

    if (src) {
      const img = doc.createElement('img');
      img.className = 'entity-image';
      if (cover) img.style.objectFit = 'cover';
      img.src = src;
      img.alt = `${kind} image for ${title}`;
      return img;
    }

    const div = doc.createElement('div');
    div.className = 'placeholder-image';
    div.style.backgroundColor = getDeterministicColor((entity.id || kind).toString());
    div.innerHTML = PLACEHOLDER_ICONS[kind] || PLACEHOLDER_ICONS.default;
    div.setAttribute('role', 'img');
    div.setAttribute('aria-label', `${kind} placeholder for ${title}`);
    return div;
  }

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

  function normalize(core, base = {}) {
    const nameOrTitle = core.name || core.title || base.name || base.title || '';
    const summaryOrDesc = core.summary || core.description || base.summary || base.description || '';
    const sections = core.sections || base.sections || {};
    const imageUrl = core.imageUrl || core.image || base.imageUrl || base.image || '';
    const image = imageUrl;
    return {
      name: nameOrTitle,
      title: nameOrTitle,
      summary: summaryOrDesc,
      description: summaryOrDesc,
      tags: core.tags || base.tags || [],
      sections: {
        forever: sections.forever || '',
        past: sections.past || '',
        present: sections.present || '',
        future: sections.future || ''
      },
      image,
      imageUrl
    };
  }

  function merge(type, custom) {
    const key = storeMap[type];
    const premade = (App.getPremadeItems ? App.getPremadeItems(key) : []).map((e) => ({
      ...e,
      kind: type,
      isPremade: true,
      isCustom: false,
      version: STORAGE_VERSION,
      ...normalize(e)
    }));
    const normal = custom.map((e) => ({
      ...e,
      kind: type,
      isPremade: false,
      isCustom: true,
      version: STORAGE_VERSION,
      ...normalize(e)
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
      if (Array.isArray(App._allItemsCache[key])) return App._allItemsCache[key];
      const data = merge(type, read(type));
      App._allItemsCache[key] = data;
      return data;
    },
    get(type, id) {
      return this.list(type).find((e) => e.id === id) || null;
    },
    upsert(type, entity) {
      const items = read(type);
      const id = entity.id || (global.crypto?.randomUUID?.() || `${type}-${Date.now()}`);
      const idx = items.findIndex((e) => e.id === id);
      const base = idx >= 0 ? items[idx] : {};
      const saved = {
        id,
        kind: type,
        isCustom: true,
        isPremade: false,
        version: STORAGE_VERSION,
        ...base,
        ...normalize(entity, base)
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
        ...normalize(entity, base)
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
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
