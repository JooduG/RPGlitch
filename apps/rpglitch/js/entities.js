/* global DOMPurify */
import { db } from './db.js'; // <-- Import our new database

// --- PREMADE CONTENT (Unchanged) ---
const premade = {
  stories: [],
  characters: [{
    id: "char-1",
    title: "Aether Blade",
    description: "Cybernetic warrior forging light into weapons.",
    type: "Character",
    palette: "cyan",
    sections: {
      forever: "Bound to the Aether Core, their blade hums with starlight.",
      past: "Once a street tinkerer who reverse‑engineered a fallen drone.",
      present: "Hired to protect caravans across the skybridges of Neo Arcadia.",
      future: "Fated to sever the Source that powers the city itself.",
    },
  }, {
    id: "char-2",
    title: "Mystic Bard",
    description: "Traveling musician who weaves spells with song.",
    type: "Character",
    palette: "pink",
    sections: {
      forever: "Every note carries a memory; every chorus, a charm.",
      past: "Exiled from a royal conservatory for forbidden harmonics.",
      present: "Busks in markets, mending hearts and stirring rebellions.",
      future: "Composes the Anthem that ends a century‑long war.",
    },
  }, {
    id: "char-3",
    title: "Clockwork Rogue",
    description: "Stealthy thief powered by ticking gears.",
    type: "Character",
    palette: "emerald",
    sections: {
      forever: "Precision over passion; gears never lie.",
      past: "Built in a hidden workshop as a prototype companion.",
      present: "Steals artifacts to buy freedom for their maker.",
      future: "Breaks their mainspring to stop a time heist.",
    },
  }, {
    id: "char-4",
    title: "Shadow Whisperer",
    description: "Mysterious figure communing with darkness.",
    type: "Character",
    palette: "cyan",
    sections: {
      forever: "The dark is not empty; it listens back.",
      past: "Swallowed by a rift and returned with a voice not their own.",
      present: "Brokers secrets between guilds through living silhouettes.",
      future: "Merges with the Night to blind an invading fleet.",
    },
  }, ],
  worlds: [{
    id: "world-1",
    title: "Eldoria",
    description: "Floating isles bound by ancient magic.",
    type: "World",
    palette: "emerald",
    sections: {
      forever: "Isles drift on leylines braided like song.",
      past: "Sky anchors forged by archmages after the Great Sundering.",
      present: "Airships trade between isles while storms hide ruins.",
      future: "The leylines unravel unless the lost keystone is found.",
    },
  }, {
    id: "world-2",
    title: "Neo Arcadia",
    description: "Futuristic metropolis built on dream tech.",
    type: "World",
    palette: "pink",
    sections: {
      forever: "Dreams scaffold towers; intent becomes steel.",
      past: "Founded by lucid engineers who stabilized shared dreaming.",
      present: "Neon districts vie for control of the Somnus Grid.",
      future: "A city‑wide insomnia threatens to collapse reality seams.",
    },
  }, ],
};

export function getPremadeItems(key) {
  const bank = premade;
  const list = bank[key] || [];
  return Array.isArray(list) ? list : [];
}

const storeMap = {
  character: "characters",
  world: "worlds"
};
const STORAGE_VERSION = 1;

// --- UTILITY FUNCTIONS (Unchanged) ---
function sanitizeHtml(s) {
  const v = typeof s === "string" ? s : String(s ?? "");
  try {
    return DOMPurify ? DOMPurify.sanitize(v) : v;
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
      hex.length === 3 ?
      hex
      .split("")
      .map((c) => c + c)
      .join("") : 
      hex;
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
  character: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-3.33 0-8 1.67-8 5v3h16v-3c0-3.33-4.67-5-8-5z"/></svg>',
  world: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 010-16 8 8 0 010 16zm0-14a6 6 0 00-5.29 3h10.58A6 6 0 0012 6zm-5.29 5a6 6 0 000 2h10.58a6 6 0 000-2H6.71zm.42 3a6 6 0 005.29 3 6 6 0 005.29-3H7.13z"/></svg>`,
  default: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>',
};

export function getPictureHTML(entity = {}, options = {}) {
  const {
    cover,
    neutralPlaceholder = false
  } = options;
  const title = entity.title || entity.name || "Empty";
  // Ensure 'kind' is derived correctly, defaulting to 'default'
  const kind = (entity.kind || entity.type || 'default').toLowerCase();
  const src =
    typeof entity.imageUrl === "string" && entity.imageUrl.trim() ?
    entity.imageUrl.trim() :
    "";
  const brand = getBrand(entity);
  const contrast = getContrast(brand);

  const wrap = document.createElement("div");
  wrap.className = `picture${cover ? " picture--cover" : ""}`;
  wrap.style.setProperty("--brand", brand);
  wrap.style.setProperty("--brand-contrast", contrast);

  if (src) {
    const img = document.createElement("img");
    img.alt = `${kind} image for ${title}`;
    img.src = src;
    img.loading = "lazy";
    img.decoding = "async";
    wrap.appendChild(img);
    return wrap;
  }

  const ph = document.createElement("div");
  ph.className = "placeholder-image";
  const useNeutral = !!neutralPlaceholder;
  if (!useNeutral) {
    ph.style.backgroundColor = "var(--brand)";
    ph.style.color = "var(--brand-contrast)";
  }
  ph.innerHTML = sanitizeHtml(
    PLACEHOLDER_ICONS[kind] || PLACEHOLDER_ICONS.default
  );
  ph.setAttribute("role", "img");
  ph.setAttribute("aria-label", `${kind} placeholder for ${title}`);
  wrap.appendChild(ph);
  return wrap;
}

// --- NEW: Data Normalization (pulled from old 'normalize') ---
// This prepares data to be saved to the database.
function normalize(base = {}) {
  const nameOrTitle = sanitizeHtml(base.name || base.title || "").trim();
  const summaryOrDesc = sanitizeHtml(
    base.summary || base.description || ""
  ).trim();
  const image = sanitizeHtml(base.imageUrl || base.image || "").trim();

  const sections = base.sections || {};
  const safeSections = {
    forever: sanitizeHtml(sections.forever || "").trim(),
    past: sanitizeHtml(sections.past || "").trim(),
    present: sanitizeHtml(sections.present || "").trim(),
    future: sanitizeHtml(sections.future || "").trim(),
  };

  const rawTags = Array.isArray(base.tags) ?
    base.tags :
    base.tags ?
    String(base.tags).split(",") :
    [];
  const safeTags = rawTags
    .map((s) => sanitizeHtml(String(s).trim()))
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

// --- NEW: Format Premade Entities ---
// This makes premade items look like items from the database.
export function formatPremade(entity, type) {
  return {
    ...entity,
    kind: type, // Ensure 'kind' is set (was missing)
    type: type, // Ensure 'type' is set
    isPremade: true,
    isCustom: false,
    version: STORAGE_VERSION,
    ...normalize(entity), // Ensure premades are also normalized
    updated: 0, // Give a fake timestamp
  };
}


// --- REWRITTEN: Entity CRUD Functions (now async) ---

// We no longer need _allItemsCache, read(), write(), or _writeAndCache()
// Dexie handles all caching and storage.

export const entities = {
  /**
   * Lists all entities of a given type, merging premade and custom.
   * @param {string} type - 'character' or 'world'
   * @returns {Promise<Array>} A promise that resolves to the merged list.
   */
  async list(type) {
    const key = storeMap[type]; // 'characters' or 'worlds'
    if (!key) return [];

    // 1. Get premade items and format them
    const premadeList = (getPremadeItems(key) || []).map(e => formatPremade(e, type));
    let customList = [];
    try {
      customList = await db.entities.where({ type: type, isCustom: true }).toArray();
    } catch (error) {
      console.error("Error fetching custom entities:", error);
      // We can return just the premade list or an empty array if the DB fails.
      // For a more robust app, you might want to notify the user.
      return premadeList; 
    }

    // 3. Merge and sort.
    const allItems = premadeList.concat(customList);
    
    // Sort by name
    return allItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  },

  /**
   * Gets a single entity by its ID.
   * @param {string} type - 'character' or 'world'
   * @param {string} id - The ID of the entity.
   * @returns {Promise<Object|null>} A promise resolving to the entity or null.
   */
  async get(type, id) {
    // 1. Check premade items first
    const key = storeMap[type];
    const premadeItem = (getPremadeItems(key) || []).find((e) => e.id === id);
    if (premadeItem) {
      return formatPremade(premadeItem, type);
    }
    
    // 2. If not premade, get from the database
    const item = await db.entities.get(id);
    
    // 3. Ensure it's the correct type before returning
    return (item && item.type === type) ? item : null;
  },

  /**
   * Creates or updates an entity in the database.
   * @param {string} type - 'character' or 'world'
   * @param {Object} entity - The entity data to save.
   * @returns {Promise<Object>} A promise resolving to the saved entity.
   */
  async upsert(type, entity) {
    const id = entity.id || crypto?.randomUUID?.() || `${type}-${Date.now()}`;
    
    // Get the existing item (if it exists) to merge with
    const base = await db.entities.get(id) || {};
    
    const saved = {
      ...base,
      ...normalize({ ...base, ...entity }), // Merge and normalize
      id: id,
      type: type, // Ensure 'type' is set (was 'kind' before)
      kind: type, // Keep 'kind' for compatibility
      isCustom: true,
      isPremade: false,
      version: STORAGE_VERSION,
      updated: Date.now(), // Set the updated timestamp
    };
    
    // Dexie's 'put' is a perfect "upsert" command
    await db.entities.put(saved);
    return saved;
  },

  /**
   * Updates an existing entity. (This is now just an alias for upsert).
   * @param {string} type - 'character' or 'world'
   * @param {string} id - The ID of the entity to update.
   * @param {Object} entity - The new data.
   * @returns {Promise<Object>} A promise resolving to the updated entity.
   */
  async update(type, id, entity) {
    // With Dexie, update is the same as upsert, but we ensure the ID is set.
    return this.upsert(type, { ...entity, id: id });
  },

  /**
   * Removes an entity from the database.
   * @param {string} type - 'character' or 'world'
   * @param {string} id - The ID of the entity to remove.
   * @returns {Promise<void>}
   */
  async remove(type, id) {
    // We only remove custom items. We can't remove premade items.
    // Dexie's delete won't fail if the ID doesn't exist.
    const item = await db.entities.get(id);
    if (item && item.type === type && item.isCustom) {
      return db.entities.delete(id);
    }
  },

  /**
   * Creates a deep copy of an entity, ready for editing.
   * @param {string} type - 'character' or 'world'
   * @param {string} id - The ID of the entity to copy.
   * @returns {Promise<Object|null>} A promise resolving to the copy or null.
   */
  async copy(type, id) {
    const item = await this.get(type, id);
    if (!item) return null;
    
    // Return a deep copy
    return { 
      ...item,
      sections: { ...item.sections }
    };
  },
};