// apps/rpglitch/js/entities.js
import { db } from "./db.js";
import { error } from "./utils.js";
import { sanitizeHtml } from "./validation.js";

// --- PREMADE CONTENT (Kept for seeding) ---
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
        present: "Hired to protect caravans across the skybridges of Neo Arcadia.",
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

const STORAGE_VERSION = 2;

// --- UTILITY FUNCTIONS ---

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
        ? hex.split("").map((c) => c + c).join("")
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

export function getSignature(entity = {}) {
  if (!entity) return getDeterministicColor("");
  if (entity.signatureColour && entity.signatureColour !== "default") {
    return `var(--signature-${entity.signatureColour})`;
  }
  const seed = [entity.name || "", ...(entity.tags || [])].filter(Boolean).join(",");
  return getDeterministicColor(seed || entity.id || entity.type || "");
}

export function getPictureHTML(entity = {}, options = {}) {
  const { cover, landscape, neutralPlaceholder = false } = options;
  const title = entity.name || "Empty";
  const type = (entity.type || "default").toLowerCase();
  const src = typeof entity.profilePictureUrl === "string" && entity.profilePictureUrl.trim()
    ? entity.profilePictureUrl.trim()
    : "";
  const signature = getSignature(entity);
  const contrast = getContrast(signature);

  const wrap = document.createElement("div");
  let aspectRatioClass = '';
  if (landscape === true) {
    aspectRatioClass = ' picture--landscape';
  } else if (landscape === false) {
    aspectRatioClass = ' picture--portrait';
  }
  wrap.className = `picture${cover ? " picture--cover" : ""}${aspectRatioClass}`;
  wrap.style.setProperty("--signature", signature);
  wrap.style.setProperty("--signature-contrast", contrast);

  if (src) {
    const img = document.createElement("img");
    img.alt = `${type} image for ${title}`;
    img.src = src;
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    wrap.appendChild(img);
    return wrap;
  }

  const ph = document.createElement("div");
  ph.className = "placeholder-image";
  if (!neutralPlaceholder) {
    ph.style.backgroundColor = "var(--signature)";
    ph.style.color = "var(--signature-contrast)";
  }

  const iconTemplateId = `tpl-placeholder-icon-${type}`;
  const iconTemplate = document.querySelector(`#${iconTemplateId}`) || document.querySelector("#tpl-placeholder-icon-default");

  if (iconTemplate?.content) {
    ph.appendChild(iconTemplate.content.cloneNode(true));
  }

  ph.setAttribute("role", "img");
  ph.setAttribute("aria-label", `${type} placeholder for ${title}`);
  wrap.appendChild(ph);
  return wrap;
}

function normalize(base = {}) {
  const safeTags = (Array.isArray(base.tags) ? base.tags : (base.tags ? String(base.tags).split(",") : []))
    .map((s) => sanitizeHtml(String(s).trim()))
    .filter(Boolean);

  return {
    name: sanitizeHtml(base.name || "").trim(),
    description: sanitizeHtml(base.description || "").trim(),
    profilePictureUrl: sanitizeHtml(base.profilePictureUrl || "").trim(),
    signatureColour: sanitizeHtml(base.signatureColour || "default").trim(),
    forever: sanitizeHtml(base.forever || "").trim(),
    past: sanitizeHtml(base.past || "").trim(),
    present: sanitizeHtml(base.present || "").trim(),
    future: sanitizeHtml(base.future || "").trim(),
    tags: safeTags,

    // V4.2: NARRATIVE PHYSICS
    dynamics: base.dynamics || null,

    // V4.2: ROLLBACK SYSTEM (Hidden Fields)
    // These must be preserved so the "Time Machine" works during Re-Rolls
    _backupState: base._backupState || null,
    _lastUpdateMsgId: base._lastUpdateMsgId || null
  };
}

function formatPremade(entity, type) {
  const flattenedEntity = {
    ...entity,
    ...(entity.sections || {}),
  };
  delete flattenedEntity.sections;

  return {
    ...flattenedEntity,
    type: type.toLowerCase(),
    isPremade: 1,
    isCustom: 0,
    version: STORAGE_VERSION,
    ...normalize(flattenedEntity),
    updatedAt: 0,
  };
}

// --- SEEDER ---
export async function seedPremades() {
  console.log("[RPGlitch] Seeding premade content...");
  try {
    const chars = premade.characters.map(c => formatPremade(c, "character"));
    const worlds = premade.worlds.map(w => formatPremade(w, "world"));
    const stories = premade.stories.map(s => formatPremade(s, "story"));
    await db.entities.bulkPut([...chars, ...worlds, ...stories]);
    console.log(`[RPGlitch] Seeded ${chars.length} characters, ${worlds.length} worlds.`);
  } catch (err) {
    error("Failed to seed premades:", err);
  }
}

// --- CRUD ---

export const entities = {
  async list(type) {
    try {
      const items = await db.entities.where("type").equals(type).toArray();
      return items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (err) {
      error(`Error listing ${type}:`, err);
      return [];
    }
  },

  async get(type, id) {
    try {
      const item = await db.entities.get(id);
      return item && item.type === type.toLowerCase() ? item : null;
    } catch (err) {
      error(`Failed to get ${type} with id ${id}:`, err);
      return null;
    }
  },

  async upsert(type, entity) {
    try {
      const id = entity.id || crypto?.randomUUID?.() || `${type}-${Date.now()}`;
      const base = (await db.entities.get(id)) || {};

      const saved = {
        ...base,
        ...normalize({ ...base, ...entity }),
        id: id,
        type: type.toLowerCase(),
        isCustom: 1,
        isPremade: 0,
        version: STORAGE_VERSION,
        updatedAt: Date.now(),
      };

      await db.entities.put(saved);
      return saved;
    } catch (err) {
      error(`Failed to save ${type}:`, err);
      throw new Error(`Failed to save ${type}. Please try again.`);
    }
  },

  async remove(type, id) {
    try {
      const item = await db.entities.get(id);
      if (item && item.type === type.toLowerCase() && item.isCustom === 1) {
        return db.entities.delete(id);
      }
      if (item && item.isPremade) {
        throw new Error("Cannot delete premade content.");
      }
    } catch (err) {
      error(`Failed to delete ${type}:`, err);
      throw err;
    }
  },

  async copy(type, id) {
    try {
      const item = await db.entities.get(id);
      if (!item) return null;
      return { ...item };
    } catch (err) {
      error(`Failed to copy ${type}:`, err);
      return null;
    }
  },

  // --- SNAPSHOT SYSTEM (V4.2) ---

  async getSnapshot(storyId, type, masterId) {
    try {
      const candidates = await db.entities.where("type").equals(type.toLowerCase()).toArray();
      return candidates.find(e =>
        e.storyId === storyId &&
        e.isSnapshot === 1 &&
        (!masterId || e.snapshotOf === masterId)
      ) || null;
    } catch (err) {
      error(`Error fetching snapshot for story ${storyId}:`, err);
      return null;
    }
  },

  async createSnapshot(storyId, masterEntity) {
    try {
      const snapshot = {
        ...masterEntity,
        id: crypto.randomUUID(),
        storyId: storyId,
        snapshotOf: masterEntity.id,
        isSnapshot: 1,
        isCustom: 1,
        isPremade: 0,
        updatedAt: Date.now(),
        // NEW: Narrative Physics Initialization
        dynamics: {
          entropy: 10,
          permeability: 50,
          velocity: 10,
          resonance: 10
        }
      };

      await db.entities.put(snapshot);
      return snapshot;
    } catch (err) {
      error(`Failed to create snapshot for ${masterEntity.name}:`, err);
      throw err;
    }
  }
};

export async function copyEntity(type, id) {
  const entityToCopy = await entities.get(type, id);
  if (!entityToCopy) return null;
  const newEntity = { ...entityToCopy };
  delete newEntity.id;
  newEntity.isPremade = 0;
  newEntity.isCustom = 1;
  newEntity.name = `${newEntity.name || "Untitled"} (Clone)`;
  return newEntity;
}