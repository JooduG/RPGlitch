import { beforeEach, describe, expect, it, vi } from "vitest";
import { clean_image_prompt, parse_llm_refine_response } from "./image-prompts.js";
import { aesthetic_resolver, build_aesthetic_map, strip_visual_excluded, VISUAL_EXCLUDED_KEYS } from "./image-aesthetics.js";

vi.mock("@data", () => ({
  db: {
    stories: { get: vi.fn().mockResolvedValue(null) },
    simulation_log: {},
  },
  detox_prose: (text) => text,
  entities: {},
  PROTOCOL_LIBRARY: {
    OPTICS: {
      NEGATIVE_PROMPT: "blurry, low quality, watermark, distorted",
      BUILDER_PROTOCOL: "Emit a structured visual build directive.",
    },
    FORMATS: { JSON_ONLY: "Return ONLY valid JSON." },
  },
  VISUAL_STYLES: {
    none: { id: "none", name: "No Visual Style", category: "None", tags: ["none"], visual_engine: "", negative_prompt: "" },
  },
  SIGNATURE_COLORS: [
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
  ],
}));

vi.mock("@platform", () => ({
  llm_service: { generate: vi.fn() },
  sanitize_llm: (text) => text,
}));

vi.mock("@utils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    state_bridge: {
      runtime: { active_story: null },
      app: { settings: {} },
      simulation_state: { start_typing: vi.fn() },
      simulation_log: { update: vi.fn() },
    },
  };
});

const fixture_entity = {
  name: "Viper",
  eternal: {
    physical: "[SHIRT: white greasy tank-top] [EYES: emerald]",
  },
  present: {
    physical: "[INVENTORY: copper key, plasma pistol] [STASH: old maps] [SECRET: knows the vault code] [PLAN: flee the city] [HELD: plasma gun]",
  },
};

describe("build_aesthetic_map — visual prompt filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("excludes INVENTORY from the aesthetic map", () => {
    const map = build_aesthetic_map(fixture_entity);
    expect(map.INVENTORY).toBeUndefined();
  });

  it("excludes STASH and SECRET/PLAN/STATUS tags", () => {
    const map = build_aesthetic_map(fixture_entity);
    expect(map.STASH).toBeUndefined();
    expect(map.SECRET).toBeUndefined();
    expect(map.PLAN).toBeUndefined();
  });

  it("keeps genuinely visual tags (SHIRT, EYES, HELD)", () => {
    const map = build_aesthetic_map(fixture_entity);
    expect(map.SHIRT).toBe("white greasy tank-top");
    expect(map.EYES).toBe("emerald");
    expect(map.HELD).toBe("plasma gun");
  });

  it("keeps inventory out of the flattened prompt string", () => {
    const flat = aesthetic_resolver.flatten(fixture_entity);
    expect(flat).not.toContain("copper key");
    expect(flat).not.toContain("plasma pistol");
    expect(flat).not.toContain("old maps");
    expect(flat).toContain("white greasy tank-top");
  });
});

describe("strip_visual_excluded", () => {
  it("drops excluded keys and preserves visual keys", () => {
    const out = strip_visual_excluded(fixture_entity.present.physical);
    expect(out).not.toContain("INVENTORY");
    expect(out).not.toContain("STASH");
    expect(out).not.toContain("SECRET");
    expect(out).not.toContain("PLAN");
    expect(out).toContain("[HELD: plasma gun]");
  });

  it("passes raw prose through untouched", () => {
    expect(strip_visual_excluded("a flowing cloak")).toBe("a flowing cloak");
  });

  it("lists the excluded keys", () => {
    for (const key of ["INVENTORY", "STASH", "SECRET", "PLAN", "STATUS"]) {
      expect(VISUAL_EXCLUDED_KEYS.has(key)).toBe(true);
    }
  });
});

describe("parse_llm_refine_response", () => {
  it("extracts prompt and negative_prompt from JSON payloads wrapped in prose", () => {
    const raw = 'Here you go: {"prompt": "A moody portrait", "negative_prompt": "blurry"}';
    expect(parse_llm_refine_response(raw)).toEqual({ prompt: "A moody portrait", negative_prompt: "blurry" });
  });

  it("returns null for non-JSON or empty input", () => {
    expect(parse_llm_refine_response("just prose")).toBeNull();
    expect(parse_llm_refine_response(null)).toBeNull();
    expect(parse_llm_refine_response("")).toBeNull();
  });
});

describe("clean_image_prompt", () => {
  it("un-wraps an embedded JSON prompt field and drops scaffolding", () => {
    const out = clean_image_prompt('{"prompt": "A cat in a neon alley", "negative_prompt": "dog"}');
    expect(out).toContain("A cat in a neon alley");
    expect(out).not.toContain("negative_prompt");
    expect(out).not.toContain("{");
  });

  it("passes plain prose through", () => {
    expect(clean_image_prompt("A quiet street at dusk.")).toBe("A quiet street at dusk.");
  });
});
