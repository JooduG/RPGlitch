import { describe, expect, it } from "vitest";
import { get_value, set_value, UNSAFE_PATH_KEYS } from "./field-path.js";

describe("field-path.js (Safe Nested Object Dot-Path Accessors)", () => {
  describe("get_value", () => {
    it("returns empty string for invalid inputs or empty paths", () => {
      expect(get_value(null, "some.path")).toBe("");
      expect(get_value(undefined, "some.path")).toBe("");
      expect(get_value({}, "")).toBe("");
      expect(get_value({}, null)).toBe("");
    });

    it("retrieves top-level and nested values", () => {
      const data = {
        name: "Silas",
        eternal: {
          physical: "Cybernetic eye",
          non_physical: "Stoic philosopher",
        },
        meta: {
          scores: {
            chaos: 75,
            is_active: false,
          },
        },
      };

      expect(get_value(data, "name")).toBe("Silas");
      expect(get_value(data, "eternal.physical")).toBe("Cybernetic eye");
      expect(get_value(data, "meta.scores.chaos")).toBe(75);
      expect(get_value(data, "meta.scores.is_active")).toBe(false);
    });

    it("returns empty string when path does not exist", () => {
      const data = { eternal: { physical: "Scar" } };
      expect(get_value(data, "eternal.non_existent")).toBe("");
      expect(get_value(data, "missing.deep.path")).toBe("");
    });

    it("blocks access to prototype pollution properties", () => {
      const obj = {};
      expect(get_value(obj, "__proto__")).toBe("");
      expect(get_value(obj, "prototype")).toBe("");
      expect(get_value(obj, "constructor")).toBe("");
      expect(get_value(obj, "constructor.name")).toBe("");
    });
  });

  describe("set_value", () => {
    it("sets shallow and deeply nested properties creating intermediate objects", () => {
      const obj = {};

      set_value(obj, "name", "Elias");
      expect(obj.name).toBe("Elias");

      set_value(obj, "eternal.physical", "Trenchcoat");
      expect(obj.eternal.physical).toBe("Trenchcoat");

      set_value(obj, "meta.tags.primary", "rebel");
      expect(obj.meta.tags.primary).toBe("rebel");
    });

    it("safely ignores invalid inputs", () => {
      expect(() => set_value(null, "a.b", 123)).not.toThrow();
      expect(() => set_value(undefined, "a.b", 123)).not.toThrow();
      expect(() => set_value({}, "", 123)).not.toThrow();
      expect(() => set_value({}, null, 123)).not.toThrow();
    });

    it("blocks prototype pollution attempts", () => {
      const obj = {};

      set_value(obj, "__proto__.polluted", true);
      expect(/** @type {any} */ ({}).polluted).toBeUndefined();

      set_value(obj, "constructor.prototype.polluted", true);
      expect(/** @type {any} */ ({}).polluted).toBeUndefined();

      set_value(obj, "prototype.polluted", true);
      expect(/** @type {any} */ ({}).polluted).toBeUndefined();
    });
  });

  describe("UNSAFE_PATH_KEYS", () => {
    it("contains prototype, __proto__, and constructor", () => {
      expect(UNSAFE_PATH_KEYS.has("__proto__")).toBe(true);
      expect(UNSAFE_PATH_KEYS.has("prototype")).toBe(true);
      expect(UNSAFE_PATH_KEYS.has("constructor")).toBe(true);
    });
  });
});
