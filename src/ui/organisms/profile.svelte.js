/**
 * @file src/ui/profile/profile.svelte.js
 * 🧬 PROFILE STATE — Reactive controller for entity editing.
 */
import { db, normalize } from "@data";
import { generateUUID } from "@engine";
import { prompt_builder, strip_cognition_blocks, temporal_engine } from "@intelligence";
import { llm_service } from "@platform";
import { app, runtime } from "@state";
import { get_value, set_value } from "@utils";
import { SvelteSet } from "svelte/reactivity";

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

  /** * Operational gate tracking real human input or array alterations.
   * @type {boolean}
   */
  _user_mutated = $state(false);

  constructor() {
    this.char = normalize(app.editing_entity || runtime.character);
  }

  /**
   * Deterministic check verifying if the active workspace has morphed during this edit session.
   * @type {boolean}
   */
  get is_dirty() {
    return this.is_editing && this._user_mutated;
  }

  /**
   * Reactive accessor for background removal modifier.
   * @type {boolean}
   */
  get noBackground() {
    return !!this.char?.modifiers?.no_background;
  }

  set noBackground(val) {
    if (this.char?.modifiers) {
      this.char.modifiers.no_background = val;
      this._user_mutated = true;
    }
  }

  /**
   * Initiates the editing state transition and resets interaction tracking.
   */
  start_editing() {
    this._user_mutated = false;
    this.is_editing = true;
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
    this._user_mutated = true;
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
      const payload = prompt_builder.build_enhancement(key, value, this.char.name || "", type, false, this.char);
      const result = await llm_service.enhance(payload);
      if (result) {
        const clean_result = strip_cognition_blocks(result).trim();
        set_value(this.char, key, clean_result);
        this._user_mutated = true;
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
      const payload = prompt_builder.build_profile_sorting_prompt(this.char, entity_type);
      const result = await llm_service.enhance(payload);

      if (result) {
        const cleanJsonText = strip_cognition_blocks(result).trim();
        const startIdx = cleanJsonText.indexOf("{");
        const endIdx = cleanJsonText.lastIndexOf("}");

        if (startIdx >= 0 && endIdx >= 0) {
          const cleanJson = JSON.parse(cleanJsonText.substring(startIdx, endIdx + 1));

          for (let [key, val] of Object.entries(cleanJson)) {
            if (key === "profile_picture" || key === "image" || key === "id" || key === "type") continue;

            // Map flat LLM keys (e.g. eternal_physical) back to nested DB schema (eternal.physical)
            if (key === "eternal_physical") key = "eternal.physical";
            else if (key === "eternal_non_physical") key = "eternal.non_physical";
            else if (key === "present_physical") key = "present.physical";
            else if (key === "present_non_physical") key = "present.non_physical";

            if (key === "past" || key === "future") {
              if (Array.isArray(val)) {
                const currentVectors = get_value(this.char, key) || [];
                const newVectors = val.map((textStr, idx) => {
                  const existing = currentVectors[idx] || {};
                  const vectorStr = typeof textStr === "string" ? textStr : textStr.directive || textStr.text || JSON.stringify(textStr);
                  return {
                    ...temporal_engine.create(vectorStr, key),
                    id: existing.id || generateUUID(),
                    emotional_weight: existing.emotional_weight || existing.base_weight || 5,
                  };
                });
                set_value(this.char, key, newVectors);
              }
            } else if (typeof val === "object" && !Array.isArray(val)) {
              for (const [subKey, subVal] of Object.entries(val)) {
                if (typeof subVal === "string") {
                  set_value(this.char, `${key}.${subKey}`, subVal);
                }
              }
            } else if (typeof val === "string") {
              set_value(this.char, key, val);
            }
          }
          this._user_mutated = true;
        }
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
      directive: "",
      type: path,
      emotional_weight: 5,
      vector_tags: [],
    };

    set_value(this.char, path, [newItem, ...items]);
    this._user_mutated = true;
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
    this._user_mutated = true;
  }

  /**
   * Removes an item from a vector array.
   * @param {string} path
   * @param {number} index
   */
  remove_vector_item(path, index) {
    if (!this.char) return;
    const items = (get_value(this.char, path) || []).filter((/** @type {any} */ _, /** @type {number} */ i) => i !== index);
    set_value(this.char, path, items);
    this._user_mutated = true;
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
    const weight = item.emotional_weight ?? 5;
    this.patch_vector_item(path, index, {
      emotional_weight: Math.min(10, Math.max(1, weight + delta)),
    });
    this._user_mutated = true;
  }

  /**
   * Sets the character's profile picture and triggers immediate persistence.
   * Includes metadata strip edge-case guard by trimming whitespace/newlines.
   * @param {string} dataUrl
   */
  async setImage(dataUrl) {
    if (!this.char || typeof dataUrl !== "string") return;
    const cleanUrl = dataUrl.trim();
    this.char.profile_picture = cleanUrl;
    this.char.image = cleanUrl; // Fallback support

    const id = this.char.id;
    if (id) {
      const type = this.char.type === "user" ? "character" : this.char.type || "character";
      await db.entities.update(id, { profile_picture: cleanUrl, updated_at: Date.now() });
      await runtime.update_entity(type, id, { profile_picture: cleanUrl });
      this._user_mutated = true;
    }
  }
}
