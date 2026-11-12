/**
 * @file src/ui/profile/Profile.svelte.js
 * 🧬 PROFILE STATE — Reactive controller for entity editing.
 */
import { db, normalize_entity as normalize } from "@data";
import { atom_for, canonicalize_field_key, output_key_for_path, resolve_entity_type } from "../definitions/profile-taxonomy.js";
import { structure_profile } from "@engine";
import { app } from "./interface.svelte.js";
import { runtime } from "@engine";
import { get_value, set_value } from "@utils";
import { resolve_voice_name, resolve_voice_uri } from "../media/audio.svelte.js";
import { SvelteSet } from "svelte/reactivity";

const DEFAULT_FIELD = { key: "visual-prompt", label: "Image Prompt" };
const QUADRANT_PATHS = ["eternal.physical", "eternal.non_physical", "present.physical", "present.non_physical", "past", "future"];

/** Identity rule: IDs are 2-20 chars of A-Z, 0-9, _ or -. */
const ID_PATTERN = /^[A-Z0-9_-]{2,20}$/;

export class ProfileState {
  is_editing = $state(false);
  is_saving = $state(false);
  show_delete_confirm = $state(false);
  is_packing_up = $state(false);
  /** @type {string | null} */
  hovered_section = $state(null);
  active_field = $state(DEFAULT_FIELD);

  /** @type {SvelteSet<string>} */
  busy_fields = new SvelteSet();

  /** @type {any} */
  char = $state(null);

  /**
   * Operational gate tracking real human input or array alterations.
   * @type {boolean}
   */
  _user_mutated = $state(false);

  /** Tracks entity ID at edit session start for primary key migrations. */
  _original_id = null;
  /** Tracks entity name at edit session start (currently informational). */
  _synced_name = null;

  /**
   * Draft ID/Name inputs.
   * @type {string | null}
   */
  draft_id = $state(null);
  /** @type {string | null} */
  draft_name = $state(null);
  /** @type {string} */
  identity_error = $state("");

  /** @returns {boolean} */
  get id_valid() {
    return !!this.char && ID_PATTERN.test(String(this.char.id || ""));
  }

  /** @returns {boolean} */
  get name_valid() {
    return !!this.char && String(this.char.name || "").trim().length > 0;
  }

  /** @returns {boolean} */
  get identity_valid() {
    return this.id_valid && this.name_valid;
  }

  /** Snapshot drafts from `char` when entering edit mode. */
  sync_identity_drafts() {
    this._original_id = this.char ? String(this.char.id || "") : null;
    this._synced_name = this.char ? String(this.char.name || "") : null;
    this.draft_id = this.char ? String(this.char.id || "") : "";
    this.draft_name = this.char ? String(this.char.name || "") : "";
    this.identity_error = "";
  }

  /** Discard drafts (after cancel / swap / successful save). */
  clear_identity_drafts() {
    this._original_id = null;
    this.draft_id = null;
    this.draft_name = null;
    this.identity_error = "";
  }

  /**
   * Commit the ID draft to `char` if it satisfies the pattern.
   * @returns {boolean} true when the draft is valid (or absent).
   */
  commit_draft_id() {
    if (this.draft_id === null || this.draft_id === undefined) return true;
    const user_edited = this.draft_id !== this._original_id;
    const cleaned = String(this.draft_id)
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "")
      .slice(0, 20);
    if (cleaned !== this.draft_id) this.draft_id = cleaned;
    if (!ID_PATTERN.test(cleaned)) return false;
    if (this.char && this.char.id !== cleaned) {
      this.char.id = cleaned;
      // Pristine drafts only carry system canonicalization (e.g. lowercase
      // premade ids): apply it, but don't read it as a user edit.
      if (user_edited) this._user_mutated = true;
    }
    return true;
  }

  /**
   * Commit the Name draft to `char` if it is non-blank.
   * @returns {boolean} true when the draft is valid (or absent).
   */
  commit_draft_name() {
    if (this.draft_name === null || this.draft_name === undefined) return true;
    if (!String(this.draft_name).trim()) return false;
    if (this.char && this.char.name !== this.draft_name) {
      this.char.name = this.draft_name;
      this._user_mutated = true;
    }
    return true;
  }

  /** Commit both drafts. Valid halves apply even when the other half fails. */
  commit_identity_drafts() {
    const id_ok = this.commit_draft_id();
    const name_ok = this.commit_draft_name();
    return id_ok && name_ok;
  }

  /**
   * (Re)baselines the discard-dialog snapshot, canonicalized the same way the
   * system canonicalizes on touch, so mount fills and pristine commits don't
   * read as user edits. Uses the real resolvers (not a copy) so this can't
   * drift from AudioWing.
   */
  take_edit_snapshot() {
    try {
      const snap = JSON.parse(JSON.stringify(this.char));
      if (snap) {
        if (typeof snap.id === "string")
          snap.id = snap.id
            .toUpperCase()
            .replace(/[^A-Z0-9_-]/g, "")
            .slice(0, 20);
        const v = snap.voice && typeof snap.voice === "object" ? snap.voice : null;
        if (v) {
          const vkey = v.name || v.uri || "Cinematic Narrator";
          v.name = resolve_voice_name(vkey);
          v.uri = resolve_voice_uri(vkey);
          if (v.cadence == null) v.cadence = "standard";
        }
      }
      this._edit_snapshot = snap;
    } catch {
      this._edit_snapshot = null;
    }
    this.pending_swap_detail = "";
  }

  /**
   * Human-readable summary of what changed since edit-entry (discard-dialog diagnostic).
   */
  describe_dirty() {
    try {
      if (!this._edit_snapshot || !this.char) return "Changed: (snapshot unavailable)";
      const paths = this.collect_changed_paths(this._edit_snapshot, this.char, "", [], 0);
      if (!paths.length) return "Flag set, but no content differences found.";
      return "Changed: " + paths.join(", ");
    } catch {
      return "Changed: (diff failed)";
    }
  }

  collect_changed_paths(a, b, base, out, depth) {
    if (out.length >= 12 || depth > 6) return out;
    if (typeof a === "function" || typeof b === "function") return out;
    if (Object.is(a, b)) return out;
    const ao = a !== null && typeof a === "object";
    const bo = b !== null && typeof b === "object";
    if (!ao || !bo) {
      out.push(base || "(root)");
      return out;
    }
    if (Array.isArray(a) || Array.isArray(b)) {
      if (JSON.stringify(a) !== JSON.stringify(b)) out.push(base || "(root)");
      return out;
    }
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      if (out.length >= 12) break;
      this.collect_changed_paths(a[k], b[k], base ? base + "." + k : k, out, depth + 1);
    }
    return out;
  }

  /**
   * Marks the workspace as dirtied by the user.
   */
  mark_mutated() {
    queueMicrotask(() => {
      this._user_mutated = true;
    });
  }

  /** Pending entity-swap held back by the dirty guard. */
  _pending_swap = null;
  /** True while the user is asked whether to discard in-flight edits. */
  pending_swap_confirm = $state(false);
  /** Deep copy of char taken at edit-entry, for the discard-dialog diagnostic. */
  _edit_snapshot = null;
  /** Human-readable changed-paths summary, shown in the discard dialog. */
  pending_swap_detail = $state("");

  constructor() {
    this.char = normalize(app.editing_entity || runtime.active_user);
  }

  /**
   * Deterministic check verifying if the active workspace has morphed during this edit session.
   * @type {boolean}
   */
  get is_dirty() {
    return this.is_editing && this._user_mutated;
  }

  /**
   * Whether profile editing is permitted for the active entity.
   * @type {boolean}
   */
  get can_edit() {
    if (app.settings.dev_mode) return true;
    if (!this.char?.id) return true;
    return !app.claimed_entity_ids.has(String(this.char.id));
  }

  /**
   * True when the active entity is locked for editing.
   * @type {boolean}
   */
  get story_locked() {
    return !this.can_edit;
  }

  /**
   * Initiates the editing state transition and resets interaction tracking.
   */
  start_editing() {
    if (!this.can_edit) return;
    this._user_mutated = false;
    this.is_editing = true;
    this.sync_identity_drafts();
    this.take_edit_snapshot();
  }

  /**
   * Syncs character state when the app-level editing entity changes.
   */
  sync() {
    if (app.editing_entity && app.editing_entity.id !== this.char?.id) {
      if (this.is_dirty) {
        this._pending_swap = app.editing_entity;
        this.pending_swap_confirm = true;
        this.pending_swap_detail = this.describe_dirty();
        return;
      }
      this.char = normalize(app.editing_entity);
      this.reset_active_field();
      this.clear_identity_drafts();
      // A silent swap while editing would otherwise keep a stale snapshot, so
      // later diffs would blame the new entity for the old one. Re-baseline.
      this._user_mutated = false;
      this.take_edit_snapshot();
    }
  }

  /**
   * User confirmed the swap: discard the in-flight edits and open the new entity.
   */
  confirm_swap() {
    const next = this._pending_swap;
    this._pending_swap = null;
    this.pending_swap_confirm = false;
    this._edit_snapshot = null;
    this.pending_swap_detail = "";
    if (next) {
      this.is_editing = false;
      this._user_mutated = false;
      this.char = normalize(next);
      this.reset_active_field();
      this.clear_identity_drafts();
    }
  }

  /**
   * User cancelled the swap: keep editing the current entity and restore app.editing_entity.
   */
  reject_swap() {
    this._pending_swap = null;
    this.pending_swap_confirm = false;
    this._edit_snapshot = null;
    this.pending_swap_detail = "";
    if (app.editing_entity && app.editing_entity.id !== this.char?.id) {
      app.editing_entity = this.char;
    }
  }

  /**
   * Gets a safe value for a field path.
   * @param {string} path
   */
  get_safe_value(path) {
    if (!this.char) return "";
    const val = get_value(this.char, path);
    return val === undefined || val === null ? "" : val;
  }

  /**
   * Sets a value for a field path.
   * @param {string} path
   * @param {any} value
   */
  set_field_value(path, value) {
    if (!this.char) return;
    set_value(this.char, path, value);
    this._user_mutated = true;
  }

  /**
   * Autosaves any pending edits and closes the profile modal.
   * @param {"character" | "fractal"} [entity_type]
   */
  async handle_close(entity_type = "character") {
    if (this.is_editing && this._user_mutated) {
      const ok = await this.save(entity_type);
      if (!ok) return false;
    }
    this.is_editing = false;
    const active_wings = app.settings.dev_mode;
    if (active_wings) {
      this.is_packing_up = true;
      setTimeout(() => {
        this.is_packing_up = false;
        app.toggle_profile(false);
      }, 500);
    } else {
      app.toggle_profile(false);
    }
    return true;
  }

  /**
   * Reverts changes and exits editing mode.
   */
  cancel() {
    this.is_editing = false;
    this.char = normalize(app.editing_entity || runtime.active_user);
    this._user_mutated = false;
    this._edit_snapshot = null;
    this.pending_swap_detail = "";
    this.reset_active_field();
    this.clear_identity_drafts();
  }

  /**
   * Sets the active field context.
   * @param {string} key
   * @param {string} [label]
   */
  set_active_field(key, label) {
    this.active_field = { key, label: label || "" };
  }

  /**
   * Resets the active field to default.
   */
  reset_active_field() {
    this.active_field = DEFAULT_FIELD;
  }

  /**
   * Commits entity changes to the repository.
   * @param {"character" | "fractal"} entity_type
   */
  async save(entity_type) {
    this.commit_identity_drafts();
    if (!this.identity_valid) {
      this.identity_error = !this.id_valid ? "ID must be 2–20 chars (A–Z, 0–9, _ or -)." : "Name is required.";
      this.is_editing = true;
      this.is_saving = false;
      return false;
    }
    this.identity_error = "";
    this.is_editing = false;
    this._user_mutated = false;
    this.is_saving = true;
    try {
      for (const key of ["past"]) {
        if (Array.isArray(this.char[key])) {
          this.char[key] = this.char[key].filter((v) =>
            typeof v === "object" && v !== null ? !(v.content || v.directive)?.trim() : !String(v).trim(),
          );
        }
      }

      const prev_id = this._original_id;
      const next_id = this.char.id;

      await runtime.save_entity(entity_type, this.char);

      // Clean up stale database record if the primary key was renamed
      if (prev_id && prev_id !== next_id) {
        await runtime.delete_entity(entity_type, prev_id);
      }

      await app.load_entities();

      const list = entity_type === "character" ? app.ai_list : app.fractal_list;
      const updated = Array.isArray(list) ? list.find((e) => e.id === next_id) : null;

      const match_id = prev_id || next_id;
      if (entity_type === "character") {
        if (app.selected_ai?.id === match_id) app.selected_ai = updated;
        if (app.selected_user?.id === match_id) app.selected_user = updated;
      } else {
        if (app.selected_fractal?.id === match_id) app.selected_fractal = updated;
      }

      if (updated) app.editing_entity = updated;
      this.clear_identity_drafts();
      return true;
    } catch (err) {
      console.error("Failed to save profile:", err);
      this.is_editing = true;
      return false;
    } finally {
      this.is_saving = false;
    }
  }

  /**
   * Deletes the current entity.
   * @param {"character" | "fractal"} entity_type
   */
  async delete(entity_type) {
    try {
      await runtime.delete_entity(entity_type, this.char.id);

      if (entity_type === "character") {
        if (app.selected_ai?.id === this.char.id) app.selected_ai = null;
        if (app.selected_user?.id === this.char.id) app.selected_user = null;
      } else {
        if (app.selected_fractal?.id === this.char.id) app.selected_fractal = null;
      }

      await app.load_entities();
      app.toggle_profile(false);
    } catch (err) {
      console.error("Failed to delete entity:", err);
    }
  }

  /**
   * AI-enhanced text generation for a field.
   * @param {string} key
   * @param {string} value
   */
  async enhance(key, value) {
    if (!value || this.busy_fields.has(key)) return;
    const type = resolve_entity_type(this.char?.type);
    const atom = atom_for(type, key);
    if (!atom || !atom.directive) return;
    this.enhance_field_inner(key, value);
  }

  /**
   * Private internal logic pipeline executing the text enhancement mechanics.
   * @private
   * @param {string} key
   * @param {string} value
   */
  async enhance_field_inner(key, value) {
    this.busy_fields.add(key);
    try {
      const type = resolve_entity_type(this.char?.type);
      const structured = await structure_profile(
        `Field: "${key}"\nCurrent Value: "${value || ""}"\nEntity: ${this.char.name || "Entity"} (${type})`,
        type,
      );
      if (structured) {
        const output_key = output_key_for_path(canonicalize_field_key(key, type));
        const field_val = output_key ? structured[output_key] || "" : "";

        if (field_val) {
          set_value(this.char, key, field_val.trim());
          this._user_mutated = true;
        }
      }
    } catch (err) {
      console.error("Enhance failed:", err);
    } finally {
      this.busy_fields.delete(key);
    }
  }

  /**
   * AI-enhanced text generation for the entire profile.
   * @param {"character" | "fractal"} entity_type
   */
  async enhance_profile(entity_type) {
    if (this.is_saving) return;
    this.is_saving = true;

    for (const path of QUADRANT_PATHS) this.busy_fields.add(path);
    this.busy_fields.add("description");

    try {
      const structured = await structure_profile(this.char, entity_type);
      if (structured) {
        for (const path of QUADRANT_PATHS) {
          const output_key = output_key_for_path(path);
          if (structured[output_key]) set_value(this.char, path, structured[output_key]);
        }
        this._user_mutated = true;
      }
    } catch (err) {
      console.error("Enhance profile failed:", err);
    } finally {
      for (const path of QUADRANT_PATHS) this.busy_fields.delete(path);
      this.busy_fields.delete("description");
      this.is_saving = false;
    }
  }

  /**
   * Sets the character's profile picture and triggers immediate persistence.
   * @param {string} data_url
   */
  async setImage(data_url) {
    if (!this.char || typeof data_url !== "string") return;
    const clean_url = data_url.trim();
    this.char.profile_picture = clean_url;

    const id = this.char.id;
    if (id) {
      const type = resolve_entity_type(this.char?.type);
      await db.entities.update(id, { profile_picture: clean_url, updated_at: Date.now() });
      await runtime.update_entity(type, id, { profile_picture: clean_url });
      this._user_mutated = true;
    }
  }
}
