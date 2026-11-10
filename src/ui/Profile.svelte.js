/**
 * @file src/ui/profile/Profile.svelte.js
 * 🧬 PROFILE STATE — Reactive controller for entity editing.
 */
import { db, normalize_entity as normalize } from "@storage";
import { PROFILE_FIELD_CATALOG } from "../definitions/profile-fields.js";
import { structure_profile } from "@engine";
import { app } from "./interface.svelte.js";
import { runtime } from "@engine";
import { get_value, set_value, safe_parse_pseudo_json } from "@utils";
import { SvelteSet } from "svelte/reactivity";

const DEFAULT_FIELD = { key: "visual-prompt", label: "Image Prompt" };
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

  /** * Operational gate tracking real human input or array alterations.
   * @type {boolean}
   */
  _user_mutated = $state(false);

  /**
   * Marks the workspace as dirtied by the user. The write is deferred out of the
   * current (possibly reactive) pass: `change`/`input` events that the browser
   * dispatches synchronously while Svelte tears down DOM (e.g. removing a focused
   * field when the profile closes) would otherwise trigger Svelte's
   * `state_unsafe_mutation` check.
   */
  mark_mutated() {
    queueMicrotask(() => {
      this._user_mutated = true;
    });
  }

  /** * Pending entity-swap held back by the dirty guard (see sync()). */
  _pending_swap = null;
  /** * True while the user is asked whether to discard in-flight edits. */
  pending_swap_confirm = $state(false);

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
   * Locked while the entity is claimed by an active (non-concluded) story,
   * unless DevMode is explicitly enabled. The profile modal still opens in
   * read-only mode — only mutation is blocked.
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
   * No-op while the entity is locked by an active story.
   */
  start_editing() {
    if (!this.can_edit) return;
    this._user_mutated = false;
    this.is_editing = true;
  }

  /**
   * Syncs character state when the app-level editing entity changes.
   */
  sync() {
    if (app.editing_entity && app.editing_entity.id !== this.char?.id) {
      // Mid-edit entity swap: never silently discard in-flight edits. Hold the
      // swap behind a confirm dialog so the user decides what happens to them.
      if (this.is_dirty) {
        this._pending_swap = app.editing_entity;
        this.pending_swap_confirm = true;
        return;
      }
      this.char = normalize(app.editing_entity);
      this.reset_active_field();
    }
  }

  /**
   * User confirmed the swap: discard the in-flight edits and open the new entity.
   */
  confirm_swap() {
    const next = this._pending_swap;
    this._pending_swap = null;
    this.pending_swap_confirm = false;
    if (next) {
      this.is_editing = false;
      this._user_mutated = false;
      this.char = normalize(next);
      this.reset_active_field();
    }
  }

  /**
   * User cancelled the swap: keep editing the current entity and restore
   * app.editing_entity so the app still targets the entity on screen.
   */
  reject_swap() {
    this._pending_swap = null;
    this.pending_swap_confirm = false;
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
      await this.save(entity_type);
    }
    this.is_editing = false;
    const active_wings = app.settings.dev_mode;
    if (active_wings) {
      this.is_packing_up = true;
      setTimeout(() => {
        this.is_packing_up = false;
        app.toggle_profile(false);
      }, 500); // 500ms matches --duration-slow / motion-elastic
    } else {
      app.toggle_profile(false);
    }
  }

  /**
   * Reverts changes and exits editing mode.
   */
  cancel() {
    this.is_editing = false;
    this.char = normalize(app.editing_entity || runtime.active_user);
    this._user_mutated = false;
    this.reset_active_field();
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
    this.is_editing = false;
    this._user_mutated = false;
    this.is_saving = true;
    try {
      for (const key of ["past"]) {
        if (Array.isArray(this.char[key])) {
          this.char[key] = this.char[key].filter((v) =>
            typeof v === "object" && v !== null ? !!(v.content || v.directive)?.trim() : !!String(v).trim(),
          );
        }
      }
      await runtime.save_entity(entity_type, this.char);
      await app.load_entities(); // Refresh lists

      const list = entity_type === "character" ? app.ai_list : app.fractal_list;
      const updated = Array.isArray(list) ? list.find((e) => e.id === this.char.id) : null;

      if (entity_type === "character") {
        if (app.selected_ai?.id === this.char.id) app.selected_ai = updated;
        if (app.selected_user?.id === this.char.id) app.selected_user = updated;
      } else {
        if (app.selected_fractal?.id === this.char.id) app.selected_fractal = updated;
      }

      // Sync app.editing_entity so the Profile modal picks up the saved data
      // (prevents stale display when reopening the profile without a refresh)
      if (updated) app.editing_entity = updated;
    } catch (err) {
      console.error("Failed to save profile:", err);
      this.is_editing = true;
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

      // Clear selected entity references if the deleted entity was selected
      if (entity_type === "character") {
        if (app.selected_ai?.id === this.char.id) app.selected_ai = null;
        if (app.selected_user?.id === this.char.id) app.selected_user = null;
      } else {
        if (app.selected_fractal?.id === this.char.id) app.selected_fractal = null;
      }

      // Refresh entity lists so CardHand and storyboard slots update immediately
      await app.load_entities();

      app.toggle_profile(false);
    } catch (err) {
      console.error("Failed to delete entity:", err);
    }
  }

  /**
   * AI-enhanced text generation for a field.
   * Only catalog fields are enhancable — name, description, and any
   * non-catalog field are excluded by design.
   * @param {string} key
   * @param {string} value
   */
  async enhance(key, value) {
    if (!value || this.busy_fields.has(key)) return;
    const type = this.char?.type === "user" ? "character" : this.char?.type || "character";
    const catalog_meta = PROFILE_FIELD_CATALOG[`${type}.${key}`];
    if (!catalog_meta) return;
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
      const type = this.char.type === "user" ? "character" : this.char.type || "character";
      const structured = await structure_profile(
        `Field: "${key}"\nCurrent Value: "${value || ""}"\nEntity: ${this.char.name || "Entity"} (${type})`,
        type,
      );
      if (structured) {
        let field_val = "";
        if (key === "eternal.physical") field_val = structured.eternal_physical || "";
        else if (key === "eternal.non_physical") field_val = structured.eternal_non_physical || "";
        else if (key === "present.physical") field_val = structured.present_physical || "";
        else if (key === "present.non_physical") field_val = structured.present_non_physical || "";
        else if (key === "future") field_val = structured.future || "";
        else if (key === "past") field_val = structured.past || "";

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
   * Validates and canonicalizes an enhanced physical-state value into bracket
   * syntax ([KEY: value] one per line). Returns null when the result is
   * unparsable or drops a mandatory key — the caller then keeps the old value.
   * @param {string} key
   * @param {string} result
   * @param {string} type
   * @returns {string | null}
   */
  _normalize_physical_enhancement(key, result, type) {
    const parsed = safe_parse_pseudo_json(result);
    if (!parsed || parsed.__raw_prose__ || Object.keys(parsed).length === 0) return null;

    const entries = Object.entries(parsed);
    if (entries.length > 15) return null;

    if (key === "eternal.physical" && type === "character") {
      const present = new SvelteSet(entries.map(([k]) => String(k).toUpperCase().replace(/\s+/g, "_")));
      for (const mandatory of ["GENDER", "AGE", "ETHNICITY"]) {
        if (!present.has(mandatory)) return null;
      }
    }

    return entries.map(([k, v]) => `[${String(k).toUpperCase().replace(/\s+/g, "_")}: ${Array.isArray(v) ? v.join(", ") : String(v)}]`).join(" ");
  }

  /**
   * AI-enhanced text generation for the entire profile.
   * @param {"character" | "fractal"} entity_type
   */
  async enhance_profile(entity_type) {
    if (this.is_saving) return;
    this.is_saving = true; // Use is_saving flag to prevent double clicks and lock UI

    // Temporarily mark all fields as busy for visual feedback
    this.busy_fields.add("eternal.physical");
    this.busy_fields.add("eternal.non_physical");
    this.busy_fields.add("present.physical");
    this.busy_fields.add("present.non_physical");
    this.busy_fields.add("past");
    this.busy_fields.add("future");
    this.busy_fields.add("description");

    try {
      const structured = await structure_profile(this.char, entity_type);
      if (structured) {
        if (structured.eternal_physical) set_value(this.char, "eternal.physical", structured.eternal_physical);
        if (structured.eternal_non_physical) set_value(this.char, "eternal.non_physical", structured.eternal_non_physical);
        if (structured.present_physical) set_value(this.char, "present.physical", structured.present_physical);
        if (structured.present_non_physical) set_value(this.char, "present.non_physical", structured.present_non_physical);
        if (structured.future) set_value(this.char, "future", structured.future);
        if (structured.past) set_value(this.char, "past", structured.past);
        this._user_mutated = true;
      }
    } catch (err) {
      console.error("Enhance profile failed:", err);
    } finally {
      this.busy_fields.delete("eternal.physical");
      this.busy_fields.delete("eternal.non_physical");
      this.busy_fields.delete("present.physical");
      this.busy_fields.delete("present.non_physical");
      this.busy_fields.delete("past");
      this.busy_fields.delete("future");
      this.busy_fields.delete("description");
      this.is_saving = false;
    }
  }

  /**
   * Sets the character's profile picture and triggers immediate persistence.
   * Includes metadata strip edge-case guard by trimming whitespace/newlines.
   * @param {string} data_url
   */
  async setImage(data_url) {
    if (!this.char || typeof data_url !== "string") return;
    const clean_url = data_url.trim();
    this.char.profile_picture = clean_url;

    const id = this.char.id;
    if (id) {
      const type = this.char.type === "user" ? "character" : this.char.type || "character";
      await db.entities.update(id, { profile_picture: clean_url, updated_at: Date.now() });
      await runtime.update_entity(type, id, { profile_picture: clean_url });
      this._user_mutated = true;
    }
  }
}

/**
 * CHANGELOG
 * - 2026-09-19: Fixed E1: explicitly passed catalog_meta (enhancer, label, directive, layer_key, is_array_field) in enhance_field_inner and enhance_vector_item when compiling enhancement prompts.
 */
