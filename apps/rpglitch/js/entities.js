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

  function merge(type, custom) {
    const key = storeMap[type];
    const premade = (App.getPremadeItems ? App.getPremadeItems(key) : []).map((e) => ({
      ...e,
      kind: type,
      isPremade: true,
      isCustom: false,
      version: STORAGE_VERSION,
      name: e.name || e.title || '',
      title: e.name || e.title || '',
      summary: e.summary || e.description || '',
      description: e.summary || e.description || ''
    }));
    const normal = custom.map((e) => ({
      ...e,
      kind: type,
      isPremade: false,
      isCustom: true,
      version: STORAGE_VERSION,
      name: e.name || e.title || '',
      title: e.name || e.title || ''
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
      const idx = entity.id ? items.findIndex((e) => e.id === entity.id) : -1;
      const id = entity.id || (global.crypto?.randomUUID?.() || `${type}-${Date.now()}`);
      const base = idx >= 0 ? items[idx] : {};
      const saved = {
        id,
        kind: type,
        isCustom: true,
        isPremade: false,
        version: STORAGE_VERSION,
        ...base,
        ...entity,
        name: entity.name || entity.title || base.name || '',
        title: entity.name || entity.title || base.title || '',
        summary: entity.summary || entity.description || base.summary || '',
        description: entity.summary || entity.description || base.description || '',
        tags: entity.tags || base.tags || [],
        sections: entity.sections || base.sections || {},
        imageUrl: entity.imageUrl || entity.image || base.imageUrl || ''
      };
      if (idx >= 0) items[idx] = saved;
      else items.push(saved);
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
