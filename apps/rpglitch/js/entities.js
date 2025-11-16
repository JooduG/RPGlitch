import { db } from "./db.js"; // <-- Import our database
import { error as warn } from "./utils.js";
import { sanitizeHtml } from "./validation.js";

// --- PREMADE CONTENT (Unchanged) ---
const premade = {
  stories: [],
  characters: [
    {
      id: "char-1",
      name: "Aether Blade",
      description: "Cybernetic warrior forging light into weapons.",
      type: "Character",
      signatureColour: "cyan",
      sections: {
        forever: "Bound to the Aether Core, their blade hums with starlight.",
        past: "Once a street tinkerer who reverse-engineered a fallen drone.",
        present:
          "Hired to protect caravans across the skybridges of Neo Arcadia.",
        future: "Fated to sever the Source that powers the city itself.",
      },
    },
    {
      id: "char-2",
      name: "Mystic Bard",
      description: "Traveling musician who weaves spells with song.",
      type: "Character",
      signatureColour: "pink",
      sections: {
        forever: "Every note carries a memory; every chorus, a charm.",
        past: "Exiled from a royal conservatory for forbidden harmonics.",
        present: "Busks in markets, mending hearts and stirring rebellions.",
        future: "Composes the Anthem that ends a century-long war.",
      },
    },
    {
      id: "char-3",
      name: "Clockwork Rogue",
      description: "Stealthy thief powered by ticking gears.",
      type: "Character",
      signatureColour: "emerald",
      sections: {
        forever: "Precision over passion; gears never lie.",
        past: "Built in a hidden workshop as a prototype companion.",
        present: "Steals artifacts to buy freedom for their maker.",
        future: "Breaks their mainspring to stop a time heist.",
      },
    },
    {
      id: "char-4",
      name: "Shadow Whisperer",
      description: "Mysterious figure communing with darkness.",
      type: "Character",
      signatureColour: "cyan",
      sections: {
        forever: "The dark is not empty; it listens back.",
        past: "Swallowed by a rift and returned with a voice not their own.",
        present: "Brokers secrets between guilds through living silhouettes.",
        future: "Merges with the Night to blind an invading fleet.",
      },
    },
  ],
  worlds: [
    {
      id: "world-1",
      name: "Eldoria",
      description: "Floating isles bound by ancient magic.",
      type: "World",
      signatureColour: "emerald",
      sections: {
        forever: "Isles drift on leylines braided like song.",
        past: "Sky anchors forged by archmages after the Great Sundering.",
        present: "Airships trade between isles while storms hide ruins.",
        future: "The leylines unravel unless the lost keystone is found.",
      },
    },
    {
      id: "world-2",
      name: "Neo Arcadia",
      description: "Futuristic metropolis built on dream tech.",
      type: "World",
      signatureColour: "pink",
      sections: {
        forever: "Dreams scaffold towers; intent becomes steel.",
        past: "Founded by lucid engineers who stabilized shared dreaming.",
        present: "Neon districts vie for control of the Somnus Grid.",
        future: "A city-wide insomnia threatens to collapse reality seams.",
      },
    },
  ],
};

export function getPremadeItems(key) {
  const bank = premade;
  const list = bank[key] || [];
  return Array.isArray(list) ? list : [];
}

const storeMap = {
  character: "characters",
  world: "worlds",
};
const STORAGE_VERSION = 1;

// --- UTILITY FUNCTIONS (Unchanged) ---

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

/**
 * Retrieves the signature color for an entity.
 *
 * The fallback chain is:
 * 1. Returns CSS variable `--signature-{color}` if `entity.signatureColour` is defined and not 'default'
 * 2. Generates a deterministic color based on entity name and tags as final fallback
 *
 * @param {Object} entity - The entity object (character, world, or story)
 * @returns {string} A CSS color value (CSS variable reference, hex code, or HSL color)
 */
function getSignature(entity = {}) {
  if (!entity) {
    return getDeterministicColor("");
  }

  // 1. Modern signature color property
  if (entity.signatureColour && entity.signatureColour !== "default") {
    return `var(--signature-${entity.signatureColour})`;
  }

  // 2. Fallback: Build seed from name and tags, filtering out empty values
  const seed = [entity.name || "", ...(entity.tags || [])]
    .filter(Boolean)
    .join(",");

  return getDeterministicColor(seed || entity.id || entity.type || "");
}

export function getPictureHTML(entity = {}, options = {}) {
  const { cover, neutralPlaceholder = false } = options;
  const title = entity.name || "Empty";
  // Use 'type' directly, no 'kind' fallback
  const type = (entity.type || "default").toLowerCase();
  const src =
    typeof entity.profilePictureUrl === "string" && entity.profilePictureUrl.trim()
      ? entity.profilePictureUrl.trim()
      : "";
  const signature = getSignature(entity);
  const contrast = getContrast(signature);

  const wrap = document.createElement("div");
  wrap.className = `picture${cover ? " picture--cover" : ""}`;
  wrap.style.setProperty("--signature", signature);
  wrap.style.setProperty("--signature-contrast", contrast);

  if (src) {
    const img = document.createElement("img");
    img.alt = `${type} image for ${title}`; // Use 'type'
    img.src = src;
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    wrap.appendChild(img);
    return wrap;
  }

  const ph = document.createElement("div");
  ph.className = "placeholder-image";
  const useNeutral = !!neutralPlaceholder;
  if (!useNeutral) {
    ph.style.backgroundColor = "var(--signature)";
    ph.style.color = "var(--signature-contrast)";
  }

  // Use templates for placeholder icons - simple lookup with fallback
  const iconTemplateId = `tpl-placeholder-icon-${type}`;
  const iconTemplate = document.querySelector(`#${iconTemplateId}`)
    || document.querySelector('#tpl-placeholder-icon-default');

  if (iconTemplate?.content) {
    const clonedIcon = iconTemplate.content.cloneNode(true);
    ph.appendChild(clonedIcon);
  } else {
    warn(`getPictureHTML: No icon template found for ${type} or default.`);
  }

  ph.setAttribute("role", "img");
  ph.setAttribute("aria-label", `${type} placeholder for ${title}`); // Use 'type'
  wrap.appendChild(ph);
  return wrap;
}

// --- NEW: Data Normalization (pulled from old 'normalize') ---
// This prepares data to be saved to the database.
function normalize(base = {}) {
  const nameOrTitle = sanitizeHtml(base.name || "").trim();
  const summaryOrDesc = sanitizeHtml(base.description || "").trim();
  const profilePictureUrl = sanitizeHtml(base.profilePictureUrl || "").trim();
  const signatureColour = sanitizeHtml(
    base.signatureColour || "default"
  ).trim();
  const forever = sanitizeHtml(base.forever || "").trim();
  const past = sanitizeHtml(base.past || "").trim();
  const present = sanitizeHtml(base.present || "").trim();
  const future = sanitizeHtml(base.future || "").trim();

  const rawTags = Array.isArray(base.tags)
    ? base.tags
    : base.tags
    ? String(base.tags).split(",")
    : [];
  const safeTags = rawTags
    .map((s) => sanitizeHtml(String(s).trim()))
    .filter(Boolean);

  return {
    name: nameOrTitle,
    description: summaryOrDesc,
    profilePictureUrl: profilePictureUrl,
    signatureColour: signatureColour,
    forever: forever,
    past: past,
    present: present,
    future: future,
    tags: safeTags,
  };
}

// --- NEW: Format Premade Entities ---
// This makes premade items look like items from the database.
export function formatPremade(entity, type) {
  const flattenedEntity = {
    ...entity,
    ...(entity.sections || {}), // Flatten sections into top-level properties
  };
  delete flattenedEntity.sections; // Remove the original sections object

  return {
    ...flattenedEntity,
    type: type, // Ensure 'type' is set
    isPremade: true,
    isCustom: 0, // 0 = not custom (premade)
    version: STORAGE_VERSION,
    ...normalize(flattenedEntity), // Ensure premades are also normalized
    updatedAt: 0, // Give a fake timestamp
  };
}

// --- REWRITTEN: Entity CRUD Functions (now async) ---

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
    const premadeList = (getPremadeItems(key) || []).map((e) =>
      formatPremade(e, type)
    );
    let customList = [];
    try {
      // 2. Query using the compound index [type+isCustom]
      customList = await db.entities
        .where("[type+isCustom]")
        .equals([type, 1]) // 1 = custom
        .toArray();
    } catch (error) {
      console.error("Error fetching custom entities:", error);
      return premadeList; // Return premade if DB fails
    }

    // 3. Merge and sort.
    const allItems = premadeList.concat(customList);
    return allItems.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  },

  /**
   * Gets a single entity by its ID.
   * @param {string} type - 'character' or 'world'
   * @param {string} id - The ID of the entity.
   * @returns {Promise<Object|null>} A promise resolving to the entity or null.
   */
  async get(type, id) {
    try {
      // 1. Check premade items first
      const key = storeMap[type];
      const premadeItem = (getPremadeItems(key) || []).find((e) => e.id === id);
      if (premadeItem) {
        return formatPremade(premadeItem, type);
      }

      // 2. If not premade, get from the database
      const item = await db.entities.get(id);

      // 3. Ensure it's the correct type before returning
      return item && item.type === type ? item : null;
    } catch (error) {
      console.error(`Failed to get ${type} with id ${id}:`, error);
      return null;
    }
  },

  /**
   * Creates or updates an entity in the database.
   * @param {string} type - 'character' or 'world'
   * @param {Object} entity - The entity data to save.
   * @returns {Promise<Object>} A promise resolving to the saved entity.
   */
  async upsert(type, entity) {
    try {
      const id = entity.id || crypto?.randomUUID?.() || `${type}-${Date.now()}`;

      // Get the existing item (if it exists) to merge with
      const base = (await db.entities.get(id)) || {};

      const saved = {
        ...base,
        ...normalize({ ...base, ...entity }), // Merge and normalize
        id: id,
        type: type, // Ensure 'type' is set
        isCustom: 1, // 1 = custom
        isPremade: false,
        version: STORAGE_VERSION,
        updatedAt: Date.now(), // Set the updated timestamp
      };

      // Dexie's 'put' is a perfect "upsert" command
      await db.entities.put(saved);
      return saved;
    } catch (error) {
      console.error(`Failed to save ${type}:`, error);
      throw new Error(`Failed to save ${type}. Please try again.`);
    }
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
    try {
      // We only remove custom items.
      const item = await db.entities.get(id);
      if (item && item.type === type && item.isCustom === 1) {
        return db.entities.delete(id);
      }
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error);
      throw new Error(`Could not delete ${type}. Please try again.`);
    }
  },

  /**
   * Creates a deep copy of an entity, ready for editing.
   * @param {string} type - 'character' or 'world'
   * @param {string} id - The ID of the entity to copy.
   * @returns {Promise<Object|null>} A promise resolving to the copy or null.
   */
  async copy(type, id) {
    try {
      const item = await this.get(type, id);
      if (!item) return null;

      // Return a deep copy, relying on the already flattened structure from get()
      return { ...item };
    } catch (error) {
      console.error(`Failed to copy ${type}:`, error);
      return null;
    }
  },
};

// Export getSignature for testing purposes
export { getSignature };
