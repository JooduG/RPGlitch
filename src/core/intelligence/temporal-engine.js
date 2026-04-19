/**
 * @file src/core/intelligence/temporal-engine.js
 * @description The RPGlitch Temporal Engine (v1).
 * Consolidates Past (Historical Anchors) and Future (Active Impulses) into a unified temporal continuum.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⏳ THE TEMPORAL FABRIC
 * ─────────────────────────────────────────────────────────────────────────────
 * This engine manages "Temporal Log Entries" (Vectors).
 * - Past (Anchors)  : Backstory, Traumas, Education, Session Memories.
 * - Future (Impulses): Prophecies, Curses, Dreams, Impending Doom, Plans.
 */

import { CONFIG } from "../engine/config.js";
import { dynamics_engine } from "./dynamics-engine.js";
import { llm_service } from "./llm-service.js";
import { prompt_builder } from "./prompt-builder.js";
import { simulation_log as log_store } from "@state/simulation-log.svelte.js";

/**
 * 🧩 TEMPORAL LOG ENTRY (Vector Schema)
 * {
 *   id: uuid,
 *   timestamp: number,
 *   text: string,          // The narrative payload (The Summary or The Intent)
 *   type: string,          // "past" | "future"
 *   base_weight: number,    // 1-10 gravity (Trauma=10, Prophecy=9, Minor Plan=3)
 *   dynamics_tags: obj[],   // Physical/Psych Triggers [{id, word}]
 *   vector_tags: string[],  // Semantic Labels (Trauma, Curse, etc.)
 *   meta: object            // For resolution status, etc.
 * }
 */

/**
 * Creates a rich Temporal Log Entry (Vector).
 *
 * @param {string} text - The narrative payload.
 * @param {string} [type="future"] - "past" | "future".
 * @param {number} [weight=5] - 1-10 priority.
 * @returns {Object} A strict Temporal Vector.
 */
export function create(text, type = "future", weight = 5) {
  const reflexes = dynamics_engine.dynamics_scan(text);
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    text,
    type,
    base_weight: weight,
    dynamics_tags: reflexes.map((r) => ({ id: r.id, word: r.scan })),
    vector_tags: [],
    meta: {},
  };
}

/**
 * RAG Scoring: Ranks a list of vectors based on relevance and base weight.
 * Symmetric logic for both past and future.
 */
export function score(vectors, input) {
  if (!Array.isArray(vectors) || !vectors.length) return [];
  if (!input) return [...vectors].sort((a, b) => b.timestamp - a.timestamp);

  const active_reflexes = dynamics_engine.dynamics_scan(input);
  const active_ids = new Set();
  const active_words = new Set();

  for (const r of active_reflexes) {
    active_ids.add(r.id);
    if (r.scan) active_words.add(r.scan.toLowerCase());
  }

  const input_lower = input.toLowerCase();

  const scored = vectors.map((v) => {
    // Start with the base weight (narrative gravity)
    let relevance = v.base_weight ?? v.emotional_weight ?? 5;

    v.dynamics_tags?.forEach((tag) => {
      const tag_id = typeof tag === "string" ? tag : tag.id;
      const tag_word = typeof tag === "string" ? null : tag.word?.toLowerCase();

      if (active_ids.has(tag_id)) {
        relevance += CONFIG.DYNAMICS.RELEVANCE_DYNAMICS_BONUS;
      }
      if (tag_word && active_words.has(tag_word)) {
        relevance += CONFIG.DYNAMICS.RELEVANCE_TRIGGER_BONUS;
      }
    });

    v.vector_tags?.forEach((t) => {
      if (input_lower.includes(t.toLowerCase())) {
        relevance += CONFIG.DYNAMICS.RELEVANCE_VECTOR_BONUS;
      }
    });

    return { ...v, _relevance: relevance };
  });

  return scored.sort((a, b) => {
    const diff = b._relevance - a._relevance;
    if (diff !== 0) return diff;
    return b.timestamp - a.timestamp;
  });
}

/**
 * Unified Generator for Prompt formatting.
 */
export function format(vectors, input, options = {}) {
  const mode = options.mode || "past";
  const limit = options.limit || 3;
  const show_text = options.vector_text ?? true;
  const show_label = options.vector_label ?? true;

  const offset = options.offset || 0;
  const ranked = score(vectors, input).slice(offset, offset + limit);
  // Maintain reverse-chrono order in the prompt (oldest to newest)
  const sorted = [...ranked].reverse();

  return sorted
    .map((v) => {
      const weight = v.base_weight ?? v.emotional_weight ?? 5;
      let label;

      if (mode === "past") {
        if (weight >= 10) label = "CORE_ANCHOR";
        else if (weight >= 8) label = "MAJOR_ANCHOR";
        else if (weight >= 7) label = "ANCHOR";
        else label = "MINOR_ANCHOR";
      } else {
        if (weight >= 10) label = "PIVOTAL_IMPULSE";
        else if (weight >= 8) label = "MAJOR_IMPULSE";
        else if (weight >= 7) label = "IMPULSE";
        else label = "ACTIVE_IMPULSE";
      }

      if (show_label && show_text) return `[${label}]: ${v.text}`;
      if (show_label) return label;
      if (show_text) return v.text;
      return "";
    })
    .join("\n");
}

/**
 * Transitions an Active Impulse (Future) into a Historical Anchor (Past).
 */
export function resolve(entity, vector_id, resolution = null) {
  if (!Array.isArray(entity.future)) return;
  const index = entity.future.findIndex((v) => v.id === vector_id);
  if (index === -1) return;

  const [vector] = entity.future.splice(index, 1);
  vector.type = "past";
  vector.timestamp = Date.now();

  if (resolution) {
    if (!vector.vector_tags) vector.vector_tags = [];
    vector.vector_tags.push(`RESOLUTION:${resolution.toUpperCase()}`);
    // Optionally update text if resolution brings new clarity
    // vector.text = `[Fulfilled] ${vector.text}`;
  }

  if (!Array.isArray(entity.past)) entity.past = [];
  entity.past.push(vector);
}

/**
 * Generates a Resonance record (Historical Anchor) from a slice of history.
 */
export async function weave_resonance(target_entity, history_slice, role = "character") {
  if (!target_entity) return null;
  try {
    const payload = prompt_builder.build_memory_prompt(role, target_entity, history_slice);
    const response = await llm_service.generate(payload, {
      json: true,
      silent: true,
      raw: true,
    });

    let raw_text = "";
    if (typeof response === "string") {
      raw_text = response.trim();
    } else if (response && typeof response === "object") {
      const r = /** @type {any} */ (response);
      raw_text = String(r.generatedText ?? r.text ?? "").trim();
    }

    const stripped = raw_text.replace(/```json\n?|```/g, "").trim();
    // Robust JSON extraction for potentially nested structures
    const object_match = stripped.match(/\{[\s\S]*?\}/);
    if (!object_match) return null;

    const resonance = JSON.parse(object_match[0]);
    if (!resonance || !resonance.summary?.trim()) return null;

    // Scan reflex tagging for the new memory
    const triggered_reflexes = dynamics_engine.dynamics_scan(resonance.summary);

    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      text: resonance.summary,
      type: "past",
      base_weight: 5, // Default for recent session memories
      dynamics_tags: triggered_reflexes.map((r) => ({ id: r.id, word: r.scan })),
      vector_tags: resonance.vector_tags || resonance.tags || [],
      meta: {},
    };
  } catch (err) {
    console.error("[TemporalEngine] Resonance weave failed.", err);
    return null;
  }
}

export const temporal_engine = {
  create,
  score,
  format,
  resolve,
  weave_resonance,
  _is_weaving: false,

  /**
   * BATCH CONSOLIDATION (The Weaving Cycle)
   * Evicts old messages and weaves them into the Temporal Fabric.
   */
  consolidate: async (Session, db, entities, runtime, app, simulation_log) => {
    if (temporal_engine._is_weaving) return;
    temporal_engine._is_weaving = true;

    try {
      const story_id = Session.require_active();
      const messages = await Session.load_log(story_id);
      const unconsolidated = messages.filter((m) => !m.meta?.consolidated);

      if (unconsolidated.length >= 12) {
        const slice = unconsolidated.slice(0, 10);
        app.log(`Temporal: Weaving ${slice.length} turns into the Historical Fabric...`, "system");

        const ai = runtime.active_ai;
        if (ai) {
          const resonance = await weave_resonance(ai, slice, "character");
          if (resonance) {
            if (!Array.isArray(ai.past)) ai.past = [];
            ai.past.push(resonance);
            await entities.upsert("character", ai);
          }
        }

        for (const msg of slice) {
          msg.meta = { ...msg.meta, consolidated: true };
          await db.simulation_log.update(msg.id, { meta: msg.meta });
        }
        log_store?.refresh();
      }
    } catch (err) {
      console.error("[TemporalEngine] Consolidation weave failed:", err);
    } finally {
      temporal_engine._is_weaving = false;
    }
  },

  /**
   * ⚙️ ENSURE MOMENTUM
   */
  ensure_momentum: (runtime, app) => {
    const fractal = runtime.active_fractal;
    if (fractal && (!Array.isArray(fractal.future) || fractal.future.length === 0)) {
      runtime.add_vector("Continue the journey.", "FRACTAL", true);
      app?.log("temporal_engine: Seeded momentum impulse", "system");
    }
  },
};
