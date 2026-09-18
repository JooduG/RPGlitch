/**
 * src/intelligence/modules/entities.test.js
 * ============================================================================
 * 🧪 UNIT TESTS: Entities Module (Sheets, Epistemic Wall & Entity XML)
 * ============================================================================
 *
 * Verifies the contract and behavior of src/intelligence/modules/entities.js:
 * - Epistemic Wall filtering (strip_epistemic_tags, strip_epistemic_secrets)
 * - Physical appearance and topography merging (render_appearance)
 * - Sheet specification catalog integrity (SHEET_SPECS)
 * - Full <AVAILABLE_ENTITIES> sheet compilation (render_entity_sheets)
 * - Nearby entities XML compilation (render_nearby_entities_xml)
 * - Present entities XML compilation (render_present_entities_xml)
 * - Spatial presence resolution (resolve_available_entities)
 * - Entity memory context rendering (render_entity_memory_context)
 * - Field enhancement context rendering (render_enhancement_field_context)
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import {
  strip_epistemic_tags,
  strip_epistemic_secrets,
  verify_epistemic_integrity,
  render_appearance,
  SHEET_SPECS,
  render_sheet,
  render_entity_sheets,
  render_nearby_entities_xml,
  render_present_entities_xml,
  resolve_available_entities,
  render_entity_memory_context,
  render_enhancement_field_context,
} from "./entities.js";

// ============================================================================
// [TEST SUITE: ENTITIES MODULE]
// ============================================================================

describe("src/intelligence/modules/entities.js", () => {
  describe("strip_epistemic_tags & strip_epistemic_secrets", () => {
    it("strips [SECRET: ...] and [PLAN: ...] tags from state text", () => {
      const input = "Calm and composed. [SECRET: Planning an escape] [PLAN: Steal the key] Alert.";
      const result = strip_epistemic_tags(input);
      expect(result).toBe("Calm and composed. Alert.");
    });

    it("handles null, undefined, or empty values safely", () => {
      expect(strip_epistemic_tags("")).toBe("");
      expect(strip_epistemic_tags(null)).toBe("");
      expect(strip_epistemic_tags(undefined)).toBe("");
      expect(strip_epistemic_secrets("")).toBe("");
      expect(strip_epistemic_secrets(null)).toBe("");
      expect(strip_epistemic_secrets(undefined)).toBe("");
    });

    it("respects ownership in strip_epistemic_secrets", () => {
      const text = "Observant. [SECRET: Knows the password]";
      expect(strip_epistemic_secrets(text, true)).toBe(text);
      expect(strip_epistemic_secrets(text, false)).toBe("Observant.");
      expect(strip_epistemic_secrets(text)).toBe("Observant.");
    });

    it("verifies epistemic integrity and detects leaks of [SECRET: ...] and [PLAN: ...]", () => {
      expect(verify_epistemic_integrity("Clean prompt without leak.")).toBe(true);
      expect(() => verify_epistemic_integrity("Leaked [SECRET: hidden key] in prompt")).toThrowError(/Epistemic leak detected/i);
      expect(() => verify_epistemic_integrity("Leaked [PLAN: infiltrate] in prompt")).toThrowError(/Epistemic leak detected/i);
    });
  });

  describe("render_appearance", () => {
    it("returns empty string when both eternal and present are empty", () => {
      expect(render_appearance("", "", {}, {})).toBe("");
      expect(render_appearance(null, null, {}, {})).toBe("");
    });

    it("merges eternal and present physical tags, with present overwriting eternal", () => {
      const eternal = "[HAIR: obsidian black] [EYES: amber] [SHIRT: white tunic]";
      const present = "[SHIRT: torn leather jacket] [POSTURE: defensive]";
      const xml = render_appearance(eternal, present, {}, {});

      expect(xml).toContain("<APPEARANCE>");
      expect(xml).toContain("</APPEARANCE>");
      expect(xml).toContain("<HAIR>obsidian black</HAIR>");
      expect(xml).toContain("<EYES>amber</EYES>");
      expect(xml).toContain("<SHIRT>torn leather jacket</SHIRT>");
      expect(xml).not.toContain("white tunic");
      expect(xml).toContain("<POSTURE>defensive</POSTURE>");
    });

    it("supports custom outer tag like TOPOGRAPHY for fractals", () => {
      const eternal = "[BIOME: frozen tundra]";
      const present = "[WEATHER: blizzard]";
      const xml = render_appearance(eternal, present, {}, {}, "TOPOGRAPHY");

      expect(xml).toContain("<TOPOGRAPHY>");
      expect(xml).toContain("</TOPOGRAPHY>");
      expect(xml).toContain("<BIOME>frozen tundra</BIOME>");
      expect(xml).toContain("<WEATHER>blizzard</WEATHER>");
    });
  });

  describe("SHEET_SPECS", () => {
    it("is frozen and defines specifications for AI_CHARACTER, NPC, USER_PERSONA, and FRACTAL", () => {
      expect(Object.isFrozen(SHEET_SPECS)).toBe(true);
      expect(SHEET_SPECS.AI_CHARACTER.tag).toBe("AI_CHARACTER");
      expect(SHEET_SPECS.NPC.tag).toBe("NPC");
      expect(SHEET_SPECS.USER_PERSONA.tag).toBe("USER_PERSONA");
      expect(SHEET_SPECS.FRACTAL.tag).toBe("FRACTAL");
      expect(SHEET_SPECS.USER_PERSONA.memory_tag).toBe("BACKSTORY");
      expect(SHEET_SPECS.FRACTAL.psychology_tag).toBe("ATMOSPHERE");
      expect(SHEET_SPECS.FRACTAL.appearance_tag).toBe("TOPOGRAPHY");
    });
  });

  describe("render_entity_sheets", () => {
    const mock_entities = {
      AI: {
        id: "char_ai_1",
        name: "Vesper",
        eternal: {
          physical: "[HAIR: silver]",
          non_physical: "Analytical and calculating.",
        },
        present: {
          physical: "[CLOTHING: dark coat]",
          non_physical: "Observing every exit. [SECRET: Knows about the breach]",
        },
        relationships: ["Vesper → Roger: suspicious of motives"],
      },
      USER: {
        id: "char_user_1",
        name: "Roger",
        eternal: {
          physical: "[EYES: brown]",
          non_physical: "Resolute explorer.",
        },
        present: {
          physical: "[CLOTHING: dust cloak]",
          non_physical: "Guarded posture. [SECRET: Carrying the relic] [PLAN: Escape at dawn]",
        },
        future: "Find the terminal.",
      },
      FRACTAL: {
        id: "fractal_1",
        name: "The Sub-Zero Vault",
        eternal: {
          physical: "[TEMPERATURE: sub-zero] [ARCHITECTURE: brutalist concrete]",
          non_physical: "Oppressive and indifferent.",
        },
        present: {
          physical: "[LIGHTING: emergency red flickers]",
          non_physical: "Creaking pipes resonate through corridors.",
        },
      },
    };

    const mock_accessors = {
      future: (entity) => entity?.future || "",
      past: () => "Surviving the deep sector.",
    };

    it("renders <AVAILABLE_ENTITIES> with AI_CHARACTER, USER_PERSONA, and FRACTAL", () => {
      const xml = render_entity_sheets({
        entities: mock_entities,
        accessors: mock_accessors,
        config: {
          entities: {
            dispositions: ["AI"],
            dynamic_axes: [],
            user_agenda: false,
            nearby_entities: false,
          },
        },
        is_npc: false,
      });

      expect(xml).toContain("<AVAILABLE_ENTITIES>");
      expect(xml).toContain('    <AI_CHARACTER id="char_ai_1" name="Vesper">');
      expect(xml).toContain('    <USER_PERSONA id="char_user_1" name="Roger">');
      expect(xml).toContain('    <FRACTAL id="fractal_1" name="The Sub-Zero Vault">');
      expect(xml).toContain("</AVAILABLE_ENTITIES>");
    });

    it("enforces the Epistemic Wall: strips user secrets and plans from USER_PERSONA", () => {
      const xml = render_entity_sheets({
        entities: mock_entities,
        accessors: mock_accessors,
        config: {
          entities: {
            dispositions: [],
            dynamic_axes: [],
            user_agenda: false,
          },
        },
        is_npc: false,
      });

      // User's secret must be stripped
      expect(xml).not.toContain("Carrying the relic");
      expect(xml).not.toContain("Escape at dawn");
      expect(xml).toContain("Guarded posture.");

      // AI's secret is preserved when AI is owner (!is_npc)
      expect(xml).toContain("Knows about the breach");
    });

    it("renders dispositions according to manifest configuration and active entities", () => {
      const xml = render_entity_sheets({
        entities: mock_entities,
        accessors: mock_accessors,
        config: {
          entities: {
            dispositions: ["AI"],
            dynamic_axes: [],
          },
        },
      });

      expect(xml).toContain("<DISPOSITIONS>");
      expect(xml).toContain('<DISPOSITION target="char_user_1">suspicious of motives</DISPOSITION>');
    });

    it("renders nearby entities when enabled in manifest configuration", () => {
      const npc_entities = [
        { id: "npc_1", name: "Sentry Bot" },
        { id: "npc_2", name: "Distant Drone" },
      ];
      const in_scene_ids = ["npc_1"];

      const xml = render_entity_sheets({
        entities: mock_entities,
        npc_entities,
        in_scene_ids,
        accessors: mock_accessors,
        config: {
          entities: {
            nearby_entities: true,
            dispositions: [],
            dynamic_axes: [],
          },
        },
      });

      expect(xml).toContain("<NEARBY_ENTITIES>");
      expect(xml).toContain('<ENTITY id="npc_1" name="Sentry Bot" role="NPC" />');
      expect(xml).not.toContain("npc_2");
    });

    it("isolates NPC dynamic axes so bystanders retain their own dynamics without speaker crosstalk", () => {
      const mock_render_axes = (dynamics) => {
        if (!dynamics) return "";
        return `<DYNAMIC_AXES chaos="${dynamics.chaos}" intensity="${dynamics.intensity}" />`;
      };

      const npc_entities = [
        { id: "npc_speaker", name: "Glitch", dynamics: { chaos: 52, intensity: 44 } },
        { id: "npc_bystander", name: "Julien", dynamics: { chaos: 40, intensity: 40 } },
      ];
      const in_scene_ids = ["npc_speaker", "npc_bystander"];

      const xml = render_entity_sheets({
        entities: mock_entities,
        npc_entities,
        in_scene_ids,
        accessors: mock_accessors,
        render_axes: mock_render_axes,
        is_npc: true,
        active_speaker: npc_entities[0],
        speaker_dynamics: { chaos: 52, intensity: 44 },
        config: {
          entities: {
            dispositions: ["NPC"],
            dynamic_axes: ["NPC"],
          },
        },
      });

      // Both NPCs should be rendered
      expect(xml).toContain('<NPC id="npc_speaker" name="Glitch">');
      expect(xml).toContain('<NPC id="npc_bystander" name="Julien">');

      // Glitch has chaos="52" intensity="44"
      // Julien MUST have chaos="40" intensity="40", NOT Glitch's values
      expect(xml).toContain('<DYNAMIC_AXES chaos="52" intensity="44" />');
      expect(xml).toContain('<DYNAMIC_AXES chaos="40" intensity="40" />');
    });

    it("deduplicates in-scene NPCs so full sheets are not repeated in proximate roster", () => {
      const npc_entities = [
        { id: "npc_1", name: "Sentry Bot" },
        { id: "npc_2", name: "Distant Drone" },
      ];
      const in_scene_ids = ["npc_1", "npc_2"];

      const xml = render_entity_sheets({
        entities: mock_entities,
        npc_entities,
        in_scene_ids,
        accessors: mock_accessors,
        config: {
          entities: {
            nearby_entities: true,
            dispositions: ["NPC"], // Triggers full sheet rendering for in-scene NPCs
            dynamic_axes: [],
          },
        },
      });

      // Full sheets rendered for in_scene_ids
      expect(xml).toContain('<NPC id="npc_1" name="Sentry Bot">');
      expect(xml).toContain('<NPC id="npc_2" name="Distant Drone">');

      // Nearby entities roster should NOT repeat them, and since none remain, NEARBY_ENTITIES should not appear
      expect(xml).not.toContain("<NEARBY_ENTITIES>");
    });

    it("enforces bystander NPC diet: strips private secrets, plans, standing agenda, and memories from non-speaking NPCs", () => {
      const npc_entities = [
        {
          id: "npc_speaker",
          name: "Glitch",
          future: "Hack the server.",
          past: [{ content: "Infiltrated sector 4." }],
          present: { non_physical: "Typing furiously. [SECRET: backdoor code]" },
        },
        {
          id: "npc_bystander",
          name: "Julien",
          future: "Reclaim the throne.",
          past: [{ content: "Exiled ten years ago." }],
          present: { non_physical: "Leaning against the console. [SECRET: hiding the dagger]" },
        },
      ];
      const in_scene_ids = ["npc_speaker", "npc_bystander"];

      const xml = render_entity_sheets({
        entities: mock_entities,
        npc_entities,
        in_scene_ids,
        is_npc: true,
        active_speaker: npc_entities[0],
        config: {
          entities: {
            dispositions: ["NPC"],
            dynamic_axes: [],
          },
        },
      });

      // Active speaker NPC preserves agenda, memories, and owner secrets
      expect(xml).toContain("Hack the server.");
      expect(xml).toContain("Infiltrated sector 4.");
      expect(xml).toContain("backdoor code");

      // Bystander NPC has secrets stripped, and agenda & memories omitted
      expect(xml).not.toContain("hiding the dagger");
      expect(xml).not.toContain("Reclaim the throne.");
      expect(xml).not.toContain("Exiled ten years ago.");
      expect(xml).toContain("Leaning against the console.");
    });
  });

  describe("render_nearby_entities_xml", () => {
    it("renders nearby entities excluding the target entity", () => {
      const other_entities = {
        AI: { name: "Vesper", present: { non_physical: "Observing." } },
        USER: { name: "Roger", eternal: { non_physical: "Steady." } },
      };

      const xml = render_nearby_entities_xml(other_entities, { exclude_key: "AI", indent: 2 });
      expect(xml).toContain("<NEARBY_ENTITIES>");
      expect(xml).toContain('<ENTITY id="Roger" name="Roger" role="USER">');
      expect(xml).toContain("<SUMMARY>Steady.</SUMMARY>");
      expect(xml).not.toContain("Vesper");
    });

    it("returns empty string when there are no other active entities", () => {
      expect(render_nearby_entities_xml({}, { exclude_key: "AI" })).toBe("");
      expect(render_nearby_entities_xml({ AI: { name: "Vesper" } }, { exclude_key: "AI" })).toBe("");
    });
  });

  describe("resolve_available_entities", () => {
    it("resolves present entities and dormant stasis entities accurately", () => {
      const entities = {
        AI: { id: "ai_1", name: "Vesper" },
        USER: { id: "usr_1", name: "Roger" },
        FRACTAL: { id: "frc_1", name: "The Vault" },
      };
      const npc_entities = [
        { id: "npc_1", name: "Elias" },
        { id: "npc_2", name: "Sentry" },
      ];
      const in_scene_ids = ["npc_1"];

      const resolved = resolve_available_entities({ entities, npc_entities, in_scene_ids });
      expect(resolved.present.map((e) => e.name)).toEqual(["Vesper", "Roger", "The Vault", "Elias"]);
      expect(resolved.dormant.map((e) => e.name)).toEqual(["Sentry"]);
      expect(resolved.active_names.has("vesper")).toBe(true);
      expect(resolved.active_names.has("elias")).toBe(true);
      expect(resolved.active_names.has("sentry")).toBe(false);
      expect(resolved.name_to_id.get("elias")).toBe("npc_1");
    });
  });

  describe("render_present_entities_xml", () => {
    it("renders PRESENT_ENTITIES with routing rules, active participants, and dormant candidates", () => {
      const entities = {
        AI: { id: "ai_1", name: "Vesper" },
        USER: { id: "usr_1", name: "Roger" },
      };
      const npc_entities = [
        { id: "npc_1", name: "Elias", description: "Archivist" },
        { id: "npc_2", name: "Sentry", description: "Station guard" },
      ];
      const in_scene_ids = ["npc_1"];

      const xml = render_present_entities_xml({ entities, npc_entities, in_scene_ids });
      expect(xml).toContain("<PRESENT_ENTITIES>");
      expect(xml).toContain("SPEAKER ROUTING RULES:");
      expect(xml).toContain("CONVERGENCE & ENTITY REUSE:");
      expect(xml).toContain("ACTIVE PRESENT PARTICIPANTS:");
      expect(xml).toContain("- Vesper: Primary Companion (Present)");
      expect(xml).toContain("- Roger: Protagonist (Present)");
      expect(xml).toContain("- Elias (id: npc_1) [Present]: Archivist");
      expect(xml).toContain("DORMANT CANDIDATE ENTITIES (STASIS):");
      expect(xml).toContain("- Sentry (id: npc_2) [Dormant (Stasis)]: Station guard");
      expect(xml).toContain("</PRESENT_ENTITIES>");
    });
  });

  describe("render_entity_memory_context", () => {
    it("renders structured memory context for a target entity using unified separate physical mode", () => {
      const entity = {
        name: "Vesper",
        eternal: {
          physical: "[HAIR: silver]",
          non_physical: "Stoic operative.",
        },
        present: {
          physical: "[CLOTHING: tactical vest]",
          non_physical: "Calculating routes.",
        },
        future: "Breach the secure lab.",
        past: [{ content: "Escaped the quarantine sector." }],
      };

      const xml = render_entity_memory_context("AI_CHARACTER", entity);
      expect(xml).toContain('<AI_CHARACTER name="Vesper">');
      expect(xml).toContain("<PSYCHOLOGY>");
      expect(xml).toContain("<PERSONALITY>Stoic operative.</PERSONALITY>");
      expect(xml).toContain("<STATE>Calculating routes.</STATE>");
      expect(xml).toContain("<PHYSICAL_APPEARANCE>");
      expect(xml).toContain("<HAIR>silver</HAIR>");
      expect(xml).toContain("<CURRENT_LOOK>");
      expect(xml).toContain("<CLOTHING>tactical vest</CLOTHING>");
      expect(xml).toContain("<AGENDA>Breach the secure lab.</AGENDA>");
      expect(xml).toContain("<MEMORIES>");
      expect(xml).toContain("Escaped the quarantine sector.");
      expect(xml).toContain("</AI_CHARACTER>");
    });

    it("handles null entity safely", () => {
      expect(render_entity_memory_context("AI_CHARACTER", null)).toBe("");
    });
  });

  describe("render_enhancement_field_context", () => {
    const entity = {
      name: "Vesper",
      eternal: {
        physical: "[HAIR: silver]",
        non_physical: "Stoic operative.",
      },
      present: {
        physical: "[CLOTHING: tactical vest]",
        non_physical: "Calculating routes.",
      },
      future: "Reach the upper deck.",
      past: [{ content: "Escaped the quarantine sector." }],
    };

    it("renders field context for present.physical with eternal sibling", () => {
      const xml = render_enhancement_field_context(entity, "present.physical");
      expect(xml).toContain("<ENTITY_CONTEXT>");
      expect(xml).toContain("<CURRENT_LOOK>");
      expect(xml).toContain("<CLOTHING>tactical vest</CLOTHING>");
      expect(xml).toContain("<PHYSICAL_APPEARANCE>");
      expect(xml).toContain("<HAIR>silver</HAIR>");
      expect(xml).toContain("</ENTITY_CONTEXT>");
    });

    it("renders field context for future agenda", () => {
      const xml = render_enhancement_field_context(entity, "future");
      expect(xml).toContain("<ENTITY_CONTEXT>");
      expect(xml).toContain("<AGENDA>");
      expect(xml).toContain("Reach the upper deck.");
      expect(xml).toContain("</AGENDA>");
      expect(xml).toContain("</ENTITY_CONTEXT>");
    });

    it("renders field context for past memories with fallback or custom formatter", () => {
      const xml = render_enhancement_field_context(entity, "past");
      expect(xml).toContain("<ENTITY_CONTEXT>");
      expect(xml).toContain("<MEMORIES>");
      expect(xml).toContain("Escaped the quarantine sector.");
      expect(xml).toContain("</MEMORIES>");
    });

    it("handles null entity safely", () => {
      expect(render_enhancement_field_context(null, "future")).toBe("");
    });
  });

  describe("render_sheet", () => {
    const character = {
      id: "char_valkyrie",
      name: "Valkyrie",
      eternal: {
        physical: "[HAIR: golden]",
        non_physical: "Fierce protector.",
      },
      present: {
        physical: "[ARMOR: battle-tested plate]",
        non_physical: "Surveying the perimeter.",
      },
      future: "Hold the line.",
      past: [{ content: "Defended the fortress." }],
    };

    it("renders combined physical mode by default", () => {
      const xml = render_sheet(SHEET_SPECS.AI_CHARACTER, { entity: character });
      expect(xml).toContain("<APPEARANCE>");
      expect(xml).toContain("<HAIR>golden</HAIR>");
      expect(xml).toContain("<ARMOR>battle-tested plate</ARMOR>");
      expect(xml).not.toContain("<PHYSICAL_APPEARANCE>");
      expect(xml).not.toContain("<CURRENT_LOOK>");
    });

    it("renders separate physical mode when requested", () => {
      const xml = render_sheet(SHEET_SPECS.AI_CHARACTER, {
        entity: character,
        physical_mode: "separate",
      });
      expect(xml).not.toContain("<APPEARANCE>");
      expect(xml).toContain("<PHYSICAL_APPEARANCE>");
      expect(xml).toContain("<HAIR>golden</HAIR>");
      expect(xml).toContain("<CURRENT_LOOK>");
      expect(xml).toContain("<ARMOR>battle-tested plate</ARMOR>");
    });

    it("renders fractal with ENVIRONMENT and ATMOSPHERE in separate physical mode", () => {
      const fractal = {
        id: "fractal_spire",
        name: "Obsidian Spire",
        eternal: {
          physical: "[SPIRES: monolithic glass]",
          non_physical: "Ancient resonating monolith.",
        },
        present: {
          physical: "[AURA: violet ion storm]",
          non_physical: "Energy crackling through conduits.",
        },
        future: "Discharge kinetic pulse.",
        past: [{ content: "Constructed during the First Epoch." }],
      };

      const xml = render_sheet(SHEET_SPECS.FRACTAL, {
        entity: fractal,
        physical_mode: "separate",
      });
      expect(xml).toContain("<ATMOSPHERE>");
      expect(xml).toContain("<ENVIRONMENT>");
      expect(xml).toContain("<SPIRES>monolithic glass</SPIRES>");
      expect(xml).toContain("<ATMOSPHERE>");
      expect(xml).toContain("<AURA>violet ion storm</AURA>");
      expect(xml).toContain("<HISTORY>");
      expect(xml).toContain("Constructed during the First Epoch.");
    });
  });
});

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-09-16: Updated test assertions for spatial and non-theater architecture: validated <AVAILABLE_ENTITIES>, <NEARBY_ENTITIES>, <PRESENT_ENTITIES>, and resolve_available_entities.
 * - 2026-09-13: Initial creation of comprehensive unit test suite for entities.js (Epistemic Wall, appearance merging, sheet compilation, scene cast, memory & enhancement context).
 * ============================================================================
 */
