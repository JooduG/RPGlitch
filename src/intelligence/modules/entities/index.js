/**
 * src/intelligence/modules/entities/index.js
 * ============================================================================
 * 👥 ENTITIES MODULE BARREL — Epistemic, Presence & Sheet Architecture
 * ============================================================================
 *
 * Centralized barrel export for the modularized entities domain:
 * - epistemic.js: Epistemic Wall security, secret stripping, and integrity verification.
 * - presence.js: Spatial graph, cast presence filtering, and Director routing XML.
 * - sheets.js: Physical state extraction, sheet specifications, and XML compilers.
 *
 * Architecture & Design Laws:
 * - Unidirectional layer flow: pure string and structured XML compilation.
 * - Single source of truth for all entity operations in the Intelligence layer.
 * - Strict Full-Name domain nomenclature.
 * ============================================================================
 */

// -----------------------------------------------------------------------------
// [SECTION 1: EPISTEMIC SECURITY RE-EXPORTS]
// -----------------------------------------------------------------------------

export { strip_epistemic_tags, strip_epistemic_secrets, verify_epistemic_integrity } from "./epistemic.js";

// -----------------------------------------------------------------------------
// [SECTION 2: SPATIAL PRESENCE & ROUTING RE-EXPORTS]
// -----------------------------------------------------------------------------

export {
  resolve_available_entities,
  render_dispositions,
  render_nearby_entities_xml,
  ROUTING_RULES,
  render_present_entities_xml,
} from "./presence.js";

// -----------------------------------------------------------------------------
// [SECTION 3: SHEET COMPILATION & PHYSICAL STATE RE-EXPORTS]
// -----------------------------------------------------------------------------

export {
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
  render_optics_entities_xml,
  render_optics_subject_rules,
  resolve_optics_cinematography,
} from "./sheets.js";

// -----------------------------------------------------------------------------
// [CHANGELOG]
// -----------------------------------------------------------------------------
/**
 * CHANGELOG
 * ============================================================================
 * - 2026-09-18: Initial creation of modularized entities index.js barrel re-exporting epistemic, presence, and sheets submodules.
 * ============================================================================
 */
