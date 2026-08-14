import { describe, expect, it } from "vitest";
import { create_new, detect_card_format, normalize, parse_character_card, serialize_character_card, serialize_rpglitch_entity } from "@data";

const V2_CARD = {
  spec: "chara_card_v2",
  spec_version: "2.0",
  data: {
    name: "Vael",
    description: "A scarred, silver-eyed smuggler with a brass compass. Guarded and quietly amused.",
    personality: "Dry wit, patient, fiercely loyal once trusted.",
    scenario: "Washed ashore on the port of Mournhold.",
    first_mes: "The tide drags at your boots. You hear a low whistle from the shadow of the jetty.",
    mes_example: "",
    creator_notes: "Test fixture",
    character_version: "1.0",
    alternate_greetings: [],
    tags: ["pirate", "smuggler", "fantasy"],
    character_book: null,
    extensions: {},
  },
};

describe("detect_card_format", () => {
  it("detects V2/V3 cards by spec", () => {
    expect(detect_card_format(V2_CARD)).toBe("v2");
    expect(detect_card_format({ spec: "chara_card_v3", data: { name: "X" } })).toBe("v2");
  });

  it("detects cards by data block even without spec", () => {
    expect(detect_card_format({ data: { first_mes: "hi", name: "Y" } })).toBe("v2");
  });

  it("detects native RPGlitch entities", () => {
    const entity = create_new("character");
    expect(detect_card_format(entity)).toBe("rpglitch");
    expect(detect_card_format({ eternal: { physical: "x" } })).toBe("rpglitch");
  });

  it("returns unknown for prose and junk", () => {
    expect(detect_card_format({ hello: "world" })).toBe("unknown");
    expect(detect_card_format("not json")).toBe("unknown");
    expect(detect_card_format(null)).toBe("unknown");
    expect(detect_card_format([1, 2])).toBe("unknown");
  });
});

describe("parse_character_card", () => {
  it("maps V2 fields into the flat profile shape", () => {
    const flat = parse_character_card(V2_CARD);
    expect(flat.name).toBe("Vael");
    expect(flat.appearance).toContain("scarred");
    expect(flat.personality).toContain("Dry wit");
    expect(flat.current_look).toContain("tide drags");
    expect(flat.future).toContain("Mournhold");
    expect(flat.tags).toEqual(["pirate", "smuggler", "fantasy"]);
  });

  it("moves creator_notes into the internal description slot", () => {
    expect(parse_character_card(V2_CARD).description).toBe("Test fixture");
  });

  it("omits missing keys", () => {
    const flat = parse_character_card({ spec: "chara_card_v2", data: { name: "Bare" } });
    expect(flat.name).toBe("Bare");
    expect(flat.personality).toBeUndefined();
    expect(flat.tags).toBeUndefined();
  });

  it("tolerates malformed cards", () => {
    expect(parse_character_card(null)).toEqual({});
    expect(parse_character_card({ data: "nope" })).toEqual({});
  });
});

describe("serialize_character_card", () => {
  it("round-trips through parse_character_card", () => {
    const entity = create_new("character", {
      name: "Vael",
      eternal: { physical: "Scarred, silver-eyed smuggler.", non_physical: "Dry wit, loyal." },
      present: { non_physical: "The tide drags at your boots." },
      future: "Washed ashore on Mournhold.",
      tags: ["pirate"],
    });
    const card = serialize_character_card(entity);
    expect(card.spec).toBe("chara_card_v2");
    expect(card.data.name).toBe("Vael");
    expect(card.data.description).toContain("silver-eyed");
    expect(card.data.personality).toBe("Dry wit, loyal.");
    expect(card.data.first_mes).toContain("tide drags");
    expect(card.data.scenario).toContain("Mournhold");
    expect(card.data.tags).toEqual(["pirate"]);

    const back = parse_character_card(card);
    expect(back.name).toBe("Vael");
    expect(back.appearance).toContain("silver-eyed");
    expect(back.personality).toBe("Dry wit, loyal.");
    expect(back.current_look).toContain("tide drags");
    expect(back.future).toContain("Mournhold");
  });

  it("never emits null values", () => {
    const card = serialize_character_card(create_new("character"));
    const json = JSON.stringify(card);
    expect(json).not.toContain("null");
  });
});

describe("serialize_rpglitch_entity", () => {
  it("strips transient DB fields and embedding blobs", () => {
    const entity = create_new("character", { name: "Reina" });
    entity.past = [
      {
        id: "v1",
        content: "Survived the winter crossing.",
        directive: "Survived the winter crossing.",
        _embedding: new Float32Array([1, 2, 3]),
        emotional_weight: 7,
      },
      { id: "v2", content: "", directive: "   " },
    ];
    const exported = serialize_rpglitch_entity(entity);

    for (const key of ["id", "created_at", "updated_at", "origin_id", "version", "is_premade", "is_custom"]) {
      expect(exported).not.toHaveProperty(key);
    }
    expect(exported.name).toBe("Reina");
    expect(exported.type).toBe("character");
    expect(exported.past.length).toBe(1);
    expect(exported.past[0]).not.toHaveProperty("_embedding");
    expect(exported.past[0].content).toBe("Survived the winter crossing.");
  });

  it("normalizes and re-imports cleanly", () => {
    const entity = create_new("fractal", { name: "Mournhold" });
    entity.present = { physical: "Black salt harbor.", non_physical: "A city holding its breath." };
    const exported = serialize_rpglitch_entity(entity);
    const reimported = normalize(exported);
    expect(reimported.name).toBe("Mournhold");
    expect(reimported.type).toBe("fractal");
    expect(reimported.present.physical).toBe("Black salt harbor.");
    expect(reimported.id).not.toBe(entity.id);
  });
});
