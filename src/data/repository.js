/**
 * @typedef {Object} Story
 * @property {string|number} id
 * @property {string} title
 * @property {'concluded'|'active'} state
 * @property {number} last_played
 * @property {string} fractal_profile_picture
 * @property {string} fractal_name
 * @property {string} signature_color
 * @property {number} [is_concluded] - Truthy once the story has been ended (epilogue delivered).
 */
import { db } from "./db.js";
import { normalize, format_premade } from "./normalizer.js";
import { premade } from "./definitions/premades.js";
import { generate_uuid, stories_bridge } from "@utils";
import { serialize_embedding, deserialize_embedding } from "@platform";

const error = console.error;
const premade_entity_map = new Map((premade?.entities || []).map((e) => [e.id, e]));
// ============================================================================
// 1. DATA SEEDING (The Entity Foundry)
// ============================================================================
/**
 * Seeds the database with premade entities if they don't already exist.
 * Trusts the Normalizer to enforce the flattened "Twin-Cylinder" structure.
 */
export const seed_premades = async () => {
  const g = /** @type {any} */ (globalThis);
  if (typeof globalThis !== "undefined" && g._seeding) return;
  if (typeof globalThis !== "undefined") g._seeding = true;
  try {
    const existing = await db.entities.toArray();
    const to_add = [];
    const existing_ids = new Set();
    for (const e of existing) {
      if (e.id != null) existing_ids.add(e.id);
      if (e.origin_id != null) existing_ids.add(e.origin_id);
    }
    for (const bp of premade.entities) {
      // Check by ID or origin_id to prevent duplicates of factory stock
      const has_child = existing_ids.has(bp.id);
      if (!has_child) {
        // format_premade stamps the premade storage shape (is_premade/version);
        // the seed layer adds the table key and creation timestamps on top.
        const formatted = format_premade(bp, bp.type);
        to_add.push({
          ...formatted,
          id: bp.id,
          origin_id: bp.id,
          is_snapshot: 0,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      }
    }
    if (to_add.length > 0) {
      await db.entities.bulkPut(to_add);
    }
  } catch (err) {
    error("Foundry Error: Failed to seed the premade gods.", err);
  } finally {
    if (typeof globalThis !== "undefined") /** @type {any} */ (globalThis)._seeding = false;
  }
};
// ============================================================================
// 2. ENTITIES (The CRUD Engine)
// ============================================================================

/**
 * Maps `_embedding` on temporal vectors (past pool only — future is prose now)
 * through a transform without mutating the input. Missing embeddings are dropped
 * so corrupt/empty values never persist.
 * @param {any} entity
 * @param {(emb: any) => any} transform
 * @returns {any}
 */
function _map_vector_embeddings(entity, transform) {
  if (!entity || typeof entity !== "object") return entity;
  const out = { ...entity };
  if (!Array.isArray(out.past)) return out;
  out.past = out.past.map((v) => {
    if (!v || !Object.prototype.hasOwnProperty.call(v, "_embedding")) return v;
    const mapped = transform(v._embedding);
    if (mapped) return { ...v, _embedding: mapped };
    const copy = { ...v };
    delete copy._embedding;
    return copy;
  });
  return out;
}

export const entities = {
  /**
   * Lists all entities of a specific type (character/fractal).
   * @param {'character'|'fractal'} type
   */
  async list(type) {
    try {
      const items = await db.entities.where("type").equals(type).toArray();
      return items.sort((a, b) => (String(/** @type {any} */ (a).name) || "").localeCompare(String(/** @type {any} */ (b).name) || ""));
    } catch (err) {
      error(`Error listing the ${type} census:`, err);
      return [];
    }
  },
  /**
   * Retrieves a single entity by ID, falling back to premades if not in DB.
   * @param {'character'|'fractal'} type
   * @param {string} id
   */
  async get(type, id) {
    try {
      let item = await db.entities.get(id);
      if (!item) {
        const raw_premade = premade_entity_map.get(id);
        if (raw_premade) item = normalize(raw_premade);
      }
      if (!item || item.type !== type) return null;
      let out = _map_vector_embeddings(item, deserialize_embedding);
      return out;
    } catch (err) {
      error(`Failed to fetch ${type} [${id}] from the void:`, err);
      return null;
    }
  },
  /**
   * Saves or updates an entity.
   * Force-normalizes and flattens everything before it touches the disk.
   * @param {'character'|'fractal'} type
   * @param {any} entity
   */
  async upsert(type, entity) {
    try {
      const id = entity.id || generate_uuid();
      const base = (await db.entities.get(id)) || {};
      // Break the Svelte 5 Proxy chains - deep clone for safety. Embeddings are
      // converted to JSON-safe arrays first so Float32Array survives the round-trip.
      const serializable = _map_vector_embeddings(entity, serialize_embedding);
      const clean_entity = JSON.parse(JSON.stringify(serializable));
      const saved = {
        ...base,
        ...normalize({ ...base, ...clean_entity }),
        id,
        type: type,
        is_snapshot: 0,
        updated_at: Date.now(),
      };
      await db.entities.put(saved);
      return saved;
    } catch (err) {
      error(`Failed to manifest ${type} into the database:`, err);
      throw err;
    }
  },
  /**
   * Deletes an entity if it matches the requested type.
   * @param {'character'|'fractal'} type
   * @param {string} id
   */
  async remove(type, id) {
    try {
      const item = await db.entities.get(id);
      if (item && item.type === type) {
        return db.entities.delete(id);
      }
    } catch (err) {
      error(`Failed to delete ${type} [${id}] - it's fighting back:`, err);
      throw err;
    }
  },
  /**
   * Updates an entity directly without full normalization.
   * Useful for partial updates or metadata stamps.
   * @param {'character'|'fractal'} type
   * @param {string} id
   * @param {any} data
   */
  async update(type, id, data) {
    try {
      const serializable = _map_vector_embeddings(data, serialize_embedding);
      const clean_data = JSON.parse(JSON.stringify(serializable));
      const item = await db.entities.get(id);
      if (item && item.type === type) {
        return db.entities.update(id, clean_data);
      }
    } catch (err) {
      error(`Failed to update ${type} [${id}]:`, err);
      throw err;
    }
  },
};
// ============================================================================
// 3. STORIES (The Narrative Archive)
// ============================================================================
/**
 * The stories table uses numeric auto-increment keys, but session persistence
 * and URL routing may store the ID as a string. Prevents silent lookup
 * failures. Canonical source — the state layer imports this via @data.
 * @param {string | number} id
 * @returns {string | number}
 */
export const coerce_story_key = (id) => {
  if (typeof id === "string" && /^\d+$/.test(id)) return Number(id);
  return id;
};

/**
 * Resolves the set of story ids whose log already contains an epilogue entry.
 * The epilogue is the app's semantic conclusion marker, so pre-existing stories
 * (created before the `is_concluded` field existed) still report as concluded.
 * @param {(string | number)[]} story_ids
 * @returns {Promise<Set<string>>}
 */
async function _epilogue_story_ids(story_ids) {
  const ids = [...new Set(story_ids.flatMap((id) => [String(id), id]))];
  if (ids.length === 0) return new Set();
  const entries = await db.simulation_log.where("story_id").anyOf(ids).toArray();
  const out = new Set();
  for (const entry of entries) {
    if (entry?.meta?.is_epilogue) out.add(String(entry.story_id));
  }
  return out;
}

export const stories = {
  /**
   * Lists all stories with associated fractal metadata.
   * UPDATED: Accesses flattened fractal properties directly.
   */
  async list() {
    try {
      const all_stories = await db.stories.orderBy("updated_at").reverse().toArray();

      // Batch fetch fractals to avoid N+1 queries
      const fractal_ids = [...new Set(all_stories.filter((s) => s.fractal_id).map((s) => s.fractal_id))];
      const fractals = await db.entities
        .where("id")
        .anyOf(/** @type {any[]} */ (fractal_ids))
        .toArray();
      const fractal_map = new Map(fractals.map((f) => [f.id, f]));

      const epilogue_story_ids = await _epilogue_story_ids(all_stories.map((s) => s.id));

      const unique_map = new Map();
      for (const story of all_stories) {
        if (!unique_map.has(story.id)) {
          const fractal = fractal_map.get(story.fractal_id);
          const is_concluded = story.is_concluded || epilogue_story_ids.has(String(story.id));
          unique_map.set(story.id, {
            id: story.id,
            title: story.title || "Untitled Fragment",
            state: is_concluded ? "concluded" : "active",
            last_played: story.updated_at,
            fractal_profile_picture: fractal?.profile_picture || "",
            fractal_name: fractal?.name || "The Void",
            signature_color: fractal?.signature_color || "default",
            npc_ids: Array.isArray(story.npc_ids) ? story.npc_ids : [],
          });
        }
      }
      return Array.from(unique_map.values());
    } catch (err) {
      error("Archive Failure: Failed to list narrative records.", err);
      return [];
    }
  },
  /** @param {any} id */
  get: (id) => db.stories.get(coerce_story_key(id)),
  /** @param {any} id @param {any} changes */
  update: async (id, changes) => {
    const result = await db.stories.update(coerce_story_key(id), changes);
    stories_bridge.bump();
    return result;
  },
  /**
   * Replaces a story's world-cast roster (NPC ids). Deduplicates and coerces to
   * clean string ids so the multiEntry index stays tidy.
   * @param {string | number} id
   * @param {string[]} npc_ids
   */
  update_cast: async (id, npc_ids) => {
    const clean = Array.isArray(npc_ids) ? [...new Set(npc_ids.map((x) => (x == null ? "" : String(x).trim())).filter(Boolean))] : [];
    const result = await db.stories.update(coerce_story_key(id), { npc_ids: clean });
    stories_bridge.bump();
    return result;
  },
  /**
   * Marks a story as concluded after its epilogue has been delivered. Concluded
   * stories release their entities back to the storyboard lobby.
   * @param {string | number} id
   */
  conclude: async (id) => {
    const result = await db.stories.update(coerce_story_key(id), { is_concluded: 1 });
    stories_bridge.bump();
    return result;
  },
  /**
   * Resolves the entity ids currently claimed by active (non-concluded) stories.
   * A claimed entity may not be re-selected for another story, and its profile
   * is locked for editing unless DevMode is enabled.
   * @returns {Promise<string[]>}
   */
  async active_entity_ids() {
    try {
      const all_stories = await db.stories.toArray();
      const epilogue_story_ids = await _epilogue_story_ids(all_stories.map((s) => s.id));
      const claimed = new Set();
      for (const story of all_stories) {
        if (story.is_concluded || epilogue_story_ids.has(String(story.id))) continue;
        for (const key of ["ai_id", "user_id", "fractal_id"]) {
          if (story[key] != null) claimed.add(String(story[key]));
        }
      }
      return [...claimed];
    } catch (err) {
      error("Archive Failure: Failed to resolve active entity claims.", err);
      return [];
    }
  },
  /**
   * Deletes a story and its entire simulation log.
   * @param {any} id
   */
  async delete(id) {
    // Log entries persist story_id as a string while stories.list() returns the
    // numeric auto-increment key — match both forms so orphaned rows never leak.
    const ids = [...new Set([String(id), id])];
    await db.simulation_log.where("story_id").anyOf(ids).delete();
    const result = await db.stories.delete(coerce_story_key(id));
    stories_bridge.bump();
    return result;
  },
};
