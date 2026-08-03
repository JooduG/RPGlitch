/**
 * src/data/content-normaliser.js
 * 🧪 CONTENT NORMALISATION LOGIC
 * Enforces the strict "Twin-Cylinder" data structure across the app.
 * ZERO BACKWARDS COMPATIBILITY.
 */
import { pick_random } from "@utils";
import { Security } from "@platform";

const sanitize_html = (/** @type {any} */ val) => Security.sanitize(val);

/**
 * Valid signature color keys.
 * This is the canonical list for data-layer validation. The media layer's
 * SIGNATURE_COLORS is derived from the same PALETTE and must stay in sync.
 * Kept locally to avoid a forbidden data→media import.
 */
const _signature_colors = [
  "Adrenaline Pink",
  "Crimson Red",
  "Deep Indigo",
  "Electric Cyan",
  "Emerald Green",
  "Forest Green",
  "Lemon Yellow",
  "Proud Purple",
  "Pumpkin Amber",
  "Rusty Orange",
  "Scientific Teal",
  "Soft Rose",
  "Space Blue",
  "Toxic Green",
  "Twilight Violet",
];

/**
 * 🐣 ENTITY TEMPLATES
 * Defines the initial structure for new entities born in the Library.
 * Fields are empty strings so that UI 'placeholder' attributes can work correctly.
 */
export const ENTITY_TEMPLATES = {
  character: {
    name: "New Character",
    type: "character",
    description: "",
    dynamics: {
      chaos: 50,
      intensity: 50,
      openness: 50,
      affinity: 50,
    },
    eternal: { physical: "", non_physical: "" },
    present: { physical: "", non_physical: "" },
    modifiers: {
      prompt: "",
      negative_prompt: "",
      no_background: false,
      flipped: false,
      profile_picture_seed: 0,
      last_generated_seed: null,
    },
    vectors: [],
    visual_style: "none",
    pov: "1st_person",
    voice_register: "",
  },
  fractal: {
    name: "New Fractal",
    type: "fractal",
    description: "",
    dynamics: {
      velocity: 50,
      entropy: 50,
    },
    eternal: { physical: "", non_physical: "" },
    present: { physical: "", non_physical: "" },
    vectors: [],
    narrative_style: "",
    visual_style: "none",
    pov: "3rd_person",
    voice_register: "",
  },
};

/**
 * Utility to safely access the palette for a random signature key.
 */
export const get_random_signature_key = () => {
  return pick_random(_signature_colors);
};

/**
 * Main Normalizer
 * Enforces structural integrity and sanitization.
 * @param {any} base
 */
export const normalize = (base = {}) => {
  const {
    id,
    created_at,
    createdAt,
    updated_at,
    updatedAt,
    originId,
    dynamicsBaseline,
    name = "",
    description = "",
    type = "character",
    eternal = {},
    present = {},
    vectors = [],
    tags = [],
    signature_color = "",
    profile_picture = "",
    dynamics = null,
    modifiers = {},
    visuals = null, // [BACKWARD COMPAT] Legacy object
    voice = {},
    custom_data = {},
    narrative_style = "",
    visual_style = "",
    pov = "",
    voice_register = "",
    voiceRegister = "",
  } = base;

  const norm_origin_id = originId ?? null;
  const norm_dynamics_baseline = dynamicsBaseline instanceof Object ? { ...dynamicsBaseline } : null;

  const result = {
    // --- CORE METADATA ---
    id: id ?? "",
    created_at: created_at ?? createdAt ?? 0,
    updated_at: updated_at ?? updatedAt ?? 0,
    originId: norm_origin_id,
    dynamicsBaseline: norm_dynamics_baseline,

    name: (() => {
      const clean = sanitize_html(name)
        .replace(/[\r\n]+/g, " ")
        .trim();
      return clean.length > 80 ? clean.slice(0, 80).trim() : clean;
    })(),
    description: sanitize_html(description).trim(),
    type: type,
    signature_color: (() => {
      const parsed = sanitize_html(String(signature_color)).trim();
      return _signature_colors.includes(parsed) ? parsed : get_random_signature_key();
    })(),
    profile_picture: sanitize_html(String(profile_picture)).trim(),
    narrative_style: sanitize_html(String(narrative_style)).trim(),
    visual_style: (() => {
      const parsed = sanitize_html(String(visual_style)).trim();
      if (parsed && parsed !== "default") return parsed;
      return "none";
    })(),
    pov: (() => {
      const parsed = sanitize_html(String(pov)).trim();
      if (parsed === "1st_person" || parsed === "3rd_person") return parsed;
      return type === "fractal" ? "3rd_person" : "1st_person";
    })(),
    voice_register: (() => {
      const parsed = sanitize_html(String(voice_register || voiceRegister || "")).trim();
      return parsed === "plain" || parsed === "ornate" || parsed === "raw" || parsed === "clinical" ? parsed : "";
    })(),
    tags: (Array.isArray(tags) ? tags : []).map((s) => (s != null ? sanitize_html(String(s).trim()) : "")).filter(Boolean),

    // --- TEMPORAL HYBRID 6 (PURGED: appearance, identity, outfit, status) ---
    eternal: {
      physical: sanitize_html(eternal?.physical ?? "").trim(),
      non_physical: sanitize_html(eternal?.non_physical ?? "").trim(),
    },
    present: {
      physical: sanitize_html(present?.physical ?? "").trim(),
      non_physical: sanitize_html(present?.non_physical ?? "").trim(),
    },
    vectors: coerce_temporal_vectors(vectors),

    // --- MODIFIERS (Visual/Aesthetic overrides) ---
    modifiers: {
      prompt: sanitize_html(modifiers?.prompt ?? visuals?.prompt ?? "").trim(),
      negative_prompt: sanitize_html(modifiers?.negative_prompt ?? "").trim(),
      no_background: !!(modifiers?.no_background ?? modifiers?.noBackground ?? visuals?.noBackground ?? visuals?.no_background ?? false),
      flipped: !!(modifiers?.flipped ?? visuals?.flipped ?? false),
      profile_picture_seed: Number(modifiers?.profile_picture_seed ?? visuals?.profile_picture_seed ?? 0),
      last_generated_seed: modifiers?.last_generated_seed ?? visuals?.last_generated_seed ?? null,
    },

    // --- DYNAMICS (Physics Sliders) ---
    dynamics: (() => {
      if (dynamics && Object.keys(dynamics).length > 0) return { ...dynamics };
      // Seed from type-template on birth
      const template = /** @type {any} */ (ENTITY_TEMPLATES)[type];
      return template?.dynamics ? { ...template.dynamics } : {};
    })(),

    // --- VOICE ---
    voice: {
      uri: voice?.uri || "",
      rate: voice?.rate || 1.0,
    },

    // --- INTERNAL ---
    custom_data: custom_data || {},
  };

  return result;
};

/**
 * Coerces a value into a strictly cleaned array of strings.
 * Used for 'past' and 'future' temporal hybrid fields.
 * @param {any} val
 * @returns {string[]}
 */
export function coerce_temporal_array(val) {
  if (Array.isArray(val)) return val;
  if (typeof val !== "string") return [];
  return val
    .split("\n")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

/**
 * Coerces raw temporal data (strings or objects) into proper TemporalVector-shaped objects.
 * Strings are wrapped into canonical vector objects. Objects are normalized in place:
 * content is read from `content`/`directive`/`text` (legacy lenient read) but the canonical
 * key is always `content`; `directive` is dropped. `type` is either "future" or "past".
 * @param {any} val
 * @returns {any[]}
 */
export function coerce_temporal_vectors(val) {
  if (!Array.isArray(val)) return [];
  return val
    .map((item) => {
      if (item && typeof item === "object") {
        const text = String(item.content ?? item.directive ?? item.text ?? "").trim();
        if (!text) return null;
        return {
          id: item.id ?? crypto.randomUUID(),
          timestamp: item.timestamp ?? 0,
          content: text,
          type: item.type === "future" ? "future" : "past",
          emotional_weight: typeof item.emotional_weight === "number" ? item.emotional_weight : 5,
          meta: item.meta && typeof item.meta === "object" ? item.meta : {},
          tags: Array.isArray(item.tags) ? item.tags : undefined,
        };
      }
      const text = typeof item === "string" ? item.trim() : "";
      if (!text) return null;
      return {
        id: crypto.randomUUID(),
        timestamp: 0,
        content: text,
        type: "past",
        emotional_weight: 5,
        meta: {},
      };
    })
    .filter(Boolean);
}

/**
 * 🏘️ THE FACTORY
 * Creates a brand new, fully normalized entity with a RANDOM signature color.
 * @param {string} type
 * @param {any} overrides
 */
export const create_new = (type = "character", overrides = {}) => {
  const template = /** @type {any} */ (ENTITY_TEMPLATES)[type] || ENTITY_TEMPLATES.character;
  const new_entity = {
    ...template,
    ...overrides,
    signature_color: get_random_signature_key(), // Random color on birth
    created_at: Date.now(),
    updated_at: Date.now(),
    id: crypto.randomUUID(),
  };
  return normalize(new_entity);
};

/**
 * Formats a premade entity for storage injection.
 * @param {any} entity
 * @param {string} type
 */
export const format_premade = (entity, type) => {
  return {
    ...normalize(entity),
    type: type,
    updated_at: 0,
  };
};

/**
 * Normalizes an imported payload (JSON file / card / array) supporting dual entity extraction.
 * Extracts both Character and Fractal entities if present or if a single card contains both character and scene context.
 * @param {any} payload
 * @returns {{ characters: any[], fractals: any[] }}
 */
export function normalize_import_payload(payload) {
  const characters = [];
  const fractals = [];

  if (!payload || typeof payload !== "object") {
    return { characters, fractals };
  }

  // Handle container object with explicit arrays
  if (Array.isArray(payload.characters) || Array.isArray(payload.entities) || Array.isArray(payload.fractals)) {
    const chars = Array.isArray(payload.characters) ? payload.characters : [];
    const fracs = Array.isArray(payload.fractals) ? payload.fractals : [];
    const general = Array.isArray(payload.entities) ? payload.entities : [];

    chars.forEach((c) => characters.push(normalize({ ...c, type: "character" })));
    fracs.forEach((f) => fractals.push(normalize({ ...f, type: "fractal" })));
    general.forEach((item) => {
      if (item.type === "fractal" || item.narrative_style) {
        fractals.push(normalize({ ...item, type: "fractal" }));
      } else {
        characters.push(normalize({ ...item, type: "character" }));
      }
    });
    return { characters, fractals };
  }

  // Handle direct array of objects
  if (Array.isArray(payload)) {
    payload.forEach((item) => {
      if (!item || typeof item !== "object") return;
      if (item.type === "fractal" || item.narrative_style) {
        fractals.push(normalize({ ...item, type: "fractal" }));
      } else {
        characters.push(normalize({ ...item, type: "character" }));
      }
    });
    return { characters, fractals };
  }

  // Handle single object / card
  const is_explicit_fractal = payload.type === "fractal" || (payload.narrative_style && !payload.type);
  if (is_explicit_fractal) {
    fractals.push(normalize({ ...payload, type: "fractal" }));
  } else {
    // Treat primary payload as Character
    const char_entity = normalize({ ...payload, type: "character" });
    characters.push(char_entity);

    // If payload contains scene/world/fractal info or nested object, extract Fractal too!
    const scene_data = payload.scene || payload.fractal || payload.world || payload.environment;
    if (scene_data && typeof scene_data === "object") {
      fractals.push(normalize({ ...scene_data, type: "fractal", name: scene_data.name || `${char_entity.name}'s World` }));
    } else if (typeof scene_data === "string" && scene_data.trim().length > 0) {
      fractals.push(
        normalize({
          name: `${char_entity.name}'s Setting`,
          type: "fractal",
          description: scene_data,
          eternal: { non_physical: scene_data },
        }),
      );
    } else if (payload.description || payload.eternal?.non_physical) {
      // Create associated Fractal setting from card context for seamless dual import
      fractals.push(
        normalize({
          name: `${char_entity.name}'s Realm`,
          type: "fractal",
          description: payload.description || "Imported environment backdrop.",
          eternal: { non_physical: payload.eternal?.non_physical || payload.description || "" },
        }),
      );
    }
  }

  return { characters, fractals };
}

/**
 * 🧼 GLOBAL PROSE DETOX LAYER
 * Programmatically intercepts and scrubs clichéd AI tropes.
 *
 * @param {string|null|undefined} rawText
 * @param {"plain"|"ornate"|"raw"|"clinical"} [register="plain"]
 *   Voice register to draw replacements from.
 *   - "plain": short, concrete, everyday phrasing. Use for blunt/direct characters (e.g. Orion)
 *     or whenever no character-voice info is available — this is the safe default.
 *   - "ornate": literary, flowing phrasing. Use for eloquent characters (e.g. Valerius) or
 *     narration running under a lush/operatic NARRATIVE_STYLE.
 *   - "raw": visceral, unfiltered, gritty phrasing.
 *   - "clinical": detached, precise, analytical phrasing.
 *   Rules that are ambient scene description rather than a specific character's voice
 *   (ozone, testament, tapestry, etc.) intentionally keep one pool regardless of register.
 *
 * Rules this file follows — keep these intact when editing:
 *   1. Every trigger maps to a POOL, chosen at random per hit. Never a static 1:1 swap.
 *   2. Different grammatical forms of the same root (murmured/murmuring/murmurs/murmur, etc.)
 *      pull from pools that do NOT share the same synonym conjugated across tenses.
 *   3. Pools for DIFFERENT triggers avoid reusing each other's signature vocabulary, so no
 *      single word becomes over-represented across a whole scene just because it's the pick
 *      for three different clichés.
 *   4. No replacement text may contain another rule's trigger word/phrase. This runs as one
 *      sequential pass over the string, so an earlier rule's output IS visible to every later
 *      rule's regex — reusing a trigger word in a replacement causes a silent second mutation.
 *   5. Do not reintroduce retired words: muttered, muttering, mutters, mutter, thrummed,
 *      thrumming, thrums, thrum, buzzed, buzzes, "murmured softly", "soft murmur", breathes,
 *      gravelly, "ionized air", "charged air", trembles, tremble, quivers, quiver.
 * @returns {string}
 */

export function detox_prose(rawText, register = "plain") {
  if (!rawText || typeof rawText !== "string") return "";

  const FALLBACK_MAP = {
    ornate: "ornate",
    plain: "plain",
    raw: "plain",
    clinical: "plain",
  };
  const exact_voice = ["plain", "ornate", "raw", "clinical"].includes(register) ? register : "plain";
  const fallback_voice = FALLBACK_MAP[exact_voice] || "plain";

  const DETOX_RULES = [
    // 1. MURMUR — quiet, low-volume speech
    {
      regex: /\\bmurmured\\b/gi,
      replace: {
        plain: ["said it quietly", "kept his voice low", "spoke half to himself", "barely spoke above a breath"],
        ornate: [
          "let the words fall hushed",
          "gave the sentence barely any air",
          "breathed it more than said it",
          "let his voice thin to almost nothing",
        ],
        raw: ["ground it out low", "said it barely loud enough to hear", "spat it out quietly", "kept it under his breath"],
        clinical: ["lowered vocal output", "spoke below standard volume", "kept the volume low", "vocalized quietly"],
      },
    },
    {
      regex: /\\bmurmuring\\b/gi,
      replace: {
        plain: ["talking under his breath", "voice sinking low", "barely audible now", "trailing off quietly"],
        ornate: [
          "letting each word dissolve into breath",
          "voice unspooling in a hush",
          "speaking as though the walls might listen",
          "trailing his voice to almost silence",
        ],
        raw: ["keeping it low and rough", "speaking too quiet to catch", "talking barely above a whisper", "grinding the words out soft"],
        clinical: ["reducing vocal amplitude", "speaking at low volume", "maintaining a quiet baseline", "dropping audio levels"],
      },
    },
    {
      regex: /\\bmurmurs\\b/gi,
      replace: {
        plain: ["keeps it quiet", "drops his voice", "speaks low", "barely says it aloud"],
        ornate: [
          "lets the words fall soft",
          "gives the sentence hardly any weight",
          "speaks as if confiding a secret",
          "lets his voice thin to a hush",
        ],
        raw: ["keeps it under his breath", "says it barely loud enough", "grinds it out soft", "drops the volume"],
        clinical: ["lowers volume", "speaks quietly", "maintains low audio output", "vocalizes softly"],
      },
    },
    {
      regex: /\\bmurmur\\b/gi,
      replace: {
        plain: ["quiet remark", "low aside", "soft comment", "hushed word"],
        ornate: ["a half-spoken confidence", "a word barely given shape", "the ghost of a sentence", "a breath dressed as speech"],
        raw: ["low word", "quiet breath", "rough aside", "stifled sound"],
        clinical: ["low-volume utterance", "quiet vocalization", "soft auditory output", "low-decibel sound"],
      },
    },

    // 2. HUM — steady vibration or drone
    {
      regex: /\\bhummed\\b/gi,
      replace: {
        plain: ["droned steadily", "throbbed low", "reverberated through the walls", "chugged along quietly"],
        ornate: [
          "sang low beneath the surface of things",
          "kept one long note running under everything",
          "breathed a current no one could quite place",
          "rolled through the floor like a held note",
        ],
        raw: ["shook with a low vibration", "rattled steadily", "pushed a heavy sound through the floor", "ground away quietly"],
        clinical: ["emitted a steady frequency", "maintained constant vibration", "produced a low oscillation", "generated a continuous drone"],
      },
    },
    {
      regex: /\\bhumming\\b/gi,
      replace: {
        plain: ["vibrating steadily", "whirring low", "oscillating faintly", "growling under load"],
        ornate: [
          "threading a low note through the silence",
          "letting an unbroken current run beneath the quiet",
          "keeping the air faintly alive with sound",
          "laying a soft undertone beneath everything else",
        ],
        raw: ["shaking the air faintly", "rattling non-stop", "pushing a low noise through the room", "vibrating with quiet force"],
        clinical: ["emitting continuous vibration", "maintaining a baseline frequency", "producing a steady drone", "oscillating evenly"],
      },
    },
    {
      regex: /\\bhums\\b/gi,
      replace: {
        plain: ["resonates low", "pulses steadily", "judders faintly", "rattles quietly"],
        ornate: [
          "keeps one low note running beneath the room",
          "threads a constant current through the quiet",
          "never quite falls silent, just softens",
          "lays a faint charge under the stillness",
        ],
        raw: ["shakes the floorboards faintly", "pushes a heavy vibration", "rattles the air", "drones on"],
        clinical: ["emits a baseline frequency", "maintains a steady oscillation", "produces a constant drone", "vibrates evenly"],
      },
    },
    {
      regex: /\\b(low|industrial|electrical|steady|soft)\\s+hum\\b/gi,
      replace: (match, ...args) => {
        const p1 = args[0];
        const offset = args[args.length - 2];
        const forms = {
          plain: ["current", "undertone", "frequency", "note"],
          ornate: ["resonance", "undercurrent", "held breath", "vibration"],
          raw: ["rattle", "grind", "heavy vibration", "drone"],
          clinical: ["oscillation", "frequency", "background noise", "baseline drone"],
        };
        const active = forms[exact_voice] || forms[fallback_voice] || forms.plain;
        return p1 + " " + stable_pick(active, match, offset);
      },
    },
    {
      regex: /\\bhum\\b/gi,
      replace: {
        plain: ["low tone", "steady frequency", "background note", "constant undertone"],
        ornate: ["a note with no beginning", "an undercurrent with no source", "a sound too constant to notice", "the city's held breath"],
        raw: ["heavy drone", "low vibration", "steady grind", "constant rattle"],
        clinical: ["baseline frequency", "continuous oscillation", "steady drone", "background noise"],
      },
    },

    // 3. PURR — warm, teasing, unhurried delivery
    {
      regex: /\\bpurred\\b/gi,
      replace: {
        plain: ["said it slow and easy", "gave the words a teasing edge", "let his tone go warm", "dropped his voice into something coy"],
        ornate: [
          "let the words curl slow off his tongue",
          "dressed the sentence in velvet",
          "drew the words out like warm honey",
          "gave the sentence a slow, deliberate shine",
        ],
        raw: ["let it drag out slow", "dropped the pitch down", "said it with heavy heat", "gave it a low edge"],
        clinical: ["spoke with deliberate slowness", "lowered vocal pitch slightly", "delivered the words evenly", "maintained a smooth cadence"],
      },
    },
    {
      regex: /\\bpurring\\b/gi,
      replace: {
        plain: ["voice gone warm and slow", "words coming out unhurried", "tone easing into something coy", "delivery turning playful and low"],
        ornate: [
          "letting his voice curl at the edges",
          "dressing every word in something softer",
          "drawing each syllable out unhurried",
          "giving his tone a slow, deliberate warmth",
        ],
        raw: ["dragging the words out", "dropping his voice low and heavy", "speaking slow and deliberate", "letting the heat bleed into his voice"],
        clinical: ["speaking with slow precision", "maintaining a smooth delivery", "lowering vocal pitch", "delivering at a measured pace"],
      },
    },
    {
      regex: /\\bpurrs\\b/gi,
      replace: {
        plain: ["says it slow", "gives the words a playful edge", "lets his tone warm up", "turns coy without missing a beat"],
        ornate: [
          "curls the words at the edges",
          "dresses his voice in something softer",
          "draws it out, unhurried and warm",
          "gives the sentence a slow shine",
        ],
        raw: ["drags the words out slow", "drops it low and heavy", "says it with heat", "lets it slide out rough"],
        clinical: ["speaks slowly", "maintains a steady, low cadence", "delivers smoothly", "lowers pitch slightly"],
      },
    },
    {
      regex: /\\bpurr\\b/gi,
      replace: {
        plain: ["low teasing tone", "warm playful edge", "c coy inflection", "slow easy delivery"],
        ornate: ["a slow, honeyed edge", "a velvet undertone", "a deliberate, unhurried warmth", "a voice dressed in silk"],
        raw: ["low heavy tone", "slow drag of a voice", "thick heat", "rough drawl"],
        clinical: ["smooth vocalization", "measured cadence", "low-pitched delivery", "even tone"],
      },
    },

    // 4. RASP — harsh, dry, strained delivery
    {
      regex: /\\brasped\\b/gi,
      replace: {
        plain: ["said it rough", "ground the words out", "let his voice go raw", "bit off each word"],
        ornate: [
          "ground the words out like stone underfoot",
          "let the sentence come out scraped raw",
          "forced the words past something torn in his throat",
          "gave the words an edge like broken stone",
        ],
        raw: ["scraped the words out", "dragged the words up rough", "forced it out raw", "hacked the words out"],
        clinical: ["spoke with severe vocal strain", "delivered with friction", "forced the vocalization", "spoke hoarsely"],
      },
    },
    {
      regex: /\\brasping\\b/gi,
      replace: {
        plain: ["voice scraping rough", "forcing the words along", "catching on every syllable", "going dry and strained"],
        ornate: [
          "scraping each word past a throat gone raw",
          "forcing sound through something torn",
          "letting the words come out edged like stone",
          "dragging each syllable up rough",
        ],
        raw: ["scraping out every word", "forcing it through a raw throat", "dragging the sounds up rough", "grinding the words out"],
        clinical: ["speaking with notable strain", "producing high-friction audio", "vocalizing hoarsely", "forcing air through restricted cords"],
      },
    },
    {
      regex: /\\brasps\\b/gi,
      replace: {
        plain: ["says it dry", "voice comes out rough", "forces it through gritted teeth", "strains to get the words out"],
        ornate: [
          "scrapes the words past a raw throat",
          "drags each syllable up rough",
          "gives the sentence an edge like broken stone",
          "forces sound through something torn",
        ],
        raw: ["scrapes the words out", "drags it up rough", "forces it out raw", "hacks the sentence out"],
        clinical: ["speaks with vocal strain", "delivers hoarsely", "forces the vocalization", "produces rough audio"],
      },
    },
    {
      regex: /\\brough,?\\s+(dismissive|dangerous)?\\s*rasp\\b/gi,
      replace: {
        plain: ["rough, worn voice", "harsh edge to his tone", "low growl of a voice", "voice roughened and low"],
        ornate: [
          "a voice worn down to bare rock",
          "a tone that never quite healed",
          "a voice roughened by something unsaid",
          "an edge that sounds permanently bruised",
        ],
        raw: ["harsh scrap of a voice", "raw edge", "voice like sandpaper", "rough grind of a tone"],
        clinical: ["strained vocalization", "hoarse audio output", "rough acoustic signature", "high-friction voice"],
      },
    },

    // 5. SENSORY & OZONE CLICHÉS
    {
      regex: /\\bair tastes of ozone\\b/gi,
      replace: {
        plain: [
          "air tastes sharp and metallic",
          "the air carries a raw electric edge",
          "the air smells faintly of hot wire",
          "a metallic tang cuts through the air",
        ],
        ornate: [
          "a bitter static coats the tongue",
          "the atmosphere carries the weight of a storm",
          "the air feels bruised and electric",
          "a charged sharpness lingers in the lungs",
        ],
        raw: [
          "air tastes like copper and heat",
          "the smell of burned wire fills the space",
          "it tastes like chewed foil",
          "the air bites with raw electricity",
        ],
        clinical: [
          "atmospheric ionization is detectable",
          "electrical discharge is present in the air",
          "metallic particulates are suspended",
          "high-voltage atmospheric conditions noted",
        ],
      },
    },
    {
      regex: /\\bscent of ozone\\b/gi,
      replace: {
        plain: ["smell of hot wire", "scent of scorched metal", "smell of overheated electronics", "a sharp electrical smell"],
        ornate: [
          "fragrance of a broken storm",
          "bitter perfume of raw current",
          "scent of something burnt and electric",
          "ghost of lightning in the air",
        ],
        raw: ["stink of hot copper", "burnt wire smell", "harsh electrical stink", "smell of fried circuits"],
        clinical: ["ionized atmospheric odor", "scent of electrical discharge", "metallic olfactory signature", "high-voltage particulate smell"],
      },
    },
    {
      regex: /\\bozone\\b/gi,
      replace: {
        plain: ["static", "hot wire", "scorched metal", "raw current"],
        ornate: ["sparking air", "electric ghost", "heavy static", "bitter air"],
        raw: ["hot copper", "fried wire", "burnt metal", "harsh static"],
        clinical: ["ionization", "electrical discharge", "atmospheric charge", "metallic particulate"],
      },
    },

    // 6. ABSTRACTION CLICHÉS
    {
      regex: /\\b(is|was|stands?|stood)\\s+a\\s+testament\\s+to\\b/gi,
      replace: (match, ...args) => {
        const p1 = args[0];
        const offset = args[args.length - 2];
        const forms = {
          plain: ["proof of", "evidence of", "a marker of", "a sign of"],
          ornate: ["a monument to", "a silent witness to", "the physical weight of", "an undeniable echo of"],
          raw: ["hard proof of", "a raw reminder of", "the ugly result of", "a heavy sign of"],
          clinical: ["evidence of", "an indicator of", "data supporting", "a metric of"],
        };
        const active = forms[exact_voice] || forms[fallback_voice] || forms.plain;
        return p1 + " " + stable_pick(active, match, offset);
      },
    },
    {
      regex: /\\ba\\s+testament\\s+to\\b/gi,
      replace: {
        plain: ["proof of", "evidence of", "a sign of", "a marker of"],
        ornate: ["a monument to", "a silent witness to", "the physical weight of", "an echo of"],
        raw: ["hard proof of", "a raw reminder of", "the ugly result of", "a heavy sign of"],
        clinical: ["evidence of", "an indicator of", "data supporting", "a metric of"],
      },
    },
    {
      regex: /\\btestament\\b/gi,
      replace: {
        plain: ["proof", "evidence", "marker", "sign"],
        ornate: ["monument", "witness", "echo", "shadow"],
        raw: ["hard proof", "reminder", "result", "scar"],
        clinical: ["evidence", "indicator", "data", "metric"],
      },
    },
    {
      regex: /\\btapestry\\s+of\\b/gi,
      replace: {
        plain: ["mix of", "web of", "tangle of", "patchwork of"],
        ornate: ["woven history of", "intricate maze of", "dense knot of", "sprawling mural of"],
        raw: ["mess of", "tangled heap of", "sprawling mess of", "bleeding mix of"],
        clinical: ["collection of", "aggregate of", "network of", "system of"],
      },
    },
    {
      regex: /\\btapestry\\b/gi,
      replace: {
        plain: ["web", "tangle", "patchwork", "mosaic"],
        ornate: ["woven thread", "intricate design", "dense knot", "sprawling mural"],
        raw: ["mess", "tangled heap", "sprawling knot", "bleeding mix"],
        clinical: ["collection", "aggregate", "network", "system"],
      },
    },
    {
      regex: /\\bsymphony\\s+of\\b/gi,
      replace: {
        plain: ["medley of", "clash of", "cascade of", "rush of"],
        ornate: ["choir of", "crescendo of", "orchestration of", "rising tide of"],
        raw: ["mess of noise", "violent clash of", "deafening rush of", "bleeding mix of"],
        clinical: ["array of", "simultaneous occurrence of", "collection of", "systematic set of"],
      },
    },
    {
      regex: /\\bcoiled\\s+spring\\b/gi,
      replace: {
        plain: ["tense frame", "wound tight", "ready to move", "poised to snap"],
        ornate: ["held in absolute tension", "drawn tight as a bowstring", "vibrating with unspent energy", "poised on a razor's edge"],
        raw: ["wound tight enough to break", "tense as a tripwire", "shaking with held-back force", "ready to snap"],
        clinical: [
          "maintaining high kinetic potential",
          "exhibiting extreme muscle tension",
          "physically primed for action",
          "highly reactive state",
        ],
      },
    },
    {
      regex: /\\ba\\s+study\\s+in\\b/gi,
      replace: {
        plain: ["a picture of", "an exercise in", "a portrait of", "a lesson in"],
        ornate: ["the living embodiment of", "a masterclass in", "the absolute expression of", "a deliberate display of"],
        raw: ["nothing but pure", "a raw display of", "a heavy dose of", "a harsh look at"],
        clinical: ["an example of", "a demonstration of", "a clear case of", "an exhibition of"],
      },
    },
    {
      regex: /\\bmarrow\\s+of\\s+(his|her|their|the)\\s+teeth\\b/gi,
      replace: (match, ...args) => {
        const p1 = args[0];
        const offset = args[args.length - 2];
        const forms = {
          plain: ["core of " + p1 + " bones", "deepest part of " + p1 + " jaw", "root of " + p1 + " bite"],
          ornate: ["very foundation of " + p1 + " frame", "deepest hollow of " + p1 + " bones", "absolute core of " + p1 + " being"],
          raw: ["roots of " + p1 + " teeth", "hard bone of " + p1 + " jaw", "base of " + p1 + " skull"],
          clinical: ["dental roots", "mandibular structure", "osseous core"],
        };
        const active = forms[exact_voice] || forms[fallback_voice] || forms.plain;
        return stable_pick(active, match, offset);
      },
    },
    { regex: /\\bshell of (his|her|their|your)\\s+ear\\b/gi, replace: (match, ...args) => args[0] + " ear" },

    // 7. BREATH & VOICE MECHANICS
    {
      regex: /\\bhitching\\b/gi,
      replace: {
        plain: ["catching short", "snagging on itself", "breaking off mid-breath", "stalling for a beat"],
        ornate: [
          "like a record skipping in place",
          "the rhythm losing its footing",
          "a held note that won't quite land",
          "something caught between two beats",
        ],
        raw: ["choking on a breath", "snagging hard", "tripping over itself", "getting caught in the throat"],
        clinical: ["experiencing respiratory interruption", "stalling momentarily", "exhibiting an irregular breathing pattern", "halting mid-cycle"],
      },
    },
    {
      regex: /\\bhitched\\b/gi,
      replace: {
        plain: ["seized for a second", "jolted mid-breath", "locked up for a beat", "skipped a step"],
        ornate: [
          "snagged on a word that never came",
          "lost its footing for one unsteady beat",
          "went still, just for a breath",
          "caught on something too quiet to name",
        ],
        raw: ["choked up for a second", "tripped hard", "got caught in the throat", "stalled out"],
        clinical: ["halted briefly", "experienced a momentary spasm", "paused mid-respiration", "interrupted its cycle"],
      },
    },
    {
      regex: /\\bhitches\\b/gi,
      replace: {
        plain: ["trips for a second", "freezes mid-breath", "cuts off short", "falters for a beat"],
        ornate: [
          "stumbles over the same silence every time",
          "loses its footing and finds it again",
          "goes still for exactly one breath",
          "catches, always, on the same unspoken word",
        ],
        raw: ["chokes up", "catches hard in the throat", "trips and falls flat", "stalls abruptly"],
        clinical: ["halts briefly", "pauses involuntarily", "interrupts the respiratory cycle", "exhibits a momentary spasm"],
      },
    },
    {
      regex: /\\bhitch\\b/gi,
      replace: {
        plain: ["short break in rhythm", "momentary stop", "half-second delay", "small interruption"],
        ornate: ["a beat that never quite lands", "a breath held too long", "a half-second of missing rhythm", "a silence where a word should be"],
        raw: ["hard catch in the throat", "sudden choke", "harsh stop", "stutter"],
        clinical: ["respiratory pause", "brief interruption", "momentary delay", "irregularity in rhythm"],
      },
    },
    {
      regex: /\\bbreathlessly\\b/gi,
      replace: {
        plain: ["with no air left", "gasping the words out", "in a rush, out of air", "barely getting the words out"],
        ornate: [
          "with what little air he had left",
          "the words spilling out before the next breath came",
          "as though speech itself had outrun his lungs",
          "with his chest still fighting for air",
        ],
        raw: ["gasping hard", "choking the words out", "heaving for air", "spitting it out breathless"],
        clinical: ["without sufficient oxygen", "exhibiting hyperventilation", "speaking during oxygen debt", "with rapid respiration"],
      },
    },
    {
      regex: /\\bbreathless\\b/gi,
      replace: {
        plain: ["out of air", "winded", "gasping", "unable to catch his breath"],
        ornate: [
          "emptied of air",
          "caught between one breath and the next",
          "lungs still chasing the moment",
          "unable to find the bottom of a breath",
        ],
        raw: ["heaving", "choking for air", "gasping hard", "sucking wind"],
        clinical: ["oxygen depleted", "hyperventilating", "experiencing oxygen debt", "exhibiting rapid respiration"],
      },
    },
    {
      regex: /\\btracing lazy circles\\b/gi,
      replace: {
        plain: ["drawing slow circles", "moving his fingers in loops", "tracing idle shapes", "brushing back and forth slowly"],
        ornate: [
          "drawing slow, unhurried circles against his skin",
          "letting his fingers wander in loose, idle loops",
          "tracing shapes with no destination in mind",
          "moving with the unhurried patience of someone in no rush to stop",
        ],
        raw: ["rubbing slow, aimless circles", "dragging his fingers in slow loops", "sliding back and forth", "tracing heavy, slow lines"],
        clinical: ["moving in slow circular patterns", "tracing repetitive motions", "applying slow friction", "moving at a low velocity"],
      },
    },
    {
      regex: /\\bdropping an octave\\b/gi,
      replace: {
        plain: ["voice dropping lower", "letting his voice go deep", "voice sinking down", "pitching his voice lower"],
        ornate: [
          "letting his voice fall to something deeper",
          "his voice dropping into a lower register",
          "his tone sinking, deliberate and low",
          "letting the words come out an octave darker",
        ],
        raw: ["letting his voice hit the floor", "dropping his tone heavy and low", "dragging his voice down", "going deep and rough"],
        clinical: ["lowering vocal pitch significantly", "shifting to a lower frequency", "decreasing vocal range", "dropping audio frequency"],
      },
    },

    // 8. INTENSITY & VISUAL CLICHÉS
    {
      regex: /\\bpalpable\\b/gi,
      replace: {
        plain: ["obvious", "heavy in the air", "impossible to miss", "hard to ignore"],
        ornate: [
          "thick enough to touch",
          "pressing on the room like weather",
          "a weight the air itself seemed to carry",
          "unmistakable, the way a held breath is unmistakable",
        ],
        raw: ["heavy enough to choke on", "crushing the air out of the room", "thick and suffocating", "pressing down hard"],
        clinical: ["measurable", "clearly observable", "quantifiable", "distinctly present"],
      },
    },
    {
      regex: /\\btangible\\b/gi,
      replace: {
        plain: ["real", "solid", "concrete", "plain to see"],
        ornate: [
          "something you could almost hold",
          "solid enough to lean on",
          "real in a way words rarely are",
          "present in the room like another body",
        ],
        raw: ["hard and real", "heavy enough to feel", "solid enough to break against", "unavoidably real"],
        clinical: ["verifiable", "concrete", "physical", "empirically observable"],
      },
    },
    {
      regex: /\\bshivering\\s+shadows?\\b/gi,
      replace: {
        plain: ["dark shadows", "shifting shadows", "moving shadows", "uneven shadows"],
        ornate: [
          "shadows that never quite settle",
          "shadows that flinch with the light",
          "restless dark pooling at the edges",
          "gloom that shifts like something breathing",
        ],
        raw: ["twitching shadows", "nervous dark spots", "jagged, moving shadows", "restless gloom"],
        clinical: ["fluctuating low-light areas", "unstable silhouettes", "shifting occlusions", "variable shadow patterns"],
      },
    },
    {
      regex: /\\bfever\\s+dream\\b/gi,
      replace: {
        plain: ["strange blur", "hazy mess", "disorienting scene", "surreal moment"],
        ornate: [
          "a hallucination with the volume turned up",
          "reality bent just slightly out of true",
          "a dream wearing the mask of the waking world",
          "something too vivid to be entirely real",
        ],
        raw: ["sick hallucination", "dizzying nightmare", "sweaty blur of a memory", "bad trip"],
        clinical: ["disorienting sequence", "hallucinatory state", "altered perception event", "cognitive distortion"],
      },
    },
    {
      regex: /\\bsmudge\\s+of\\s+(charcoal|darkness)\\b/gi,
      replace: {
        plain: ["dark shape", "shadowy outline", "dim silhouette", "shape in the dark"],
        ornate: [
          "a silhouette cut from the dark itself",
          "an outline the shadows seem reluctant to release",
          "a shape more suggested than seen",
          "a smear of night given rough form",
        ],
        raw: ["heavy stain of dark", "bruise of a shadow", "dirty smear of black", "harsh outline in the gloom"],
        clinical: ["low-contrast form", "indistinct silhouette", "obscured figure", "shadowed mass"],
      },
    },
    {
      regex: /\\bblindingly\\s+white\\s+grin\\b/gi,
      replace: {
        plain: ["bright grin", "wide smile", "big grin", "toothy smile"],
        ornate: [
          "a grin lit up like a struck match",
          "a smile bright enough to cut through the gloom",
          "teeth flashing white against the dark",
          "a grin that seemed to throw its own light",
        ],
        raw: ["harsh, bright smile", "teeth flashing sharp and white", "glaring grin", "stark, wide smile"],
        clinical: ["high-contrast smile", "prominent dental display", "wide facial expression", "clearly visible grin"],
      },
    },
    {
      regex: /\\bshimmering\\b/gi,
      replace: {
        plain: ["glinting", "shining", "sparkling", "gleaming"],
        ornate: [
          "catching the light in restless flickers",
          "throwing off light like something alive",
          "glowing with a light that won't sit still",
          "lit with a glow that seems to breathe",
        ],
        raw: ["flashing harsh light", "glaring bright", "spitting off sparks of light", "gleaming hard"],
        clinical: ["reflecting light rapidly", "exhibiting high specular reflection", "fluctuating in brightness", "displaying optical interference"],
      },
    },
    // 9. BELLOW — loud, deep shout
    {
      regex: /\\bbellowed\\b/gi,
      replace: {
        plain: ["shouted", "roared", "yelled", "called out loudly"],
        ornate: [
          "let the sound tear from his chest",
          "threw his voice out like a physical weight",
          "shook the air with his voice",
          "forced the words out in a roar",
        ],
        raw: ["screamed it loud", "roared until his throat hurt", "busted the air open with a shout", "yelled hard enough to break glass"],
        clinical: ["shouted at maximum volume", "vocalized forcefully", "produced a high-decibel shout", "projected at peak volume"],
      },
    },
    {
      regex: /\\bbellowing\\b/gi,
      replace: {
        plain: ["shouting", "roaring", "yelling loudly", "calling out"],
        ornate: [
          "letting the sound rip from his chest",
          "throwing his voice against the walls",
          "shaking the air with the volume",
          "forcing the sound out like a blow",
        ],
        raw: ["screaming loud", "tearing his throat out roaring", "yelling at the top of his lungs", "blasting the air with a shout"],
        clinical: ["shouting forcefully", "projecting at high volume", "vocalizing loudly", "producing high-decibel output"],
      },
    },
    {
      regex: /\\bbellows\\b/gi,
      replace: {
        plain: ["shouts", "roars", "yells", "calls out"],
        ornate: [
          "lets the sound tear from his chest",
          "throws his voice out like a weight",
          "shakes the air with his voice",
          "forces the words out in a roar",
        ],
        raw: ["screams loud", "roars hard", "yells at the top of his lungs", "blasts out a shout"],
        clinical: ["shouts", "projects at peak volume", "vocalizes forcefully", "produces a high-decibel shout"],
      },
    },
    {
      regex: /\\bbellow\\b/gi,
      replace: {
        plain: ["shout", "roar", "loud cry", "yell"],
        ornate: ["a sound torn straight from the chest", "a roar that shook the air", "a heavy, concussive shout", "a raw eruption of sound"],
        raw: ["screaming shout", "throat-tearing roar", "deafening yell", "harsh blast of sound"],
        clinical: ["high-decibel vocalization", "forceful shout", "loud acoustic output", "maximum volume projection"],
      },
    },
    // 10. BOOMING — deep, loud, resonant
    {
      regex: /\\bbooming\\b/gi,
      replace: {
        plain: ["loud", "deep and loud", "deafening", "roaring"],
        ornate: [
          "heavy enough to rattle the teeth",
          "filling all the available space",
          "rolling like distant artillery",
          "carrying the weight of a falling vault",
        ],
        raw: ["bone-rattling", "crushing and loud", "heavy enough to hurt your ears", "slamming into the room"],
        clinical: ["high-amplitude", "highly resonant", "acoustically overwhelming", "low-frequency and high-decibel"],
      },
    },
    {
      regex: /\\bboomed\\b/gi,
      replace: {
        plain: ["echoed loudly", "rang out loud", "sounded loud", "hit with a thud"],
        ornate: [
          "struck the air like a physical blow",
          "rolled through the space unhindered",
          "hit with concussive force",
          "rang out heavy and dense",
        ],
        raw: ["slammed into the silence", "crashed loud and heavy", "hit like a shockwave", "rang out hard enough to hurt"],
        clinical: ["produced a high-amplitude echo", "resonated forcefully", "impacted with acoustic weight", "generated a concussive sound wave"],
      },
    },
    {
      regex: /\\bbooms\\b/gi,
      replace: {
        plain: ["echoes loudly", "rings out loud", "sounds loud", "hits with a thud"],
        ornate: ["strikes the air like a blow", "rolls through the space", "hits with concussive force", "rings out heavy and dense"],
        raw: ["slams hard", "crashes loud", "hits like a physical blow", "rings out deafeningly"],
        clinical: ["produces a high-amplitude echo", "resonates heavily", "impacts with acoustic force", "generates concussive noise"],
      },
    },
    {
      regex: /\\bboom\\b/gi,
      replace: {
        plain: ["loud thud", "deep crash", "heavy impact", "loud noise"],
        ornate: ["a concussive shock", "a sound heavy enough to feel", "a sudden pressure in the air", "a deep, bone-rattling impact"],
        raw: ["shockwave of sound", "crushing thud", "deafening crash", "bone-shaking impact"],
        clinical: ["concussive acoustic event", "high-amplitude sound wave", "heavy acoustic impact", "low-frequency noise"],
      },
    },
    {
      regex: /\\bshiver(s|ed|ing)?\\b/gi,
      replace: (match, ...args) => {
        const p1 = args[0];
        const offset = args[args.length - 2];
        const forms = {
          plain: {
            "": ["flinch", "tense up", "twitch", "jolt"],
            s: ["shudders", "stiffens", "jerks back", "convulses briefly"],
            ed: ["seized up", "went rigid for a second", "recoiled slightly", "jumped involuntarily"],
            ing: ["going rigid in waves", "reacting over and over", "unable to stay still", "caught in small aftershocks"],
          },
          ornate: {
            "": [
              "a current runs through him",
              "something cold moves down his spine",
              "his body reacts before his mind catches up",
              "a chill finds its way under his skin",
            ],
            s: [
              "something crosses just beneath his skin",
              "his frame answers before he can stop it",
              "a cold thread pulls tight down his back",
              "his whole body registers it first",
            ],
            ed: [
              "a current ran through him before he could stop it",
              "something cold traced a line down his spine",
              "his frame gave one involuntary jolt",
              "the reaction arrived before the thought did",
            ],
            ing: [
              "caught in a current that won't let go",
              "unable to find stillness again",
              "answering the cold again and again",
              "caught somewhere between each involuntary jolt",
            ],
          },
          raw: {
            "": ["flinch hard", "jolt", "spasm", "jerk"],
            s: ["flinches violently", "jerks hard", "spasms", "jolts"],
            ed: ["flinched hard", "spasmed", "jolted like he'd been hit", "jerked violently"],
            ing: ["flinching continuously", "spasming", "jerking uncontrollably", "shaking hard"],
          },
          clinical: {
            "": ["exhibit a tremor", "experience a spasm", "react involuntarily", "flinch"],
            s: ["exhibits a tremor", "experiences a spasm", "reacts involuntarily", "flinches"],
            ed: ["exhibited a tremor", "experienced a spasm", "reacted involuntarily", "flinched"],
            ing: ["exhibiting tremors", "experiencing spasms", "reacting involuntarily", "flinching"],
          },
        };
        const key = p1 === "s" || p1 === "ed" || p1 === "ing" ? p1 : "";
        const active_forms = forms[exact_voice] || forms[fallback_voice] || forms.plain;
        return match_case(match, stable_pick(active_forms[key], match, offset));
      },
    },
  ];

  let clean_text = rawText;
  for (const item of DETOX_RULES) {
    clean_text = clean_text.replace(item.regex, (match, ...args) => {
      const offset = args[args.length - 2];
      if (typeof item.replace === "function") {
        return item.replace(match, ...args);
      }
      return pick_replacement(match, item.replace, exact_voice, fallback_voice, offset);
    });
  }

  return clean_text;
}

/**
 * Picks a deterministic item from a flat array, or from pool[register] (falling back to
 * pool[fallback_voice], then pool.plain) when given a { plain, ornate, raw, clinical } pool object.
 * Preserves capitalization of the matched text.
 */
function pick_replacement(match, pool, exact_voice = "plain", fallback_voice = "plain", offset = 0) {
  if (!pool) return match;
  if (typeof pool === "string") return match_case(match, pool);
  const list = Array.isArray(pool) ? pool : pool[exact_voice] || pool[fallback_voice] || pool.plain || [];
  if (!list.length) return match;
  return match_case(match, stable_pick(list, match, offset));
}

function stable_pick(list, match, offset) {
  if (!list || list.length === 0) return "";
  let h = 0x811c9dc5;
  const s = match + "@" + offset;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return list[h % list.length];
}

function match_case(original, replacement) {
  if (!original || !replacement) return replacement;
  const first = original.charAt(0);
  if (first === first.toUpperCase() && first !== first.toLowerCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}
