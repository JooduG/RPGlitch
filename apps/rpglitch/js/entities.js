(function (global) {
  const App = global.App || (global.App = {});
  const storeMap = { character: 'characters', world: 'worlds' };

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
      name: e.name || e.title,
      title: e.name || e.title,
      summary: e.summary || e.description || '',
      description: e.summary || e.description || ''
    }));
    const normal = custom.map((e) => ({
      ...e,
      kind: type,
      isPremade: false,
      isCustom: true,
      name: e.name || e.title,
      title: e.name || e.title
    }));
    return premade.concat(normal);
  }

  App.entities = {
    list(type) {
      App._allItemsCache = App._allItemsCache || Object.create(null);
      const key = storeMap[type];
      const cached = App._allItemsCache[key];
      if (cached) return cached;
      const custom = read(type);
      const data = merge(type, custom);
      App._allItemsCache[key] = data;
      return data;
    },
    get(type, id) {
      return this.list(type).find((e) => e.id === id) || null;
    },
    create(type, data) {
      const items = read(type);
      const id = data.id || (global.crypto?.randomUUID?.() || `${type}-${Date.now()}`);
      const entity = {
        id,
        kind: type,
        name: data.name || data.title || '',
        title: data.name || data.title || '',
        summary: data.summary || data.description || '',
        description: data.summary || data.description || '',
        tags: data.tags || [],
        imageUrl: data.imageUrl || data.image || '',
        isCustom: true,
        isPremade: false,
        ...data
      };
      items.push(entity);
      write(type, items);
      App._allItemsCache = App._allItemsCache || Object.create(null);
      const key = storeMap[type];
      const cache = App._allItemsCache[key] || [];
      cache.push(entity);
      App._allItemsCache[key] = cache;
      return entity;
    },
    update(type, id, patch) {
      const items = read(type);
      const idx = items.findIndex((e) => e.id === id);
      if (idx === -1) return null;
      items[idx] = {
        ...items[idx],
        ...patch,
        name: patch.name || patch.title || items[idx].name,
        title: patch.name || patch.title || items[idx].title,
        summary: patch.summary || patch.description || items[idx].summary,
        description: patch.summary || patch.description || items[idx].description
      };
      write(type, items);
      const key = storeMap[type];
      const cache = App._allItemsCache[key] || [];
      const cidx = cache.findIndex((e) => e.id === id);
      if (cidx >= 0) cache[cidx] = items[idx];
      else cache.push(items[idx]);
      App._allItemsCache[key] = cache;
      return items[idx];
    },
    remove(type, id) {
      const next = read(type).filter((e) => e.id !== id);
      write(type, next);
      const key = storeMap[type];
      const cache = (App._allItemsCache && App._allItemsCache[key]) || [];
      App._allItemsCache[key] = cache.filter((e) => e.id !== id);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
