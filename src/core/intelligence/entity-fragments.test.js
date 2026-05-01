import { describe, it, expect } from "vitest";
import { ENTITY_FRAGMENTS, ENTITY_CATALOG } from "@core/intelligence/entity-fragments.js";

describe("entity-fragments", () => {
  describe("ENTITY_FRAGMENTS", () => {
    it("should have top-level fields name and description", () => {
      expect(ENTITY_FRAGMENTS.name).toBeDefined();
      expect(ENTITY_FRAGMENTS.description).toBeDefined();
      expect(typeof ENTITY_FRAGMENTS.name).toBe("string");
      expect(typeof ENTITY_FRAGMENTS.description).toBe("string");
    });

    it("should have temporal sections: eternal, present, future, past", () => {
      expect(ENTITY_FRAGMENTS.eternal).toBeDefined();
      expect(ENTITY_FRAGMENTS.present).toBeDefined();
      expect(ENTITY_FRAGMENTS.future).toBeDefined();
      expect(ENTITY_FRAGMENTS.past).toBeDefined();
    });

    it("should define fields for eternal and present sections", () => {
      expect(ENTITY_FRAGMENTS.eternal.fields).toBeDefined();
      expect(ENTITY_FRAGMENTS.present.fields).toBeDefined();
      expect(ENTITY_FRAGMENTS.eternal.fields.non_physical).toBeDefined();
      expect(ENTITY_FRAGMENTS.eternal.fields.physical).toBeDefined();
      expect(ENTITY_FRAGMENTS.present.fields.non_physical).toBeDefined();
      expect(ENTITY_FRAGMENTS.present.fields.physical).toBeDefined();
    });

    it("should define future and past as array-type sections", () => {
      expect(ENTITY_FRAGMENTS.future.type).toBe("array");
      expect(ENTITY_FRAGMENTS.past.type).toBe("array");
      expect(ENTITY_FRAGMENTS.future.fields).toBeDefined();
      expect(ENTITY_FRAGMENTS.past.fields).toBeDefined();
    });
  });

  describe("ENTITY_CATALOG", () => {
    it("should be a flat object", () => {
      expect(typeof ENTITY_CATALOG).toBe("object");
      Object.values(ENTITY_CATALOG).forEach((entry) => {
        expect(typeof entry).toBe("object");
      });
    });

    it("should contain dot-notated keys for nested fields", () => {
      expect(ENTITY_CATALOG["eternal.non_physical"]).toBeDefined();
      expect(ENTITY_CATALOG["eternal.physical"]).toBeDefined();
      expect(ENTITY_CATALOG["present.non_physical"]).toBeDefined();
      expect(ENTITY_CATALOG["present.physical"]).toBeDefined();
    });

    it("should contain top-level keys for array-type sections", () => {
      expect(ENTITY_CATALOG["future"]).toBeDefined();
      expect(ENTITY_CATALOG["past"]).toBeDefined();
    });

    it("should enrich entries with id, section_label, and layer_key", () => {
      const entry = ENTITY_CATALOG["eternal.non_physical"];
      expect(entry.id).toBe("eternal.non_physical");
      expect(entry.section_label).toBe("Eternal");
      expect(entry.layer_key).toBe("ETERNAL");
    });

    it("should exclude top-level string fields from ENTITY_FRAGMENTS", () => {
      expect(ENTITY_CATALOG["name"]).toBeUndefined();
      expect(ENTITY_CATALOG["description"]).toBeUndefined();
    });

    it("should correctly handle string fields within sections by converting them to objects", () => {
      // In ENTITY_FRAGMENTS.future.fields, the values are strings
      expect(typeof ENTITY_FRAGMENTS.future.fields.text).toBe("string");

      // Verify expansion of string fields to objects in the catalog
      expect(ENTITY_CATALOG["future.text"]).toBeDefined();
      expect(ENTITY_CATALOG["future.text"].description).toBe(ENTITY_FRAGMENTS.future.fields.text);
      expect(ENTITY_CATALOG["future.text"].id).toBe("future.text");
      expect(ENTITY_CATALOG["future.text"].section_label).toBe("Future");
      expect(ENTITY_CATALOG["future.text"].layer_key).toBe("FUTURE");
    });
  });
});
