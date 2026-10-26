/**
 * @file simulation-audit.js
 * 🏎️ THE DRIVETRAIN: Consolidated Simulation Execution & Schema Audit Harness.
 * Handles the linear flow of Hydration -> Simulation -> Synthesis,
 * as well as the full combinatorial Live Schema Sweep across prompt modes.
 *
 * Updated for Bayesian Psychology Engine & Consolidated Schema Sweep:
 * - Unified entity mapping and past vector enrichment.
 * - Single-turn pipeline verification (Shot 1 Director, Shot 2 Storyteller).
 * - Multi-mode combinatorial live schema sweep across stories, trios, and triggers.
 * - Consolidated report synthesis emitting unified 'tmp/simulation-audit-report.md'.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { compile_prompt } from "../../../../src/intelligence/prompts.js";
import { make_contract_cases, CONTRACT } from "../../../../src/intelligence/prompt-verification.js";
import { get_premade_entity_by_id } from "../../../../src/data/definitions/premade-entities.js";
import { resolve_stability_lock } from "../../../../src/intelligence/modules/reflex.js";

// CLI Runner: When executed directly via Node (node .agents/skills/simulation/scripts/simulation-audit.js),
// delegate to Vitest to run the audit harness in the Vite / Svelte 5 compilation environment.
if (process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])) {
  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["vitest", "run", ".agents/skills/simulation/scripts/simulation-audit.test.js"],
    { stdio: "inherit", shell: true },
  );
  process.exit(result.status ?? 0);
}

let context_builder = null;

async function ensure_simulation_dependencies() {
  if (!context_builder) {
    const builder_module = await import("../../../../src/intelligence/builder.js");
    context_builder = builder_module.context_builder;
  }
}

// -----------------------------------------------------------------------------
// Shared Entity & Fixture Utilities
// -----------------------------------------------------------------------------

/**
 * Enriches a vector with category and triggers fields if missing.
 * @param {any} v
 * @returns {any}
 */
export function enrich_vector(v) {
  if (!v || typeof v !== "object") return v;
  return {
    ...v,
    category: v.category || "event",
  };
}

/**
 * Maps a raw premade entity into the structure the prompt builder and compiler expect.
 * Ensures present/eternal are direct properties, enriches past vectors,
 * and passes speaking/narrative styles cleanly.
 * @param {any} data
 * @returns {any}
 */
export function map_entity(data) {
  if (!data) return undefined;
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    present: data.present || { physical: "", non_physical: "" },
    eternal: data.eternal || { physical: "", non_physical: "" },
    past: Array.isArray(data.past) ? data.past.map(enrich_vector) : data.past || "",
    future: data.future || "",
    dynamics: data.dynamics || {},
    dynamics_baseline: data.dynamics_baseline || null,
    pov: data.pov || "",
    visual_style: data.visual_style || "",
    narrative_style: data.narrative_style || "",
    speaking_style: data.speaking_style || "",
  };
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr, exclude) {
  const pool = exclude ? arr.filter((x) => x !== exclude) : arr;
  return pool[Math.floor(rng() * pool.length)];
}

function snapshot_for(entities, chaos, dyn_override) {
  const ai_dyn = dyn_override ? { ...dyn_override.ai } : { ...(entities.AI?.dynamics || {}) };
  if (chaos) ai_dyn.chaos = chaos;
  return {
    ai: { dynamics: ai_dyn },
    fractal: { dynamics: dyn_override ? { ...dyn_override.fractal } : { ...(entities.FRACTAL?.dynamics || {}) } },
    flags: {},
  };
}

// -----------------------------------------------------------------------------
// Live Schema Sweep Fixtures & Constants
// -----------------------------------------------------------------------------

const CHARS = ["orion", "glitch", "silvers", "hank", "elias", "julien", "beast", "nova"];
const FRACTALS = ["ashenweald", "tartarus"];
const FIXED_TRIO = { ai: "silvers", user: "julien", fractal: "ashenweald" };
const DISSONANCE_DYN = { ai: { chaos: 30, intensity: 70, openness: 40, affinity: 20 }, fractal: { velocity: 50, entropy: 80 } };

const STORIES = [
  {
    id: "S1-first-contact",
    label: "First Contact at the Rust Gate",
    input: "The rusted gate swings inward on its own. I step through with my empty hands raised.",
    beats: [],
    round: 1,
    stag: 0,
    kw: [],
    fc: true,
    chaos: 0,
  },
  {
    id: "S2-stalemate",
    label: "The Stalemate",
    input: "...",
    beats: [
      { role: "user", text: "..." },
      { role: "model", text: "The dust settles back onto the same stones. Nothing moves." },
      { role: "user", text: "We wait." },
      { role: "model", text: "Waiting, then. The room keeps its shape around you." },
      { role: "user", text: "..." },
      { role: "model", text: "Stillness again. Even the ash seems bored of falling." },
    ],
    round: 6,
    stag: 16,
    kw: ["MASKING", "SUSPICION"],
    fc: false,
    chaos: 0,
  },
  {
    id: "S3-confrontation",
    label: "The Confrontation",
    input: "Draw steel or step aside — the ash takes us all otherwise.",
    beats: [
      { role: "user", text: "You sold the gate codes. Say it plainly." },
      { role: "model", text: "Careful. Some words cannot be unsaid in this room." },
      { role: "user", text: "Then we settle it the old way. Steel, at dusk." },
      { role: "model", text: "Dusk, then. Bring your second — you will need a witness." },
    ],
    round: 4,
    stag: 3,
    kw: ["SUSPICION", "THREAT"],
    fc: false,
    chaos: 90,
  },
];

const FACTS = [
  { text: "The gate codes changed hands at dusk.", source: "ai_0007" },
  { text: "A second set of footprints led away from the rust gate.", source: "ai_0011" },
  { text: "The protein shipment was refused, not lost.", source: "ai_0019" },
];

const SWEEP = [
  { axis: "base", round: 5, stag: 0, kw: [], beats: "S2", input: "S2", fc: false, cand: false, facts: false, chaos: 0, dyn: false, stab: false },
  { axis: "round1", round: 1, stag: 0, kw: [], beats: null, input: "S1", fc: false, cand: false, facts: false, chaos: 0, dyn: false, stab: false },
  {
    axis: "firstcontact",
    round: 1,
    stag: 0,
    kw: [],
    beats: null,
    input: "S1",
    fc: true,
    cand: false,
    facts: false,
    chaos: 0,
    dyn: false,
    stab: false,
  },
  { axis: "stag8", round: 5, stag: 8, kw: [], beats: "S2", input: "S2", fc: false, cand: false, facts: false, chaos: 0, dyn: false, stab: false },
  {
    axis: "stag16",
    round: 6,
    stag: 16,
    kw: ["MASKING", "SUSPICION"],
    beats: "S2",
    input: "S2",
    fc: false,
    cand: false,
    facts: false,
    chaos: 0,
    dyn: false,
    stab: false,
  },
  {
    axis: "keywords",
    round: 5,
    stag: 0,
    kw: ["MASKING", "SUSPICION"],
    beats: "S2",
    input: "S2",
    fc: false,
    cand: false,
    facts: false,
    chaos: 0,
    dyn: false,
    stab: false,
  },
  {
    axis: "keywords2",
    round: 4,
    stag: 3,
    kw: ["THREAT", "BETRAYAL"],
    beats: "S3",
    input: "S3",
    fc: false,
    cand: false,
    facts: false,
    chaos: 0,
    dyn: false,
    stab: false,
  },
  { axis: "candidates", round: 5, stag: 0, kw: [], beats: "S2", input: "S2", fc: false, cand: true, facts: false, chaos: 0, dyn: false, stab: false },
  { axis: "nohistory", round: 5, stag: 0, kw: [], beats: null, input: "S2", fc: false, cand: false, facts: false, chaos: 0, dyn: false, stab: false },
  { axis: "facts", round: 5, stag: 0, kw: [], beats: "S2", input: "S2", fc: false, cand: false, facts: true, chaos: 0, dyn: false, stab: false },
  {
    axis: "chaos",
    round: 4,
    stag: 3,
    kw: ["SUSPICION"],
    beats: "S3",
    input: "S3",
    fc: false,
    cand: false,
    facts: false,
    chaos: 90,
    dyn: false,
    stab: false,
  },
  { axis: "dissonance", round: 5, stag: 0, kw: [], beats: "S2", input: "S2", fc: false, cand: false, facts: false, chaos: 0, dyn: true, stab: false },
  { axis: "stability", round: 5, stag: 0, kw: [], beats: "S2", input: "S2", fc: false, cand: false, facts: false, chaos: 0, dyn: false, stab: true },
  {
    axis: "actioninput",
    round: 1,
    stag: 0,
    kw: [],
    beats: null,
    input: "S2",
    inputText: "The rusted gate swings inward on its own. I step through with my empty hands raised.",
    fc: false,
    cand: false,
    facts: false,
    chaos: 0,
    dyn: false,
    stab: false,
  },
];

const AXIS_WHEN = {
  round1: "round ≤ 1",
  firstcontact: "is_first_contact param + round 1",
  stag8: "stagnation ≥ 8",
  stag16: "stagnation ≥ 16",
  keywords: "keywords set A (MASKING, SUSPICION)",
  keywords2: "keywords set B (THREAT, BETRAYAL)",
  candidates: "dormant NPC candidates present",
  nohistory: "empty history",
  facts: "settled facts present (continuum advisory)",
  chaos: "chaos ≥ 90 dynamics",
  dissonance: "fixture dynamics (intensity 70 / affinity 20)",
  stability: "structural errors recorded (1–2)",
  actioninput: "non-verbal action input, no quotes",
};

const ALL_AXES = [...SWEEP.map((d) => d.axis), "live"];

const ASSERTED = [
  "FIRST_CONTACT",
  "ROUND_ONE",
  "EVALUATION_INPUT",
  "EVALUATION_SCENE",
  "MOMENTUM",
  "MOMENTUM_SOFT_PERMIT",
  "MOMENTUM_HARD_MANDATE",
  "STABILITY_LOCK",
  "SCENE_DIRECTIVE",
  "CANDIDATE",
  "AVAILABLE_ENTITIES",
  "TARGET_ENTITY",
  "FIELD_CONTEXT",
  "MEMORY_ADVISORY",
  "FACT",
  "INPUT_HISTORY",
  "CHAPTER_HISTORY",
  "TARGET",
  "SPATIAL_FRAMING",
  "CINEMATOGRAPHY",
  "TRUNCATION_NOTE",
  "FINISH_TAIL",
  "ENVIRONMENTAL_HINT",
  "ANTI_STAGING",
  "HELD_MOMENT",
  "ALTERNATION_OPTIONS",
  "AVAILABLE_KEYWORDS",
  "KEYWORD_DIRECTIVES",
];

const PROV = {
  SYSTEM: "prompts.js (envelope)",
  AXIOMATIC_CONSTITUTION: "constitution.js",
  LAW: "constitution.js",
  CORE_PROTOCOLS: "protocols.js",
  PERSPECTIVE: "protocols.js",
  AUTHORIAL_VOICE: "protocols.js",
  SIGNATURE_ELEMENTS: "protocols.js + narrative-styles.js",
  SOVEREIGNTY: "protocols.js",
  PROSE_DISCIPLINE: "protocols.js",
  TYPOGRAPHY: "protocols.js",
  SCENE_MOMENTUM: "protocols.js",
  NATURAL_DIALOGUE: "protocols.js",
  CONSTRAINTS: "protocols.js + reflex.js",
  LETHALITY: "reflex.js",
  AGENCY: "reflex.js",
  GENESIS: "reflex.js + director.js",
  OVERARCHING_QUESTS: "reflex.js",
  SYNTHETIC_FORMULAS: "reflex.js",
  CLICHES: "speaking-styles.js via protocols.js",
  EXHAUSTED_OPENINGS: "reflex.js",
  IMAGE_VOCABULARY: "protocols.js",
  TEXT_RENDERING: "protocols.js",
  VISUAL_STYLE: "visual-styles.js via optics.js",
  MEDIUM: "visual-styles.js",
  PALETTE: "visual-styles.js",
  TEXTURES: "visual-styles.js",
  ALTERNATION_OPTIONS: "macros.js via protocols.js (fires when entity text holds {A|B})",
  DYNAMIC_AXES: "dynamics.js",
  CALIBRATION: "dynamics.js",
  CHAOS: "dynamics.js",
  INTENSITY: "dynamics.js",
  OPENNESS: "dynamics.js",
  AFFINITY: "dynamics.js",
  VELOCITY: "dynamics.js",
  ENTROPY: "dynamics.js",
  ENTITIES: "entities.js",
  CHARACTER: "entities.js + sheets.js",
  FRACTAL: "entities.js + sheets.js",
  PSYCHOLOGY: "sheets.js",
  AGENDA: "sheets.js",
  PERSONALITY: "sheets.js",
  STATE: "sheets.js",
  RELATION: "sheets.js",
  APPEARANCE: "sheets.js",
  CURRENT_LOOK: "sheets.js",
  MEMORIES: "sheets.js",
  BACKSTORY: "sheets.js",
  TRAJECTORY: "sheets.js",
  PERMANENT_TRUTHS: "sheets.js",
  AVAILABLE_ENTITIES: "entities.js",
  CANDIDATE: "entities.js (pruned first past the 8000-char ENTITIES budget)",
  TARGET_ENTITY_CONTEXT: "entities.js + temporal.js",
  CAST: "entities.js",
  ENTITY: "entities.js",
  SUMMARY: "entities.js",
  FIELD_CONTEXT: "temporal.js",
  MEMORY_ADVISORY: "entities.js (facts: temporal.js resolve_settled_facts)",
  FACT: "entities.js",
  HISTORY: "history.js (convo) / sheets.js (fractal)",
  ACTION: "task.js / history.js (see parent)",
  TASK: "task.js",
  THINK_FORMAT: "task.js",
  THINK: "task.js",
  CURRENTS: "task.js",
  SENSORY_EXPERIENCE: "task.js + narrative-styles.js",
  SUBTEXT: "task.js + dynamics.js",
  SCENE_DIRECTIVE: "builder.js narrator path (PROSE.SCENE.* prose)",
  DELIVERY_POSTURE: "task.js + reflex.js",
  TEMPERAMENT: "reflex.js",
  CADENCE: "reflex.js",
  PACING: "reflex.js",
  BEAT_BUDGET: "reflex.js",
  RHYTHM: "narrative-styles.js",
  DRIVE: "reflex.js",
  FIRST_CONTACT: "reflex.js TURN_STATE (prose-only, not enveloped)",
  ROUND_ONE: "reflex.js TURN_STATE (prose-only, not enveloped)",
  EVALUATION_INPUT: "reflex.js TURN_STATE (prose-only)",
  EVALUATION_SCENE: "reflex.js TURN_STATE (prose-only)",
  MOMENTUM: "reflex.js render_momentum_directive_xml",
  MOMENTUM_SOFT_PERMIT: "reflex.js",
  MOMENTUM_HARD_MANDATE: "reflex.js",
  STABILITY_LOCK: "reflex.js (structural_errors 1–2)",
  TARGET: "task.js (optics tier)",
  SPATIAL_FRAMING: "task.js",
  CINEMATOGRAPHY: "task.js",
  SOLO_ENTITY: "entities.js (optics tier)",
  INPUT: "task.js (retired Wave 2)",
  DIRECTIVES: "task.js + prompts.js",
  STAGING: "prompts.js",
  SCENE_ADVANCEMENT: "prompts.js",
  TASK_INSTRUCTION: "prompts.js",
  KEYWORD_DIRECTIVES: "task.js (optics-scoped)",
  AVAILABLE_KEYWORDS: "task.js (optics-scoped)",
  OUTPUT_FORMAT: "output.js",
  ENVIRONMENTAL_HINT: "reflex.js CONDITIONALS (enveloped)",
};

const CONTENT_PARENTS = new Set([
  "AGENDA",
  "PERSONALITY",
  "STATE",
  "MEMORIES",
  "BACKSTORY",
  "TRAJECTORY",
  "PERMANENT_TRUTHS",
  "APPEARANCE",
  "CURRENT_LOOK",
]);
const CONTENT_ALLOW = new Set(["RELATION", "DYNAMIC_AXES", "CHAOS", "INTENSITY", "OPENNESS", "AFFINITY", "VELOCITY", "ENTROPY"]);

function is_schema_node(tag, parents, schema) {
  if (!schema.has(tag)) return false;
  if (CONTENT_ALLOW.has(tag)) return true;
  for (const p of parents) {
    if (CONTENT_PARENTS.has(p)) return false;
  }
  return true;
}

const PARENT_PROV = {
  HISTORY: "history.js",
  SUBTEXT: "dynamics.js (keyword-driven)",
  PSYCHOLOGY: "sheets.js",
};

function prov_for(tag, parents) {
  if (tag === "HISTORY") return parents.includes("FRACTAL") ? "sheets.js" : "history.js";
  if (tag === "ACTION") return parents.includes("HISTORY") ? "history.js" : "task.js";
  if (tag === "DYNAMIC_AXES") return parents.includes("PSYCHOLOGY") ? "sheets.js + dynamics.js" : "dynamics.js";
  if (PROV[tag]) return PROV[tag];
  for (let i = parents.length - 1; i >= 0; i -= 1) {
    if (PARENT_PROV[parents[i]]) return PARENT_PROV[parents[i]] + " (via parent)";
  }
  return "unattributed";
}

const TAG_RE = /<(\/?)([A-Z][A-Z0-9_]{1,})([^<>]*)>/g;

function parse_system(system) {
  const roots = [];
  const stack = [];
  const occurrences = [];
  let m;
  while ((m = TAG_RE.exec(system)) !== null) {
    const closing = m[1] === "/";
    const tag = m[2];
    const rest = m[3] || "";
    if (closing) {
      while (stack.length && stack[stack.length - 1].tag !== tag) stack.pop();
      if (stack.length) stack.pop();
      continue;
    }
    if (rest.trimEnd().endsWith("/")) {
      const node = { tag, attrs: rest.trim().slice(0, -1).trim(), children: [] };
      (stack.length ? stack[stack.length - 1].children : roots).push(node);
      occurrences.push({ node, parents: stack.map((n) => n.tag) });
      continue;
    }
    const node = { tag, attrs: rest.trim(), children: [] };
    (stack.length ? stack[stack.length - 1].children : roots).push(node);
    occurrences.push({ node, parents: stack.map((n) => n.tag) });
    stack.push(node);
  }
  return { roots, occurrences };
}

function check_problems(mode, system) {
  const problems = [];
  if (!system.endsWith("</SYSTEM>")) problems.push(mode + ": missing close");
  if ((system.match(/<TASK\b/g) || []).length !== 1) problems.push(mode + ": TASK count != 1");
  return problems;
}

function story_by_id(id) {
  return STORIES.find((s) => s.id === id);
}

function build_entities(trio) {
  return {
    AI: map_entity(get_premade_entity_by_id(trio.ai)),
    USER: map_entity(get_premade_entity_by_id(trio.user)),
    FRACTAL: map_entity(get_premade_entity_by_id(trio.fractal)),
  };
}

function patch_case(mode, ctx, sc, entities) {
  const c = { ...ctx };
  const snapshot = snapshot_for(entities, sc.chaos, sc.dyn ? DISSONANCE_DYN : null);
  c.round = sc.round;
  c.stagnation_turns = sc.stag;
  c.meta = { ...(c.meta || {}), stagnation_turns: sc.stag, keywords: sc.kw };
  c.director_data = { ...(c.director_data || {}), keywords: sc.kw, first_contact: sc.fc };
  if (sc.fc) c.is_first_contact = true;
  if (sc.stab) {
    c.stability_lock = resolve_stability_lock({ structural_errors: 2 });
    c.meta = { ...(c.meta || {}), structural_errors: 2 };
  }
  c.npc_entities = sc.cand;
  c.in_scene_ids = sc.inScene;
  if (c.entities) c.entities = entities;
  if (c.compressed_snapshot) c.compressed_snapshot = snapshot;
  if (c.snapshot) c.snapshot = snapshot;
  if (c.simulation_log) c.simulation_log = sc.beats;
  if (c.history) c.history = sc.beats;
  if (c.input) c.input = sc.input;
  if (mode === "continuum") {
    c.target_entity = entities.AI;
    c.other_entities = entities;
    c.history = sc.beats;
    if (sc.facts) c.memory_advisory_args = { enabled: true, facts: FACTS };
  }
  if (mode === "enhancement") c.entity = entities.AI;
  if (mode === "optics") {
    c.ai = entities.AI;
    c.fractal = entities.FRACTAL;
    c.entity = entities.AI;
  }
  return c;
}

function scenario_for(def) {
  const full_id = def.beats === "S2" ? "S2-stalemate" : def.beats === "S3" ? "S3-confrontation" : def.beats;
  const story = def.beats ? story_by_id(full_id) : null;
  const inputStory = story_by_id(def.input === "S1" ? "S1-first-contact" : def.input === "S2" ? "S2-stalemate" : "S3-confrontation");
  return {
    axis: def.axis,
    round: def.round,
    stag: def.stag,
    kw: def.kw,
    beats: story ? story.beats : [],
    input: def.inputText || inputStory.input,
    fc: def.fc,
    cand: def.cand ? [map_entity(get_premade_entity_by_id("elias")), map_entity(get_premade_entity_by_id("nova"))] : [],
    inScene: def.cand ? ["elias"] : [],
    facts: def.facts,
    chaos: def.chaos,
    dyn: def.dyn,
    stab: def.stab,
  };
}

function merge_node(parent_key, node, tag_index, schema) {
  if (node.tag === "RELATION") return null;
  const key = (parent_key ? parent_key + ">" : "") + node.tag;
  if (!is_schema_node(node.tag, parent_key ? parent_key.split(">") : [], schema)) return null;
  let entry = tag_index.get(key);
  if (!entry) {
    entry = { tag: node.tag, key, parents: parent_key ? parent_key.split(">") : [], attrs: node.attrs, children_keys: [], occ: [] };
    tag_index.set(key, entry);
  }
  if (!entry.attrs && node.attrs) entry.attrs = node.attrs;
  for (const child of node.children) {
    const child_entry = merge_node(key, child, tag_index, schema);
    if (child_entry && !entry.children_keys.includes(child_entry.key)) entry.children_keys.push(child_entry.key);
  }
  return entry;
}

function when_for(occ_list) {
  const axes = [...new Set(occ_list.map((o) => o.axis))];
  const in_base = axes.includes("base");
  if (axes.length === 1 && axes[0] === "live") return "live-run only (premade/real-data dependent)";
  if (in_base) {
    const needs_history = !occ_list.some((o) => o.axis === "nohistory");
    const missing = ALL_AXES.filter((a) => a !== "base" && a !== "live" && a !== "nohistory" && !axes.includes(a));
    const miss_s = missing.length ? " · except: " + missing.map((a) => AXIS_WHEN[a] || a).join(" / ") : "";
    return "always" + (needs_history ? " + requires non-empty history" : "") + miss_s;
  }
  return axes
    .filter((a) => a !== "live")
    .map((a) => AXIS_WHEN[a] || a)
    .join(" / ");
}

// -----------------------------------------------------------------------------
// Live Schema Sweep Engine
// -----------------------------------------------------------------------------

export function run_live_schema_sweep(options = {}) {
  const seed = (options && options.seed) || 7;
  const rng = mulberry32(seed);
  const problems = [];
  const schema = new Set(ASSERTED);
  for (const inv of Object.values(CONTRACT)) {
    for (const tag of inv.system || []) schema.add(tag);
  }
  const data_keys = new Map();
  let compiles = 0;
  const byte_table = {};

  const note_data = (tag, parents) => {
    const key = parents.join(">") + ">" + tag;
    data_keys.set(key, (data_keys.get(key) || 0) + 1);
  };

  const live_runs = STORIES.map((story) => {
    const ai = pick(rng, CHARS);
    const trio = { ai, user: pick(rng, CHARS, ai), fractal: pick(rng, FRACTALS) };
    const entities = build_entities(trio);
    const snapshot = snapshot_for(entities, story.chaos, null);
    const shared = {
      round: story.round,
      entities,
      input: story.input,
      simulation_log: story.beats,
      history: story.beats,
      raw_messages: story.beats,
      stagnation_turns: story.stag,
      meta: { stagnation_turns: story.stag, keywords: story.kw },
      director_data: { keywords: story.kw, first_contact: story.fc },
      compressed_snapshot: snapshot,
      snapshot,
      explicit_narrative_style: entities.FRACTAL?.narrative_style || "gothic",
    };
    if (story.fc) shared.is_first_contact = true;
    const out = {};
    for (const mode of ["director", "interaction"]) {
      const pkg = compile_prompt(mode, shared);
      compiles += 1;
      problems.push(...check_problems("live-" + story.id + "-" + mode, String(pkg.system || "")));
      out[mode] = String(pkg.system || "");
    }
    return { story, trio, director: out.director, character: out.interaction };
  });

  const fixed_entities = build_entities(FIXED_TRIO);
  const tag_index = new Map();
  const cases = make_contract_cases();
  for (const sc_def of SWEEP) {
    const sc = scenario_for(sc_def);
    for (const [mode, [mode_key, ctx]] of Object.entries(cases)) {
      const patched = patch_case(mode, ctx, sc, fixed_entities);
      let system;
      try {
        system = String(compile_prompt(mode_key, patched).system || "");
      } catch (error) {
        problems.push(mode + "@" + sc.axis + " THREW: " + String((error && error.message) || error));
        continue;
      }
      compiles += 1;
      byte_table[mode + "@" + sc.axis] = system.length;
      problems.push(...check_problems(mode + "@" + sc.axis, system));
      const { roots, occurrences } = parse_system(system);
      for (const root of roots) merge_node(null, root, tag_index, schema);
      for (const o of occurrences) {
        if (o.node.tag === "RELATION") continue;
        if (!is_schema_node(o.node.tag, o.parents, schema)) {
          note_data(o.node.tag, o.parents);
          continue;
        }
        const key = [...o.parents, o.node.tag].join(">");
        const entry = tag_index.get(key);
        if (entry) entry.occ.push({ mode, axis: sc.axis });
      }
    }
  }
  for (const run of live_runs) {
    for (const [mode, system] of [
      ["director", run.director],
      ["interaction", run.character],
    ]) {
      const { roots, occurrences } = parse_system(system);
      for (const root of roots) merge_node(null, root, tag_index, schema);
      for (const o of occurrences) {
        if (o.node.tag === "RELATION") continue;
        if (!is_schema_node(o.node.tag, o.parents, schema)) {
          note_data(o.node.tag, o.parents);
          continue;
        }
        const key = [...o.parents, o.node.tag].join(">");
        const entry = tag_index.get(key);
        if (entry) entry.occ.push({ mode: mode + " (live)", axis: "live" });
      }
    }
  }

  const MODE_ORDER = ["continuum", "director", "enhancement", "ghostwrite", "interaction", "narrator", "npc", "optics", "sorting"];
  function short_mode(m) {
    const s = String(m).replace(" (live)", "");
    return s === "director_terse" ? "director" : s;
  }
  function mode_labels(modes) {
    const norm = [...new Set(modes.map(short_mode))];
    const rest = norm.filter((m) => m !== "narrator" && m !== "narrator_epilogue" && m !== "narrator_prologue");
    const epi = norm.includes("narrator_epilogue");
    const pro = norm.includes("narrator_prologue");
    if (norm.includes("narrator") || epi || pro) {
      const which = [epi ? "epilogue" : null, pro ? "prologue" : null].filter(Boolean);
      rest.push(which.length ? "narrator (" + which.join(" & ") + ")" : "narrator");
    }
    const rank = (m) => MODE_ORDER.indexOf(m.startsWith("narrator") ? "narrator" : m);
    rest.sort((a, b) => rank(a) - rank(b));
    return rest;
  }
  function compact_when(when) {
    if (when === "always") return "always active";
    if (when.startsWith("always")) return when.replace("always", "always active").replace("\u00b7 except:", "except");
    if (when.startsWith("live-run only")) return when;
    return when + " active";
  }

  const lines = [];
  lines.push("### Combinatorial Tag Tree & Trigger Matrix");
  lines.push("");
  lines.push("Seed `" + seed + "` · " + compiles + " live compiles · fixed sweep trio `silvers / julien / ashenweald`.");
  lines.push(
    "Every tag below was observed in real compiled output across prompt modes. Annotations specify mode presence, triggering conditions, and module sources.",
  );
  lines.push("");
  lines.push("#### Observed Live Tag Tree");
  lines.push("");

  const render_entry = (entry, depth) => {
    const modes = mode_labels(entry.occ.map((o) => o.mode));
    const pad = "  ".repeat(depth);
    if (depth === 0) {
      lines.push(pad + "<" + entry.tag + ">" + modes.join(", "));
      for (const ck of entry.children_keys) {
        const child = tag_index.get(ck);
        if (child) render_entry(child, depth + 1);
      }
      lines.push(pad + "</" + entry.tag + ">");
      return;
    }
    if (!entry.children_keys.length) {
      const when = compact_when(when_for(entry.occ));
      lines.push(
        pad + "<" + entry.tag + ">" + modes.join(", ") + ", " + when + " from " + prov_for(entry.tag, entry.parents) + "</" + entry.tag + ">",
      );
      return;
    }
    lines.push(pad + "<" + entry.tag + ">");
    for (const ck of entry.children_keys) {
      const child = tag_index.get(ck);
      if (child) render_entry(child, depth + 1);
    }
    lines.push(pad + "</" + entry.tag + ">");
  };
  for (const key of [...tag_index.keys()].filter((k) => !k.includes(">"))) {
    render_entry(tag_index.get(key), 0);
  }
  lines.push("");
  lines.push("#### Conditional Directives");
  lines.push("");
  for (const entry of [...tag_index.values()].sort((a, b) => (a.key < b.key ? -1 : 1))) {
    const when = when_for(entry.occ);
    if (when === "always" || when.startsWith("always")) continue;
    const modes = [...new Set(entry.occ.map((o) => o.mode))].sort();
    lines.push("- `" + entry.key + "` — when: " + when + " · modes: " + modes.join(", ") + " · src: " + prov_for(entry.tag, entry.parents));
  }
  lines.push("");
  lines.push("#### Verification Spectrum");
  lines.push("");
  const seen_tags = new Set();
  for (const entry of tag_index.values()) seen_tags.add(entry.tag);
  const wanted = [
    "MOMENTUM_SOFT_PERMIT",
    "MOMENTUM_HARD_MANDATE",
    "MOMENTUM",
    "CANDIDATE",
    "FACT",
    "MEMORY_ADVISORY",
    "HISTORY",
    "STABILITY_LOCK",
    "TARGET",
    "SPATIAL_FRAMING",
    "GENESIS",
    "AGENCY",
    "DISSONANCE",
    "INSTABILITY",
    "ALTERNATION_OPTIONS",
    "KEYWORD_DIRECTIVES",
    "ENVIRONMENTAL_HINT",
  ];
  for (const tag of wanted) {
    lines.push("- `" + tag + "`: " + (seen_tags.has(tag) ? "fired live" : "did NOT fire headless"));
  }
  const retired = ["INPUT", "ENTRY", "PREVIOUS_TURN", "CURRENT_TURN", "GROUNDING", "ROUTING_RULES"];
  for (const tag of retired) {
    lines.push("- `" + tag + "`: " + (seen_tags.has(tag) ? "PRESENT (retirement violated)" : "confirmed absent"));
  }
  lines.push("");
  lines.push("#### Data Keys");
  lines.push("");
  lines.push(
    [...data_keys.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 60)
      .map(([k, n]) => "`" + k + "` ×" + n)
      .join(", "),
  );
  lines.push("");
  lines.push("Total data-key occurrences: " + [...data_keys.values()].reduce((a, b) => a + b, 0));
  lines.push("");

  const matrix_tables = generate_prompt_atom_matrix(tag_index, MODE_ORDER);

  const conditional_count = [...tag_index.values()].filter((e) => {
    const w = when_for(e.occ);
    return w !== "always" && !w.startsWith("always");
  }).length;
  return {
    markdown: lines.join("\n"),
    atom_matrix_markdown: matrix_tables,
    stats: {
      seed,
      compiles,
      tagsObserved: tag_index.size,
      conditionalTags: conditional_count,
      dataKeys: data_keys.size,
      directorCandidatesBytes: byte_table["director@candidates"] || 0,
    },
    problems,
  };
}

/**
 * Generates the Prompt Atom Manifest and Mutual-Exclusion & Co-Existence Grid tables.
 * @param {Map<string, any>} tag_index
 * @param {string[]} mode_order
 * @returns {string}
 */
export function generate_prompt_atom_matrix(tag_index, mode_order) {
  const table_lines = [];

  table_lines.push("## PART III: PROMPT ATOM & MUTUAL-EXCLUSION MATRIX");
  table_lines.push("");
  table_lines.push("### Table 1: Comprehensive Atom Manifest");
  table_lines.push("");
  table_lines.push("| XML Atom / Tag | Containing Modes | Attributes / Parameters | Sample Structure / Representation |");
  table_lines.push("| :--- | :--- | :--- | :--- |");

  // Collect distinct tags
  const distinct_tags = new Map();
  for (const entry of tag_index.values()) {
    if (!distinct_tags.has(entry.tag)) {
      distinct_tags.set(entry.tag, entry);
    }
  }

  for (const [tag, entry] of [...distinct_tags.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const modes = [...new Set(entry.occ.map((o) => String(o.mode).replace(" (live)", "").replace("director_terse", "director")))]
      .filter((m) => mode_order.includes(m))
      .sort((a, b) => mode_order.indexOf(a) - mode_order.indexOf(b));

    const attrs = entry.attrs ? "`" + entry.attrs.replace(/\|/g, "\\|") + "`" : "*none*";
    const sample = "`<" + tag + (entry.attrs ? " " + entry.attrs.split(" ")[0] : "") + ">Bla bla bla...</" + tag + ">`";
    table_lines.push(`| \`<${tag}>\` | ${modes.map((m) => `\`${m}\``).join(", ") || "*all*"} | ${attrs} | ${sample} |`);
  }

  table_lines.push("");
  table_lines.push("### Table 2: Cross-Mode Mutual-Exclusion & Co-Existence Matrix");
  table_lines.push("");
  table_lines.push("| Prompt Mode | Active XML Atoms | Mutually Exclusive With | Core Mission & Role |");
  table_lines.push("| :--- | :--- | :--- | :--- |");

  const mode_summaries = {
    director: {
      role: "Shot 1 Turn Orchestration & Directorial Staging",
      exclusive: "prose-only tags (`<CURRENTS>`, `<AUTHORIAL_VOICE>`, `<DELIVERY_POSTURE>`)",
    },
    interaction: {
      role: "Shot 2A Canonical In-Character Companion Voice",
      exclusive: 'director JSON output (`<OUTPUT_FORMAT mode="json">`), optics cinematography',
    },
    npc: {
      role: "Shot 2A Supporting / Cast World Entity Voice",
      exclusive: "director JSON output, solo companion ego",
    },
    narrator: {
      role: "Shot 2A World / Setting Voice & Scene Transitions",
      exclusive: "director JSON output, first-person character POV",
    },
    ghostwrite: {
      role: "User Persona Turn Drafting (Player Voice Assist)",
      exclusive: "director JSON output, AI companion ego",
    },
    continuum: {
      role: "Shot 2B Memory Forge Temporal Consolidation",
      exclusive: "narrative prose streaming, real-time input history",
    },
    optics: {
      role: "Sensory Staging & Diffusion Image Synthesis",
      exclusive: "dialogue generation, director JSON output",
    },
    enhancement: {
      role: "Single Profile Field Expansion (Magic Wand)",
      exclusive: "full conversation history, multi-turn dynamics",
    },
    sorting: {
      role: "Raw Profile Text Ingestion & Structuring",
      exclusive: "real-time turn progression, narrative styles",
    },
  };

  for (const mode of mode_order) {
    const info = mode_summaries[mode] || { role: "Simulation subsystem", exclusive: "None" };
    const active_tags = [...distinct_tags.values()]
      .filter((entry) => entry.occ.some((o) => String(o.mode).replace(" (live)", "").replace("director_terse", "director") === mode))
      .map((entry) => `\`<${entry.tag}>\``)
      .slice(0, 10);

    const tag_str = active_tags.join(", ") + (active_tags.length >= 10 ? ", *...*" : "");
    table_lines.push(`| **\`${mode}\`** | ${tag_str} | ${info.exclusive} | ${info.role} |`);
  }

  table_lines.push("");
  return table_lines.join("\n");
}

// -----------------------------------------------------------------------------
// Core Simulation Audit Orchestrator
// -----------------------------------------------------------------------------

export const SimulationAudit = {
  /**
   * Executes a complete intelligence cycle.
   * @param {string} input - The user prompt/action.
   * @param {object} scenario - Metadata containing entities and world state.
   * @param {object} [overrides] - Optional overrides for dynamics, flags, etc.
   */
  async execute_turn(input, scenario, overrides = {}) {
    await ensure_simulation_dependencies();
    // 1. PHASE 1: HYDRATION (Context Assembly)
    const raw_entities = await this.resolve_entities(scenario);
    const history = scenario.history || [];

    // Construct the payload as expected by the context_builder
    const payload = await context_builder.build_context(input, "simulation", history);

    // Map scenario entities to the flattened Kernel structure (Role -> Data)
    for (const [key, data] of Object.entries(raw_entities)) {
      const role = key.toUpperCase();
      payload.entities[role] = map_entity(data);
    }

    // Ensure raw_messages is available for Director's AI_LAST_TURN block
    payload.raw_messages = history;

    // Wire stagnation turns, narrative style, and keywords for full conditional prompt coverage
    const stagnation_turns = overrides.stagnation_turns ?? scenario.stagnation_turns ?? 8;
    const explicit_narrative_style =
      overrides.explicit_narrative_style ?? scenario.explicit_narrative_style ?? payload.entities.FRACTAL?.narrative_style ?? "gothic";
    const keywords = overrides.keywords ?? scenario.keywords ?? ["MASKING", "SUSPICION"];

    payload.stagnation_turns = stagnation_turns;
    payload.explicit_narrative_style = explicit_narrative_style;
    payload.meta = {
      ...(payload.meta || {}),
      stagnation_turns,
      keywords,
    };
    payload.director_data = {
      ...(payload.director_data || {}),
      keywords,
    };

    // 2. PHASE 2: PHYSICS (Snapshot Construction)
    const snapshot = {
      ai: {
        dynamics: overrides.ai_dynamics ||
          raw_entities.ai?.dynamics || {
            chaos: 50,
            openness: 50,
            intensity: 50,
            affinity: 50,
          },
      },
      fractal: {
        dynamics: overrides.fractal_dynamics ||
          raw_entities.fractal?.dynamics || {
            velocity: 50,
            entropy: 50,
          },
      },
      flags: overrides.flags || [],
    };

    // 3. PHASE 3: SYNTHESIS (Prompt Construction)
    const director_prompt = compile_prompt("director", {
      ...payload,
      compressed_snapshot: snapshot,
      stagnation_turns,
    });
    const character_prompt = compile_prompt("interaction", {
      ...payload,
      snapshot,
      stagnation_turns,
      explicit_narrative_style,
      director_data: { keywords },
    });

    // 4. PHASE 4: VERIFICATION (Pipeline Feature Audit)
    const verification = this.verify_pipeline(director_prompt, character_prompt);

    return {
      payload,
      snapshot,
      director_prompt: director_prompt.system,
      character_prompt: character_prompt.system,
      verification,
    };
  },

  /**
   * Verifies that the generated prompts contain all expected pipeline features.
   * Prompts are compiled closed envelopes where task layers are sealed inside system.
   * @param {{ system: string }} director
   * @param {{ system: string }} character
   * @returns {{ passed: string[], failed: string[] }}
   */
  verify_pipeline(director, character) {
    const passed = [];
    const failed = [];

    const check = (name, condition) => {
      if (condition) passed.push(name);
      else failed.push(name);
    };

    // --- Director (Shot 1) Feature Verification ---
    check("director:system_has_role_line", director.system.includes("You are the Director"));
    check("director:system_has_DYNAMIC_AXES", director.system.includes("<DYNAMIC_AXES"));
    check("director:system_has_ENTITIES", director.system.includes("<ENTITIES>"));
    check("director:system_has_CONSTRAINTS", director.system.includes("<CONSTRAINTS>"));
    check("director:task_has_schema_keywords", director.system.includes('"keywords": ["<1-5 from:'));
    check(
      "director:system_no_empty_protocols",
      !director.system.includes("<CORE_PROTOCOLS></CORE_PROTOCOLS>") && !director.system.includes("<CORE_PROTOCOLS>\n  </CORE_PROTOCOLS>"),
    );
    check("director:task_has_JSON_schema", director.system.includes('"_thought_process"'));
    check("director:task_has_next_action", director.system.includes('"next_action"'));
    check("director:task_has_keywords", director.system.includes('"keywords"'));
    check("director:task_has_dynamics_deltas", director.system.includes("dynamics_deltas"));
    check("director:task_has_visual_staging", director.system.includes('"visual_staging"'));
    check("director:task_has_spotlight_schema", director.system.includes('"spotlight"'));

    // --- Character (Shot 2) Feature Verification ---
    check("character:system_has_AXIOMATIC_CONSTITUTION", character.system.includes("<AXIOMATIC_CONSTITUTION>"));
    check("character:system_has_CORE_PROTOCOLS", character.system.includes("<CORE_PROTOCOLS>"));
    check("character:system_has_AUTHORIAL_VOICE", character.system.includes("<AUTHORIAL_VOICE"));
    check("character:system_has_ENTITIES", character.system.includes("<ENTITIES>"));

    // Prefix-cache & Task Verification:
    check("character:system_lacks_dynamics_attrs", !character.system.includes("chaos="));
    check("character:system_lacks_PRESENT", !character.system.includes("<PRESENT>"));
    check("character:task_has_ENTRY", character.system.includes("<ENTRY"));
    check("character:task_has_CURRENTS", character.system.includes("<CURRENTS>"));
    check("character:task_has_DELIVERY_POSTURE", character.system.includes("<DELIVERY_POSTURE>"));
    check("character:task_has_SUBTEXT", character.system.includes("<SUBTEXT>"));
    check("character:task_has_MOMENTUM_SOFT_PERMIT", character.system.includes("<MOMENTUM_SOFT_PERMIT>"));
    check("character:task_has_THINK", character.system.includes("<THINK>"));
    check("character:task_has_CONSTRAINTS", character.system.includes("<CONSTRAINTS>"));

    return { passed, failed };
  },

  /**
   * Resolves entity data from IDs or static premades.
   */
  async resolve_entities(scenario) {
    await ensure_simulation_dependencies();
    const result = {};
    const types = ["ai", "user", "fractal"];

    for (const type of types) {
      const entity_id = scenario[type + "_id"];
      if (entity_id) {
        const found = get_premade_entity_by_id(entity_id);
        if (found) {
          result[type] = found;
        }
      } else if (scenario[type]) {
        result[type] = scenario[type];
      }
    }

    return result;
  },

  /**
   * Runs the full live schema sweep across all prompt modes and fixtures.
   */
  run_schema_sweep(options = {}) {
    return run_live_schema_sweep(options);
  },
};

// =============================================================================
// CHANGELOG
// =============================================================================

/**
 * CHANGELOG:
 * - 2026-10-18: Consolidated live-schema-sweep.js and simulation-audit.js into a single unified simulation audit suite with shared entity mapping and consolidated reporting.
 * - 2026-10-14: Added direct Node CLI execution delegation to Vitest and lazy-loaded Vite/Svelte dependencies so 'node .agents/skills/simulation/scripts/simulation-audit.js' runs seamlessly from the terminal.
 * - 2026-10-14: Wave 2 — Updated pipeline verification to validate schema-co-located keywords and unified character <CONSTRAINTS> layer, retiring stale director:task_has_KEYWORD_DIRECTIVES check.
 * - 2026-09-24: Updated context_builder import from retired payload.js to builder.js under P4 Zero Backwards Compatibility.
 * - 2026-09-19: Retired stale character:system_has_DYNAMIC_AXES verification check — DYNAMIC_AXES are now exclusively in the Director shot's <DYNAMICS> envelope.
 * - 2026-09-19: Replaced director:system_has_CORE_PROTOCOLS with director:system_no_empty_protocols per R1/R5 dynamic protocol omission.
 * - 2026-09-18: Standardized verification checks to match scrobbles.md blueprint (<ENTITIES>, <CORE_PROTOCOLS>).
 */
