/**
 * src/intelligence/prompts/temporal-prompts.test.js
 * ⏳ UNIT TESTS: TEMPORAL PROMPTS (MEMORY FORGE COMPILER)
 */

import { describe, expect, it } from "vitest";
import { render_memory, render_chapter_history_xml, render_entity_memory_context, TEMPORAL_PROTOCOLS } from "./temporal-prompts.js";

describe("Memory Forge Prompts (temporal-prompts.js)", () => {
  const mock_entities = {
    AI_CHARACTER: {
      name: "Viper",
      eternal: { physical: "Scarred eye", non_physical: "Protective" },
      present: { physical: "Leather jacket", non_physical: "Wary" },
      future: "Reach the perimeter.",
      chapters: [{ title: "The Breakout", summary: "Escaped the prison facility.", status: "closed" }],
    },
    USER_PERSONA: {
      name: "Ghost",
      eternal: { physical: "Holo-mask", non_physical: "Impulsive" },
      present: { physical: "Stealth suit", non_physical: "Focused" },
      future: "Decrypt data core.",
    },
  };

  it("exposes valid TEMPORAL_PROTOCOLS.SCHEMA", () => {
    expect(TEMPORAL_PROTOCOLS.SCHEMA).toContain('"_thought_process"');
    expect(TEMPORAL_PROTOCOLS.SCHEMA).toContain('"target"');
    expect(TEMPORAL_PROTOCOLS.SCHEMA).toContain('"eternal"');
    expect(TEMPORAL_PROTOCOLS.SCHEMA).toContain('"present"');
    expect(TEMPORAL_PROTOCOLS.SCHEMA).toContain('"future"');
    expect(TEMPORAL_PROTOCOLS.SCHEMA).toContain('"past"');
    expect(TEMPORAL_PROTOCOLS.SCHEMA).toContain('"relationships"');
  });

  it("render_chapter_history_xml() formats closed chapters into XML block", () => {
    const xml = render_chapter_history_xml(mock_entities.AI_CHARACTER);
    expect(xml).toContain("<CHAPTER_HISTORY>");
    expect(xml).toContain("Chapter The Breakout: Escaped the prison facility.");
  });

  it("render_entity_memory_context() maps entity fragments to XML tags", () => {
    const xml = render_entity_memory_context("AI_CHARACTER", mock_entities.AI_CHARACTER);
    expect(xml).toContain('<AI_CHARACTER name="Viper">');
    expect(xml).toContain("<PERSONALITY>Protective</PERSONALITY>");
    expect(xml).toContain("<STATE_OF_MIND>Wary</STATE_OF_MIND>");
    expect(xml).toContain("<AGENDA>Reach the perimeter.</AGENDA>");
  });

  it("render_memory() compiles single-entity Back Shot prompt correctly", () => {
    const history = [{ role: "user", text: "We need to move now." }];
    const prompt = render_memory({
      target_entity: mock_entities.AI_CHARACTER,
      target_key: "AI_CHARACTER",
      other_entities: { USER_PERSONA: mock_entities.USER_PERSONA },
      history,
    });

    expect(prompt).toContain('<SYSTEM role="MEMORY_FORGE" target="AI_CHARACTER" name="Viper">');
    expect(prompt).toContain("<SCENE_CAST>");
    expect(prompt).toContain('name="Ghost"');
    expect(prompt).toContain("<INPUT_HISTORY>");
    expect(prompt).toContain("We need to move now.");
    expect(prompt).toContain("Analyze recent history specifically for TARGET ENTITY");
  });
});
