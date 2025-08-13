(function (global) {
  const App = global.App || (global.App = {});
  const storeMap = { character: 'characters', world: 'worlds' };

  function load(type) {
    const key = storeMap[type];
    try {
      const raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function save(type, items) {
    const key = storeMap[type];
    global.localStorage.setItem(key, JSON.stringify(items));
  }

  function list(type) {
    const key = storeMap[type];
    const premade = App.getPremadeItems ? App.getPremadeItems(key) : [];
    const custom = load(type);
    return premade.concat(custom);
  }

  function get(type, id) {
    return list(type).find((e) => e.id === id) || null;
  }

  function generateId(type) {
    return `${type}-${Date.now()}`;
  }

  function create(entity) {
    const type = entity.type;
    const items = load(type);
    const now = Date.now();
    const newEntity = {
      id: generateId(type),
      kind: 'custom',
      source: 'user',
      updatedAt: now,
      ...entity
    };
    items.push(newEntity);
    save(type, items);
    return newEntity;
  }

  function update(entity) {
    const type = entity.type;
    const items = load(type);
    const idx = items.findIndex((e) => e.id === entity.id);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...entity, updatedAt: Date.now() };
      save(type, items);
      return items[idx];
    }
    return null;
  }

  function remove(type, id) {
    const items = load(type);
    const next = items.filter((e) => e.id !== id);
    save(type, next);
  }

  function copyFromPremade(id) {
    const types = Object.keys(storeMap);
    for (const t of types) {
      const premade = App.getPremadeItems ? App.getPremadeItems(storeMap[t]) : [];
      const base = premade.find((p) => p.id === id);
      if (base) {
        const copy = { ...base, baseId: base.id, kind: 'custom', source: 'user', id: generateId(t), type: t };
        const items = load(t);
        items.push(copy);
        save(t, items);
        return copy;
      }
    }
    return null;
  }

  App.entities = { get, list, create, update, remove, copyFromPremade };
})(typeof window !== 'undefined' ? window : globalThis);
