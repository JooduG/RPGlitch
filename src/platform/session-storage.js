/**
 * src/platform/session-storage.js
 * 🧭 RELOAD-SAFE SESSION CHECKPOINT TIERS
 *
 * Core Responsibilities:
 * - Persists and recovers lightweight session state (`{ story_id, round, phase }`) across browser reloads.
 * - Bridges the quiesce gap when IndexedDB is undergoing a schema upgrade (`versionchange`) or is unavailable.
 * - Provides resilient fallback tiers: `sessionStorage` (Tier 1) ➔ `window.name` (Tier 2) ➔ `in-memory` (Tier 3).
 *
 * Dependencies & Cross-Module Invariants:
 * - Invoked by `main.js` (`set_versionchange_quiesce`) and `runtime.svelte.js` (`sync()`).
 * - Invariant: Storage failures must fail silently to ensure graceful degradation in sandboxed iframes.
 */

// ============================================================================
// [SECTION 1: CONSTANTS & TYPE DEFINITIONS]
// ============================================================================

/** Storage key for session checkpoint entries in sessionStorage. */
export const CHECKPOINT_KEY = "rpglitch.session_checkpoint";

/**
 * @typedef {Object} SessionCheckpoint
 * @property {string | null} story_id - The active story identifier.
 * @property {number} round - The current macro round count.
 * @property {string} phase - The active execution phase.
 */

/** @type {SessionCheckpoint | null} */
let _in_memory_checkpoint = null;

// ============================================================================
// [SECTION 2: STORAGE PROBE & ACCESSORS]
// ============================================================================

/**
 * Probes for available and usable `sessionStorage`.
 * Returns null when running in restricted or sandboxed iframe environments.
 * @returns {Storage | null}
 */
function get_session_storage() {
  try {
    if (typeof window !== "undefined" && typeof window.sessionStorage !== "undefined") {
      window.sessionStorage.getItem("__rpglitch_probe__");
      return window.sessionStorage;
    }
  } catch {
    /* Sandboxed iframe SecurityError — fall through to next tier */
  }
  return null;
}

// ============================================================================
// [SECTION 3: CHECKPOINT MUTATIONS & RECOVERY]
// ============================================================================

/**
 * Persists a session checkpoint across an imminent page reload or database migration.
 * @param {SessionCheckpoint | Partial<SessionCheckpoint>} checkpoint
 */
export function save_session_checkpoint(checkpoint) {
  const payload = {
    story_id: checkpoint?.story_id ?? null,
    round: typeof checkpoint?.round === "number" ? checkpoint.round : 0,
    phase: checkpoint?.phase ?? "idle",
  };

  _in_memory_checkpoint = payload;

  const storage = get_session_storage();
  if (storage) {
    try {
      storage.setItem(CHECKPOINT_KEY, JSON.stringify(payload));
      return;
    } catch {
      /* Storage quota exceeded or blocked — continue to Tier 2 */
    }
  }

  try {
    if (typeof window !== "undefined") {
      window.name = JSON.stringify(payload);
    }
  } catch {
    /* Cross-origin window access restriction */
  }
}

/**
 * Reads the persisted session checkpoint from available storage tiers, returning null if absent or corrupt.
 * @returns {SessionCheckpoint | null}
 */
export function load_session_checkpoint() {
  if (_in_memory_checkpoint) {
    return _in_memory_checkpoint;
  }

  const storage = get_session_storage();
  if (storage) {
    try {
      const raw = storage.getItem(CHECKPOINT_KEY);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          /* Corrupted storage payload — fall through to Tier 2 */
        }
      }
    } catch {
      /* Storage access error */
    }
  }

  try {
    if (typeof window !== "undefined" && window.name && window.name.startsWith("{")) {
      return JSON.parse(window.name);
    }
  } catch {
    /* Corrupted or blocked window.name */
  }

  return null;
}

/**
 * Clears the session checkpoint across all storage tiers after a successful session restoration.
 */
export function clear_session_checkpoint() {
  _in_memory_checkpoint = null;

  const storage = get_session_storage();
  if (storage) {
    try {
      storage.removeItem(CHECKPOINT_KEY);
    } catch {
      /* Storage removal error */
    }
  }

  try {
    if (typeof window !== "undefined" && window.name && window.name.startsWith("{")) {
      window.name = "";
    }
  } catch {
    /* Window.name access error */
  }
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, normalized `get_session_storage` and `_in_memory_checkpoint`,
 *   cleared `window.name` in `clear_session_checkpoint`, and added JSDoc typedefs.
 * - 2026-08-16: Added multi-tier fallback (sessionStorage -> window.name -> in-memory) for
 *   safe checkpointing during Dexie schema upgrades and iframe quiescence.
 */
