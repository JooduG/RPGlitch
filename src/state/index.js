/**
 * ============================================================================
 * RPGlitch State Layer Sovereign Barrel Export
 * ============================================================================
 *
 * @file src/state/index.js
 * @description Central barrel export providing unified access to reactive
 * Svelte 5 state stores, simulation status locks, chronos engine, streaming,
 * developer logs, and watchdog recovery utilities.
 *
 * Architectural Laws:
 * - Unidirectional layer flow: State layer must never import from UI layer.
 * - Single source of truth: All reactive runes and state singletons are
 *   routed through this barrel.
 *
 * ============================================================================
 */

// ============================================================================
// Application Interface & Navigation Store
// ============================================================================

export { app, register_image_preview_handlers } from "./interface.svelte.js";

// ============================================================================
// Simulation Runtime & Entity Chronology
// ============================================================================

export { runtime } from "./runtime.svelte.js";

// ============================================================================
// Simulation Phase, UI Locks, Streaming & Stasis Recovery
// ============================================================================

export { simulation_state, ui_state, streaming, force_recover_simulation, install_freeze_watchdog } from "./status.svelte.js";

// ============================================================================
// Narrative Logs & Developer Telemetry HUD
// ============================================================================

export { simulation_log, developer_log } from "./log.svelte.js";

// ============================================================================
// Chrono Engine (Turn Orchestration & Physics Loop)
// ============================================================================

export { chrono_engine } from "./chrono.svelte.js";
