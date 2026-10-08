/**
 * src/utils/catalog.test.js
 * ============================================================================
 * 🧪 CATALOG CORE UNIT TESTS — Interpolation & Dotted-Key Resolution
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import { interpolate_tokens, resolve_catalog_atom } from "./catalog.js";

const CATALOG = Object.freeze({
  PLAIN: "hello {name}",
  NESTED: Object.freeze({
    LEAF: "value {slot}",
    BRANCH: Object.freeze({ DEEP: "deep" }),
  }),
  RECORD: Object.freeze({ tag: "NOTE", body: "body {slot}", enveloped: true }),
  BODYLESS: Object.freeze({ tag: "EMPTY" }),
});

describe("interpolate_tokens", () => {
  it("interpolates tokens and blanks missing slots", () => {
    expect(interpolate_tokens("hi {name}!", { name: "Al" })).toBe("hi Al!");
    expect(interpolate_tokens("hi {name}!", {})).toBe("hi !");
    expect(interpolate_tokens("hi {name}!", { name: null })).toBe("hi !");
  });

  it("keeps the exact lowercase token class", () => {
    expect(interpolate_tokens("{Name} {a-b} {a b}", { Name: "X" })).toBe("{Name} {a-b} {a b}");
  });

  it("stringifies non-string values and tolerates nullish templates", () => {
    expect(interpolate_tokens("{n}", { n: 7 })).toBe("7");
    expect(interpolate_tokens(null)).toBe("");
    expect(interpolate_tokens(undefined, {})).toBe("");
  });
});

describe("resolve_catalog_atom", () => {
  it("walks dotted paths and interpolates", () => {
    expect(resolve_catalog_atom(CATALOG, "PLAIN", { name: "Al" })).toBe("hello Al");
    expect(resolve_catalog_atom(CATALOG, "NESTED.LEAF", { slot: "s" })).toBe("value s");
    expect(resolve_catalog_atom(CATALOG, "NESTED.BRANCH.DEEP", {})).toBe("deep");
  });

  it("returns empty for missing keys and non-leaf branches", () => {
    expect(resolve_catalog_atom(CATALOG, "NOPE", {})).toBe("");
    expect(resolve_catalog_atom(CATALOG, "NESTED", {})).toBe("");
    expect(resolve_catalog_atom(CATALOG, "NESTED.BRANCH", {})).toBe("");
    expect(resolve_catalog_atom(null, "PLAIN", {})).toBe("");
  });

  it("passes {tag,body} records through with interpolated bodies", () => {
    expect(resolve_catalog_atom(CATALOG, "RECORD", { slot: "s" })).toEqual({ tag: "NOTE", body: "body s", enveloped: true });
    expect(resolve_catalog_atom(CATALOG, "BODYLESS", {})).toBe("");
  });

  it("uppercases keys and merges defaults under values", () => {
    expect(resolve_catalog_atom(CATALOG, "plain", { name: "Al" }, { uppercase: true })).toBe("hello Al");
    expect(resolve_catalog_atom(CATALOG, "PLAIN", {}, { defaults: { name: "D" } })).toBe("hello D");
    expect(resolve_catalog_atom(CATALOG, "PLAIN", { name: null }, { defaults: { name: "D" } })).toBe("hello ");
  });

  it("falls back before returning empty", () => {
    expect(resolve_catalog_atom(CATALOG, "NOPE", { name: "Al" }, { fallback_key: "PLAIN" })).toBe("hello Al");
    expect(resolve_catalog_atom(CATALOG, "NOPE", {}, { fallback_key: "ALSO_NOPE" })).toBe("");
  });
});
