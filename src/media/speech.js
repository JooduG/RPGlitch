/**
 * @file src/media/speech.js
 * 🎙️ SENSORY CORTEX — SPEECH PIPELINE & SPEAKER ATTRIBUTION
 *
 * Core Responsibilities:
 * 1. Role Normalization (`normalize_role`):
 *    - Maps raw entity roles (`AI_CHARACTER`, `USER_PERSONA`, `FRACTAL`, `npc`) to internal keys.
 * 2. Kokoro Voice Catalog & Resolvers:
 *    - Comprehensive dictionary of 28 Male & Female ONNX vocal models (`KOKORO_VOICES`).
 *    - Symmetrical cadence rate offsets based on entity velocity/intensity (`get_cadence_rate`).
 * 3. Speech Parsing & Typographic Emphasis:
 *    - Quote-aware atomic sentence segmentation (`split_speech_sentences`).
 *    - Typographic emphasis styling for bold, italics, ALL-CAPS (`extract_styled_segments`).
 * 4. Multi-Speaker Dialogue Attribution:
 *    - Binds quoted dialogue chunks to active character/roster profiles using verb attribution (`split_speech_by_speaker`).
 *
 * Purity: 100% pure functions & frozen tables. Zero Svelte runes, zero DOM mutations, zero async side effects.
 */

// ============================================================================
// [SECTION 1: CONSTANTS & KOKORO VOICE CATALOG]
// ============================================================================

/**
 * Kokoro-82M neural voice catalog (alphabetically sorted by name within gender groups).
 * @type {ReadonlyArray<{ uri: string, name: string }>}
 */
export const KOKORO_VOICES = Object.freeze([
  // Male Voices (American & British)
  { uri: "am_eric", name: "Animated Sidekick" },
  { uri: "bm_lewis", name: "Aristocratic Benefactor" },
  { uri: "am_adam", name: "Cinematic Narrator" },
  { uri: "am_fenrir", name: "Cyber Handler" },
  { uri: "am_liam", name: "Everyday Companion" },
  { uri: "am_puck", name: "Gentle Devotee" },
  { uri: "am_michael", name: "Grizzled Veteran" },
  { uri: "am_echo", name: "Late-Night Host" },
  { uri: "am_onyx", name: "Low-Resonance Shadow" },
  { uri: "bm_fable", name: "Modern Presenter" },
  { uri: "bm_george", name: "Refined Scholar" },
  { uri: "bm_daniel", name: "Seasoned Veteran" },
  { uri: "am_santa", name: "Theatrical Showman" },

  // Female Voices (American & British)
  { uri: "af_aoede", name: "Bardic Muse" },
  { uri: "af_kore", name: "Celestial Oracle" },
  { uri: "af_alloy", name: "Cyber Interface" },
  { uri: "af_nova", name: "Energetic Spark" },
  { uri: "af_sky", name: "Ethereal Wanderer" },
  { uri: "af_river", name: "Frontier Wanderer" },
  { uri: "bf_lily", name: "Gentle Seraph" },
  { uri: "af_sarah", name: "Guild Sovereign" },
  { uri: "af_bella", name: "Imperial Leader" },
  { uri: "bf_alice", name: "Refined Aristocrat" },
  { uri: "bf_isabella", name: "Royal Matriarch" },
  { uri: "bf_emma", name: "Scholarly Duchess" },
  { uri: "af_jessica", name: "Tactical Sentinel" },
  { uri: "af_nicole", name: "Velvet Whisper" },
  { uri: "af_heart", name: "Warm Anchor" },
]);

/**
 * Standard cadence rates by identifier.
 * @type {Readonly<Record<string, number>>}
 */
export const CADENCE_RATES = Object.freeze({
  drawl: 0.85,
  measured: 0.95,
  standard: 1.0,
  brisk: 1.1,
  rapid: 1.2,
});

/**
 * 5 Symmetrical voice cadences (Standard centered at 1.0).
 * @type {ReadonlyArray<{ id: string, label: string, rate: number }>}
 */
export const VOICE_CADENCES = Object.freeze([
  { id: "drawl", label: "Drawl", rate: 0.85 },
  { id: "measured", label: "Measured", rate: 0.95 },
  { id: "standard", label: "Standard", rate: 1.0 },
  { id: "brisk", label: "Brisk", rate: 1.1 },
  { id: "rapid", label: "Rapid", rate: 1.2 },
]);

/**
 * Canonical dialogue attribution verbs for speaker assignment.
 */
const DIALOGUE_VERBS =
  "said|says|whispered|muttered|murmured|snapped|hissed|growled|shouted|called|cried|asked|replied|answered|echoed|noted|mused|added|quipped|scoffed|declared|observed|reminded|teased|ventured|began|concluded|insisted|offered|pressed|wondered|sighed|chuckled|laughed|soothed|warned";

// ============================================================================
// [SECTION 2: ROLE & VOICE RESOLUTION HELPERS]
// ============================================================================

/**
 * Normalizes input entity role names to internal keys: "ai", "user", "fractal", "npc".
 * When options.preserve_npc is true, keeps 'npc' and 'fractal' distinct for streaming voice resolution;
 * otherwise, maps them to the unified AI toggle key.
 * @param {string | null} role
 * @param {{ preserve_npc?: boolean }} [options]
 * @returns {"ai" | "user" | "fractal" | "npc" | null}
 */
export function normalize_role(role, options = {}) {
  if (!role) return null;
  const str = String(role).trim().toLowerCase();
  if (str === "system") return null;
  if (str.includes("user")) return "user";
  if (str.includes("npc")) return options.preserve_npc ? "npc" : "ai";
  if (str.includes("fractal")) return options.preserve_npc ? "fractal" : "ai";
  if (str.includes("ai") || str.includes("character") || str === "model") return "ai";
  return null;
}

/**
 * Resolves a Kokoro voice URI from a voice name or URI string.
 * @param {string | null | undefined} name_or_uri
 * @returns {string} Voice URI (defaults to 'am_adam')
 */
export function resolve_voice_uri(name_or_uri) {
  if (!name_or_uri) return "am_adam";
  const str = String(name_or_uri).trim().toLowerCase();
  const found = KOKORO_VOICES.find((v) => v.name.toLowerCase() === str || v.uri.toLowerCase() === str);
  return found ? found.uri : "am_adam";
}

/**
 * Resolves a human-readable Kokoro voice name from a voice name or URI string.
 * @param {string | null | undefined} name_or_uri
 * @returns {string} Voice display name (defaults to 'Cinematic Narrator')
 */
export function resolve_voice_name(name_or_uri) {
  if (!name_or_uri) return "Cinematic Narrator";
  const str = String(name_or_uri).trim().toLowerCase();
  const found = KOKORO_VOICES.find((v) => v.name.toLowerCase() === str || v.uri.toLowerCase() === str);
  return found ? found.name : "Cinematic Narrator";
}

/**
 * Calculates effective playback rate with a linear ±5% offset anchored to dynamics value 50.
 * @param {string} cadence
 * @param {number} [dynamics_val=50]
 * @returns {number} Effective playback rate
 */
export function get_cadence_rate(cadence, dynamics_val = 50) {
  const base_rate = CADENCE_RATES[cadence] || 1.0;
  if (dynamics_val === undefined || dynamics_val === null || isNaN(Number(dynamics_val))) {
    return base_rate;
  }
  const clean_dyn = Math.max(0, Math.min(100, Number(dynamics_val)));
  const offset = (clean_dyn - 50) * 0.001;
  return Math.max(0.5, Math.min(2.0, base_rate + offset));
}

// ============================================================================
// [SECTION 3: SPEECH SEGMENTATION & TYPOGRAPHIC STYLING]
// ============================================================================

/**
 * Checks if a character is an alphanumeric word character.
 * @param {string} char
 * @returns {boolean}
 */
function is_word_char(char) {
  return /[A-Za-z0-9]/.test(char);
}

/**
 * Extracts typographic segments from prose (*italics*, **bold**, ALL-CAPS).
 * @param {string} text
 * @returns {Array<{ text: string, style: "normal" | "italics" | "bold" | "all_caps", volume_db: number, rate_scale: number }>}
 */
export function extract_styled_segments(text) {
  if (!text) return [];
  const segments = [];
  const regex = /(\*\*(.*?)\*\*|\*(.*?)\*|([^*]+))/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    let content;
    let style = "normal";
    let volume_db = 0;
    let rate_scale = 1.0;

    if (match[2] !== undefined) {
      content = match[2].trim();
      style = "bold";
      volume_db = 3;
      rate_scale = 1.05;
    } else if (match[3] !== undefined) {
      content = match[3].trim();
      style = "italics";
      volume_db = -2;
      rate_scale = 0.95;
    } else {
      content = match[4].trim();
      const letters = content.replace(/[^A-Za-z]/g, "");
      if (letters.length >= 2 && letters === letters.toUpperCase()) {
        style = "all_caps";
        volume_db = 2;
        rate_scale = 1.05;
      }
    }

    if (content) {
      segments.push({ text: content, style, volume_db, rate_scale });
    }
  }
  return segments;
}

/**
 * Splits prose into sentences, treating quoted spans as atomic units.
 * @param {string} text
 * @returns {{ sentences: string[], committed: number, tail: string, segments: Array<{ text: string, style: string, volume_db: number, rate_scale: number }> }}
 */
export function split_speech_sentences(text) {
  const sentences = [];
  let buffer = "";
  let active_quote_delimiter = null;
  let committed = 0;
  const complete_end = /[.!?\u2026]["'\u201d\u2019]*$/;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const prev_char = i > 0 ? text[i - 1] : " ";
    const next_char = i < text.length - 1 ? text[i + 1] : " ";
    buffer += char;

    if (active_quote_delimiter === null) {
      if (char === '"' || char === "\u201c" || char === "\u201e") {
        active_quote_delimiter = '"';
      } else if ((char === "'" || char === "\u2018" || char === "\u201a") && !is_word_char(prev_char) && is_word_char(next_char)) {
        active_quote_delimiter = "'";
      }
    } else if (active_quote_delimiter === '"') {
      if (char === '"' || char === "\u201d") active_quote_delimiter = null;
    } else if (active_quote_delimiter === "'") {
      if ((char === "'" || char === "\u2019") && is_word_char(prev_char) && !is_word_char(next_char)) active_quote_delimiter = null;
    }

    const is_terminal_char =
      active_quote_delimiter === null && (/[.!?\u2026]/.test(char) || char === '"' || char === "'" || char === "\u201d" || char === "\u2019");
    if (is_terminal_char) {
      const trimmed = buffer.trim();
      if (complete_end.test(trimmed)) {
        const rest = text.slice(i + 1);
        const next_nonspace = /^\s*(\S)/.exec(rest);
        const is_attribution_follow =
          char === '"' || char === "'" || char === "\u201d" || char === "\u2019" ? Boolean(next_nonspace && /^[a-z]/.test(next_nonspace[1])) : false;
        if (!is_attribution_follow && (rest.length === 0 || /^\s/.test(rest))) {
          sentences.push(trimmed);
          committed = i + 1;
          buffer = "";
        }
      }
    }
  }

  const segments = extract_styled_segments(text);
  return { sentences, committed, tail: text.slice(committed).trim(), segments };
}

// ============================================================================
// [SECTION 4: MULTI-SPEAKER DIALOGUE ATTRIBUTION]
// ============================================================================

/**
 * Infers a Kokoro voice id for a single speech chunk by matching dialogue attribution.
 * @param {string} chunk
 * @param {Array<{ name?: string, voice_id?: string, is_narrator?: boolean }>} [roster=[]]
 * @param {string} [narrator_voice=""]
 * @param {string} [default_voice="am_adam"]
 * @returns {string}
 */
export function infer_voice_for_chunk(chunk, roster = [], narrator_voice = "", default_voice = "am_adam") {
  if (!chunk) return default_voice;
  const text = String(chunk).trim();
  const has_quote = /["'“”‘’]/.test(text);
  const trailing = new RegExp(`\\b(${DIALOGUE_VERBS})\\s+([A-Za-z][A-Za-z' -]{1,40})[.,!?\u2026]*$`).exec(text);
  const leading = new RegExp(`^([A-Za-z][A-Za-z' -]{1,40})(?:\\s+(?:${DIALOGUE_VERBS})\\s*|:\\s*)`).exec(text);
  const name = trailing ? trailing[2] : leading ? leading[1] : "";

  if (name) {
    const norm = name
      .replace(/[^A-Za-z' -]/g, "")
      .trim()
      .toLowerCase();
    const match = (roster || []).find((r) => r.name && r.name.toLowerCase() === norm);
    if (match?.voice_id) return match.voice_id;
  }

  if (!has_quote) {
    const narrator = (roster || []).find(
      (r) =>
        r.is_narrator ||
        /^bm_/.test(String(r.voice_id || "")) ||
        String(r.name || "")
          .toLowerCase()
          .includes("narrator"),
    );
    if (narrator?.voice_id) return narrator.voice_id;
    if (narrator_voice) return narrator_voice;
  }

  return default_voice;
}

/**
 * Segments streaming prose by speaker attribution and assigns voice IDs per sentence.
 * @param {string} text
 * @param {Array<{ name?: string, voice_id?: string, is_narrator?: boolean }>} [active_roster=[]]
 * @param {{ narrator_voice?: string, default_voice?: string }} [options={}]
 * @returns {Array<{ text: string, voice_id: string }>}
 */
export function split_speech_by_speaker(text, active_roster = [], options = {}) {
  if (!text) return [];
  const roster = (Array.isArray(active_roster) ? active_roster : []).filter((r) => r && (r.name || r.voice_id));
  const { sentences } = split_speech_sentences(String(text));
  return (sentences || [])
    .map((s) => String(s).trim())
    .filter(Boolean)
    .map((s) => ({
      text: s,
      voice_id: infer_voice_for_chunk(s, roster, options.narrator_voice || "", options.default_voice || "am_adam"),
    }));
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Renamed voice.js -> speech.js to accurately encapsulate speech processing,
 *   speaker attribution, and typographic sentence analysis.
 * - 2026-08-29: Applied ground-up /refactor protocol: added Universal File Architecture header block,
 *   structured 4 explicit section dividers, froze constant tables (KOKORO_VOICES, CADENCE_RATES, VOICE_CADENCES),
 *   added comprehensive JSDoc annotations, and verified 100% test pass.
 * - 2026-08-29: Enhanced normalize_role with options.preserve_npc support.
 * - 2026-08-28: Initialized Kokoro-82M voice catalog and speaker attribution parsers.
 */
