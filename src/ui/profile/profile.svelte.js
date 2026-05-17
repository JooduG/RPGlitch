/**
 * @file src/ui/profile/profile.svelte.js
 * 🧬 PROFILE STATE — Reactive controller for entity editing.
 */
import { SvelteSet } from "svelte/reactivity";
import { app } from "@state/app.svelte.js";
import { runtime } from "@state/runtime.svelte.js";
import { normalize } from "@data/content-normaliser.js";
import { llm_service } from "@core/intelligence/llm-service.js";
import { prompt_builder } from "@core/intelligence/prompt-builder.js";
import { get_value, set_value } from "@utils/field-path.js";
import { generateUUID } from "@core/utils.js";

const DEFAULT_FIELD = { key: "visual-prompt", label: "Image Prompt" };

export class ProfileState {
  is_editing = $state(false);
  is_saving = $state(false);
  show_delete_confirm = $state(false);
  /** @type {string | null} */
  hovered_section = $state(null);
  active_field = $state(DEFAULT_FIELD);

  /** @type {SvelteSet<string>} */
  busy_fields = new SvelteSet();

  /** @type {any} */
  char = $state(null);

  constructor() {
    this.char = normalize(app.editing_entity || runtime.character);
  }

  /**
   * Syncs character state when the app-level editing entity changes.
   */
  sync() {
    if (app.editing_entity && app.editing_entity.id !== this.char?.id) {
      this.char = normalize(app.editing_entity);
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
  }

  /**
   * Toggles editing mode or closes the profile.
   */
  handle_close() {
    if (this.is_editing) {
      this.cancel();
    } else {
      app.toggle_profile(false);
    }
  }

  /**
   * Reverts changes and exits editing mode.
   */
  cancel() {
    this.is_editing = false;
    this.char = normalize(app.editing_entity || runtime.character);
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
    this.is_saving = true;
    try {
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
    this.busy_fields.add(key);
    try {
      const payload = prompt_builder.build_enhancement(key, value);
      const result = await llm_service.enhance(payload);
      if (result) set_value(this.char, key, result);
    } catch (err) {
      console.error("Enhance failed:", err);
    } finally {
      this.busy_fields.delete(key);
    }
  }

  /**
   * Adds a new item to a vector array.
   * @param {string} path
   */
  add_vector_item(path) {
    if (!this.char || !this.is_editing) return;

    const raw = get_value(this.char, path) || [];
    const items = Array.isArray(raw) ? raw : typeof raw === "string" && raw.trim() ? [raw] : [];

    const newItem = {
      id: generateUUID(),
      timestamp: Date.now(),
      text: "",
      type: path,
      base_weight: 5,
      vector_tags: [],
    };

    set_value(this.char, path, [newItem, ...items]);
  }

  /**
   * Patches a specific item in a vector array.
   * @param {string} path
   * @param {number} index
   * @param {any} patch
   */
  patch_vector_item(path, index, patch) {
    if (!this.char) return;
    const items = [...(get_value(this.char, path) || [])];
    if (!items[index]) return;
    items[index] = { ...items[index], ...patch };
    set_value(this.char, path, items);
  }

  /**
   * Removes an item from a vector array.
   * @param {string} path
   * @param {number} index
   */
  remove_vector_item(path, index) {
    if (!this.char) return;
    const items = (get_value(this.char, path) || []).filter(
      (/** @type {any} */ _, /** @type {number} */ i) => i !== index,
    );
    set_value(this.char, path, items);
  }

  /**
   * Updates the weight of a vector item.
   * @param {string} path
   * @param {number} index
   * @param {number} delta
   */
  update_vector_weight(path, index, delta) {
    if (!this.char) return;
    const items = get_value(this.char, path) || [];
    const item = items[index];
    if (!item) return;
    const weight = item.base_weight ?? 5;
    this.patch_vector_item(path, index, {
      base_weight: Math.min(10, Math.max(1, weight + delta)),
    });
  }
}
