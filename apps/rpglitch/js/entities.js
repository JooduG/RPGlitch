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

  function copyFromPremade(baseEntity) {
    if (!baseEntity || !baseEntity.type) {
      return null;
    }
    // Normalize type to lowercase to match storeMap keys, e.g., 'Character' -> 'character'
    const type = baseEntity.type.toLowerCase();
    if (!storeMap[type]) {
      return null;
    }

    // Create a copy, ensuring the type remains consistent with how new entities are created.
    const copy = { ...baseEntity, baseId: baseEntity.id, kind: 'custom', source: 'user', id: generateId(type), type: type };
    const items = load(type);
    items.push(copy);
    save(type, items);
    return copy;
  }

  App.entities = { get, list, create, update, remove, copyFromPremade };
})(typeof window !== 'undefined' ? window : globalThis);
