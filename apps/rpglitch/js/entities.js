(function (global) {
  const App = global.App || (global.App = {});
  const storeMap = { character: 'characters', world: 'worlds' };
  const STORAGE_VERSION = 1;

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
    return {
      name: nameOrTitle,
      title: nameOrTitle,
      summary: summaryOrDesc,
      description: summaryOrDesc,
      tags: core.tags || base.tags || [],
      sections: core.sections || base.sections || {},
      imageUrl: core.imageUrl || core.image || base.imageUrl || ''
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
      write(type, items);
      const key = storeMap[type];
      App._allItemsCache = App._allItemsCache || Object.create(null);
      App._allItemsCache[key] = merge(type, items);
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
      write(type, items);
      const key = storeMap[type];
      App._allItemsCache = App._allItemsCache || Object.create(null);
      App._allItemsCache[key] = merge(type, items);
      return saved;
    },
    remove(type, id) {
      const remaining = read(type).filter((e) => e.id !== id);
      write(type, remaining);
      const key = storeMap[type];
      App._allItemsCache = App._allItemsCache || Object.create(null);
      App._allItemsCache[key] = merge(type, remaining);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
