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
      const active_wings = this.is_editing || app.settings.dev_mode;
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

        // Array fields (past/future) return JSON arrays of vector objects
        const is_array_field = key === "past" || key === "future";
        if (is_array_field) {
          const json_str = clean_result.replace(/```json\n?|```/g, "").trim();
          const start = json_str.indexOf("[");
          const end = json_str.lastIndexOf("]");
          if (start >= 0 && end >= 0) {
            try {
              const parsed = JSON.parse(json_str.substring(start, end + 1));
              if (Array.isArray(parsed)) {
                const vectors = parsed.map((v) => {
                  const directive = typeof v === "string" ? v : v.directive || v.text || "";
                  return {
                    ...temporal_engine.create(directive, key),
                    tags: Array.isArray(v.tags) ? v.tags : [],
                    emotional_weight: v.emotional_weight ?? v.base_weight ?? 5,
                  };
                });
                set_value(this.char, key, vectors);
                this._user_mutated = true;
              }
            } catch (e) {
              console.error("Array enhancement JSON parse failed:", e);
            }
          }
        } else {
          set_value(this.char, key, clean_result);
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
   * AI-enhanced text generation for a specific vector item in an array (e.g. past[0]).
   * @param {string} path - Array path ('past' or 'future')
   * @param {number} index - Index of item to enhance
   */
  async enhance_vector_item(path, index) {
    const itemKey = `${path}[${index}]`;
    const items = get_value(this.char, path) || [];
    const item = items[index];
    const directive = typeof item === "string" ? item : item?.directive;

    if (!directive || this.busy_fields.has(itemKey) || this.busy_fields.has(path)) return;

    this.busy_fields.add(itemKey);
    this.busy_fields.add(path);

    try {
      const type = this.char.type === "user" ? "character" : this.char.type || "character";
      const payload = prompt_builder.build_enhancement(path, directive, this.char.name || "", type, false, this.char);
      const result = await llm_service.enhance(payload);

      if (result) {
        let clean_result = strip_cognition_blocks(result).trim();
        let json_str = clean_result.replace(/```json\n?|```/g, "").trim();

        const start_arr = json_str.indexOf("[");
        const end_arr = json_str.lastIndexOf("]");
        const start_obj = json_str.indexOf("{");
        const end_obj = json_str.lastIndexOf("}");

        let patch = {};

        if (start_arr >= 0 && end_arr > start_arr) {
          try {
            const parsed = JSON.parse(json_str.substring(start_arr, end_arr + 1));
            if (Array.isArray(parsed) && parsed.length > 0) {
              const currentItems = [...(get_value(this.char, path) || [])];

              parsed.forEach((v, idx) => {
                const targetIdx = index + idx;
                const dir = typeof v === "string" ? v : v.directive || v.text || "";
                if (!dir) return;

                const tags = Array.isArray(v.tags) ? v.tags : [];
                const emotional_weight = typeof v.emotional_weight === "number" ? v.emotional_weight : 5;

                if (targetIdx < currentItems.length) {
                  const existing = currentItems[targetIdx];
                  currentItems[targetIdx] = {
                    ...existing,
                    directive: dir,
                    tags: tags.length > 0 ? tags : existing.tags || [],
                    emotional_weight: typeof v.emotional_weight === "number" ? emotional_weight : (existing.emotional_weight ?? 5),
                  };
                } else {
                  currentItems.push({
                    id: generateUUID(),
                    timestamp: Date.now(),
                    directive: dir,
                    type: path,
                    emotional_weight,
                    tags,
                  });
                }
              });

              set_value(this.char, path, currentItems);
              this._user_mutated = true;
              return;
            }
          } catch (_e) {
            // Keep clean_result as fallback
          }
        } else if (start_obj >= 0 && end_obj > start_obj) {
          try {
            const parsed = JSON.parse(json_str.substring(start_obj, end_obj + 1));
            if (parsed && typeof parsed === "object") {
              if (parsed.directive || parsed.text) patch.directive = parsed.directive || parsed.text;
              if (Array.isArray(parsed.tags) && parsed.tags.length > 0) patch.tags = parsed.tags;
              if (typeof parsed.emotional_weight === "number") patch.emotional_weight = parsed.emotional_weight;
            }
          } catch (_e) {
            // Keep clean_result as fallback
          }
        }

        if (!patch.directive) {
          clean_result = clean_result.replace(/^"(.*)"$/, "$1").trim();
          if (clean_result) patch.directive = clean_result;
        }

        if (patch.directive) {
          this.patch_vector_item(path, index, patch);
          this._user_mutated = true;
        }
      }
    } catch (err) {
      console.error("Vector item enhance failed:", err);
    } finally {
      this.busy_fields.delete(itemKey);
      this.busy_fields.delete(path);
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
      tags: [],
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
