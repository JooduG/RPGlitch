/**
 * src/state/control.svelte.js
 * 🎮 CONTROL PLANE: Interface & Settings Logic
 * Defines the strict TypeScript interfaces for the application's control layer.
 * ZERO NESTING - Flattened Schema only.
 */

/**
 * @typedef {Object} AppSettings
 * @property {boolean} sound - Whether audio feedback and notification sounds are enabled.
 * @property {boolean} call_mode - Toggles the immersive 'Call' UI overlay for focus.
 * @property {boolean} stream_text - Toggles the character text streaming/typing animation.
 * @property {boolean} auto_scroll - Toggles automatic log scrolling to the bottom of the stack.
 * @property {boolean} dev_mode - Enables the Telemetry HUD and system debug overrides.
 * @property {boolean} dev_grid_visible - Toggles the visual chess grid overlay.
 */

/**
 * @typedef {Object} DrawerState
 * @property {boolean} open - Whether the side drawer is currently visible.
 * @property {'ai' | 'user' | 'fractal' | null} type - The target category for entity selection.
 * @property {number} reroll_count - The number of times the current selection pool has been shuffled.
 */

/**
 * @typedef {Object} SimulationControl
 * @property {boolean} loading - STASIS: True when the Chrono Engine is processing a turn.
 */

/**
 * @typedef {Object} FateSystem
 * @property {boolean} active - Whether the Fate Card system is currently engaged.
 * @property {any[]} hand - The current collection of unresolved fate vectors.
 * @property {any | null} selected - The specific fate vector currently under resolution.
 */

// Exporting types for use in other modules
export {};
