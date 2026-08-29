/**
 * @file src/media/image-aesthetics.test.js
 * Unit tests for Sensory Cortex — Aesthetic Map Builder & Visual Engine Synthesis.
 */

import { describe, expect, it } from "vitest";
import {
  aesthetic_resolver,
  build_aesthetic_map,
  ORDERED_VISUAL_STYLE_KEYS,
  resolve_visual_engine_tokens,
  strip_visual_excluded,
  VISUAL_EXCLUDED_KEYS,
} from "./image-aesthetics.js";

describe("image-aesthetics constants", () => {
  it("exports frozen VISUAL_EXCLUDED_KEYS set", () => {
    expect(VISUAL_EXCLUDED_KEYS).toBeInstanceOf(Set);
    expect(VISUAL_EXCLUDED_KEYS.has("INVENTORY")).toBe(true);
    expect(VISUAL_EXCLUDED_KEYS.has("STASH")).toBe(true);
    expect(VISUAL_EXCLUDED_KEYS.has("SECRET")).toBe(true);
    expect(VISUAL_EXCLUDED_KEYS.has("PLAN")).toBe(true);
    expect(VISUAL_EXCLUDED_KEYS.has("STATUS")).toBe(true);
    expect(Object.isFrozen(VISUAL_EXCLUDED_KEYS)).toBe(true);
  });

  it("exports frozen ORDERED_VISUAL_STYLE_KEYS array", () => {
    expect(Array.isArray(ORDERED_VISUAL_STYLE_KEYS)).toBe(true);
    expect(ORDERED_VISUAL_STYLE_KEYS).toEqual([
      "_visual_style_medium",
      "_visual_style_palette",
      "_visual_style_camera",
      "_visual_style_composition",
      "_visual_style_texture",
      "_visual_style_tags",
    ]);
    expect(Object.isFrozen(ORDERED_VISUAL_STYLE_KEYS)).toBe(true);
  });
});

describe("strip_visual_excluded", () => {
  it("returns empty string for falsy input", () => {
    expect(strip_visual_excluded("")).toBe("");
    expect(strip_visual_excluded(null)).toBe("");
    expect(strip_visual_excluded(undefined)).toBe("");
  });

  it("preserves raw prose strings that are not pseudo-json brackets", () => {
    const raw = "A towering cybernetic titan with glowing amber optical sensors.";
    expect(strip_visual_excluded(raw)).toBe(raw);
  });

  it("strips excluded keys and preserves visual keys", () => {
    const input = "[SHIRT: black leather jacket] [INVENTORY: keycard, blaster] [EYES: icy blue] [SECRET: undercover spy]";
    const result = strip_visual_excluded(input);
    expect(result).toContain("[SHIRT: black leather jacket]");
    expect(result).toContain("[EYES: icy blue]");
    expect(result).not.toContain("INVENTORY");
    expect(result).not.toContain("SECRET");
    expect(result).not.toContain("keycard");
    expect(result).not.toContain("undercover spy");
  });
});

describe("resolve_visual_engine_tokens", () => {
  it("resolves empty tokens for 'none' style", () => {
    const tokens = resolve_visual_engine_tokens("none");
    expect(tokens).toEqual({
      medium: "",
      palette: "",
      camera: "",
      composition: "",
      texture: "",
      negative_prompt: "",
    });
  });

  it("resolves medium, palette, camera, composition, texture, and negative_prompt for styled presets", () => {
    const tokens = resolve_visual_engine_tokens("cyberpunk");
    expect(tokens.medium).toBe("neon cyberpunk dystopian digital concept art matte painting");
    expect(tokens.palette).toBe("vibrant neon accents, deep blacks, holographic iridescent accents, harsh LED lighting");
    expect(tokens.camera).toBe("wide-angle anamorphic lens, low angle dramatic perspective, optical lens flares");
    expect(tokens.texture).toBe("polished chrome reflections, rain-streaked glass, circuit board patterns, holographic noise");
    expect(tokens.negative_prompt).toBe("medieval, fantasy, natural, pastoral, watercolor, oil painting, antique, sunny, historical");
  });

  it("falls back gracefully when style key is unknown", () => {
    const tokens = resolve_visual_engine_tokens("non_existent_key");
    expect(tokens).toEqual({
      medium: "",
      palette: "",
      camera: "",
      composition: "",
      texture: "",
      negative_prompt: "",
    });
  });
});

describe("build_aesthetic_map", () => {
  it("merges eternal and present physical traits while excluding private metadata", () => {
    const entity = {
      name: "Kaelen",
      eternal: {
        physical: "[HAIR: silver undercut] [EYES: amber]",
      },
      present: {
        physical: "[JACKET: worn duster] [INVENTORY: datapad] [PLAN: infiltrate the tower]",
      },
    };

    const map = build_aesthetic_map(entity);
    expect(map.HAIR).toBe("silver undercut");
    expect(map.EYES).toBe("amber");
    expect(map.JACKET).toBe("worn duster");
    expect(map.INVENTORY).toBeUndefined();
    expect(map.PLAN).toBeUndefined();
  });

  it("handles raw prose in physical fragments", () => {
    const entity = {
      name: "Shadow",
      eternal: { physical: "Tall slender silhouette" },
      present: { physical: "Wrapped in mist" },
    };

    const map = build_aesthetic_map(entity);
    expect(map.eternal).toBe("Tall slender silhouette");
    expect(map.present).toBe("Wrapped in mist");
  });

  it("purges unoverridden eternal clothing when present state contains bare/naked markers", () => {
    const entity = {
      name: "Lyra",
      eternal: {
        physical: "[SHIRT: silk blouse] [PANTS: tailored trousers] [EYES: hazel]",
      },
      present: {
        physical: "[CLOTHING: bare] [EYES: wide and alert]",
      },
    };

    const map = build_aesthetic_map(entity);
    expect(map.SHIRT).toBeUndefined();
    expect(map.PANTS).toBeUndefined();
    expect(map.EYES).toBe("wide and alert");
  });

  it("injects visual style engine tokens and entity tags", () => {
    const entity = {
      name: "Cipher",
      visual_style: "cyberpunk",
      tags: ["operative", "augmented"],
      eternal: { physical: "[HAIR: neon pink spikes]" },
    };

    const map = build_aesthetic_map(entity);
    expect(map._visual_style_medium).toBe("neon cyberpunk dystopian digital concept art matte painting");
    expect(map._visual_style_palette).toBe("vibrant neon accents, deep blacks, holographic iridescent accents, harsh LED lighting");
    expect(map._visual_style_tags).toBe("cyberpunk, neon, scifi, dystopian, chrome");
    expect(map.tags).toBe("operative, augmented");
  });

  it("resolves signature color hex into aesthetic string", () => {
    const entity = {
      name: "Aria",
      signature_color: "Electric Cyan",
    };

    const map = build_aesthetic_map(entity);
    expect(map.aesthetic).toBe("in color #11aecc");
  });
});

describe("aesthetic_resolver", () => {
  it("extracts formatted JSON property lines in ordered sequence", () => {
    const entity = {
      name: "Vesper",
      signature_color: "Electric Cyan",
      visual_style: "cyberpunk",
      eternal: {
        physical: "[HAIR: raven black] [EYES: emerald]",
      },
    };

    const extracted = aesthetic_resolver.extract(entity);
    expect(extracted).toContain('"medium": "neon cyberpunk dystopian digital concept art matte painting"');
    expect(extracted).toContain('"palette": "vibrant neon accents, deep blacks, holographic iridescent accents, harsh LED lighting"');
    expect(extracted).toContain('"HAIR": "raven black"');
    expect(extracted).toContain('"EYES": "emerald"');
    expect(extracted).toContain('"aesthetic": "in color #11aecc"');
  });

  it("flattens entity physical traits into continuous descriptive sentences", () => {
    const entity = {
      name: "Vesper",
      signature_color: "Electric Cyan",
      eternal: {
        physical: "[HAIR: raven black] [EYES: emerald]",
      },
    };

    const flattened = aesthetic_resolver.flatten(entity);
    expect(flattened).toContain("HAIR: raven black");
    expect(flattened).toContain("EYES: emerald");
    expect(flattened).toContain("in color #11aecc");
  });
});
