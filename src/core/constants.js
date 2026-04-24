/**
 * @file src/core/constants.js
 * 🗝️ SHARED CONSTANTS & STORAGE KEYS
 * Centralized registry for non-dynamic application constants and database names.
 * Follows the [Sovereign Axiomatic Laws] for structural integrity.
 */

export const DB_NAME = "rpglitch";

/**
 * Storage key used to bypass the seed recovery logic during a hard reset.
 * Set to "1" in ControlPanel.svelte and consumed/removed in repository.js.
 */
export const STORAGE_SKIP_SEED = "rpglitch_skip_seed";

/**
 * Key for main application settings in the kv_settings table.
 */
export const KV_SETTINGS_KEY = "rpg_settings";
