// apps/rpglitch/js/entity-structs.js
import { sanitizeHtml, getRandomSignatureKey } from "./core-utils.js";

// --- PREMADE CONTENT (Kept for seeding) ---
const premade = {
  stories: [],
  characters: [
    {
      id: "char-1",
      name: "Aether Blade",
      description: "Cybernetic warrior forging light into weapons.",
      type: "Character",
      signatureColour: "azure",
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
      signatureColour: "amber",
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
      signatureColour: "jade",
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
      signatureColour: "violet",
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
      signatureColour: "green",
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
      signatureColour: "purple",
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

// --- DATA UTILITIES (No DOM logic) ---

// [NEW] Visual State Helper (The Safe Accessor)
export function getVisualState(entity) {
  // If modern structure exists, return it
  if (entity.visuals) return entity.visuals;

  // Fallback for legacy entities (Migration on read)
  return {
    flipped: false,
    avatarUrl: entity.profilePictureUrl || "",
    fullBodyUrl: "",
    scale: 1.0,
    yOffset: 0
  };
}

export function normalize(base = {}) {
  const safeTags = (Array.isArray(base.tags) ? base.tags : (base.tags ? String(base.tags).split(",") : []))
    .map((s) => sanitizeHtml(String(s).trim()))
    .filter(Boolean);

  // Determine avatar URL (Prefer visuals.avatarUrl, fallback to profilePictureUrl)
  const existingAvatar = (base.visuals && base.visuals.avatarUrl) || base.profilePictureUrl || "";

  return {
    name: sanitizeHtml(base.name || "").trim(),
    description: sanitizeHtml(base.description || "").trim(),
    profilePictureUrl: sanitizeHtml(existingAvatar).trim(), // Keep sync for now
    signatureColour: (() => {
      const existing = sanitizeHtml(base.signatureColour || "").trim();
      return (existing && existing !== "default") ? existing : getRandomSignatureKey();
    })(),
    forever: sanitizeHtml(base.forever || "").trim(),
    past: sanitizeHtml(base.past || "").trim(),
    present: sanitizeHtml(base.present || "").trim(),
    future: sanitizeHtml(base.future || "").trim(),
    tags: safeTags,

    // [NEW] Visual State Container
    visuals: base.visuals || {
      flipped: false,
      avatarUrl: existingAvatar,
      fullBodyUrl: "",
      scale: 1.0,
      yOffset: 0
    },

    // V4.2: NARRATIVE PHYSICS
    dynamics: base.dynamics || null,

    // V4.2: ROLLBACK SYSTEM (Hidden Fields)
    _backupState: base._backupState || null,
    _lastUpdateMsgId: base._lastUpdateMsgId || null
  };
}

export function formatPremade(entity, type) {
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

export { premade, STORAGE_VERSION };