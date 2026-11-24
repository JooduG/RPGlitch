/**
 * src/data/checkpoint.js
 * ============================================================================
 * 💾 SESSION CHECKPOINT - synchronous 3-tier reload survival
 * ============================================================================
 *
 * RAM -> sessionStorage -> window.name. Pure, no runes, no upward imports.
 * ============================================================================
 */

/** Storage key for session checkpoint entries in sessionStorage. */
export const CHECKPOINT_KEY = "rpglitch.session_checkpoint";

/** Namespaced prefix for session checkpoint payloads stored in window.name. */
export const WINDOW_NAME_CHECKPOINT_PREFIX = "__RPGLITCH_CHECKPOINT__::";

/** @type {{ story_id: string | null; round: number; phase: string } | null} */
let _in_memory_checkpoint = null;

function get_session_storage() {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      return window.sessionStorage;
    }
  } catch {
    /* Storage disabled or running in restricted sandbox */
  }
  return null;
}

/**
 * Persists a lightweight session checkpoint across page reloads during schema upgrades and iframe quiescence.
 * @param {{ story_id: string | null; round?: number; phase?: string }} checkpoint
 */
export function save_session_checkpoint(checkpoint) {
  if (!checkpoint || typeof checkpoint !== "object") return;
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
      /* Storage quota exceeded or blocked - continue to Tier 2 */
    }
  }

  try {
    if (typeof window !== "undefined") {
      window.name = `${WINDOW_NAME_CHECKPOINT_PREFIX}${JSON.stringify(payload)}`;
    }
  } catch {
    /* Cross-origin window access restriction */
  }
}

/**
 * Reads the persisted session checkpoint from available storage tiers, returning null if absent or corrupt.
 * @returns {{ story_id: string | null; round: number; phase: string } | null}
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
          /* Corrupted storage payload - fall through to Tier 2 */
        }
      }
    } catch {
      /* Storage access error */
    }
  }

  try {
    if (typeof window !== "undefined" && typeof window.name === "string" && window.name.startsWith(WINDOW_NAME_CHECKPOINT_PREFIX)) {
      return JSON.parse(window.name.slice(WINDOW_NAME_CHECKPOINT_PREFIX.length));
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
    if (typeof window !== "undefined" && typeof window.name === "string" && window.name.startsWith(WINDOW_NAME_CHECKPOINT_PREFIX)) {
      window.name = "";
    }
  } catch {
    /* Window.name access error */
  }
}
