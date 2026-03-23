/**
 * @file src/core/intelligence/vector-engine.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🧠 VECTOR ENGINE  —  The Temporal Memory Controller
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * vector_engine manages the "Temporal Architecture" of entities. It handles
 * the creation, retrieval (RAG), and formatting of Past Vectors and
 * Future Vectors. It is responsible for making the AI "remember" what
 * matters most in the current context.
 *
 * DATA SCHEMA
 * Every vector follows a strict schema:
 * {
 *   id: uuid,
 *   timestamp: number,
 *   text: string (raw content),
 *   emotional_weight: number (Weights=1-10, set at write time),
 *   dynamics_tags: string[] (derived from dynamics_engine),
 *   vector_tags: string[] (manual/system tags),
 * }
 *
 * ARCHITECTURE
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  create_vector()  : Factory. Turns raw text into enriched metadata.    │
 * │  score_vectors()   : The RAG Brain. Ranks memory by Axis relevance.    │
 * │  format_past/fut() : The Pipe. Turns ranked data into Prompt strings.  │
 * └────────────────────────────────────────────────────────────────────────┘
 */

import { CONFIG } from "../engine/config.js";
import { dynamics_engine } from "./dynamics-engine.js";

/************************************************************************************
 * 🧩 [SECTION: VECTOR SOVEREIGNTY]
 * ----------------------------------------------------------------------------------
 * Canonical metadata and taxonomy for all Temporal Vectors.
 ************************************************************************************/

/**
 * THE VECTOR TEMPLATE
 * Defining the strict shape of a Vector object (The Blueprint).
 */
export const VECTOR_TEMPLATE = {
  id: "uuid",
  label: "",
  timestamp: "number (ms)",
  text: "string (raw content)",
  emotional_weight: "number (1-10)",
  dynamics_tags: "Array<{id, word}> (Physical/psychological triggers)",
  vector_tags: "string[] (Semantic/narrative keywords)",
};

/************************************************************************************
 * 🧩 [SECTION: THE FORGE — Vector Creation]
 * ----------------------------------------------------------------------------------
 * Logic for synthesizing raw data into structured memory vectors.
 ************************************************************************************/

/**
 * Creates a strict, metadata-rich vector object.
 *
 * @param {string} text - Raw content (past) or intent (future).
 * @returns {Object} A strict Vector object.
 */
export function create_vector(text) {
  const reflexes = dynamics_engine.dynamics_scan(text);
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    label: "",
    text,
    emotional_weight: 5,
    dynamics_tags: reflexes.map((r) => ({ id: r.id, word: r.scan })),
    vector_tags: [],
  };
}

/************************************************************************************
 * 🧩 [SECTION: THE BRAIN — RAG Retrieval & Scoring]
 * ----------------------------------------------------------------------------------
 * Ranks a list of vectors based on their relevance to the current input.
 ************************************************************************************/

/**
 * RAG Scoring: Prioritizes thematic alignment over keyword matching.
 */
export function score_vectors(vectors, input) {
  if (!Array.isArray(vectors) || !vectors.length) return [];
  if (!input) return vectors.slice(-3); // No input? Just give the 3 newest memories

  const active_reflexes = dynamics_engine.dynamics_scan(input);
  const active_ids = new Set();
  const active_words = new Set();

  for (const r of active_reflexes) {
    active_ids.add(r.id);
    if (r.scan) {
      active_words.add(r.scan.toLowerCase());
    }
  }

  const input_lower = input.toLowerCase();

  const scored = vectors.map((v) => {
    let relevance = v.emotional_weight ?? 5;

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

/************************************************************************************
 * 🧩 [SECTION: THE PIPE — Prompt Formatting]
 * ----------------------------------------------------------------------------------
 * Transforms data objects into formatted text blocks for AI delivery.
 ************************************************************************************/

/**
 * Renders the most relevant past memories (Past Vectors).
 */
export function format_past(
  vectors,
  input,
  limit = 3,
  offset = 0,
  options = { vector_text: true, vector_label: true },
) {
  const show_text = options.vector_text ?? true;
  const show_label = options.vector_label ?? true;
  const ranked = score_vectors(vectors, input).slice(offset, offset + limit);
  const reversed = [...ranked].reverse();

  return reversed
    .map((v) => {
      const weight = v.emotional_weight ?? 5;
      const label =
        weight >= 10
          ? "CORE_VECTOR"
          : weight >= 8
            ? "MAJOR_VECTOR"
            : weight >= 7
              ? "VECTOR"
              : "VECTOR_ECHO";

      if (show_label && show_text) return `[${label}]: ${v.text}`;
      if (show_label) return label;
      if (show_text) return v.text;
      return "";
    })
    .join("\n");
}

/**
 * Renders the most relevant future vectors.
 */
export function format_future(
  vectors,
  input,
  limit = 3,
  offset = 0,
  options = { vector_text: true, vector_label: true },
) {
  const show_text = options.vector_text ?? true;
  const show_label = options.vector_label ?? true;
  const ranked = score_vectors(vectors, input).slice(offset, offset + limit);
  const reversed = [...ranked].reverse();

  return reversed
    .map((v) => {
      const weight = v.emotional_weight ?? 5;
      let label;
      if (weight >= 10) label = "PIVOTAL_VECTOR";
      else if (weight >= 8) label = "MAJOR_VECTOR";
      else if (weight >= 7) label = "VECTOR";
      else label = "VECTOR_IMPULSE";

      if (show_label && show_text) return `[${label}]: ${v.text}`;
      if (show_label) return label;
      if (show_text) return v.text;
      return "";
    })
    .join("\n");
}

/**
 * Moves a future vector to the past log, optionally with a resolution tag.
 */
export function resolve_vector(entity, vector_id, resolution = null) {
  if (!Array.isArray(entity.future)) return;
  const index = entity.future.findIndex((v) => v.id === vector_id);
  if (index === -1) return;
  const [vector] = entity.future.splice(index, 1);

  if (resolution) {
    if (!vector.vector_tags) vector.vector_tags = [];
    vector.vector_tags.push(`RESOLUTION:${resolution.toUpperCase()}`);
  }

  vector.timestamp = Date.now();
  if (!Array.isArray(entity.past)) entity.past = [];
  entity.past.push(vector);
}

export const vector_engine = {
  create_vector,
  score_vectors,
  format_past,
  format_future,
  resolve_vector,

  /**
   * ⚙️ ENSURE MOMENTUM (Simulation Physics)
   */
  ensure_momentum: (runtime, app) => {
    const fractal = runtime.active_fractal;
    if (fractal && (!Array.isArray(fractal.future) || fractal.future.length === 0)) {
      runtime.add_vector("Continue the journey.", "FRACTAL", true);
      app?.log("vector_engine: Auto-seeded active_vector", "system");
    }
  },
};
