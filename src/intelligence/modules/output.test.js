/**
 * src/intelligence/modules/output.test.js
 * ============================================================================
 * 🧪 UNIT TESTS: Output Module — Output Plans & Return Shapes
 * ============================================================================
 *
 * Verifies the output plan contracts:
 * 1. resolve_output_plan routing kinds (prose/bracket/text/json/empty)
 * 2. Think-aware emission variants
 * 3. Temporal routing with explicit is_temporal (tripwire retired)
 * 4. JSON schema warnings for unrenderable keys
 * 5. Thin renderers (envelope, JSON-return interpolation, body reader)
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import {
  OUTPUT_FORMATS,
  resolve_output_plan,
  render_output_plan,
  render_output_plan_body,
  render_json_return,
  render_json_schema,
  get_output_format,
} from "./output.js";

describe("src/intelligence/modules/output.js — resolve_output_plan", () => {
  it("routes prose with think-aware variants", () => {
    const think = resolve_output_plan({ format_spec: { mode: "prose" }, has_think: true });
    expect(think.kind).toBe("prose");
    expect(think.body).toBe(OUTPUT_FORMATS.PROSE);
    const plain = resolve_output_plan({ format_spec: { mode: "prose" }, has_think: false });
    expect(plain.body).toBe(OUTPUT_FORMATS.PLAIN_PROSE);
    expect(Object.isFrozen(think)).toBe(true);
  });

  it("routes temporal fields by explicit is_temporal only", () => {
    const bracket = resolve_output_plan({ format_spec: { mode: "temporal_field" }, has_think: true, is_temporal: true });
    expect(bracket.kind).toBe("bracket");
    expect(bracket.body).toContain("[KEY: value]");

    const text = resolve_output_plan({ format_spec: { mode: "temporal_field" }, has_think: true });
    expect(text.kind).toBe("text");
    expect(text.body).toBe(OUTPUT_FORMATS.PLAIN_TEXT);

    const retired_tripwire = resolve_output_plan({ format_spec: { mode: "prose" }, has_think: true, is_temporal: false });
    expect(retired_tripwire.kind).toBe("prose");
    expect(retired_tripwire.body).toBe(OUTPUT_FORMATS.PROSE);
  });

  it("composes json schemas and warns on unrenderable keys", () => {
    const plan = resolve_output_plan({ format_spec: { mode: "json", schema: ["next_action", "name", "bogus_key_xyz"] } });
    expect(plan.kind).toBe("json");
    expect(plan.body).toContain('"next_action"');
    expect(plan.body).toContain('"name"');
    expect(plan.body).not.toContain("bogus_key_xyz");
    expect(plan.warnings).toEqual(["bogus_key_xyz"]);
    expect(plan.schema_keys).toContain("next_action");
  });

  it("adds caption for selfie variants without duplicating it", () => {
    const plan = resolve_output_plan({ format_spec: { mode: "json", schema: ["prompt"] }, variant: "selfie" });
    expect(plan.schema_keys).toContain("caption");
    const repeat = resolve_output_plan({ format_spec: { mode: "json", schema: ["prompt", "caption"] }, is_selfie: true });
    expect(repeat.schema_keys.filter((key) => key === "caption")).toHaveLength(1);
  });

  it("falls back to empty plans for null or unroutable specs", () => {
    expect(resolve_output_plan({ format_spec: null }).body).toBe("");
    expect(resolve_output_plan({ format_spec: null }).kind).toBe("empty");
    expect(resolve_output_plan({ format_spec: { mode: "nope" }, fallback: "fb" }).body).toBe("fb");
  });
});

describe("src/intelligence/modules/output.js — thin renderers", () => {
  it("maps plans to the envelope and passes pre-routed bodies through", () => {
    const prose_plan = resolve_output_plan({ format_spec: { mode: "prose" }, has_think: true });
    const xml = render_output_plan(prose_plan, { mode: "prose" });
    expect(xml).toContain("<OUTPUT_FORMAT");
    expect(xml).toContain(OUTPUT_FORMATS.PROSE);
    expect(render_output_plan({ kind: "external", body: "custom" }, { mode: "weird" })).toContain('mode="weird"');
    expect(render_output_plan({ kind: "empty", body: "   " })).toBe("");
    expect(render_output_plan(null)).toBe("");
    expect(render_output_plan_body(prose_plan)).toBe(prose_plan.body);
  });

  it("interpolates schemas into the JSON-return template", () => {
    expect(render_json_return('{"a": 1}')).toBe(OUTPUT_FORMATS.JSON_RETURN.replace("{schema}", '{"a": 1}'));
    expect(get_output_format({ mode: "prose" })).toBe(OUTPUT_FORMATS.PROSE);
    expect(get_output_format(null)).toBe("");
    expect(get_output_format(null, { fallback: "fb" })).toBe("fb");
    expect(render_json_schema(["name"], "character")).toContain('"name"');
  });
});

/**
 * CHANGELOG
 * - 2026-10-04: Initial output plan test suite covering routing kinds, think variants, temporal explicitness, selfie caption, warnings, envelope mapping, and the get_output_format body reader.
 */
