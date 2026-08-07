/**
 * src/engine/session.js
 * 🧭 SESSION CHECKPOINT — Reload-safe session restoration.
 * When IndexedDB is mid-upgrade (Dexie versionchange) or otherwise blocked,
 * the active session pointer cannot be written to the DB. This module stashes
 * a minimal {story_id, round, phase} checkpoint through synchronous storage
 * tiers that survive the reload: sessionStorage → window.name → in-memory.
 * The boot path restores from the checkpoint before falling back to kv_settings.
 */

const CHECKPOINT_KEY = "rpglitch.session_checkpoint";

/** @type {{ story_id: string | null, round: number, phase: string } | null} */
let _in_memory = null;

/**
 * Returns a usable sessionStorage handle, or null when sandboxed (SecurityError).
 * @returns {Storage | null}
 */
function _storage() {
  try {
    if (typeof window !== "undefined" && typeof window.sessionStorage !== "undefined") {
      window.sessionStorage.getItem("__rpglitch_probe__");
      return window.sessionStorage;
    }
  } catch {
    /* sandboxed iframe — fall through to next tier */
  }
  return null;
}

/**
 * Persists a session checkpoint across an imminent reload.
 * @param {{ story_id: string | null, round: number, phase: string }} checkpoint
 */
export function save_session_checkpoint(checkpoint) {
  const payload = {
    story_id: checkpoint?.story_id ?? null,
    round: typeof checkpoint?.round === "number" ? checkpoint.round : 0,
    phase: checkpoint?.phase ?? "idle",
  };
  _in_memory = payload;
  const ss = _storage();
  if (ss) {
    try {
      ss.setItem(CHECKPOINT_KEY, JSON.stringify(payload));
      return;
    } catch {
      /* storage full / unavailable — continue */
    }
  }
  try {
    if (typeof window !== "undefined") window.name = JSON.stringify(payload);
  } catch {
    /* cross-origin guard */
  }
}

/**
 * Reads the persisted checkpoint, or null when absent.
 * @returns {{ story_id: string | null, round: number, phase: string } | null}
 */
export function load_session_checkpoint() {
  if (_in_memory) return _in_memory;
  const ss = _storage();
  if (ss) {
    try {
      const raw = ss.getItem(CHECKPOINT_KEY);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          /* corrupt — fall through */
        }
      }
    } catch {
      /* unavailable */
    }
  }
  try {
    if (typeof window !== "undefined" && window.name && window.name.startsWith("{")) {
      return JSON.parse(window.name);
    }
  } catch {
    /* corrupt or unavailable */
  }
  return null;
}

/**
 * Clears the checkpoint after a successful restore.
 */
export function clear_session_checkpoint() {
  _in_memory = null;
  const ss = _storage();
  if (ss) {
    try {
      ss.removeItem(CHECKPOINT_KEY);
    } catch {
      /* ignore */
    }
  }
}
