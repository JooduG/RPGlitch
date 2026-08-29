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

export { app, app_interface, register_image_preview_handlers } from "./interface.svelte.js";

// ============================================================================
// Simulation Runtime & Entity Chronology
// ============================================================================

export { runtime } from "./runtime.svelte.js";

// ============================================================================
// Simulation Phase & UI Status Locks
// ============================================================================

export { simulation_state, ui_state } from "./status.svelte.js";

// ============================================================================
// Narrative Message & System Log Store
// ============================================================================

export { simulation_log } from "./log.svelte.js";

// ============================================================================
// Chrono Engine (Turn Orchestration & Physics Loop)
// ============================================================================

export { chrono_engine } from "./chrono.svelte.js";

// ============================================================================
// Text Streaming & Audio Speech Buffer
// ============================================================================

export { streaming } from "./streaming.svelte.js";

// ============================================================================
// Developer Telemetry & Diagnostic HUD Store
// ============================================================================

export { developer_log } from "./developer-log.svelte.js";

// ============================================================================
// Freeze Watchdog & Automatic Stasis Recovery
// ============================================================================

export { force_recover_simulation } from "./freeze-watchdog.js";

/**
 * CHANGELOG:
 * - 2026-08-29: Renamed app-store ➔ interface.svelte.js and dev-log ➔ developer-log.svelte.js with structured universal file architecture (/harmonize).
 */
