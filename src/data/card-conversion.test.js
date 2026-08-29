import { describe, expect, it } from "vitest";
import {
  create_new,
  detect_card_format,
  extract_card_from_png,
  normalize,
  parse_character_card,
  serialize_character_card,
  serialize_rpglitch_entity,
} from "@data";

const V2_CARD_FIXTURE = {
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
    expect(detect_card_format(V2_CARD_FIXTURE)).toBe("v2");
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
    const flat_profile = parse_character_card(V2_CARD_FIXTURE);
    expect(flat_profile.name).toBe("Vael");
    expect(flat_profile.appearance).toContain("scarred");
    expect(flat_profile.personality).toContain("Dry wit");
    expect(flat_profile.current_look).toContain("tide drags");
    expect(flat_profile.future).toContain("Mournhold");
    expect(flat_profile.tags).toEqual(["pirate", "smuggler", "fantasy"]);
  });

  it("moves creator_notes into the internal description slot", () => {
    expect(parse_character_card(V2_CARD_FIXTURE).description).toBe("Test fixture");
  });

  it("omits missing keys", () => {
    const flat_profile = parse_character_card({ spec: "chara_card_v2", data: { name: "Bare" } });
    expect(flat_profile.name).toBe("Bare");
    expect(flat_profile.personality).toBeUndefined();
    expect(flat_profile.tags).toBeUndefined();
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

    const round_tripped = parse_character_card(card);
    expect(round_tripped.name).toBe("Vael");
    expect(round_tripped.appearance).toContain("silver-eyed");
    expect(round_tripped.personality).toBe("Dry wit, loyal.");
    expect(round_tripped.current_look).toContain("tide drags");
    expect(round_tripped.future).toContain("Mournhold");
  });

  it("never emits null values", () => {
    const card = serialize_character_card(create_new("character"));
    const serialized_json = JSON.stringify(card);
    expect(serialized_json).not.toContain("null");
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

describe("extract_card_from_png", () => {
  /** Builds a minimal PNG whose `chara` tEXt chunk holds a base64 JSON card. */
  function create_fake_png_with_chara(json_text) {
    const create_png_chunk = (chunk_type, chunk_data) => {
      const output_bytes = new Uint8Array(12 + chunk_data.length);
      const data_view = new DataView(output_bytes.buffer);
      data_view.setUint32(0, chunk_data.length, false);
      for (let index = 0; index < 4; index += 1) {
        output_bytes[4 + index] = chunk_type.charCodeAt(index);
      }
      output_bytes.set(chunk_data, 8);
      return output_bytes;
    };

    const concatenate_byte_arrays = (parts) => {
      const total_length = parts.reduce((accumulator, part) => accumulator + part.length, 0);
      const output_buffer = new Uint8Array(total_length);
      let current_offset = 0;
      for (const part of parts) {
        output_buffer.set(part, current_offset);
        current_offset += part.length;
      }
      return output_buffer;
    };

    const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const header_chunk = create_png_chunk("IHDR", new TextEncoder().encode("x".repeat(13)));
    const text_chunk = create_png_chunk("tEXt", new TextEncoder().encode(`chara\0${btoa(json_text)}`));
    const end_chunk = create_png_chunk("IEND", new Uint8Array(0));

    return concatenate_byte_arrays([signature, header_chunk, text_chunk, end_chunk]);
  }

  it("extracts the embedded chara JSON from a PNG card", () => {
    const json_string = JSON.stringify({ spec: "chara_card_v2", data: { name: "Vael" } });
    expect(extract_card_from_png(create_fake_png_with_chara(json_string))).toBe(json_string);
  });

  it("accepts ArrayBuffer input", () => {
    const json_string = JSON.stringify({ name: "Reina" });
    const buffer_data = create_fake_png_with_chara(json_string);
    expect(extract_card_from_png(buffer_data.buffer.slice(buffer_data.byteOffset, buffer_data.byteOffset + buffer_data.byteLength))).toBe(
      json_string,
    );
  });

  it("returns null when the PNG carries no chara chunk", () => {
    const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const create_png_chunk = (chunk_type, chunk_data) => {
      const output_bytes = new Uint8Array(12 + chunk_data.length);
      const data_view = new DataView(output_bytes.buffer);
      data_view.setUint32(0, chunk_data.length, false);
      for (let index = 0; index < 4; index += 1) {
        output_bytes[4 + index] = chunk_type.charCodeAt(index);
      }
      output_bytes.set(chunk_data, 8);
      return output_bytes;
    };
    const concatenate_byte_arrays = (parts) => {
      const total_length = parts.reduce((accumulator, part) => accumulator + part.length, 0);
      const output_buffer = new Uint8Array(total_length);
      let current_offset = 0;
      for (const part of parts) {
        output_buffer.set(part, current_offset);
        current_offset += part.length;
      }
      return output_buffer;
    };
    const without_card = concatenate_byte_arrays([
      signature,
      create_png_chunk("IHDR", new TextEncoder().encode("x".repeat(13))),
      create_png_chunk("IEND", new Uint8Array(0)),
    ]);
    expect(extract_card_from_png(without_card)).toBeNull();
  });

  it("returns null for empty or tiny buffers", () => {
    expect(extract_card_from_png(new Uint8Array(0))).toBeNull();
    expect(extract_card_from_png(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});
