import { describe, expect, it } from "vitest";
import {
  ROLE_LIBRARY,
  ROLE_DEFAULTS,
  get_role_atom,
  resolve_system_role_line,
  PROMPT_LAYERS,
  resolve_system_plan,
  render_system_plan,
  render_system_xml,
  compose_system,
  pack_prompt,
  resolve_prompt_meta,
} from "./system.js";

describe("ROLE_LIBRARY and get_role_atom", () => {
  it("holds all eight frozen role atoms", () => {
    expect(Object.keys(ROLE_LIBRARY).sort()).toEqual([
      "CONTINUUM_CARETAKER",
      "DIRECTOR",
      "ENHANCER",
      "INTERACTION",
      "NARRATIVE_STRUCTURER",
      "NARRATOR",
      "NPC",
      "SENSORY_CORTEX",
    ]);
    expect(Object.isFrozen(ROLE_LIBRARY)).toBe(true);
    expect(ROLE_DEFAULTS.ENHANCER).toEqual({ enhancer_name: "GENERAL" });
  });

  it("interpolates role templates byte-identically to the retired factories", () => {
    expect(get_role_atom("INTERACTION", { speaker_name: "Alice", listener_name: "Bob", fractal_name: "Neo-Tokyo" })).toBe(
      "You are Alice within FRACTAL Neo-Tokyo, interacting with Bob.",
    );
    expect(get_role_atom("NPC", { speaker_name: "Guard", listener_name: "Bob", fractal_name: "Neo-Tokyo" })).toBe(
      "You are Guard, a supporting character within FRACTAL Neo-Tokyo, interacting with Bob.",
    );
    expect(get_role_atom("NARRATOR", { speaker_name: "The Void" })).toBe("You are The Void, the Fractal itself, narrating the story.");
    expect(get_role_atom("DIRECTOR")).toBe("You are the Director orchestrating simulation mechanics and staging.");
    expect(get_role_atom("CONTINUUM_CARETAKER", { target_name: "Alice" })).toBe(
      'You are the Continuum Caretaker for target entity "Alice". Consolidate temporal state from recent events.',
    );
    expect(get_role_atom("NARRATIVE_STRUCTURER")).toBe("You are the Narrative Structurer, extracting profile fragments from narrative prose.");
    expect(get_role_atom("ENHANCER", { enhancer_name: "PHYSICAL" })).toBe(
      "You are the PHYSICAL Profile Enhancer, refining target profile dimensions.",
    );
    expect(get_role_atom("SENSORY_CORTEX")).toBe("You are the Sensory Cortex synthesizing visual staging and descriptive optics.");
  });

  it("resolves case-insensitively with INTERACTION fallback", () => {
    expect(get_role_atom("director")).toBe("You are the Director orchestrating simulation mechanics and staging.");
    expect(get_role_atom("unknown_role", { speaker_name: "X", listener_name: "Y", fractal_name: "Z" })).toBe(
      "You are X within FRACTAL Z, interacting with Y.",
    );
  });

  it("resolves missing slots to empty string and ENHANCER to GENERAL", () => {
    expect(get_role_atom("INTERACTION", {})).toBe("You are  within FRACTAL , interacting with .");
    expect(get_role_atom("ENHANCER", {})).toBe("You are the GENERAL Profile Enhancer, refining target profile dimensions.");
    expect(get_role_atom("ENHANCER", { enhancer_name: undefined })).toBe("You are the GENERAL Profile Enhancer, refining target profile dimensions.");
    expect(get_role_atom("NARRATOR", { speaker_name: null })).toBe("You are , the Fractal itself, narrating the story.");
  });
});

describe("resolve_system_role_line", () => {
  it("delegates to the role catalog with INTERACTION default", () => {
    expect(resolve_system_role_line({ role: "director" })).toBe("You are the Director orchestrating simulation mechanics and staging.");
    expect(resolve_system_role_line({})).toBe("You are  within FRACTAL , interacting with .");
    expect(resolve_system_role_line()).toBe("You are  within FRACTAL , interacting with .");
  });
});

describe("resolve_system_plan and render_system_plan", () => {
  const config = { system: { mode: "director" }, layers: { system: ["role", "core_protocols"] } };
  const state = { role_line: "You are the Director.", core_protocols: "Rules", dynamics: "Axes" };

  it("resolves a frozen plan bounded by the manifest layer list", () => {
    const plan = resolve_system_plan(config, state, { round: 3 });
    expect(plan).toEqual({ tag: "SYSTEM", mode: "director", round: 3, attributes: {}, children: ["You are the Director.", "Rules"] });
    expect(Object.isFrozen(plan)).toBe(true);
    expect(Object.isFrozen(plan.children)).toBe(true);
  });

  it("renders the open envelope without a closing tag", () => {
    const xml = render_system_plan(resolve_system_plan(config, state, { round: 3 }));
    expect(xml).toContain("<SYSTEM");
    expect(xml).toContain("You are the Director.");
    expect(xml).not.toContain("</SYSTEM>");
  });

  it("renders an empty string for a missing plan", () => {
    expect(render_system_plan(null)).toBe("");
  });

  it("compose_system threads the plan to the renderer", () => {
    expect(compose_system(config, state, { round: 3 })).toBe(render_system_plan(resolve_system_plan(config, state, { round: 3 })));
  });
});

describe("render_system_xml", () => {
  it("renders the open envelope with round and mode attributes", () => {
    const xml = render_system_xml({ mode: "interaction", round: 1, children: ["<ROLE>You are Alice.</ROLE>"] });
    expect(xml).toContain('<SYSTEM round="1" mode="interaction">');
    expect(xml).toContain("<ROLE>You are Alice.</ROLE>");
    expect(xml).not.toContain("</SYSTEM>");
  });

  it("carries extra attributes onto the open tag", () => {
    const xml = render_system_xml({ mode: "continuum", attributes: { target: "Alice" }, children: ["Body"] });
    expect(xml).toContain('target="Alice"');
  });
});

describe("pack_prompt and resolve_prompt_meta", () => {
  it("seals the task inside the closed envelope", () => {
    const sealed = pack_prompt({ system: "<SYSTEM begins>", task: "<TASK>Go.</TASK>" }, {});
    expect(sealed.system).toBe("<SYSTEM begins>\n\n<TASK>Go.</TASK>\n</SYSTEM>");
    expect(sealed).not.toHaveProperty("meta");
  });

  it("closes a taskless system and carries non-empty meta", () => {
    const sealed = pack_prompt({ system: "<SYSTEM begins>", task: "" }, { ai: { intensity: 1 } });
    expect(sealed.system).toBe("<SYSTEM begins>\n</SYSTEM>");
    expect(sealed.meta).toEqual({ ai: { intensity: 1 } });
  });

  it("normalizes the canonical package meta shape", () => {
    expect(resolve_prompt_meta({ ai: "A", fractal: "F", flags: "G", role: "npc", entity_id: "E" })).toEqual({
      ai: "A",
      fractal: "F",
      flags: "G",
      role: "npc",
      entity_id: "E",
    });
    expect(resolve_prompt_meta()).toEqual({ ai: null, fractal: null, flags: {} });
  });

  it("exposes the canonical system layer table", () => {
    expect(PROMPT_LAYERS.map((layer) => layer.key)).toEqual([
      "role",
      "axiomatic_constitution",
      "core_protocols",
      "dynamic_axes",
      "entities",
      "target_entity_context",
      "cast",
      "entity_context",
      "chapter_history",
      "memory_advisory",
      "history",
    ]);
  });
});

/**
 * CHANGELOG
 * - Track 2.4: Canonical PROMPT_LAYERS key assertion gains memory_advisory.
 * - Track 0.10: Dropped layer from the canonical PROMPT_LAYERS key assertion.
 * - 2026-10-07: Plan Omega for System — rewritten for ROLE_LIBRARY/ROLE_DEFAULTS/get_role_atom, the plan/render split, relocated pack_prompt/resolve_prompt_meta, and the purged render_system_xml (closed/task options gone; stability-lock tests live in reflex.test.js).
 * - 2026-09-20: Retargeted the envelope test to the open-fragment contract.
 * - 2026-09-18: Initial creation of comprehensive system.test.js.
 */
