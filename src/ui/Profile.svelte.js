/**
 * @file src/ui/Profile.svelte.js
 * Reactive controller for entity editing.
 */
import { normalize_entity as normalize } from "@data";
import { atom_for, canonicalize_field_key, output_key_for_path, resolve_entity_type } from "@definitions";
import { parse_entity_profile } from "@engine";
import { motion, resolve_voice_name, resolve_voice_uri } from "@media";
import { app, session } from "@state";
import { get_value, set_value } from "@utils";
import { SvelteSet } from "svelte/reactivity";

const DEFAULT_FIELD = { key: "visual-prompt", label: "Image Prompt" };
const QUADRANT_PATHS = ["eternal.physical", "eternal.non_physical", "present.physical", "present.non_physical", "past", "future"];
const ID_PATTERN = /^[A-Za-z0-9_-]{2,36}$/;

const clean_id = (raw) =>
  String(raw ?? "")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 36);

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

  _user_mutated = $state(false);
  _original_id = null;
  _pending_swap = null;
  _edit_snapshot = null;

  /** @type {string | null} */
  draft_id = $state(null);
  /** @type {string | null} */
  draft_name = $state(null);
  identity_error = $state("");
  pending_swap_confirm = $state(false);
  pending_swap_detail = $state("");

  constructor() {
    this.char = normalize(app.editing_entity || session.active_user);
  }

  get id_valid() {
    return Boolean(this.char) && ID_PATTERN.test(String(this.char.id || ""));
  }

  get name_valid() {
    return Boolean(this.char) && String(this.char.name || "").trim().length > 0;
  }

  get identity_valid() {
    return this.id_valid && this.name_valid;
  }

  get is_dirty() {
    return this.is_editing && this._user_mutated;
  }

  get can_edit() {
    if (app.settings.dev_mode || !this.char?.id) return true;
    return !app.claimed_entity_ids.has(String(this.char.id));
  }

  get story_locked() {
    return !this.can_edit;
  }

  sync_identity_drafts() {
    this._original_id = this.char ? String(this.char.id || "") : null;
    this.draft_id = this.char ? String(this.char.id || "") : "";
    this.draft_name = this.char ? String(this.char.name || "") : "";
    this.identity_error = "";
  }

  clear_identity_drafts() {
    this._original_id = null;
    this.draft_id = null;
    this.draft_name = null;
    this.identity_error = "";
  }

  commit_draft_id() {
    if (this.draft_id == null) return true;
    const cleaned = clean_id(this.draft_id);
    if (cleaned !== this.draft_id) this.draft_id = cleaned;
    if (!ID_PATTERN.test(cleaned)) return false;
    if (this.char && this.char.id !== cleaned) {
      this.char.id = cleaned;
      this._user_mutated = true;
    }
    return true;
  }

  commit_draft_name() {
    if (this.draft_name == null) return true;
    if (!String(this.draft_name).trim()) return false;
    if (this.char && this.char.name !== this.draft_name) {
      this.char.name = this.draft_name;
      this._user_mutated = true;
    }
    return true;
  }

  commit_identity_drafts() {
    const id_ok = this.commit_draft_id();
    const name_ok = this.commit_draft_name();
    return id_ok && name_ok;
  }

  canonical_copy(char) {
    const snap = JSON.parse(JSON.stringify(char));
    if (!snap) return snap;
    if (typeof snap.id === "string") snap.id = clean_id(snap.id);
    if (snap.voice && typeof snap.voice === "object") {
      const vkey = snap.voice.name || snap.voice.uri || "Standard Voice";
      snap.voice.name = resolve_voice_name(vkey);
      snap.voice.uri = resolve_voice_uri(vkey);
      snap.voice.cadence ??= "standard";
    }
    return snap;
  }

  take_edit_snapshot() {
    try {
      this._edit_snapshot = this.canonical_copy(this.char);
    } catch {
      this._edit_snapshot = null;
    }
    this.pending_swap_detail = "";
  }

  describe_dirty() {
    try {
      if (!this._edit_snapshot || !this.char) return "Changed: (snapshot unavailable)";
      const paths = this.collect_changed_paths(this._edit_snapshot, this.canonical_copy(this.char), "", [], 0);
      return paths.length ? `Changed: ${paths.join(", ")}` : "Flag set, but no content differences found.";
    } catch {
      return "Changed: (diff failed)";
    }
  }

  collect_changed_paths(a, b, base, out, depth) {
    if (out.length >= 12 || depth > 6 || typeof a === "function" || typeof b === "function" || Object.is(a, b)) return out;
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
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (out.length >= 12) break;
      this.collect_changed_paths(a[k], b[k], base ? `${base}.${k}` : k, out, depth + 1);
    }
    return out;
  }

  mark_mutated() {
    queueMicrotask(() => {
      this._user_mutated = true;
    });
  }

  start_editing() {
    if (!this.can_edit) return;
    this._user_mutated = false;
    this.is_editing = true;
    this.sync_identity_drafts();
    this.take_edit_snapshot();
  }

  sync() {
    if (!app.editing_entity || app.editing_entity.id === this.char?.id) return;
    if (this.is_dirty) {
      this._pending_swap = app.editing_entity;
      this.pending_swap_confirm = true;
      this.pending_swap_detail = this.describe_dirty();
      return;
    }
    this.char = normalize(app.editing_entity);
    this.reset_active_field();
    this._user_mutated = false;
    if (this.is_editing) this.sync_identity_drafts();
    else this.clear_identity_drafts();
    this.take_edit_snapshot();
  }

  confirm_swap() {
    const next = this._pending_swap;
    this._pending_swap = null;
    this.pending_swap_confirm = false;
    this._edit_snapshot = null;
    this.pending_swap_detail = "";
    if (!next) return;
    this.is_editing = false;
    this._user_mutated = false;
    this.char = normalize(next);
    this.reset_active_field();
    this.clear_identity_drafts();
  }

  reject_swap() {
    this._pending_swap = null;
    this.pending_swap_confirm = false;
    this.pending_swap_detail = "";
    if (app.editing_entity && app.editing_entity.id !== this.char?.id) {
      app.editing_entity = this.char;
    }
  }

  get_safe_value(path) {
    if (!this.char) return "";
    const val = get_value(this.char, path);
    return val ?? "";
  }

  set_field_value(path, value) {
    if (!this.char) return;
    set_value(this.char, path, value);
    this._user_mutated = true;
  }

  async handle_close(entity_type = "character") {
    if (this.is_packing_up) return false;
    if (this.is_editing && this._user_mutated) {
      const ok = await this.save(entity_type);
      if (!ok) return false;
    }
    this.is_editing = false;
    if (app.settings.dev_mode && !motion.is_reduced) {
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

  cancel() {
    this.is_editing = false;
    this.char = normalize(app.editing_entity || session.active_user);
    this._user_mutated = false;
    this._edit_snapshot = null;
    this.pending_swap_detail = "";
    this.reset_active_field();
    this.clear_identity_drafts();
  }

  set_active_field(key, label) {
    this.active_field = { key, label: label || "" };
  }

  reset_active_field() {
    this.active_field = DEFAULT_FIELD;
  }

  async save(entity_type) {
    if (this.is_saving) return false;
    this.commit_identity_drafts();
    if (!this.identity_valid) {
      this.identity_error = !this.id_valid ? "ID must be 2–36 chars (A–Z, a–z, 0–9, _ or -)." : "Name is required.";
      this.is_editing = true;
      return false;
    }

    this.identity_error = "";
    this.is_editing = false;
    this.is_saving = true;

    try {
      const prev_id = this._original_id;
      const next_id = this.char.id;

      await session.save_entity(entity_type, this.char);
      if (prev_id && prev_id !== next_id) {
        await session.delete_entity(entity_type, prev_id);
      }

      await app.load_entities();

      const list = entity_type === "character" ? app.characters : app.fractal_list;
      const updated = Array.isArray(list) ? list.find((e) => e.id === next_id) : null;
      const match_id = prev_id || next_id;

      if (entity_type === "character") {
        if (app.selected_ai?.id === match_id) app.selected_ai = updated;
        if (app.selected_user?.id === match_id) app.selected_user = updated;
      } else if (app.selected_fractal?.id === match_id) {
        app.selected_fractal = updated;
      }

      if (updated) app.editing_entity = updated;
      this._user_mutated = false;
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

  async delete(entity_type) {
    try {
      await session.delete_entity(entity_type, this.char.id);
      if (entity_type === "character") {
        if (app.selected_ai?.id === this.char.id) app.selected_ai = null;
        if (app.selected_user?.id === this.char.id) app.selected_user = null;
      } else if (app.selected_fractal?.id === this.char.id) {
        app.selected_fractal = null;
      }
      await app.load_entities();
      app.toggle_profile(false);
    } catch (err) {
      console.error("Failed to delete entity:", err);
    }
  }

  async enhance(key, value) {
    if (!value || this.busy_fields.has(key)) return;
    const type = resolve_entity_type(this.char?.type);
    const atom = atom_for(type, key);
    if (!atom?.directive) return;

    this.busy_fields.add(key);
    try {
      const structured = await parse_entity_profile(`Field: "${key}"\nCurrent Value: "${value}"\nEntity: ${this.char.name || "Entity"} (${type})`, type);
      if (!structured) return;
      const output_key = output_key_for_path(canonicalize_field_key(key, type));
      const field_val = output_key ? structured[output_key] || "" : "";
      if (field_val) {
        set_value(this.char, key, field_val.trim());
        this._user_mutated = true;
      }
    } catch (err) {
      console.error("Enhance failed:", err);
    } finally {
      this.busy_fields.delete(key);
    }
  }

  async enhance_profile(entity_type) {
    if (this.is_saving) return;
    this.is_saving = true;
    const locked_paths = [...QUADRANT_PATHS, "description"];
    for (const path of locked_paths) this.busy_fields.add(path);

    try {
      const structured = await parse_entity_profile(this.char, entity_type);
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
      for (const path of locked_paths) this.busy_fields.delete(path);
      this.is_saving = false;
    }
  }

  async setImage(data_url) {
    if (!this.char || typeof data_url !== "string") return;
    const clean_url = data_url.trim();
    this.char.profile_picture = clean_url;
    if (this.char.id) {
      const type = resolve_entity_type(this.char?.type);
      await session.update_entity(type, this.char.id, { profile_picture: clean_url });
      this._user_mutated = true;
    }
  }
}
