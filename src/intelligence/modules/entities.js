/**
 * src/intelligence/modules/entities.js
 * ============================================================================
 * 👥 ENTITIES MODULE — Spatial Entity Architecture & Universal Sheet Compiler
 * ============================================================================
 *
 * Sovereign entrypoint for entity manifestation, epistemic security, spatial
 * presence, and XML sheet compilation across the RPGlitch Intelligence layer.
 *
 * Modularized into cohesive submodules under `./entities/`:
 * - `./entities/epistemic.js`: Epistemic Wall security, secret stripping, integrity verification.
 * - `./entities/presence.js`: Spatial graph, nearby cast filtering, and Director routing XML.
 * - `./entities/sheets.js`: Physical appearance synthesis, sheet specifications, and XML compilers.
 *
 * Architecture & Design Laws:
 * - Single-Source Taxonomy: XML tags derive deterministically from @data's PROFILE_FIELD_CATALOG.
 * - Epistemic Wall Integrity: Private tags ([SECRET: ...], [PLAN: ...]) are never leaked across boundaries.
 * - Universal Sheet Compiler: Every entity in the simulation compiles through render_sheet.
 * - Zero Backwards Compatibility: Ruthless purity, full domain nomenclature, no legacy shims.
 * ============================================================================
 */

// -----------------------------------------------------------------------------
// [SUBMODULE RE-EXPORTS]
// -----------------------------------------------------------------------------

export {
  strip_epistemic_tags,
  strip_epistemic_secrets,
  verify_epistemic_integrity,
  resolve_available_entities,
  render_dispositions,
  render_nearby_entities_xml,
  ROUTING_RULES,
  render_present_entities_xml,
  resolve_profile_field_tag,
  resolve_entity_field_value,
  extract_physical_body,
  extract_physical_rows,
  render_appearance,
  SHEET_SPECS,
  render_sheet,
  render_entity_sheets,
  render_entity_memory_context,
  render_enhancement_field_context,
} from "./entities/index.js";

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-09-18: Modularization Pass — Decomposed monolithic 883-line entities.js into cohesive submodules: epistemic.js, presence.js, and sheets.js under ./entities/; added verify_epistemic_integrity. Converted entities.js to clean canonical barrel.
 * - 2026-09-16: Spatial Architecture Standardization & Non-Theater Harmonization: (1) Swapped and standardized spatial XML structures: replaced <STORY_ENTITIES> with <AVAILABLE_ENTITIES>, merged <PROXIMATE_NPCS> and <SCENE_CAST> into <NEARBY_ENTITIES>, and replaced <SCENE_SPOTLIGHT> with <PRESENT_ENTITIES>; (2) Purged all theater/stage metaphors in favor of spatial/systems taxonomy (resolve_available_entities, ROUTING_RULES, render_present_entities_xml); (3) Pruned dead legacy functions under P4 Zero Backwards Compatibility.
 * - 2026-09-16: Comprehensive simplification and consolidation: (1) Consolidated core trio (AI, USER, FRACTAL) assembly in render_entity_sheets into declarative loop, slashing repetitive boilerplate; (2) Extracted render_sheet_field helper in render_sheet and unified separate physical block compilation; (3) Inlined and simplified extract_physical_rows; (4) Verified 100% test pass across entities, builder, and story suites.
 * - 2026-09-16: Refactored `entities.js`: standardized `STORY_ENTITIES`, `ENTITY_CONTEXT`, and `SCENE_SPOTLIGHT` XML assembly via `render_xml_tag`; consolidated NPC sheet compilation into unified candidate loop; pruned duplicate changelog line.
 * - 2026-09-16: Repatriated `render_scene_spotlight_xml` and `SPOTLIGHT_RULES` back to `entities.js` (Layer 4 entity/cast management sovereignty). Merged headers into single directive blocks.
 * - 2026-09-14: Purged dead `agenda_gate` configuration property from `SHEET_SPECS.USER_PERSONA` per P4 pre-beta purity.
 * - 2026-09-13: Token optimization & epistemic reinforcement: (1) Enforced Bystander NPC Diet where non-speaking in-scene NPCs omit private standing agendas and deep memory vectors while stripping secrets/plans across the Epistemic Wall; (2) Compressed nested whitespace across dispositions and dynamic axes to 6-space hierarchy, trimming whitespace tokens.
 * - 2026-09-13: Fixed NPC dynamic axes crosstalk by isolating bystander NPC axes from active speaker dynamics; deduplicated in-scene NPCs in proximate roster to eliminate redundant <NPC> tags when full sheets are already rendered.
 * - 2026-09-13: Full architectural symmetry with prompts.js — established 1-to-1 parity between config.entities manifest keys and entities.js renderers; unified TARGET into render_sheet via physical_mode ("combined" vs "separate"); exported render_sheet as sovereign universal compiler; pruned redundant dictionaries; enforced Full-Name domain nomenclature throughout.
 * - 2026-09-13: Streamlined render_entity_memory_context and render_enhancement_field_context — replaced manual tag variables with declarative PROFILE_FIELD_CATALOG path iteration via resolve_entity_field_value, slashing boilerplate and eliminating linter warnings.
 * - 2026-09-13: Deconstruction and first-principles architectural rebuild — established sovereign red thread across 6 symmetrical sections; unified scene presence and name-to-id indexing into build_scene_roster; derived XML tags cleanly via resolve_profile_field_tag; pruned dead loop branches in NPC sheet assembly.
 * - 2026-09-13: Comprehensive refactor — enforced Full-Name nomenclature (CHARACTER_FIELDS, context, source_name, indentation_padding, entity loop variables); unified physical body extraction via _extract_physical_body; modernized render_entity_sheets to consume entities_configuration directly; pruned stale spotlight doc drift in header; purged dead clean_xml import.
 * - 2026-09-13: Purified `SHEET_SPECS` by directly deriving field XML tags from `PROFILE_FIELD_CATALOG`; relocated `SPOTLIGHT_RULES` and `render_scene_spotlight_xml` to `task.js` under Director turn choreography.
 * - 2026-09-12: Standardization pass — the three near-duplicate sheet compilers (speaker/user/fractal) were collapsed into one data-driven `render_sheet` reading a frozen `SHEET_SPECS` catalog; every field XML tag now derives from the canonical `PROFILE_FIELD_CATALOG` in @data (no local label→tag duplication); banner corrected (chapter/recent-history functions live in history.js).
 * - 2026-09-11: Delegated format_recent_history and render_chapter_history_xml to history.js, and added render_scene_cast_xml.
 * - 2026-09-11: Renamed module to entities.js. Absorbed format_recent_history, render_chapter_history_xml, render_entity_memory_context, and render_enhancement_field_context.
 * - 2026-09-11: Added SPOTLIGHT_RULES and render_scene_spotlight_xml for Stage Spotlight orchestration.
 * - 2026-09-11: Initial creation of modular story-entities.js extracting sheet compilation and epistemic boundaries.
 * ============================================================================
 */
