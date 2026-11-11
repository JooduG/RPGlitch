<script>
  /**
   * @file src/ui/profile/Profile.svelte
   * 🧪 ENTITY EDITOR — Primary orchestrator for viewing and editing entities.
   * Flat DOM · Bolted Architecture
   */
  import { auto_resize, click_outside, format_datetime, generate_uuid } from "@utils";
  import { download_json_file, safe_parse_pseudo_json } from "@utils";
  import { Button, Modal, TextField, tooltip, Dropdown, Label, StyleBadge } from "@primitives";
  import { Shimmer } from "@primitives";
  import { ProfilePicture } from "@ui";
  import { get_signature_color } from "@media";
  import { Dialog } from "@primitives";
  import AudioWing from "./AudioWing.svelte";
  import DevWing from "./DevWing.svelte";
  import VisualWing from "./VisualWing.svelte";
  import { ProfileState } from "./Profile.svelte.js";
  import RelationalGraph from "./RelationalGraph.svelte";
  import { app } from "./interface.svelte.js";
  import { runtime, simulation_state } from "@engine";
  import { resolve_display_macro_segments } from "@utils";
  import MacroText from "./MacroText.svelte";
  import { fade } from "svelte/transition";
  import { SvelteSet } from "svelte/reactivity";
  import {
    serialize_character_card,
    serialize_rpglitch_entity,
    normalize_entity as normalize,
    query_entity_history,
    replay_entity_field,
    replay_full_entity_at_round,
    upsert_entity,
    update_entity,
  } from "@data";
  import { PROFILE_SECTIONS_BY_TYPE, PROFILE_FIELDS } from "../definitions/profile-taxonomy.js";
  import { NARRATIVE_STYLES, get_narrative_style } from "../definitions/narrative-styles.js";
  import { VISUAL_STYLES, get_visual_style } from "../definitions/visual-styles.js";
  const entities = { upsert: upsert_entity, update: update_entity };

  /** @type {{ entity_type?: "character" | "fractal" }} */
  let { entity_type = "character" } = $props();

  // --- ORCHESTRATION ---
  const profile_state = new ProfileState();
  /** @type {HTMLElement | undefined} */
  let footer_el = $state();
  /** Footer height (px) — reserves scroll padding so end content clears the frost overlay. */
  let footer_h = $state(0);
  /** @type {HTMLElement | undefined} */
  let info_container_el = $state();
  /** Native scrollbar lane width (px) — the footer stops short of it. */
  let scrollbar_lane = $state(0);
  /** True while the info scroller actually overflows. */
  let info_needs_scroll = $state(false);
  let previous_scroll_top = $state(0);
  /** Export chooser (edit-mode footer) — picks V2 Card or native RPGlitch JSON. */
  let show_export_modal = $state(false);
  /** Mutation Ledger Field History Inspector */
  let show_field_history_modal = $state(false);
  let history_target_field = $state("present.non_physical");
  /** Full Profile Timeline Scrubber & Branching Mode */
  let show_timeline_modal = $state(false);

  // --- FIELD HISTORY STATE ---
  let is_field_history_loading = $state(false);
  /** @type {Array<any>} */
  let field_history_records = $state([]);
  let reconstructed_brackets = $state("");
  let reconstructed_prose = $state("");
  let field_history_active_tab = $state("timeline"); // "timeline" | "reconstructed"

  $effect(() => {
    if (show_field_history_modal && profile_state.char?.id) {
      load_field_history();
    }
  });

  async function load_field_history() {
    if (!profile_state.char?.id) return;
    is_field_history_loading = true;
    try {
      const records = await query_entity_history(profile_state.char.id, history_target_field);
      field_history_records = records.reverse();
      const replay_result = await replay_entity_field(profile_state.char.id, history_target_field);
      reconstructed_brackets = replay_result.reconstructed_brackets;
      reconstructed_prose = replay_result.raw_prose;
    } catch (err) {
      console.error("[Profile:FieldHistory] Failed to load history:", err);
      field_history_records = [];
    } finally {
      is_field_history_loading = false;
    }
  }

  // --- TIMELINE MODAL STATE ---
  let is_timeline_loading = $state(false);
  let is_performing_timeline_action = $state(false);
  /** @type {Array<number>} */
  let available_timeline_rounds = $state([]);
  let selected_timeline_round = $state(0);
  /** @type {any} */
  let reconstructed_timeline_state = $state(null);
  /** @type {Array<any>} */
  let timeline_round_events = $state([]);

  $effect(() => {
    if (show_timeline_modal && profile_state.char?.id) {
      load_timeline_data();
    }
  });

  async function load_timeline_data() {
    if (!profile_state.char?.id) return;
    is_timeline_loading = true;
    try {
      const history = await query_entity_history(profile_state.char.id);
      const rounds_set = new SvelteSet();
      rounds_set.add(0);
      for (const entry of history) {
        if (typeof entry.round === "number") {
          rounds_set.add(entry.round);
        }
      }
      available_timeline_rounds = Array.from(rounds_set).sort((a, b) => a - b);
      selected_timeline_round = available_timeline_rounds[available_timeline_rounds.length - 1] ?? 0;
      await fetch_timeline_round_state(selected_timeline_round, history);
    } catch (err) {
      console.error("[Profile:Timeline] Failed to load entity timeline:", err);
      available_timeline_rounds = [0];
      selected_timeline_round = 0;
    } finally {
      is_timeline_loading = false;
    }
  }

  /**
   * Fetches the reconstructed profile state up to the target round.
   * @param {number} round
   * @param {Array<any>} [provided_history]
   */
  async function fetch_timeline_round_state(round, provided_history = null) {
    if (!profile_state.char?.id) return;
    try {
      const history = provided_history || (await query_entity_history(profile_state.char.id));
      timeline_round_events = history.filter((e) => e.round === round);
      reconstructed_timeline_state = await replay_full_entity_at_round(profile_state.char.id, round);
    } catch (err) {
      console.error("[Profile:Timeline] Failed to replay entity at round:", err);
    }
  }

  async function handle_select_timeline_round(round) {
    if (round === selected_timeline_round) return;
    selected_timeline_round = round;
    await fetch_timeline_round_state(round);
  }

  /**
   * Reverts the active entity's Four-Quadrant state in-place to this historical snapshot.
   */
  async function handle_timeline_update_from_point() {
    if (!reconstructed_timeline_state || !profile_state.char?.id || is_performing_timeline_action) return;
    is_performing_timeline_action = true;
    try {
      const updated_entity = {
        ...profile_state.char,
        eternal: {
          ...profile_state.char.eternal,
          ...reconstructed_timeline_state.eternal,
        },
        present: {
          ...profile_state.char.present,
          ...reconstructed_timeline_state.present,
        },
        past: reconstructed_timeline_state.past,
        future: reconstructed_timeline_state.future,
      };

      await entities.upsert(entity_type, updated_entity);
      await app.load_entities();

      if (runtime.active_ai?.id === profile_state.char.id) runtime.active_ai = updated_entity;
      if (runtime.active_user?.id === profile_state.char.id) runtime.active_user = updated_entity;
      if (runtime.active_fractal?.id === profile_state.char.id) runtime.active_fractal = updated_entity;

      profile_state.char = normalize(profile_state.char);
      show_timeline_modal = false;
    } catch (err) {
      console.error("[Profile:Timeline] Failed to revert entity state:", err);
    } finally {
      is_performing_timeline_action = false;
    }
  }

  /**
   * Clones a new timeline branch into the census from this historical snapshot.
   */
  async function handle_timeline_clone_from_point() {
    if (!reconstructed_timeline_state || !profile_state.char || is_performing_timeline_action) return;
    is_performing_timeline_action = true;
    try {
      const branch_id = generate_uuid();
      const branch_name = `${profile_state.char.name || "Entity"} (R${selected_timeline_round} Branch)`;
      const new_entity = normalize({
        ...profile_state.char,
        id: branch_id,
        name: branch_name,
        eternal: {
          ...profile_state.char.eternal,
          ...reconstructed_timeline_state.eternal,
        },
        present: {
          ...profile_state.char.present,
          ...reconstructed_timeline_state.present,
        },
        past: reconstructed_timeline_state.past,
        future: reconstructed_timeline_state.future,
      });

      await entities.upsert(entity_type, new_entity);
      await app.load_entities();
      show_timeline_modal = false;
    } catch (err) {
      console.error("[Profile:Timeline] Failed to clone entity branch:", err);
    } finally {
      is_performing_timeline_action = false;
    }
  }

  // --- HEADER REF RUNES ---
  /** @type {HTMLInputElement | undefined} */
  let name_input = $state();

  function format_header_name(rawName) {
    if (!rawName) return "";
    return rawName.trim();
  }

  $effect(() => {
    if (profile_state.is_editing && profile_state.active_field?.key === "name" && name_input) {
      name_input.focus();
      name_input.select();
    }
  });

  // --- DEVMODE LIVE TELEMETRY SYNC ---
  $effect(() => {
    // Keeps the Profile modal Dev Wing synced with live background engine changes
    if (app.settings.dev_mode && profile_state.char?.id) {
      const live_entity = [runtime.active_user, runtime.active_fractal].find((e) => e && e.id === profile_state.char.id);
      if (live_entity?.dynamics && profile_state.char.dynamics) {
        Object.assign(profile_state.char.dynamics, live_entity.dynamics);
      }
    }
  });

  // --- REACTIVE SYNC FOR ENTITY SWAPS ---
  $effect(() => {
    if (app.editing_entity && profile_state.char?.id !== app.editing_entity.id) {
      profile_state.sync();
    }
  });

  // --- FROSTED FOOTER OVERLAY GEOMETRY ---
  // The footer floats over the bottom of the info scroller so content slides
  // under the frost, while the native scrollbar keeps its own reserved lane
  // (the footer stops short of it) so the thumb never rides over the buttons.
  function measure_footer_geometry() {
    const scroller = info_container_el;
    const footer = footer_el;
    if (!scroller || !footer) return;
    const lane = Math.max(0, scroller.offsetWidth - scroller.clientWidth);
    const needs = scroller.scrollHeight > scroller.clientHeight + 1;
    const h = footer.offsetHeight || 0;
    if (lane !== scrollbar_lane) scrollbar_lane = lane;
    if (needs !== info_needs_scroll) info_needs_scroll = needs;
    if (h !== footer_h) footer_h = h;
  }

  $effect(() => {
    if (!info_container_el || !footer_el) return;
    measure_footer_geometry();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => measure_footer_geometry()) : null;
    if (ro) {
      ro.observe(info_container_el);
      ro.observe(footer_el);
    }
    const mo = typeof MutationObserver !== "undefined" ? new MutationObserver(() => measure_footer_geometry()) : null;
    if (mo && info_container_el) {
      mo.observe(info_container_el, { childList: true, subtree: true, characterData: true, attributes: true });
    }
    window.addEventListener("resize", measure_footer_geometry);
    return () => {
      if (ro) ro.disconnect();
      if (mo) mo.disconnect();
      window.removeEventListener("resize", measure_footer_geometry);
    };
  });

  // Re-measure after content/mode swaps (edit toggle, viewport, entity) settle.
  $effect(() => {
    profile_state.is_editing;
    app.viewport.mobile;
    entity_type;
    if (!info_container_el || !footer_el) return;
    const t = setTimeout(measure_footer_geometry, 0);
    return () => clearTimeout(t);
  });

  // --- DERIVED ---
  const signature_color = $derived(get_signature_color(profile_state.char, "var(--color-gunmetal)"));

  const display_entities = $derived({
    AI: runtime.active_ai || app.selected_ai,
    USER: runtime.active_user || app.selected_user,
    FRACTAL: runtime.active_fractal || app.selected_fractal,
  });

  const author_options = Object.values(NARRATIVE_STYLES)
    .sort((a, b) => {
      if (a.id === "default") return -1;
      if (b.id === "default") return 1;
      return a.name.localeCompare(b.name);
    })
    .map((style) => ({
      value: style.id,
      label: style.name,
      portrait: style.portrait,
      tag: style.description,
      tooltip: `${style.name}: ${style.description}`,
    }));

  const visual_style_options = Object.values(VISUAL_STYLES)
    .sort((a, b) => {
      if (a.id === "none") return -1;
      if (b.id === "none") return 1;
      return a.name.localeCompare(b.name);
    })
    .map((style) => ({
      value: style.id,
      label: style.name,
      portrait: style.portrait,
      tag: style.description,
      tooltip: `${style.name}: ${style.description}`,
    }));

  const has_wings = $derived(!app.transitioning_profile && !profile_state.is_packing_up && (profile_state.is_editing || app.settings.dev_mode));

  // --- WING CHOREOGRAPHY GATE ---
  // CSS *animations* of transform-like properties freeze at time 0 in this
  // environment (opacity animations and CSS transitions are unaffected), and
  // the profile card/wings are captured by the open/close view-transition. So
  // the wings-open/close choreography is driven with CSS *transitions* (FLIP),
  // and ONLY when `has_wings` toggles after the profile has settled: never
  // during a flip, never on the initial open (the flip is the open), never on
  // mobile (no wings layout there).
  let card_ref = $state(undefined);
  let wings_ref = $state(undefined);
  let _prev_has_wings = null;

  /** Slides `el` from one translateX to another via a CSS transition (FLIP). */
  function slide_x(el, from_x, to_x, ease = "var(--motion-elastic)") {
    el.style.transition = "none";
    el.style.transform = `translateX(${from_x})`;
    // Stage the "to" pose on the next frame so the transition actually fires
    // (an immediate same-task restyle does not start a transition here).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = `transform ${ease}`;
        el.style.transform = `translateX(${to_x})`;
      });
    });
    setTimeout(() => {
      el.style.transition = "";
      el.style.transform = "";
    }, 1000);
  }

  /** Briefly dips the info column opacity to mask the instant edit/readonly content swap. */
  function dip_content(el) {
    el.style.transition = "none";
    el.style.opacity = "1";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "opacity 90ms ease-in";
        el.style.opacity = "0";
      });
    });
    setTimeout(() => {
      el.style.transition = "opacity 220ms ease-out";
      el.style.opacity = "1";
    }, 120);
    setTimeout(() => {
      el.style.transition = "";
      el.style.opacity = "";
    }, 400);
  }

  $effect(() => {
    const hw = has_wings;
    if (app.transitioning_profile) {
      // Page is being captured by the flip — disarm and clear the choreography.
      _prev_has_wings = null;
      if (card_ref) {
        card_ref.style.transition = "";
        card_ref.style.transform = "";
      }
      if (wings_ref) {
        wings_ref.style.transition = "";
        wings_ref.style.transform = "";
        wings_ref.style.opacity = "";
      }
      return;
    }
    if (app.viewport.mobile) {
      _prev_has_wings = hw;
      return;
    }
    if (_prev_has_wings === null) {
      _prev_has_wings = hw;
      return;
    }
    if (_prev_has_wings !== hw) {
      _prev_has_wings = hw;
      if (hw) {
        // Entering edit — wings sweep in from behind, card glides left.
        if (card_ref) slide_x(card_ref, "33.33%", "0", "var(--motion-elastic)");
        if (wings_ref) slide_x(wings_ref, "-165%", "0", "var(--motion-elastic)");
      } else {
        // Exiting edit — card glides back to center, wings sweep back out to
        // the left behind the card (mirror of their entrance).
        if (card_ref) slide_x(card_ref, "-33.33%", "0", "300ms ease-out");
        if (wings_ref) slide_x(wings_ref, "0", "-165%", "var(--motion-elastic)");
      }
    }
  });

  let _prev_is_editing = null;

  $effect(() => {
    const editing = profile_state.is_editing;
    if (app.transitioning_profile || app.viewport.mobile) {
      _prev_is_editing = editing;
      return;
    }
    if (_prev_is_editing === null) {
      _prev_is_editing = editing;
      return;
    }
    if (_prev_is_editing !== editing) {
      _prev_is_editing = editing;
      if (info_container_el) dip_content(info_container_el);
    }
  });

  const active_sections = $derived(PROFILE_SECTIONS_BY_TYPE[entity_type] || PROFILE_SECTIONS_BY_TYPE.character);
  const target_morph_name = $derived.by(() => {
    if (!profile_state.char?.id) return undefined;
    let type = "";
    if (app.selected_ai?.id === profile_state.char.id) type = "ai";
    else if (app.selected_user?.id === profile_state.char.id) type = "user";
    else if (app.selected_fractal?.id === profile_state.char.id) type = "fractal";

    if (!type) return undefined;
    // Unified flip source: the armed entity card's root carries "card-slot-<type>"
    // in every view (storyboard slot, storymode panel, or prologue message card).
    return "card-slot-" + type;
  });

  // --- STYLELINT SAFE LAYOUT ENGINE STATES ---
  const main_card_class = $derived(
    "flex overflow-hidden border border-solid transition-all duration-300 relative z-10 " +
      (app.viewport.mobile
        ? "col-span-full h-full flex-col rounded-none "
        : (has_wings ? "modal-profile-grid-main row-start-1 my-auto h-[90dvh]" : "modal-profile-grid-flat row-start-1 my-auto h-[90dvh]") +
          " rounded-2xl ") +
      (entity_type === "fractal" ? "flex-col" : "flex-row"),
  );

  const avatar_container_class = $derived(
    "sticky top-0 z-20 flex shrink-0 items-stretch transition-all duration-300 " +
      (entity_type === "fractal" ? "h-12 min-h-64 w-full " : "h-full w-[calc(var(--spacing-column-unit)*2)] ") +
      (app.viewport.mobile ? "h-auto w-auto items-center justify-center" : ""),
  );

  const profile_pic_wrapper_class = $derived(
    "overflow-hidden border-solid transition-all duration-300 " +
      (entity_type === "fractal"
        ? "h-full w-full border-0 border-b " + (!app.viewport.mobile ? "rounded-t-2xl" : "rounded-none")
        : "h-full w-full border-0 border-r " + (!app.viewport.mobile ? "rounded-l-2xl" : "rounded-none")) +
      (app.viewport.mobile
        ? "h-[calc(var(--spacing-column-unit)*2)] w-[calc(var(--spacing-column-unit)*2)] border-(--spacing-pixel) rounded-md"
        : ""),
  );

  const info_container_class = $derived(
    "flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent",
  );

  const main_layout_class = $derived("grow p-0");

  const footer_layout_class = $derived(
    "absolute bottom-0 left-0 z-10 flex gap-4 border-t border-solid border-white/10 px-4 pt-3 pb-4 outline-none " +
      (app.viewport.mobile ? "flex-col items-stretch" : "justify-end"),
  );

  const entity_body_class = $derived("min-w-0 " + (app.viewport.mobile ? "flex flex-col gap-4" : "grid items-center gap-x-2 gap-y-4"));

  const entity_body_grid_cols = $derived(app.viewport.mobile ? undefined : "2rem 1fr");

  // --- MARKUP CONTEXT SANITIZERS ---
  const get_section_class = () => {
    let cls = "relative flex w-full min-w-0 flex-col items-center justify-center my-auto overflow-visible text-center transition-all duration-300 ";
    cls += profile_state.is_editing ? "cursor-pointer " : "cursor-default ";
    if (app.viewport.mobile) cls += "pr-0";
    return cls;
  };

  const get_inner_section_style = (_id) => {
    return "display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: auto; margin-bottom: auto;";
  };

  const get_label_span_class = () => {
    return app.viewport.mobile ? "" : "block rotate-180 my-auto";
  };

  const get_fields_container_class = (fieldsLength) => {
    const base = "grid min-w-0 items-stretch gap-4 my-auto ";
    return base + (fieldsLength === 2 ? "grid-cols-2" : "grid-cols-1");
  };

  const get_ai_action_btn_class = (fieldKey) => {
    let cls = "text-slate-400 transition-all duration-200 hover:text-(--signature-color) ";
    cls += profile_state.active_field?.key === fieldKey ? "opacity-100" : "opacity-0 group-data-[expanded=true]/textfield:opacity-100";
    return cls;
  };

  /**
   * Recursively parses string payloads to detect inline Perchance dynamic variable loops.
   * Supports arbitrary N-flat options like {A|B|C} and nested options like {A|B|{C1|C2}}.
   * @param {string} str
   * @returns {Array<{is_var: boolean, text?: string, choices?: Array<any>}>}
   */
  const parse_variants = (str) => {
    if (!str) return [];

    const result = [];
    let i = 0;
    let text_buffer = "";

    while (i < str.length) {
      if (str[i] === "{") {
        if (text_buffer) {
          result.push({ is_var: false, text: text_buffer });
          text_buffer = "";
        }

        let depth = 1;
        i++;
        let current_choice = "";
        const raw_choices = [];

        while (i < str.length && depth > 0) {
          const char = str[i];
          if (char === "{") {
            depth++;
            current_choice += char;
          } else if (char === "}") {
            depth--;
            if (depth > 0) current_choice += char;
          } else if (char === "|" && depth === 1) {
            raw_choices.push(current_choice.trim());
            current_choice = "";
          } else {
            current_choice += char;
          }
          i++;
        }

        if (current_choice.trim() || raw_choices.length > 0) {
          raw_choices.push(current_choice.trim());
        }

        const parsed_choices = raw_choices.map((c) => parse_variants(c));
        result.push({ is_var: true, choices: parsed_choices });
      } else {
        text_buffer += str[i];
        i++;
      }
    }

    if (text_buffer) {
      result.push({ is_var: false, text: text_buffer });
    }

    return result.length > 0 ? result : [{ is_var: false, text: str }];
  };

  // --- EFFECTS ---
  $effect(() => profile_state.sync());

  // Operational catchment tracking user DOM actions
  $effect(() => {
    if (profile_state.is_editing) {
      const mark_mutated = () => {
        profile_state.mark_mutated();
      };
      window.addEventListener("input", mark_mutated, { capture: true });
      window.addEventListener("change", mark_mutated, { capture: true });

      return () => {
        window.removeEventListener("input", mark_mutated, { capture: true });
        window.removeEventListener("change", mark_mutated, { capture: true });
      };
    }
  });

  /** @type {(event: MouseEvent) => void} */
  function handle_click_outside(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (profile_state.show_delete_confirm) return;
    if (target.closest("[data-wings-container] > *")) return;
    if (
      target.closest(".menu") ||
      target.closest("[data-dropdown-menu]") ||
      target.closest(".dropdown-portal-wrapper") ||
      target.closest(".tooltip-portal") ||
      target.closest("[data-modal-variant='lightbox']") ||
      target.closest("[data-modal-backdrop='lightbox']") ||
      target.closest("[data-modal-variant='bare']") ||
      target.closest("[data-modal-backdrop='bare']")
    )
      return;
    if (target.closest("[data-backdrop='mini']") || target.closest(".root.mini")) return;

    event.preventDefault();
    if (profile_state.is_editing) {
      profile_state.save(entity_type);
    } else {
      profile_state.handle_close(entity_type);
    }
  }

  // --- ENTITY EXPORT (Edit Mode Footer) ---
  function export_entity_filename(extension = "json") {
    const name =
      String(profile_state.char?.name || "entity")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48) || "entity";
    return `${name}.${extension}`;
  }

  /** Downloads the entity as a standalone native RPGlitch .json backup. */
  function export_entity_json() {
    if (!profile_state.char) return;
    download_json_file(export_entity_filename("json"), serialize_rpglitch_entity({ ...profile_state.char, type: entity_type }));
  }

  /** Downloads the entity as a standard Character Card V2 .json (Tavern/Chub/Janitor). */
  function export_entity_card() {
    if (!profile_state.char) return;
    download_json_file(export_entity_filename("v2.json"), serialize_character_card({ ...profile_state.char, type: entity_type }));
  }

  /**
   * Evaluates if a temporal field in edit mode is formatted as a single dense paragraph (>=120 chars, no line breaks or brackets).
   * @param {string} field_key
   * @param {string} value
   * @returns {boolean}
   */
  function should_show_bracket_tip(field_key, value) {
    if (!profile_state.is_editing || !value) return false;
    const is_temporal = ["eternal.physical", "eternal.non_physical", "present.physical", "present.non_physical", "past", "future"].includes(
      field_key,
    );
    if (!is_temporal) return false;
    const trimmed = String(value).trim();
    return trimmed.length >= 120 && !trimmed.includes("\n") && !trimmed.includes("[");
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (!profile_state.char || profile_state.show_delete_confirm) return;
    if (e.key === "Enter" && !e.shiftKey) {
      const target = /** @type {HTMLElement} */ (e.target);
      if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON" || target.isContentEditable) return;
      e.preventDefault();
      if (profile_state.is_editing) {
        footer_el?.focus();
        profile_state.save(entity_type);
      } else if (profile_state.can_edit) {
        footer_el?.focus();
        profile_state.start_editing();
      }
    }
  }}
/>

{#if profile_state.char}
  <Dialog
    type="confirm"
    bind:open={profile_state.pending_swap_confirm}
    title="Discard unsaved changes?"
    message={`You have unsaved edits to ${profile_state.char?.name || "this profile"}. Open the other entity and discard them?`}
    confirm_label="Discard & Continue"
    on_confirm={() => profile_state.confirm_swap()}
    on_cancel={() => profile_state.reject_swap()}
  />

  <Dialog
    type="confirm"
    bind:open={profile_state.show_delete_confirm}
    title="Delete {profile_state.char.name || 'Entity'}"
    message="This action is irreversible. All associated data, including history and memories, will be lost."
    confirm_label="Confirm"
    on_confirm={() => profile_state.delete(entity_type)}
  />

  <Modal
    variant="bare"
    bind:open={show_export_modal}
    z_index="1000"
    class="relative w-[clamp(24rem,92vw,38rem)] rounded-2xl bg-glass-elevated p-4 shadow-[0_16px_48px_rgba(0,0,0,0.8)] [backdrop-filter:var(--blur-mist)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-(--noise-url) before:opacity-10 before:mix-blend-overlay before:content-['']"
    on_close={() => {
      show_export_modal = false;
    }}
  >
    <div class="flex flex-col gap-4 font-sans">
      <div class="flex flex-col gap-4 text-left">
        <h5 class="m-0 text-xs font-bold tracking-widest text-slate-300 uppercase">
          Export {entity_type === "fractal" ? "Fractal" : "Character"}
        </h5>
        <p class="m-0 text-xs leading-relaxed text-slate-400">
          V2 Card is the standard character format for other apps (Tavern, Chub, Janitor). Keep in mind: some RPGlitch data — memories, vectors,
          seeds, styling — is lost when exporting as V2 Card. RPGlitch JSON is a full-fidelity backup.
        </p>
      </div>
      <div class="flex gap-4">
        <Button
          variant="secondary"
          class="flex-1 justify-center"
          onclick={() => {
            export_entity_card();
            show_export_modal = false;
          }}
        >
          V2 Card (.json)
        </Button>
        <Button
          variant="primary"
          class="flex-1 justify-center"
          onclick={() => {
            export_entity_json();
            show_export_modal = false;
          }}
        >
          RPGlitch JSON (.json)
        </Button>
      </div>
    </div>
  </Modal>

  <Modal
    variant="profile"
    on_close={() => {
      if (profile_state.is_editing) {
        profile_state.save(entity_type);
      } else {
        profile_state.handle_close(entity_type);
      }
    }}
    is_pass_through={true}
  >
    <div
      class={`m-auto grid w-grid-width grid-cols-12 transition-all duration-300 ${
        app.viewport.mobile ? (has_wings ? "h-auto grid-rows-[auto_auto] gap-y-4 pb-4" : "h-dvh grid-rows-1") : "my-auto h-dvh grid-rows-1"
      }`}
      data-mobile={app.viewport.mobile}
      role="presentation"
    >
      <div
        class={main_card_class}
        bind:this={card_ref}
        style:background-color="color-mix(in srgb, var(--signature-color) 1%, var(--color-glass-sunken))"
        style:border-color="color-mix(in srgb, var(--signature-color) 30%, transparent)"
        style:backdrop-filter="var(--blur-mist)"
        style:--signature-color={signature_color}
        style:view-transition-name={target_morph_name}
        use:click_outside={handle_click_outside}
      >
        <div class={avatar_container_class + " relative"}>
          <Button
            variant="bare"
            class={[
              profile_pic_wrapper_class,
              "relative flex appearance-none items-center justify-center overflow-hidden p-0 outline-none",
              "cursor-default",
            ]}
            style="border-color: color-mix(in srgb, var(--signature-color) 30%, transparent); background: transparent;"
            disabled
          >
            {#if profile_state.busy_fields.has("generating-image")}
              <Shimmer color={signature_color || "var(--color-electric-cyan)"} class="rounded-[inherit]" />
            {/if}
            <ProfilePicture entity={profile_state.char} contain={true} landscape={entity_type !== "character"} />
          </Button>
          {#if entity_type === "fractal" && !app.viewport.mobile}
            {@const is_default_style = !profile_state.char.narrative_style || profile_state.char.narrative_style === "default"}
            {@const is_default_visual = !profile_state.char.visual_style || profile_state.char.visual_style === "none"}
            <div class="absolute right-8 -bottom-16 z-30 flex flex-col items-end gap-2">
              {#if profile_state.is_editing || !is_default_style}
                <Dropdown
                  bind:value={profile_state.char.narrative_style}
                  items={author_options}
                  label="Select Narrative Style"
                  uppercase={false}
                  matchWidth={false}
                  dropdownWidth="w-80"
                  align="center"
                  disabled={!profile_state.is_editing}
                  variant="bare"
                  class="block cursor-pointer p-0 outline-none data-disabled:cursor-default"
                  trigger_style="width: 8.5rem; height: 8.5rem;"
                >
                  {#snippet trigger_content({ selected_item })}
                    <StyleBadge
                      entity={profile_state.char}
                      layout="profile"
                      which="narrative"
                      class="h-full w-full"
                      tooltip={selected_item?.tooltip}
                    />
                  {/snippet}
                </Dropdown>
              {/if}

              {#if profile_state.is_editing || !is_default_visual}
                <Dropdown
                  bind:value={profile_state.char.visual_style}
                  items={visual_style_options}
                  label="Select Visual Style"
                  uppercase={false}
                  matchWidth={false}
                  dropdownWidth="w-80"
                  align="center"
                  disabled={!profile_state.is_editing}
                  variant="bare"
                  class="block cursor-pointer p-0 outline-none data-disabled:cursor-default"
                  trigger_style="width: 8.5rem; height: 8.5rem;"
                  onchange={() => profile_state.mark_mutated()}
                >
                  {#snippet trigger_content({ selected_item })}
                    <StyleBadge entity={profile_state.char} layout="profile" which="visual" class="h-full w-full" tooltip={selected_item?.tooltip} />
                  {/snippet}
                </Dropdown>
              {/if}
            </div>
          {/if}
        </div>

        <div class="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div
            class={info_container_class}
            bind:this={info_container_el}
            style:padding-bottom={`${footer_h + 16}px`}
            style:scrollbar-gutter={info_needs_scroll ? "stable" : "auto"}
          >
            <!-- Inlined ProfileHeader snippet -->
            <div
              class="flex min-h-10 w-full min-w-0 shrink-0 flex-col gap-2 {entity_type === 'fractal' && !app.viewport.mobile ? 'pr-44 pl-10' : ''}"
              data-testid="profile-header"
              role="banner"
            >
              {#if profile_state.is_editing}
                <div class="mb-1 flex items-center gap-2 font-mono text-xs opacity-80" style="color: {signature_color};">
                  <span aria-hidden="true">@</span>
                  <input
                    type="text"
                    value={profile_state.draft_id ?? profile_state.char.id ?? ""}
                    placeholder="SLUG"
                    pattern={"^[A-Za-z0-9_-]{2,20}$"}
                    maxlength="20"
                    class="border-b border-white/20 bg-transparent px-1 py-0.5 font-mono text-xs tracking-wider uppercase outline-none focus:border-white/60"
                    style="color: {signature_color};"
                    oninput={(event) => {
                      profile_state.draft_id = event.currentTarget.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9_-]/g, "")
                        .slice(0, 20);
                      profile_state.identity_error = "";
                      profile_state.mark_mutated();
                    }}
                    onblur={() => {
                      if (!profile_state.commit_draft_id()) {
                        profile_state.identity_error = "ID must be 2–20 chars (A–Z, 0–9, _ or -).";
                      }
                      profile_state.set_active_field("", "");
                    }}
                    onfocus={() => profile_state.set_active_field("id", "Entity Handle")}
                  />
                  {#if entity_type !== "fractal"}
                    <span class="text-slate-400" aria-hidden="true">·</span>
                    <button
                      type="button"
                      class="cursor-pointer tracking-wider uppercase transition-colors outline-none hover:opacity-100"
                      onclick={() => {
                        profile_state.char.pov = profile_state.char.pov === "3rd_person" ? "1st_person" : "3rd_person";
                        profile_state.mark_mutated();
                      }}
                      onfocus={() => profile_state.set_active_field("pov", "Perspective")}
                      onblur={() => profile_state.set_active_field("", "")}
                    >
                      {profile_state.char.pov === "1st_person" ? "1st person" : "3rd person"}
                    </button>
                  {/if}
                </div>
                {#if profile_state.is_editing && profile_state.identity_error}
                  <div role="alert" class="mb-1 font-mono text-[11px] tracking-wide text-red-300/90">
                    {profile_state.identity_error}
                  </div>
                {/if}
              {:else if profile_state.char.id}
                <div
                  class="mb-1 font-mono text-xs opacity-60 {entity_type === 'fractal' ? 'text-left' : 'text-right'}"
                  style="color: {signature_color};"
                >
                  @{profile_state.char.id.toUpperCase()}{#if entity_type !== "fractal"}
                    · {profile_state.char.pov === "1st_person" ? "1st person" : "3rd person"}{/if}
                </div>
              {/if}

              <div class="w-full min-w-0 shrink-0">
                {#if profile_state.is_editing}
                  <div class="glass-input" data-expanded={profile_state.active_field?.key === "name"} style="--signature-color: {signature_color};">
                    <input
                      bind:this={name_input}
                      value={profile_state.draft_name ?? profile_state.char.name ?? ""}
                      class="
                      z-20
                      box-border
                      w-full
                      border-none
                      bg-transparent
                      p-3
                      text-left
                      font-heading
                      text-4xl
                      leading-none
                      font-extrabold
                      tracking-normal
                      outline-none
                      sm:text-5xl
                      md:text-6xl
                    "
                      style="color: {signature_color}; font-size: clamp(2.5rem, 5vw, 4.5rem) !important;"
                      oninput={(event) => {
                        profile_state.draft_name = event.currentTarget.value;
                        profile_state.identity_error = "";
                        profile_state.mark_mutated();
                      }}
                      onfocus={() => profile_state.set_active_field("name", "Entity Name")}
                      onblur={() => {
                        if (!profile_state.commit_draft_name()) {
                          profile_state.identity_error = "Name is required.";
                        }
                        profile_state.set_active_field("", "");
                      }}
                    />
                  </div>
                {:else}
                  <h1
                    class="
                    m-0
                    block
                    {entity_type === 'fractal' ? 'text-left' : 'text-right'}
                    font-heading
                    text-6xl leading-none font-extrabold
                    tracking-tight
                    text-balance
                    sm:text-7xl
                    md:text-8xl
                    lg:text-[5.5rem]
                  "
                    style="margin: 0 !important; color: {signature_color}; font-size: clamp(3.5rem, 7vw, 6rem) !important; filter: drop-shadow(0 4px 16px rgb(0 0 0 / 0.4));"
                  >
                    {format_header_name(profile_state.char.name)}
                  </h1>
                {/if}
              </div>

              {#if profile_state.is_editing}
                <div
                  class="glass-input"
                  data-expanded={profile_state.active_field?.key === "description"}
                  style="--signature-color: {signature_color};"
                >
                  <textarea
                    class="
                    z-20
                    m-0
                    max-h-[calc(var(--spacing-row-unit)*4)]
                    min-h-row-unit
                    w-full
                    resize-none
                    [scrollbar-color:color-mix(in_srgb,var(--signature-color)_40%,var(--color-gunmetal))_transparent]
                    border-none
                    bg-transparent
                    p-3
                    text-left
                    font-sans
                    text-sm
                    leading-relaxed
                    [text-wrap:auto]
                    text-slate-50
                    outline-none
                    placeholder:text-slate-400
                    placeholder:italic
                    placeholder:opacity-60
                    [&::-webkit-scrollbar]:h-[calc(var(--spacing-unit)*2)]
                    [&::-webkit-scrollbar]:w-[calc(var(--spacing-unit)*2)]
                    [&::-webkit-scrollbar-thumb]:rounded-standard
                    [&::-webkit-scrollbar-thumb]:bg-[color-mix(in_srgb,var(--signature-color)_40%,var(--color-gunmetal))]
                    hover:[&::-webkit-scrollbar-thumb]:bg-[color-mix(in_srgb,var(--signature-color)_60%,var(--color-frisk))]
                    [&::-webkit-scrollbar-track]:bg-transparent
                  "
                    placeholder={PROFILE_FIELDS.description?.description || "Description"}
                    bind:value={profile_state.char.description}
                    use:auto_resize
                    onfocus={() => profile_state.set_active_field("description", "Description")}
                    onblur={() => profile_state.set_active_field("", "")}></textarea>
                </div>
              {:else if profile_state.char.description}
                <p
                  class="
                  m-0
                  rounded-md
                  {entity_type === 'fractal' ? 'text-left' : 'text-right'}
                  font-sans
                  text-sm
                  leading-relaxed
                  text-balance
                  whitespace-pre-wrap
                  text-slate-200
                  opacity-75
                "
                >
                  {profile_state.char.description}
                </p>
              {/if}
            </div>

            {#if entity_type === "fractal" && app.viewport.mobile}
              {@const active_style = get_narrative_style(profile_state.char.narrative_style)}
              {@const is_default_style = !profile_state.char.narrative_style || profile_state.char.narrative_style === "default"}
              {#if profile_state.is_editing || !is_default_style}
                <div class="mt-2 flex w-full flex-col gap-2">
                  <span class="text-[10px] font-bold tracking-widest text-slate-400 uppercase"> Narrative Style </span>
                  {#if profile_state.is_editing}
                    <div class="relative flex w-full max-w-sm rounded-md">
                      <Dropdown
                        bind:value={profile_state.char.narrative_style}
                        items={author_options}
                        label="Select Narrative Style"
                        uppercase={false}
                        matchWidth={false}
                      />
                    </div>
                  {:else}
                    <span class="cursor-default text-sm text-slate-300 italic" use:tooltip={`${active_style.name}: ${active_style.description}`}>
                      {active_style.name}
                    </span>
                  {/if}
                </div>
              {/if}
            {/if}

            {#if entity_type === "fractal" && app.viewport.mobile}
              {@const active_vstyle = get_visual_style(profile_state.char.visual_style)}
              {@const is_default_vstyle = !profile_state.char.visual_style || profile_state.char.visual_style === "none"}
              {#if profile_state.is_editing || !is_default_vstyle}
                <div class="mt-2 flex w-full flex-col gap-2">
                  <span class="text-[10px] font-bold tracking-widest text-slate-400 uppercase"> Visual Style (Story Exclusive) </span>
                  {#if profile_state.is_editing}
                    <div class="relative flex w-full max-w-sm rounded-md">
                      <Dropdown
                        bind:value={profile_state.char.visual_style}
                        items={visual_style_options}
                        label="Select Visual Style"
                        uppercase={false}
                        matchWidth={true}
                        onchange={() => profile_state.mark_mutated()}
                      />
                    </div>
                  {:else}
                    <span class="cursor-default text-sm text-slate-300 italic" use:tooltip={`${active_vstyle.name}: ${active_vstyle.description}`}>
                      {active_vstyle.name}
                    </span>
                  {/if}
                </div>
              {/if}
            {/if}

            <main class={main_layout_class}>
              {@render EntityBody()}
            </main>
          </div>

          <footer
            bind:this={footer_el}
            tabindex="-1"
            class={footer_layout_class}
            style:right={`${scrollbar_lane}px`}
            style="background-color: color-mix(in srgb, var(--signature-color) 8%, var(--color-glass-sunken) 50%); backdrop-filter: var(--blur-mist);"
          >
            {#if profile_state.is_editing}
              <Button
                variant="primary"
                actions={[tooltip]}
                aria-label="Warning: Overwrites all fields using AI enhancement. Existing macros are preserved."
                disabled={profile_state.is_saving || profile_state.busy_fields.size > 0}
                onclick={() => {
                  profile_state.enhance_profile(entity_type);
                }}
                class="touch-target-coarse"
              >
                {#if Array.from(profile_state.busy_fields).some((f) => f !== "visual-prompt")}
                  <span class="animate-pulse">ENHANCING...</span>
                {:else}
                  Enhance Profile
                {/if}
              </Button>
              <Button
                variant="primary"
                actions={[tooltip]}
                aria-label={`Export ${entity_type === "fractal" ? "Fractal" : "Character"} (V2 Card or RPGlitch JSON)`}
                disabled={profile_state.is_saving}
                onclick={() => (show_export_modal = true)}
                class="touch-target-coarse"
              >
                Export {entity_type === "fractal" ? "Fractal" : "Character"}
              </Button>
              <Button
                variant="secondary"
                class="touch-target-coarse"
                aria-label="Discard unsaved edits and exit editing"
                disabled={profile_state.is_saving}
                onclick={() => {
                  profile_state.cancel();
                }}>Revert</Button
              >
              <Button
                variant="danger"
                class="touch-target-coarse"
                onclick={() => {
                  profile_state.show_delete_confirm = true;
                }}>Delete</Button
              >
            {:else}
              <Button
                variant="secondary"
                class="touch-target-coarse"
                aria-label="Inspect historical rounds and branch or revert entity state"
                actions={[tooltip]}
                onclick={() => (show_timeline_modal = true)}
              >
                Timeline
              </Button>
              <Button
                variant="secondary"
                class="touch-target-coarse"
                disabled={simulation_state.busy || !profile_state.can_edit}
                aria-label={!profile_state.can_edit ? "Edit locked — entity is in an active story. Enable DevMode to override." : "Edit"}
                onclick={() => {
                  if (!profile_state.can_edit) return;
                  previous_scroll_top = info_container_el?.scrollTop || 0;
                  profile_state.start_editing();
                  setTimeout(() => {
                    if (info_container_el) info_container_el.scrollTop = previous_scroll_top;
                  }, 0);
                }}>{profile_state.can_edit ? "Edit" : "Locked"}</Button
              >
            {/if}
          </footer>
        </div>
      </div>

      <!-- Wing Container stays in DOM to animate exit -->
      <aside
        data-wings-container
        class={"relative isolate z-0 flex scrollbar-none gap-4 [&::-webkit-scrollbar]:hidden " +
          (app.viewport.mobile
            ? "col-span-full w-full items-start overflow-x-visible"
            : "col-[9/12] row-start-1 flex-col items-center overflow-y-auto")}
        bind:this={wings_ref}
        style:pointer-events={has_wings ? "auto" : "none"}
      >
        <div class={"flex gap-4 " + (app.viewport.mobile ? "w-fit flex-row px-4" : "w-full flex-col")}>
          {#if profile_state.is_editing}
            <div
              style={app.viewport.mobile ? "width: 85vw; flex-shrink: 0;" : ""}
              class={app.viewport.mobile ? "max-w-sm" : "w-full"}
              transition:fade={{ duration: 250 }}
            >
              <VisualWing {profile_state} />
            </div>
            <div
              style={app.viewport.mobile ? "width: 85vw; flex-shrink: 0;" : ""}
              class={"flex flex-col gap-4 " + (app.viewport.mobile ? "max-h-[65vh] max-w-sm scrollbar-none overflow-y-auto pb-4" : "w-full")}
              transition:fade={{ duration: 250 }}
            >
              <AudioWing {profile_state} />
              {#if app.settings.dev_mode}
                <DevWing
                  {profile_state}
                  on_inspect_history={(field) => {
                    history_target_field = field;
                    show_field_history_modal = true;
                  }}
                />
              {/if}
            </div>
          {:else if app.settings.dev_mode}
            <div style={app.viewport.mobile ? "width: 85vw; flex-shrink: 0;" : ""} class={app.viewport.mobile ? "max-w-sm" : "w-full"}>
              <DevWing
                {profile_state}
                on_inspect_history={(field) => {
                  history_target_field = field;
                  show_field_history_modal = true;
                }}
              />
            </div>
          {/if}
        </div>
      </aside>
    </div>
  </Modal>

  <!-- Field History Inspector Modal (Inlined) -->
  {#if show_field_history_modal && profile_state.char?.id}
    <Modal
      bind:open={show_field_history_modal}
      variant="bare"
      z_index="400"
      class="relative flex max-h-[85vh] w-[clamp(28rem,90vw,48rem)] flex-col rounded-2xl bg-glass-elevated p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] [backdrop-filter:var(--blur-mist)]"
      on_close={() => {
        show_field_history_modal = false;
      }}
    >
      <div class="flex h-full flex-col gap-4 overflow-hidden font-sans">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex flex-col">
            <h4 class="m-0 text-sm font-bold tracking-wider text-cyan-400 uppercase">Mutation Ledger Inspector</h4>
            <span class="font-mono text-xs text-slate-400">
              {profile_state.char.name} &bull; <span class="text-cyan-200">{history_target_field}</span>
            </span>
          </div>

          <div class="flex items-center gap-2">
            <div class="flex rounded-lg bg-black/40 p-0.5">
              <button
                type="button"
                class="cursor-pointer rounded-md px-2.5 py-1 font-mono text-[11px] font-medium transition-colors {field_history_active_tab ===
                'timeline'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'}"
                onclick={() => (field_history_active_tab = "timeline")}
              >
                Timeline ({field_history_records.length})
              </button>
              <button
                type="button"
                class="cursor-pointer rounded-md px-2.5 py-1 font-mono text-[11px] font-medium transition-colors {field_history_active_tab ===
                'reconstructed'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'}"
                onclick={() => (field_history_active_tab = "reconstructed")}
              >
                Reconstructed State
              </button>
            </div>

            <Button variant="invisible" size="small" square={true} onclick={() => (show_field_history_modal = false)} aria-label="Close">
              <svg viewBox="0 0 24 24" class="size-4 fill-none stroke-current stroke-2" style="stroke-linecap: round; stroke-linejoin: round;">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>
          </div>
        </div>

        <!-- Body -->
        <div class="flex flex-1 flex-col overflow-y-auto pr-1">
          {#if is_field_history_loading}
            <div class="flex h-48 animate-pulse items-center justify-center font-mono text-xs text-cyan-400">Replaying ledger stream...</div>
          {:else if field_history_active_tab === "timeline"}
            {#if field_history_records.length === 0}
              <div class="flex h-48 flex-col items-center justify-center gap-1 font-mono text-xs text-slate-500">
                <span>No ledger events recorded for this field.</span>
                <span class="text-[10px] text-slate-600">Mutations during genesis or turns will appear here.</span>
              </div>
            {:else}
              <div class="flex flex-col gap-2.5 py-1">
                {#each field_history_records as record (record.id || record.timestamp + "-" + record.round + "-" + record.seq)}
                  <div
                    class="flex flex-col gap-1.5 rounded-xl border border-white/5 bg-black/25 p-3 text-xs transition-colors hover:border-cyan-500/20"
                  >
                    <div class="flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <div class="flex items-center gap-2">
                        <span class="rounded bg-cyan-950/60 px-1.5 py-0.5 font-bold text-cyan-400">
                          R{record.round}:S{record.seq}
                        </span>
                        <span class="text-slate-300 capitalize">{record.writer}</span>
                        {#if record.decider && record.decider !== record.writer}
                          <span class="text-slate-500">via {record.decider}</span>
                        {/if}
                      </div>
                      <span>{format_datetime(record.timestamp)}</span>
                    </div>

                    <div class="flex items-start gap-2 pt-0.5">
                      {#if record.key}
                        <span class="shrink-0 font-mono text-xs font-semibold text-cyan-300">
                          [{record.key}]
                        </span>
                      {/if}

                      <div class="flex flex-1 flex-col gap-1">
                        {#if record.new_value === null}
                          <span class="font-mono text-xs text-red-400 italic">cleared (null)</span>
                        {:else}
                          <span class="font-mono text-xs text-slate-200">
                            {record.new_value}
                          </span>
                        {/if}

                        {#if record.old_value != null && record.old_value !== record.new_value}
                          <span class="font-mono text-[10px] text-slate-500 line-through">
                            was: {record.old_value}
                          </span>
                        {/if}
                      </div>

                      {#if record.visibility || record.weight}
                        <div class="flex shrink-0 items-center gap-1.5 font-mono text-[10px]">
                          {#if record.visibility === "hide"}
                            <span class="rounded bg-red-950/40 px-1.5 py-0.5 text-red-400">hide</span>
                          {/if}
                          {#if record.weight && record.weight !== 5}
                            <span class="rounded bg-amber-950/40 px-1.5 py-0.5 text-amber-300">w:{record.weight}</span>
                          {/if}
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          {:else}
            <!-- Reconstructed Tab -->
            <div class="flex flex-col gap-3 py-1">
              <div class="flex flex-col gap-1">
                <span class="font-mono text-[11px] font-bold tracking-wider text-slate-300 uppercase"> Replayed Bracket Predicates </span>
                <div class="min-h-24 rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs leading-relaxed break-words text-cyan-200">
                  {reconstructed_brackets || "(empty state)"}
                </div>
              </div>

              {#if reconstructed_prose}
                <div class="flex flex-col gap-1">
                  <span class="font-mono text-[11px] font-bold tracking-wider text-slate-300 uppercase"> Replayed Raw Prose </span>
                  <div class="min-h-16 rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-slate-300">
                    {reconstructed_prose}
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </Modal>
  {/if}

  <!-- Timeline Scrubber & Branching Modal (Inlined) -->
  {#if show_timeline_modal && profile_state.char?.id}
    <Modal
      bind:open={show_timeline_modal}
      variant="bare"
      z_index="400"
      class="relative flex max-h-[88vh] w-[clamp(30rem,92vw,54rem)] flex-col rounded-2xl bg-glass-elevated p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] [backdrop-filter:var(--blur-mist)]"
      on_close={() => {
        show_timeline_modal = false;
      }}
    >
      <div class="flex h-full flex-col gap-4 overflow-hidden font-sans">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex flex-col">
            <h4 class="m-0 text-sm font-bold tracking-wider text-cyan-400 uppercase">Profile Timeline Scrubber</h4>
            <span class="font-mono text-xs text-slate-400">
              {profile_state.char.name || "Entity"} &bull; <span class="text-cyan-200">Timeline Branching & Historical Reversion</span>
            </span>
          </div>

          <Button variant="invisible" size="small" square={true} onclick={() => (show_timeline_modal = false)} aria-label="Close">
            <svg viewBox="0 0 24 24" class="size-4 fill-none stroke-current stroke-2" style="stroke-linecap: round; stroke-linejoin: round;">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </Button>
        </div>

        <!-- Scrubber Bar -->
        <div class="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/40 p-3">
          <div class="flex items-center justify-between">
            <span class="font-mono text-xs font-semibold text-slate-300"> SELECT TIMELINE POINT </span>
            <span class="rounded bg-cyan-950/70 px-2 py-0.5 font-mono text-xs font-bold text-cyan-400">
              Round {selected_timeline_round}
              {selected_timeline_round === 0 ? "(Genesis Baseline)" : ""}
            </span>
          </div>

          <!-- Round Selector Strip -->
          <div class="flex flex-wrap items-center gap-1.5 pt-1">
            {#each available_timeline_rounds as r (r)}
              <button
                type="button"
                class="cursor-pointer rounded-lg px-3 py-1 font-mono text-xs font-medium transition-all {selected_timeline_round === r
                  ? 'bg-cyan-500 font-bold text-black shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/50 hover:bg-white/10'}"
                onclick={() => handle_select_timeline_round(r)}
              >
                R{r}
              </button>
            {/each}
          </div>
        </div>

        <!-- Snapshot Replay Body -->
        <div class="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
          {#if is_timeline_loading}
            <div class="flex h-48 animate-pulse items-center justify-center font-mono text-xs text-cyan-400">
              Reconstructing Four-Quadrant Matrix...
            </div>
          {:else if reconstructed_timeline_state}
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <!-- Present Quadrant -->
              <div class="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/25 p-3">
                <span class="font-mono text-xs font-bold text-cyan-300">PRESENT QUADRANT</span>
                <div class="flex flex-col gap-1.5 font-mono text-xs">
                  <span class="text-[10px] text-slate-400 uppercase">Physical:</span>
                  <div class="max-h-24 overflow-y-auto rounded bg-black/40 p-2 text-slate-300">
                    {reconstructed_timeline_state.present.physical || "<empty>"}
                  </div>
                  <span class="text-[10px] text-slate-400 uppercase">Non-Physical:</span>
                  <div class="max-h-24 overflow-y-auto rounded bg-black/40 p-2 text-slate-300">
                    {reconstructed_timeline_state.present.non_physical || "<empty>"}
                  </div>
                </div>
              </div>

              <!-- Past & Future Quadrants -->
              <div class="flex flex-col gap-3">
                <!-- Past Quadrant -->
                <div class="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/25 p-3">
                  <span class="font-mono text-xs font-bold text-cyan-300">PAST</span>
                  <div class="max-h-24 overflow-y-auto rounded bg-black/40 p-2 font-mono text-xs text-slate-300">
                    {reconstructed_timeline_state.past || "<empty>"}
                  </div>
                </div>

                <!-- Future / Standing Trajectory -->
                <div class="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/25 p-3">
                  <span class="font-mono text-xs font-bold text-cyan-300">FUTURE (STANDING AGENDA)</span>
                  <div class="max-h-24 overflow-y-auto rounded bg-black/40 p-2 font-mono text-xs text-slate-300">
                    {reconstructed_timeline_state.future || "<empty>"}
                  </div>
                </div>
              </div>
            </div>

            <!-- Recorded mutations in this specific round -->
            {#if timeline_round_events.length > 0}
              <div class="flex flex-col gap-1.5 rounded-xl border border-white/5 bg-black/20 p-3">
                <span class="font-mono text-[11px] font-semibold text-slate-400">
                  Round {selected_timeline_round} Mutations ({timeline_round_events.length})
                </span>
                <div class="flex max-h-32 flex-col gap-1 overflow-y-auto font-mono text-[11px] text-slate-300">
                  {#each timeline_round_events as ev (ev.id || `${ev.field}-${ev.round}-${ev.seq || 0}-${ev.timestamp}`)}
                    <div class="flex items-center justify-between gap-2 border-b border-white/5 py-0.5">
                      <div class="flex items-center gap-2 truncate">
                        <span class="text-cyan-400">[{ev.field}]</span>
                        {#if ev.key}
                          <span class="text-slate-200">[{ev.key}] &rarr; {ev.new_value ?? "cleared"}</span>
                        {:else}
                          <span class="truncate text-slate-400">{ev.new_value}</span>
                        {/if}
                      </div>
                      <span class="shrink-0 text-[10px] text-slate-500">{format_datetime(ev.timestamp)}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          {/if}
        </div>

        <!-- Actions Footer -->
        <div class="flex items-center justify-between border-t border-white/10 pt-3">
          <div class="font-mono text-[11px] text-slate-500">Reverting alters current profile. Cloning branches a separate entity into census.</div>

          <div class="flex items-center gap-2">
            <Button
              variant="secondary"
              size="medium"
              disabled={is_performing_timeline_action || is_timeline_loading}
              onclick={handle_timeline_clone_from_point}
              aria-label="Clone from this point into a new entity"
              actions={[tooltip]}
            >
              {is_performing_timeline_action ? "Cloning..." : "Clone from this point"}
            </Button>

            <Button
              variant="primary"
              size="medium"
              disabled={is_performing_timeline_action || is_timeline_loading}
              onclick={handle_timeline_update_from_point}
              aria-label="Revert entity in-place to this historical round"
              actions={[tooltip]}
            >
              {is_performing_timeline_action ? "Reverting..." : "Update from this point"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  {/if}
{/if}

{#snippet EntityBody()}
  <div class={entity_body_class} style:grid-template-columns={entity_body_grid_cols} data-testid="profile-fragments">
    <!-- Profile order: Name → Description → ID+POV strip (header) → Relationships → quadrant sections -->
    <div
      class={get_section_class()}
      style:border-color={app.viewport.mobile ? "color-mix(in srgb, var(--signature-color) 30%, transparent)" : undefined}
      data-section="relationships"
      role="presentation"
    >
      <div class="relative flex w-full flex-col items-center" style={get_inner_section_style("relationships")}>
        <h6
          class="relative m-0 flex items-center justify-center text-center tracking-wider uppercase transition-colors duration-300"
          style="color: var(--signature-color); text-shadow: none;"
        >
          <span
            class={get_label_span_class()}
            style:text-orientation={app.viewport.mobile ? undefined : "mixed"}
            style:writing-mode={app.viewport.mobile ? undefined : "vertical-rl"}>Relationships</span
          >
        </h6>
      </div>
    </div>

    <div class="relative flex h-full w-full min-w-0 flex-col items-stretch justify-stretch">
      <RelationalGraph
        entity={profile_state.char}
        on_select_entity={(selected) => {
          if (selected) {
            app.open_profile(selected);
          }
        }}
      />
    </div>

    {#each active_sections as section (section.id)}
      <div
        class={get_section_class()}
        style:border-color={app.viewport.mobile ? "color-mix(in srgb, var(--signature-color) 30%, transparent)" : undefined}
        data-section={section.id}
        onclick={() => {
          if (profile_state.is_editing && section.fields.length > 0) {
            const first_field = section.fields[0];
            const el = document.getElementById(`field-${first_field.key.replace(".", "-")}`);
            if (el) el.focus();
          }
        }}
        onmouseenter={() => (profile_state.hovered_section = section.id)}
        onmouseleave={() => (profile_state.hovered_section = null)}
        role="presentation"
      >
        <div class="relative flex w-full flex-col items-center" style={get_inner_section_style(section.id)}>
          <h6
            class="relative m-0 flex items-center justify-center text-center tracking-widest uppercase transition-colors duration-300"
            style="color: var(--signature-color); text-shadow: none;"
          >
            <span
              class={get_label_span_class()}
              style:text-orientation={app.viewport.mobile ? undefined : "mixed"}
              style:writing-mode={app.viewport.mobile ? undefined : "vertical-rl"}>{section.label}</span
            >
          </h6>
        </div>
      </div>

      <div class={get_fields_container_class(section.fields.length)}>
        {#each section.fields as field (field.key)}
          {@const field_id = `field-${field.key.replace(".", "-")}`}
          {@const raw_val = profile_state.get_safe_value(field.key)}
          {@const raw =
            typeof raw_val === "string"
              ? raw_val
              : Array.isArray(raw_val)
                ? raw_val
                    .map((item) => (typeof item === "object" ? item?.content || item?.directive || "" : String(item || "")))
                    .filter(Boolean)
                    .join("\n")
                : raw_val || ""}
          {@const parsed = (() => {
            const res = safe_parse_pseudo_json(raw);
            if (res && Object.keys(res).length > 0 && !res.__raw_prose__) {
              const standardized = {};
              Object.entries(res).forEach(([k, v]) => {
                if (typeof v === "string") {
                  standardized[k] = v.replace(/,([^\s])/g, ", $1");
                } else {
                  standardized[k] = v;
                }
              });
              return standardized;
            }
            return null;
          })()}
          <div class="relative flex h-full w-full min-w-0 flex-col items-stretch justify-stretch gap-2">
            {#if field.column_label}
              <Label class="justify-center drop-shadow-md" style="color: var(--signature-color);" disabled={!profile_state.is_editing} for={field_id}
                >{field.column_label}</Label
              >
            {/if}

            {#if !profile_state.is_editing && parsed}
              <div
                id={field_id}
                class="relative flex h-full min-h-20 w-full flex-col overflow-hidden rounded-xl border border-transparent transition-all duration-300"
                role="region"
                aria-label={field.label}
                use:auto_resize={{ sync_id: section.label }}
                data-sync-id={section.label}
              >
                {#if field.label}
                  <header
                    style="position: relative; top: 0; z-index: 10; display: flex !important; align-items: center !important; justify-content: space-between !important; border-radius: 0.75rem; background-color: var(--color-dev-accent) !important; padding: 0.175rem 0.75rem; opacity: 1 !important; min-height: 1.5rem !important; height: auto !important; --color-dev-accent: {signature_color};"
                    class="relative w-full overflow-hidden"
                  >
                    {#if profile_state.busy_fields.has(field.key)}
                      <Shimmer color={signature_color || "var(--color-amber-gold, #f59e0b)"} class="rounded-[inherit]" />
                    {/if}
                    <div
                      style="margin-right: 0.5rem; display: flex !important; align-items: center !important; flex: 1 1 0% !important; min-width: 0; overflow: hidden;"
                    >
                      <span
                        class="block max-w-full cursor-default truncate font-sans text-xs font-normal tracking-normal whitespace-nowrap text-white opacity-90"
                        use:tooltip
                        aria-label={field.description}>{field.label}</span
                      >
                    </div>
                    <div class="ml-auto flex h-full shrink-0 items-center gap-2">
                      {#if field.description}
                        <span class="flex cursor-help items-center text-white/60 hover:text-white" use:tooltip aria-label={field.description}>
                          <svg
                            viewBox="0 0 24 24"
                            class="size-icon-small fill-none stroke-current stroke-2"
                            style="stroke-linecap: round; stroke-linejoin: round;"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                          </svg>
                        </span>
                      {/if}
                      <Button
                        variant="invisible"
                        size="small"
                        square={true}
                        aria-label="Inspect Field History"
                        actions={[tooltip]}
                        onclick={() => {
                          history_target_field = field.key;
                          show_field_history_modal = true;
                        }}
                        class="cursor-pointer text-slate-400 hover:text-cyan-300"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          class="size-icon-small fill-none stroke-current stroke-2"
                          style="stroke-linecap: round; stroke-linejoin: round;"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </Button>
                    </div>
                  </header>
                {/if}
                <div class="pt-2">
                  {#if profile_state.busy_fields.has(field.key)}
                    <span class="animate-pulse font-mono text-[10px] tracking-widest text-white uppercase">ENHANCING</span>
                  {:else}
                    {@const sorted_entries = Object.entries(parsed).sort((a, b) => String(a[1]).length - String(b[1]).length)}
                    <div class="flex flex-wrap gap-2">
                      {#each sorted_entries as [k, v] (k)}
                        {@const raw_val = String(v ?? "")}
                        {@const is_hidden = /(?:^|\s)\|(?:\s*(?:hide|private)\b)/i.test(raw_val)}
                        {@const clean_val = raw_val
                          .replace(/\s*\|\s*(?:hide|show|private)\b/gi, "")
                          .replace(/\s*\|\s*w:\s*\d+\b/gi, "")
                          .trim()}
                        {#if clean_val}
                          <div
                            class="flex min-w-23.75 grow flex-col items-start gap-0.5 rounded-xl px-2.5 py-1.5 transition-colors {is_hidden
                              ? 'border border-dashed border-slate-700/60 bg-slate-900/40 opacity-55'
                              : 'border border-(--signature-color)/15 bg-(--signature-color)/5'}"
                          >
                            <span
                              class="text-left font-mono text-[10px] font-bold tracking-wider uppercase {is_hidden
                                ? 'text-slate-400 opacity-70'
                                : 'text-(--signature-color) opacity-85'}">{k}</span
                            >
                            <span class="text-left text-xs leading-normal {is_hidden ? 'text-slate-400 italic' : 'text-slate-200'}">
                              {@render RenderFormattedValue(clean_val)}
                            </span>
                          </div>
                        {/if}
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            {:else}
              <TextField
                id={field_id}
                is_edit={profile_state.is_editing}
                active={profile_state.active_field?.key === field.key}
                sync_id={section.label}
                {signature_color}
                placeholder={field.description}
                value={raw}
                inline_snippet={inline_macro_text}
                oninput={(e) => profile_state.set_field_value(field.key, e.target.value)}
                busy={profile_state.busy_fields.has(field.key)}
                onfocus={() => profile_state.set_active_field(field.key, field.label || section.label)}
              >
                {#snippet status()}
                  {#if field.label}
                    <span
                      class="block max-w-full cursor-default truncate font-sans text-xs font-normal tracking-normal whitespace-nowrap text-white opacity-80"
                      use:tooltip
                      aria-label={field.description}>{field.label}</span
                    >
                  {/if}
                {/snippet}

                {#snippet header_actions()}
                  {#if field.description}
                    <span class="flex cursor-help items-center text-white/60 hover:text-white" use:tooltip aria-label={field.description}>
                      <svg
                        viewBox="0 0 24 24"
                        class="size-icon-small fill-none stroke-current stroke-2"
                        style="stroke-linecap: round; stroke-linejoin: round;"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                    </span>
                  {/if}
                  <Button
                    variant="invisible"
                    size="small"
                    square={true}
                    aria-label="Inspect Field History"
                    actions={[tooltip]}
                    onclick={() => {
                      history_target_field = field.key;
                      show_field_history_modal = true;
                    }}
                    class="cursor-pointer text-slate-400 hover:text-cyan-300"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      class="size-icon-small fill-none stroke-current stroke-2"
                      style="stroke-linecap: round; stroke-linejoin: round;"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </Button>

                  {#if profile_state.is_editing}
                    <Button
                      variant="invisible"
                      size="small"
                      square={true}
                      aria-label="Enhance with AI"
                      actions={[tooltip]}
                      disabled={profile_state.busy_fields.has(field.key) || !profile_state.get_safe_value(field.key)}
                      onclick={() => profile_state.enhance(field.key, profile_state.get_safe_value(field.key))}
                      class={get_ai_action_btn_class(field.key)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        class="size-icon-small fill-none stroke-current stroke-2"
                        style="stroke-linecap: round; stroke-linejoin: round;"
                      >
                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="currentColor"></path>
                      </svg>
                    </Button>
                  {/if}
                {/snippet}
              </TextField>

              {#if should_show_bracket_tip(field.key, raw)}
                <div
                  class="flex items-center gap-1.5 rounded-md border border-cyan-500/20 bg-cyan-950/20 px-2 py-1 text-[11px] leading-tight text-cyan-300/80"
                  transition:fade={{ duration: 150 }}
                >
                  <span class="shrink-0 font-mono text-[10px] font-semibold tracking-wider text-cyan-400 uppercase">Tip</span>
                  <span
                    >The engine reasons best with multiple bracketed directives <code class="font-mono text-[10px] text-cyan-200">[KEY: value]</code> or
                    distinct lines.</span
                  >
                </div>
              {/if}
            {/if}
          </div>
        {/each}
      </div>
    {/each}

    <!-- RADIAL RELATIONAL CONSTELLATION GRAPH (Vertical Rotated Headline Grid) -->
  </div>
{/snippet}

{#snippet RenderChoiceNodes(nodes)}
  {#each nodes as part, i (i)}
    {#if part.is_var}
      <span
        class="mx-0.5 inline-flex flex-wrap items-center gap-2 rounded border border-dashed border-(--signature-color)/25 bg-(--signature-color)/5 px-1.5 py-0.5 font-mono text-[11px] text-slate-300"
      >
        <span class="mr-0.5 text-[9px] font-bold text-(--signature-color) opacity-70">⌥</span>
        {#each part.choices as choiceNodes, idx (idx)}
          <span class="inline-flex items-center">
            {@render RenderChoiceNodes(choiceNodes)}
          </span>
          {#if idx < part.choices.length - 1}
            <span class="mx-0.5 text-[9px] text-(--signature-color)/40">/</span>
          {/if}
        {/each}
      </span>
    {:else}
      <span>{part.text}</span>
    {/if}
  {/each}
{/snippet}

{#snippet RenderFormattedValue(val_str)}
  {#each resolve_display_macro_segments(val_str, profile_state.char, display_entities) as seg, si (si)}
    {#if seg.macro}
      <MacroText segment={seg} />
    {:else}
      {@render RenderChoiceNodes(parse_variants(seg.text))}
    {/if}
  {/each}
{/snippet}

{#snippet inline_macro_text(text)}
  <MacroText {text} owner={profile_state.char} entities={display_entities} />
{/snippet}

<!--
CHANGELOG:
- 2026-10-18: Phase V Sub-item 5.4 — Embedded educational Lorebook Guidance info icons with field tooltips into parsed pseudo-JSON and TextField header bars.
- 2026-10-04: Safeguarded raw profile field parsing to extract content from any legacy vector objects or arrays, preventing [object Object] leaks and standardizing past as bracket strings.
- 2026-10-04: Grayed out hidden/private pseudo-JSON cards (dashed border, dimmed background, muted text) and stripped raw engine flags (| show, | hide, | w:N) from card values.
- 2026-10-03: Added Field History Inspector launcher button to parsed pseudo-JSON bracket field headers so timeline inspection is available regardless of bracket existence.
- 2026-10-03: Added Field History Inspector launcher to TextField header actions and mounted FieldHistoryModal for timeline auditing.
- 2026-10-01: Universal Predicates Migration — decoupled RelationalGraph mutation from `profile_state.char.relationships`, driving relationships purely through universal bracket predicates in `present.non_physical`.
- 2026-10-01: Added Nordic bracket tip banner below temporal fields in edit mode when dense single-paragraph text (>=120 chars without linebreaks/brackets) is detected.
-->

<style>
  @keyframes slide-in-left {
    0% {
      opacity: var(--opacity-none);
      transform: translateX(calc(var(--spacing-unit) * 5));
    }

    100% {
      opacity: var(--opacity-solid);
      transform: translateX(0);
    }
  }
</style>
