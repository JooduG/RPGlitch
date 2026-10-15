/**
 * @file live-schema-sweep.js
 * Live prompt XML schema sweep: compiles every prompt mode through the real
 * compile_prompt pipeline across seeded premade-trio + story + trigger fixtures.
 * Run with: npx vitest run .agents/skills/simulation/scripts/live-schema-sweep.test.js
 * (optional: SWEEP_SEED=12 to re-roll the random trio/story pairings)
 */

import { compile_prompt } from "../../../../src/intelligence/prompts.js";
import { make_contract_cases, CONTRACT } from "../../../../src/intelligence/prompt-verification.js";
import { get_premade_entity_by_id } from "../../../../src/data/definitions/premade-entities.js";
import { resolve_stability_lock } from "../../../../src/intelligence/modules/reflex.js";

const CHARS = ["orion", "glitch", "silvers", "hank", "elias", "julien", "beast", "nova"];
const FRACTALS = ["ashenweald", "tartarus"];
const FIXED_TRIO = { ai: "silvers", user: "julien", fractal: "ashenweald" };
const DISSONANCE_DYN = { ai: { chaos: 30, intensity: 70, openness: 40, affinity: 20 }, fractal: { velocity: 50, entropy: 80 } };

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

function enrich_vector(v) {
  if (!v || typeof v !== "object") return v;
  return { ...v, category: v.category || "event" };
}

function map_premade(data) {
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

function snapshot_for(entities, chaos, dyn_override) {
  const ai_dyn = dyn_override ? { ...dyn_override.ai } : { ...(entities.AI?.dynamics || {}) };
  if (chaos) ai_dyn.chaos = chaos;
  return {
    ai: { dynamics: ai_dyn },
    fractal: { dynamics: dyn_override ? { ...dyn_override.fractal } : { ...(entities.FRACTAL?.dynamics || {}) } },
    flags: {},
  };
}

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
};

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
  IMAGE_VOCABULARY: "optics.js",
  TEXT_RENDERING: "optics.js",
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
  TARGET: "optics.js",
  SPATIAL_FRAMING: "optics.js",
  CINEMATOGRAPHY: "optics.js",
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

function attr_names(attrs) {
  const out = [];
  const re = /([a-zA-Z_][a-zA-Z0-9_-]*)=/g;
  let m;
  while ((m = re.exec(attrs)) !== null) {
    if (!out.includes(m[1])) out.push(m[1]);
  }
  return out;
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
    AI: map_premade(get_premade_entity_by_id(trio.ai)),
    USER: map_premade(get_premade_entity_by_id(trio.user)),
    FRACTAL: map_premade(get_premade_entity_by_id(trio.fractal)),
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
    input: inputStory.input,
    fc: def.fc,
    cand: def.cand ? [map_premade(get_premade_entity_by_id("elias")), map_premade(get_premade_entity_by_id("nova"))] : [],
    inScene: def.cand ? ["elias"] : [],
    facts: def.facts,
    chaos: def.chaos,
    dyn: def.dyn,
    stab: def.stab,
  };
}

function merge_node(parent_key, node, tag_index, schema) {
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
    return "always" + (needs_history ? " + requires non-empty history" : "");
  }
  return axes
    .filter((a) => a !== "live")
    .map((a) => AXIS_WHEN[a] || a)
    .join(" / ");
}

export function run_sweep(options = {}) {
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
      // eslint-disable-next-line no-useless-assignment
      let system = "";
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

  const lines = [];
  lines.push("# Live Prompt XML Schema Report");
  lines.push("");
  lines.push("Seed `" + seed + "` · " + compiles + " live compiles · fixed sweep trio `silvers / julien / ashenweald`.");
  lines.push("Every tag below was observed in real compiled output. Content is stripped to attr names; annotations carry modes, trigger, source.");
  lines.push("Data-driven bracket keys (HAIR, BIND, FAME…) are NOT schema — counted separately in Part 5.");
  lines.push("");
  lines.push("## Part 1 — Live runs (random trio × story)");
  lines.push("");
  for (const run of live_runs) {
    lines.push("### " + run.story.id + " — " + run.story.label);
    lines.push("");
    lines.push(
      "Trio `AI=" +
        run.trio.ai +
        " / USER=" +
        run.trio.user +
        " / FRACTAL=" +
        run.trio.fractal +
        "` · round " +
        run.story.round +
        " · stagnation " +
        run.story.stag +
        " · keywords [" +
        run.story.kw.join(", ") +
        "].",
    );
    lines.push("");
    lines.push("Director (" + run.director.length + "b):");
    lines.push("");
    lines.push("```xml");
    lines.push(run.director);
    lines.push("```");
    lines.push("");
    lines.push("Character (" + run.character.length + "b):");
    lines.push("");
    lines.push("```xml");
    lines.push(run.character);
    lines.push("```");
    lines.push("");
  }
  lines.push("## Part 2 — Merged tag tree (content stripped, triggers annotated)");
  lines.push("");
  lines.push("```xml");
  const render_entry = (entry, depth) => {
    const modes = [...new Set(entry.occ.map((o) => o.mode))].sort();
    const when = when_for(entry.occ);
    const attrs = attr_names(entry.attrs);
    const attr_s = attrs.length ? " " + attrs.join(" ") : "";
    const pad = "  ".repeat(depth);
    lines.push(
      pad +
        "<" +
        entry.tag +
        attr_s +
        "> <!-- modes: " +
        modes.join(", ") +
        " · when: " +
        when +
        " · src: " +
        prov_for(entry.tag, entry.parents) +
        " -->",
    );
    for (const ck of entry.children_keys) {
      const child = tag_index.get(ck);
      if (child) render_entry(child, depth + 1);
    }
    lines.push(pad + "</" + entry.tag + ">");
  };
  for (const key of [...tag_index.keys()].filter((k) => !k.includes(">"))) {
    render_entry(tag_index.get(key), 0);
  }
  lines.push("```");
  lines.push("");
  lines.push("## Part 3 — Conditionals (tags that only fire under trigger states)");
  lines.push("");
  for (const entry of [...tag_index.values()].sort((a, b) => (a.key < b.key ? -1 : 1))) {
    const when = when_for(entry.occ);
    if (when === "always" || when.startsWith("always")) continue;
    const modes = [...new Set(entry.occ.map((o) => o.mode))].sort();
    lines.push("- `" + entry.key + "` — when: " + when + " · modes: " + modes.join(", ") + " · src: " + prov_for(entry.tag, entry.parents));
  }
  lines.push("");
  lines.push("## Part 4 — Fired / missed / retired / prose-only");
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
  lines.push("Prose-only triggers (real conditions, no XML tag — get_reflex_atom returns body text unless enveloped):");
  lines.push("- `FIRST_CONTACT` — strangers + director_data.first_contact (builder) / is_first_contact param (compile); prose inside DIRECTIVES.");
  lines.push("- `ROUND_ONE` — round ≤ 1; prose inside director DIRECTIVES group.");
  lines.push("- `EVALUATION_INPUT / EVALUATION_SCENE` — has_input true/false; prose inside director DIRECTIVES group.");
  lines.push("- `SCENE_DIRECTIVE` — narrator builder path only (PROSE.SCENE.* prose via builder.js normalize_narrator_context).");
  lines.push("- `ANTI_STAGING / HELD_MOMENT` — reflex prose conditionals, never enveloped.");
  lines.push("- `TRUNCATION_NOTE / FINISH_TAIL` — runtime recovery path only, not compile-time.");
  lines.push("");
  lines.push("Known headless gaps (mechanism verified, unreachable with blueprint fixtures):");
  lines.push(
    "- `CANDIDATE` — director manifest allows it, but the 8000-char ENTITIES budget prunes candidates first; full premade trios always exceed it (director@candidates " +
      (byte_table["director@candidates"] || "?") +
      "b system).",
  );
  lines.push(
    "- `MEMORY_ADVISORY>FACT` — needs vectorized memory (past[] origin vectors or closed chapter nodes via resolve_settled_facts); blueprints carry ledger text, not vectors.",
  );
  lines.push("");
  const contract_only = [];
  for (const [mode, inv] of Object.entries(CONTRACT)) {
    for (const tag of inv.system || []) {
      if (!seen_tags.has(tag)) contract_only.push(mode + ":" + tag);
    }
  }
  lines.push("Contract-inventoried but unobserved with premade fixtures: " + ([...new Set(contract_only)].join(", ") || "none"));
  lines.push("");
  lines.push("## Part 5 — Data keys (content, not schema)");
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
  lines.push(
    "Caveat: prose inside directives may mention tags (e.g. `<THINK>`) that parse as nodes; such phantoms inherit their textual parent. Provenance is layer-attributed (static), presence and triggers are live.",
  );
  lines.push("");
  const conditional_count = [...tag_index.values()].filter((e) => {
    const w = when_for(e.occ);
    return w !== "always" && !w.startsWith("always");
  }).length;
  return {
    markdown: lines.join("\n"),
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
