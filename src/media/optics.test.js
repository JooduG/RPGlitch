/**
 * src/media/optics.test.js
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PromptTemplates, AestheticResolver, getResolution } from "@media/optics.js";
import { themeStore } from "@media/palette.svelte.js";

vi.mock("@media/palette.svelte.js", () => ({
  themeStore: {
    get_signature_label: vi.fn(),
  },
}));

describe("PromptTemplates", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("ENHANCE", () => {
    it("should wrap text in the ENHANCE template", () => {
      const text = "A futuristic city with neon lights";
      const result = PromptTemplates.ENHANCE(text);
      expect(result).toContain("[SYSTEM: CINEMATOGRAPHY_DIRECTOR]");
      expect(result).toContain("<DRAFT_DESCRIPTION>");
      expect(result).toContain(text);
    });

    it("should escape XML characters in input", () => {
      const text = 'Text with <tags> & "quotes"';
      const result = PromptTemplates.ENHANCE(text);
      expect(result).toContain("Text with &lt;tags&gt; &amp; &quot;quotes&quot;");
    });
  });

  describe("BUILDER", () => {
    it("should build a prompt for 'ai' target", () => {
      const rawIntent = "Generate a portrait";
      const context = { ai: { name: "Nova", present: { physical: "Cybernetic" } } };
      const result = PromptTemplates.BUILDER("ai", rawIntent, context);
      expect(result).toContain("Target: ai");
      expect(result).toContain("Identity: Nova");
      expect(result).toContain("Physical: Cybernetic");
      expect(result).toContain('Input Intent: "Generate a portrait"');
    });

    it("should handle 'scene' target", () => {
      const context = { fractal: { present: { physical: "Crystal forest" } } };
      const result = PromptTemplates.BUILDER("scene", "Look around", context);
      expect(result).toContain("[CONTEXT: ENVIRONMENT]");
      expect(result).toContain("Setting: Crystal forest");
      expect(result).toContain("STRICTLY NO CHARACTERS.");
    });

    it("should handle 'user' target", () => {
      const context = { user: { name: "Alice", present: { physical: "Explorer" } } };
      const result = PromptTemplates.BUILDER("user", "My portrait", context);
      expect(result).toContain("[CONTEXT: USER_PORTRAIT]");
      expect(result).toContain("Identity: Alice");
      expect(result).toContain("Physical: Explorer");
    });

    it("should include history if provided", () => {
      const context = { history: "User said hello. AI replied hi." };
      const result = PromptTemplates.BUILDER("ai", "continue", context);
      expect(result).toContain("[HISTORY]");
      expect(result).toContain("User said hello. AI replied hi.");
    });

    it("should escape XML characters in all dynamic fields", () => {
      const context = {
        ai: { name: "<Nova>", present: { physical: '"Metallic"' } },
        history: "& historical context",
      };
      const result = PromptTemplates.BUILDER("ai", "intent > something", context);
      expect(result).toContain("&lt;Nova&gt;");
      expect(result).toContain("&quot;Metallic&quot;");
      expect(result).toContain("&amp; historical context");
      expect(result).toContain("intent &gt; something");
    });
  });
});

describe("AestheticResolver", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should extract traits and use portrait preset for character-like entities", () => {
    vi.mocked(themeStore.get_signature_label).mockReturnValue("Crimson Red");
    const entity = {
      type: "ai",
      present: { physical: "Tall and lean" },
      eternal: { physical: "Silver hair" },
    };
    const result = AestheticResolver.extract(entity);
    expect(result).toContain("Tall and lean");
    expect(result).toContain("Silver hair");
    expect(result).toContain("crimson red aesthetic");
    expect(result).toContain("Hasselblad H6D-100c"); // from portrait preset
  });

  it("should use landscape preset for 'fractal' or 'scene' entities", () => {
    vi.mocked(themeStore.get_signature_label).mockReturnValue("");
    const entity = {
      type: "fractal",
      present: { physical: "Infinite spirals" },
    };
    const result = AestheticResolver.extract(entity);
    expect(result).toContain("Infinite spirals");
    expect(result).toContain("Leica M11"); // from landscape preset
  });

  it("should handle missing fields gracefully", () => {
    vi.mocked(themeStore.get_signature_label).mockReturnValue("");
    const result = AestheticResolver.extract({});
    // Fragments should just be the preset if nothing else is present
    expect(result).toContain("Hasselblad H6D-100c");
    expect(result).toContain("80mm f/1.9 lens");
    expect(result).toContain("8k resolution");
  });
});

describe("getResolution", () => {
  it.each([
    ["landscape", { width: 768, height: 512 }],
    ["scene", { width: 768, height: 512 }],
    ["fractal", { width: 768, height: 512 }],
  ])("should return landscape dimensions for %s mode", (mode, expected) => {
    expect(getResolution(mode)).toEqual(expected);
  });

  it.each([
    ["portrait", { width: 512, height: 768 }],
    ["character", { width: 512, height: 768 }],
    ["user", { width: 512, height: 768 }],
    ["ai", { width: 512, height: 768 }],
  ])("should return portrait dimensions for %s mode", (mode, expected) => {
    expect(getResolution(mode)).toEqual(expected);
  });

  it("should return square dimensions for default", () => {
    expect(getResolution("unknown")).toEqual({ width: 768, height: 768 });
  });
});
