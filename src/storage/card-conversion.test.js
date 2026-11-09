import { describe, expect, it } from "vitest";
import {
  create_entity as create_new,
  detect_card_format,
  extract_card_from_png,
  parse_character_card,
  serialize_character_card,
  serialize_rpglitch_entity,
} from "./index.js";

const V2_CARD_FIXTURE = {
  spec: "chara_card_v2",
  spec_version: "2.0",
  data: {
    name: "Aria",
    description: "Test fixture",
    personality: "Determined and sharp.",
    scenario: "Escaping a compromised server node.",
    first_mes: "The terminal flickers. 'We have three minutes,' she whispers.",
    creator_notes: "Character created for testing card conversion.",
    tags: ["cyberpunk", "hacker"],
  },
};

describe("detect_card_format", () => {
  it("recognizes standard chara_card_v2 and chara_card_v3 specs", () => {
    expect(detect_card_format(V2_CARD_FIXTURE)).toBe("v2");
    expect(detect_card_format({ spec: "chara_card_v3", data: { name: "X" } })).toBe("v2");
  });

  it("recognizes cards with a data property containing typical fields", () => {
    expect(detect_card_format({ data: { first_mes: "hi", name: "Y" } })).toBe("v2");
  });

  it("recognizes native rpglitch entities", () => {
    const entity = create_new("character");
    expect(detect_card_format(entity)).toBe("rpglitch");
    expect(detect_card_format({ eternal: { physical: "x" } })).toBe("rpglitch");
  });

  it("recognizes flat V2-style cards without a data envelope", () => {
    expect(detect_card_format({ name: "Ilsa", description: "stern captain", personality: "disciplined" })).toBe("v2");
    expect(detect_card_format({ name: "Ilsa", scenario: "airship" })).toBe("v2");
  });

  it("prioritizes rpglitch format over flat V2 when both criteria are met", () => {
    expect(detect_card_format({ name: "X", eternal: { physical: "y" } })).toBe("rpglitch");
  });

  it("returns unknown for unparseable payloads", () => {
    expect(detect_card_format({ hello: "world" })).toBe("unknown");
    expect(detect_card_format({ name: "Lonely" })).toBe("unknown");
    expect(detect_card_format("not json")).toBe("unknown");
    expect(detect_card_format(null)).toBe("unknown");
    expect(detect_card_format([1, 2])).toBe("unknown");
  });
});

describe("parse_character_card", () => {
  it("maps chara_card_v2 fields into a flat profile dictionary", () => {
    const flat_profile = parse_character_card(V2_CARD_FIXTURE);

    expect(flat_profile.name).toBe("Aria");
    expect(flat_profile.appearance).toBe("Test fixture");
    expect(flat_profile.personality).toBe("Determined and sharp.");
    expect(flat_profile.future).toBe("Escaping a compromised server node.");
    expect(flat_profile.current_look).toBe("The terminal flickers. 'We have three minutes,' she whispers.");
    expect(flat_profile.tags).toEqual(["cyberpunk", "hacker"]);
    expect(parse_character_card(V2_CARD_FIXTURE).description).toBe("Character created for testing card conversion.");
  });

  it("tolerates missing data envelope and fields", () => {
    const flat_profile = parse_character_card({ spec: "chara_card_v2", data: { name: "Bare" } });
    expect(flat_profile.name).toBe("Bare");
    expect(flat_profile.appearance).toBeUndefined();
    expect(flat_profile.tags).toBeUndefined();
  });

  it("reads flat classic cards without a data envelope", () => {
    const flat_profile = parse_character_card({ name: "Ilsa", description: "stern captain", personality: "disciplined" });
    expect(flat_profile.name).toBe("Ilsa");
    expect(flat_profile.appearance).toBe("stern captain");
    expect(flat_profile.personality).toBe("disciplined");
  });

  it("returns an empty object on falsy or non-object payloads", () => {
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
    entity.past = "[MEM: Survived the winter crossing.]";

    const serialized_entity = serialize_rpglitch_entity(entity);
    expect(serialized_entity.name).toBe("Reina");
    expect(serialized_entity._embedding).toBeUndefined();
    expect(serialized_entity.id).toBeUndefined();
    expect(serialized_entity.created_at).toBeUndefined();
  });
});

describe("extract_card_from_png", () => {
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
