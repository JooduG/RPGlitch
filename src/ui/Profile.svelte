<script>
  /**
   * @file src/ui/profile/Profile.svelte
   * 🧪 ENTITY EDITOR - Primary orchestrator for viewing and editing entities.
   * Flat DOM · Bolted Architecture
   */
  import {
    normalize_entity as normalize,
    query_entity_history,
    replay_full_entity_at_round,
    serialize_character_card,
    serialize_rpglitch_entity,
    update_entity,
    upsert_entity,
  } from "@data";
  import { PROFILE_FIELDS, PROFILE_SECTIONS_BY_TYPE } from "@definitions";
  import { runtime, simulation_state } from "@state";
  import { get_signature_color } from "@media";
  import { Button, Dialog, Dropdown, Label, Modal, Shimmer, TextField, tooltip } from "@primitives";
  import { ProfilePicture } from "@ui";
  import { safe_parse_pseudo_json } from "@simulation";
  import { auto_resize, click_outside, download_json_file, generate_uuid, resolve_display_macro_segments } from "@utils";
  import { SvelteSet } from "svelte/reactivity";
  import { fade } from "svelte/transition";
  import { NARRATIVE_STYLES, get_narrative_style } from "@definitions";
  import { ALL_PREMADES } from "@definitions";
  import { VISUAL_STYLES, get_visual_style } from "@definitions";
  import AudioWing from "./AudioWing.svelte";
  import DevWing from "./DevWing.svelte";
  import MacroText from "./MacroText.svelte";
  import { ProfileState } from "./Profile.svelte.js";
  import RelationalGraph from "./RelationalGraph.svelte";
  import StyleBadge from "./StyleBadge.svelte";
  import VisualWing from "./VisualWing.svelte";
  import { app } from "@state";
  const entities = { upsert: upsert_entity, update: update_entity };

  /** @type {{ entity_type?: "character" | "fractal" }} */
  let { entity_type = "character" } = $props();

  // --- ORCHESTRATION ---
  const profile_state = new ProfileState();
  /** @type {HTMLElement | undefined} */
  let footer_el = $state();
  /** Footer height (px) - reserves scroll padding so end content clears the frost overlay. */
  let footer_h = $state(0);
  /** @type {HTMLElement | undefined} */
  let info_container_el = $state();
  /** Native scrollbar lane width (px) - preserves spacing so buttons clear the scrollbar track. */
  let scrollbar_lane = $state(0);
  /** True while the info scroller actually overflows. */
  let info_needs_scroll = $state(false);
  let previous_scroll_top = $state(0);
  /** Export chooser (edit-mode footer) - picks V2 Card or native RPGlitch JSON. */
  let show_export_modal = $state(false);
  /** In-place Time-Travel Scrub Bar */
  let is_time_traveling = $state(false);

  // --- TIME-TRAVEL SCRUB BAR STATE ---
  let is_timeline_loading = $state(false);
  let is_performing_timeline_action = $state(false);
  /** @type {Array<number>} */
  let available_timeline_rounds = $state([]);
  let selected_timeline_round = $state(0);
  /** @type {any} */
  let reconstructed_timeline_state = $state(null);

  $effect(() => {
    if (is_time_traveling && profile_state.char?.id) {
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
      await fetch_timeline_round_state(selected_timeline_round);
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
  async function fetch_timeline_round_state(round) {
    if (!profile_state.char?.id) return;
    try {
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
        eternal: { ...profile_state.char.eternal, ...reconstructed_timeline_state.eternal },
        present: { ...profile_state.char.present, ...reconstructed_timeline_state.present },
        past: reconstructed_timeline_state.past,
        future: reconstructed_timeline_state.future,
      };

      await entities.upsert(entity_type, updated_entity);
      await app.load_entities();

      if (runtime.active_ai?.id === profile_state.char.id) runtime.active_ai = updated_entity;
      if (runtime.active_user?.id === profile_state.char.id) runtime.active_user = updated_entity;
      if (runtime.active_fractal?.id === profile_state.char.id) runtime.active_fractal = updated_entity;

      const normalized = normalize(updated_entity);
      profile_state.char = normalized;
      if (app.editing_entity?.id === normalized.id) app.editing_entity = normalized;

      is_time_traveling = false;
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
        eternal: { ...profile_state.char.eternal, ...reconstructed_timeline_state.eternal },
        present: { ...profile_state.char.present, ...reconstructed_timeline_state.present },
        past: reconstructed_timeline_state.past,
        future: reconstructed_timeline_state.future,
      });

      await entities.upsert(entity_type, new_entity);
      await app.load_entities();
      is_time_traveling = false;
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
    if (app.settings.dev_mode && profile_state.char?.id) {
      const live_entity = [runtime.active_user, runtime.active_fractal].find((e) => e && e.id === profile_state.char.id);
      if (live_entity?.dynamics && profile_state.char.dynamics) {
        Object.assign(profile_state.char.dynamics, live_entity.dynamics);
      }
    }
  });

  // --- FROSTED FOOTER OVERLAY GEOMETRY ---
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

  // Re-measure after content/mode swaps settle.
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

  const known_entities = $derived(
    [...(app.ai_list || []), ...(app.fractal_list || []), runtime.active_ai, runtime.active_user, runtime.active_fractal, ...ALL_PREMADES].filter(Boolean),
  );

  /**
   * Resolves the target entity's signature color for `@ENTITY` bracket keys.
   * @param {string} key
   * @returns {string | null}
   */
  function resolve_bracket_target_color(key) {
    if (!key || !key.startsWith("@")) return null;
    const raw_slug = key.slice(1).trim().toLowerCase();
    if (!raw_slug) return null;
    if (raw_slug === "user" && display_entities.USER) return get_signature_color(display_entities.USER, null);
    if ((raw_slug === "char" || raw_slug === "ai") && display_entities.AI) return get_signature_color(display_entities.AI, null);
    if (raw_slug === "fractal" && display_entities.FRACTAL) return get_signature_color(display_entities.FRACTAL, null);

    const spaced_slug = raw_slug.replace(/_/g, " ");
    const exact_match = known_entities.find((entity) => {
      const entity_id = String(entity?.id || "")
        .trim()
        .toLowerCase();
      const entity_name = String(entity?.name || "")
        .trim()
        .toLowerCase();
      return entity_id === raw_slug || entity_id === spaced_slug || entity_name === raw_slug || entity_name === spaced_slug;
    });
    if (exact_match) return get_signature_color(exact_match, null);

    const token_match = known_entities.find((entity) => {
      const entity_name = String(entity?.name || "")
        .trim()
        .toLowerCase();
      return entity_name.split(/\s+/).includes(spaced_slug);
    });
    return token_match ? get_signature_color(token_match, null) : null;
  }

  const author_options = Object.values(NARRATIVE_STYLES)
    .sort((a, b) => {
      if (a.id === "default") return -1;
      if (b.id === "default") return 1;
      return a.name.localeCompare(b.name);
    })
    .map((style) => ({ value: style.id, label: style.name, portrait: style.portrait, tag: style.description, tooltip: `${style.name}: ${style.description}` }));

  const visual_style_options = Object.values(VISUAL_STYLES)
    .sort((a, b) => {
      if (a.id === "none") return -1;
      if (b.id === "none") return 1;
      return a.name.localeCompare(b.name);
    })
    .map((style) => ({ value: style.id, label: style.name, portrait: style.portrait, tag: style.description, tooltip: `${style.name}: ${style.description}` }));

  const has_wings = $derived(!app.transitioning_profile && !profile_state.is_packing_up && (profile_state.is_editing || app.settings.dev_mode));

  // --- WING CHOREOGRAPHY GATE ---
  let card_ref = $state(undefined);
  let wings_ref = $state(undefined);
  let _prev_has_wings = null;

  /** Slides `el` from one translateX to another via a CSS transition (FLIP). */
  function slide_x(el, from_x, to_x, ease = "var(--ease-drawer)") {
    if (el._slide_timer) clearTimeout(el._slide_timer);
    el.style.transition = "none";
    el.style.transform = `translateX(${from_x})`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = `transform ${ease}`;
        el.style.transform = `translateX(${to_x})`;
      });
    });
    el._slide_timer = setTimeout(() => {
      el.style.transition = "";
      el.style.transform = "";
      el._slide_timer = null;
    }, 1000);
  }

  /** Briefly dips the info column opacity to mask the instant edit/readonly content swap. */
  function dip_content(el) {
    if (el._dip_timer_1) clearTimeout(el._dip_timer_1);
    if (el._dip_timer_2) clearTimeout(el._dip_timer_2);
    el.style.transition = "none";
    el.style.opacity = "1";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "opacity 90ms var(--ease-out)";
        el.style.opacity = "0";
      });
    });
    el._dip_timer_1 = setTimeout(() => {
      el.style.transition = "opacity 220ms ease-out";
      el.style.opacity = "1";
    }, 120);
    el._dip_timer_2 = setTimeout(() => {
      el.style.transition = "";
      el.style.opacity = "";
      el._dip_timer_1 = null;
      el._dip_timer_2 = null;
    }, 400);
  }

  $effect(() => {
    const hw = has_wings;
    if (app.transitioning_profile) {
      _prev_has_wings = null;
      if (card_ref) {
        if (card_ref._slide_timer) clearTimeout(card_ref._slide_timer);
        card_ref.style.transition = "";
        card_ref.style.transform = "";
      }
      if (wings_ref) {
        if (wings_ref._slide_timer) clearTimeout(wings_ref._slide_timer);
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
        if (card_ref) slide_x(card_ref, "33.33%", "0", "var(--ease-drawer)");
        if (wings_ref) slide_x(wings_ref, "-165%", "0", "var(--ease-drawer)");
      } else {
        if (card_ref) slide_x(card_ref, "-33.33%", "0", "300ms ease-out");
        if (wings_ref) slide_x(wings_ref, "0", "-165%", "var(--ease-drawer)");
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
    return "card-slot-" + type;
  });

  // --- STYLELINT SAFE LAYOUT ENGINE STATES ---
  const main_card_class = $derived(
    "flex overflow-hidden border border-solid transition-[height,grid-template-columns,grid-template-rows,border-radius] duration-300 relative z-10 " +
      (app.viewport.mobile ?
        "col-span-full h-full flex-col rounded-none "
      : (has_wings ? "md:col-[2/8] row-start-1 my-auto h-[90dvh]" : "md:col-[4/10] row-start-1 my-auto h-[90dvh]") + " rounded-2xl ") +
      (entity_type === "fractal" ? "flex-col" : "flex-row"),
  );

  const avatar_container_class = $derived(
    "sticky top-0 z-20 flex shrink-0 items-stretch transition-[height,width,min-height] duration-300 " +
      (entity_type === "fractal" ? "h-12 min-h-64 w-full " : "h-full w-[calc(var(--spacing-column-unit)*2)] ") +
      (app.viewport.mobile ? "h-auto w-auto items-center justify-center" : ""),
  );

  const profile_pic_wrapper_class = $derived(
    "overflow-hidden border-solid transition-[border-radius] duration-300 " +
      (entity_type === "fractal" ?
        "h-full w-full border-0 border-b " + (!app.viewport.mobile ? "rounded-t-2xl" : "rounded-none")
      : "h-full w-full border-0 " + (!app.viewport.mobile ? "rounded-l-2xl" : "rounded-none")) +
      (app.viewport.mobile ? "h-[calc(var(--spacing-column-unit)*2)] w-[calc(var(--spacing-column-unit)*2)] border-(--spacing-pixel) rounded-md" : ""),
  );

  const info_container_class = $derived(
    "flex min-h-0 min-w-0 flex-1 flex-col gap-standard overflow-x-hidden overflow-y-auto p-standard scrollbar-thin scrollbar-track-transparent [&::-webkit-scrollbar-track]:mb-(--footer-h)",
  );

  const main_layout_class = $derived("grow p-0");

  const footer_layout_class = $derived(
    "absolute right-0 bottom-0 left-0 z-30 flex gap-standard px-standard p-standard outline-none overflow-hidden " +
      (app.viewport.mobile ? "flex-col items-stretch" : "justify-end"),
  );

  const entity_body_class = $derived("min-w-0 " + (app.viewport.mobile ? "flex flex-col gap-standard" : "grid items-center gap-x-tight gap-y-standard"));

  const entity_body_grid_cols = $derived(app.viewport.mobile ? undefined : "2rem 1fr");

  // --- MARKUP CONTEXT SANITIZERS ---
  const get_section_class = () => {
    let cls = "relative flex w-full min-w-0 flex-col items-center justify-center my-auto overflow-visible text-center transition duration-300 ";
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
    const base = "grid min-w-0 items-stretch gap-standard my-auto ";
    return base + (fieldsLength === 2 ? "grid-cols-2" : "grid-cols-1");
  };

  const get_ai_action_btn_class = (fieldKey) => {
    let cls = "text-slate-400 transition duration-200 hover:text-(--signature-color) ";
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

  // Operational catchment tracking user DOM actions.
  // Scoped to the profile card: the modal is pass-through, so background UI
  // (composer, storyboard title, portals) stays interactive while it is open -
  // input/change events from out there must never dirty this profile.
  // (Wing controls mark via direct calls; the description textarea, which uses
  // bind:value with no direct marker, is inside the card and still covered.)
  $effect(() => {
    if (!profile_state.is_editing) return;
    const root = card_ref;
    if (!root) return;
    const mark_mutated = () => {
      profile_state.mark_mutated();
    };
    root.addEventListener("input", mark_mutated, { capture: true });
    root.addEventListener("change", mark_mutated, { capture: true });

    return () => {
      root.removeEventListener("input", mark_mutated, { capture: true });
      root.removeEventListener("change", mark_mutated, { capture: true });
    };
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
    const is_temporal = ["eternal.physical", "eternal.non_physical", "present.physical", "present.non_physical", "past", "future"].includes(field_key);
    if (!is_temporal) return false;
    const trimmed = String(value).trim();
    return trimmed.length >= 120 && !trimmed.includes("\n") && !trimmed.includes("[");
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (!profile_state.char || profile_state.show_delete_confirm || profile_state.pending_swap_confirm || show_export_modal) return;
    if (e.key === "Enter" && !e.shiftKey) {
      const target = /** @type {HTMLElement} */ (e.target);
      if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON" || target.isContentEditable || target.closest("[data-wings-container]")) return;
      e.preventDefault();
      if (profile_state.is_editing) {
        footer_el?.focus();
        profile_state.save(entity_type);
      } else if (profile_state.can_edit) {
        footer_el?.focus();
        profile_state.start_editing();
      }
    }
  }} />

{#if profile_state.char}
  <Dialog
    type="confirm"
    bind:open={profile_state.pending_swap_confirm}
    title="Discard unsaved changes?"
    message={`You have unsaved edits to ${profile_state.char?.name || "this profile"}. Open the other entity and discard them?${profile_state.pending_swap_detail ? ` [${profile_state.pending_swap_detail}]` : ""}`}
    confirm_label="Discard & Continue"
    on_confirm={() => profile_state.confirm_swap()}
    on_cancel={() => profile_state.reject_swap()} />

  <Dialog
    type="confirm"
    bind:open={profile_state.show_delete_confirm}
    title="Delete {profile_state.char.name || 'Entity'}"
    message="This action is irreversible. All associated data, including history and memories, will be lost."
    confirm_label="Confirm"
    on_confirm={() => profile_state.delete(entity_type)} />

  <Modal
    variant="bare"
    bind:open={show_export_modal}
    z_index="1000"
    class="relative w-[clamp(24rem,92vw,38rem)] rounded-2xl bg-glass-elevated p-standard shadow-[0_16px_48px_rgba(0,0,0,0.8)] [backdrop-filter:var(--blur-mist)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-(--noise-url) before:opacity-10 before:mix-blend-overlay before:content-['']"
    on_close={() => {
      show_export_modal = false;
    }}>
    <div class="flex flex-col gap-standard font-sans">
      <div class="flex flex-col gap-standard text-left">
        <h5 class="m-0 text-xs font-bold tracking-widest text-slate-300 uppercase">
          Export {entity_type === "fractal" ? "Fractal" : "Character"}
        </h5>
        <p class="m-0 text-xs leading-relaxed text-slate-400">
          V2 Card is the standard character format for other apps (Tavern, Chub, Janitor). Keep in mind: some RPGlitch data - memories, vectors, seeds, styling
          - is lost when exporting as V2 Card. RPGlitch JSON is a full-fidelity backup.
        </p>
      </div>
      <div class="flex gap-standard">
        <Button
          variant="secondary"
          class="flex-1 justify-center"
          onclick={() => {
            export_entity_card();
            show_export_modal = false;
          }}>
          V2 Card (.json)
        </Button>
        <Button
          variant="primary"
          class="flex-1 justify-center"
          onclick={() => {
            export_entity_json();
            show_export_modal = false;
          }}>
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
    is_pass_through={true}>
    <div
      class={`m-auto grid w-grid-width grid-cols-12 transition-[grid-template-rows,height] duration-300 ${
        app.viewport.mobile ?
          has_wings ? "h-auto grid-rows-[auto_auto] gap-y-standard pb-standard"
          : "h-dvh grid-rows-1"
        : "my-auto h-dvh grid-rows-1"
      }`}
      data-mobile={app.viewport.mobile}
      role="presentation">
      <div
        class={main_card_class}
        bind:this={card_ref}
        style:background-color="color-mix(in srgb, var(--signature-color) 1%, var(--color-glass-sunken))"
        style:border-color="color-mix(in srgb, var(--signature-color) 30%, transparent)"
        style:backdrop-filter="var(--blur-mist)"
        style:--signature-color={signature_color}
        style:view-transition-name={target_morph_name}
        use:click_outside={handle_click_outside}>
        <div class={avatar_container_class + " relative"}>
          <Button
            variant="bare"
            class={[profile_pic_wrapper_class, "relative flex appearance-none items-center justify-center overflow-hidden p-0 outline-none", "cursor-default"]}
            style="border-color: color-mix(in srgb, var(--signature-color) 30%, transparent); background: transparent;"
            disabled>
            {#if profile_state.busy_fields.has("generating-image")}
              <Shimmer color={signature_color || "var(--color-electric-cyan)"} class="rounded-[inherit]" />
            {/if}
            <ProfilePicture entity={profile_state.char} contain={true} landscape={entity_type !== "character"} />
          </Button>
          {#if entity_type === "fractal" && !app.viewport.mobile}
            {@const is_default_style = !profile_state.char.narrative_style || profile_state.char.narrative_style === "default"}
            {@const is_default_visual = !profile_state.char.visual_style || profile_state.char.visual_style === "none"}
            <div class="absolute right-8 -bottom-16 z-30 flex flex-col items-end gap-tight">
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
                  trigger_style="width: 8.5rem; height: 8.5rem;">
                  {#snippet trigger_content({ selected_item })}
                    <StyleBadge entity={profile_state.char} layout="profile" which="narrative" class="h-full w-full" tooltip={selected_item?.tooltip} />
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
                  onchange={() => profile_state.mark_mutated()}>
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
            style:--footer-h={`${footer_h}px`}
            style:padding-bottom={`${footer_h + 16}px`}
            style:scrollbar-gutter={info_needs_scroll ? "stable" : "auto"}>
            <!-- Inlined ProfileHeader snippet -->
            <div
              class="flex min-h-10 w-full min-w-0 shrink-0 flex-col gap-tight {entity_type === 'fractal' && !app.viewport.mobile ? 'pr-44 pl-10' : ''}"
              data-testid="profile-header"
              role="banner">
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
                      p-standard
                      {entity_type === 'fractal' ? 'text-left' : 'text-right'}
                      font-heading
                      text-4xl
                      leading-none
                      font-extrabold
                      tracking-normal
                      outline-none
                      sm:text-5xl
                      md:text-6xl
                    "
                      style="color: {signature_color}; font-size: clamp(2.5rem, 5vw, 4.5rem);"
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
                      }} />
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
                    style="margin: 0; color: {signature_color}; font-size: clamp(3.5rem, 7vw, 6rem); filter: drop-shadow(0 4px 16px rgb(0 0 0 / 0.4));">
                    {format_header_name(profile_state.char.name)}
                  </h1>
                {/if}
              </div>

              {#if profile_state.is_editing}
                <div class="glass-input" data-expanded={profile_state.active_field?.key === "description"} style="--signature-color: {signature_color};">
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
                    p-standard
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
                ">
                  {profile_state.char.description}
                </p>
              {/if}
            </div>

            {#if entity_type === "fractal" && app.viewport.mobile}
              {@const active_style = get_narrative_style(profile_state.char.narrative_style)}
              {@const is_default_style = !profile_state.char.narrative_style || profile_state.char.narrative_style === "default"}
              {#if profile_state.is_editing || !is_default_style}
                <div class="mt-tight flex w-full flex-col gap-tight">
                  <span class="text-[10px] font-bold tracking-widest text-slate-400 uppercase"> Narrative Style </span>
                  {#if profile_state.is_editing}
                    <div class="relative flex w-full max-w-sm rounded-md">
                      <Dropdown
                        bind:value={profile_state.char.narrative_style}
                        items={author_options}
                        label="Select Narrative Style"
                        uppercase={false}
                        matchWidth={false} />
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
                <div class="mt-tight flex w-full flex-col gap-tight">
                  <span class="text-[10px] font-bold tracking-widest text-slate-400 uppercase"> Visual Style (Story Exclusive) </span>
                  {#if profile_state.is_editing}
                    <div class="relative flex w-full max-w-sm rounded-md">
                      <Dropdown
                        bind:value={profile_state.char.visual_style}
                        items={visual_style_options}
                        label="Select Visual Style"
                        uppercase={false}
                        matchWidth={true}
                        onchange={() => profile_state.mark_mutated()} />
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

          {#if is_time_traveling}
            <div
              data-testid="profile-time-travel-bar"
              class="relative z-20 flex flex-wrap items-center justify-between gap-tight border-t px-standard py-tight backdrop-blur-lg"
              style:border-color="color-mix(in srgb, var(--signature-color) 25%, transparent)"
              style:background-color="color-mix(in srgb, var(--signature-color) 8%, var(--color-glass-sunken))"
              style:margin-left={entity_type !== "fractal" && !app.viewport.mobile ? "calc(var(--spacing-column-unit) * -2)" : "0"}>
              <div
                class={"flex flex-wrap items-center gap-tight" +
                  (!app.viewport.mobile && entity_type !== "fractal" ? " pl-[calc(var(--spacing-column-unit)*2)]" : "")}>
                <span class="font-mono text-[11px] font-bold tracking-wider uppercase tabular-nums" style="color: {signature_color};">
                  R{selected_timeline_round}
                </span>
                <div class="flex flex-wrap items-center gap-1">
                  {#each available_timeline_rounds as r (r)}
                    <button
                      type="button"
                      class="cursor-pointer rounded-md px-2 py-0.5 font-mono text-[11px] tabular-nums transition-colors"
                      style:background-color={selected_timeline_round === r ?
                        "color-mix(in srgb, var(--signature-color) 25%, var(--color-glass-sunken))"
                      : "rgba(0,0,0,0.3)"}
                      style:border={selected_timeline_round === r ?
                        "1px solid color-mix(in srgb, var(--signature-color) 60%, transparent)"
                      : "1px solid rgba(255,255,255,0.08)"}
                      style:color={selected_timeline_round === r ? "var(--color-frisk)" : "rgb(148 163 184)"}
                      onclick={() => handle_select_timeline_round(r)}>
                      R{r}
                    </button>
                  {/each}
                </div>
              </div>

              <div class="flex items-center gap-tight">
                <Button
                  variant="secondary"
                  size="small"
                  disabled={is_performing_timeline_action || is_timeline_loading}
                  onclick={handle_timeline_clone_from_point}>
                  {is_performing_timeline_action ? "Branching..." : "Branch"}
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  disabled={is_performing_timeline_action || is_timeline_loading}
                  onclick={handle_timeline_update_from_point}>
                  {is_performing_timeline_action ? "Reverting..." : "Revert"}
                </Button>
                <Button variant="invisible" size="small" onclick={() => (is_time_traveling = false)}>Done</Button>
              </div>
            </div>
          {/if}

          <footer
            bind:this={footer_el}
            tabindex="-1"
            class={footer_layout_class}
            style:padding-right={`calc(1rem + ${scrollbar_lane}px)`}
            style:margin-left={entity_type !== "fractal" && !app.viewport.mobile ? "calc(var(--spacing-column-unit) * -2)" : "0"}>
            <!-- Phase 1: Mirrored photographic tiling - same bottom-anchored portrait slice, alternately flipped, so every joint is seamless by construction -->
            <div aria-hidden="true" class="pointer-events-none absolute inset-0 z-0 flex overflow-hidden select-none">
              {#if profile_state.char?.profile_picture}
                {#each [0, 1, 2, 3, 4, 5] as tile, i (i)}
                  <img
                    src={profile_state.char.profile_picture}
                    alt=""
                    draggable={false}
                    class={"h-full min-w-0 flex-1 object-cover object-bottom blur-2xl saturate-200 " +
                      (tile % 2 === 0 ? "scale-125 opacity-70" : "scale-[-1.25_1.25] opacity-70")} />
                {/each}
              {/if}
              <!-- Veil: transparent at the portrait edge (melt into the band), long ramp to 65% neutral glass so there's no curtain edge; backdrop-blur smears scrolled text into illegibility so the veil can stay light and the photo stays alive (desktop gradient, flat veil on mobile/fractal) -->
              <div
                class="absolute inset-0 backdrop-blur-lg"
                style:background={entity_type !== "fractal" && !app.viewport.mobile ?
                  "linear-gradient(to right, transparent 0%, color-mix(in srgb, var(--color-glass-sunken) 65%, transparent) 55%, color-mix(in srgb, var(--color-glass-sunken) 65%, transparent) 100%)"
                : "color-mix(in srgb, var(--color-glass-sunken) 65%, transparent)"}>
              </div>
            </div>

            <div
              class={"relative z-10 flex w-full max-w-full flex-row items-center justify-between gap-tight" +
                // Footer frost is full-bleed (pulled under the portrait by -2 column units),
                // but the buttons must stay in the info column: the sticky avatar (z-20)
                // would otherwise paint over + eat clicks on anything under it.
                (!app.viewport.mobile && entity_type !== "fractal" ? " pl-[calc(var(--spacing-column-unit)*2)]" : "")}>
              <!-- Left: Paired @ID · POV -->
              <div class="flex min-w-0 flex-col gap-0.5">
                {#if profile_state.is_editing}
                  <div class="flex items-center gap-tight font-mono text-xs" style="color: {signature_color};">
                    <span aria-hidden="true" class="opacity-70">@</span>
                    <input
                      type="text"
                      value={profile_state.draft_id ?? profile_state.char.id ?? ""}
                      placeholder="SLUG"
                      maxlength="36"
                      aria-label="Entity Handle"
                      class="w-28 border-b border-white/25 bg-transparent px-1 py-0.5 font-mono text-xs tracking-wider text-slate-100 uppercase outline-none focus:border-white/60"
                      oninput={(event) => {
                        profile_state.draft_id = event.currentTarget.value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 36);
                        profile_state.identity_error = "";
                        profile_state.mark_mutated();
                      }}
                      onblur={() => {
                        if (!profile_state.commit_draft_id()) {
                          profile_state.identity_error = "ID must be 2–36 chars (A–Z, a–z, 0–9, _ or -).";
                        }
                        profile_state.set_active_field("", "");
                      }}
                      onfocus={() => profile_state.set_active_field("id", "Entity Handle")} />
                    <span class="text-slate-400" aria-hidden="true">·</span>
                    <button
                      type="button"
                      class="cursor-pointer rounded-md border border-white/15 bg-black/25 px-2 py-0.5 font-mono text-[11px] tracking-wider text-slate-200 uppercase transition-colors outline-none hover:border-white/35"
                      onclick={() => {
                        profile_state.char.pov = profile_state.char.pov === "3rd_person" ? "1st_person" : "3rd_person";
                        profile_state.mark_mutated();
                      }}
                      onfocus={() => profile_state.set_active_field("pov", "Perspective")}
                      onblur={() => profile_state.set_active_field("", "")}>
                      {profile_state.char.pov === "1st_person" ? "1st person" : "3rd person"}
                    </button>
                  </div>
                  {#if profile_state.identity_error}
                    <div role="alert" class="font-mono text-[10px] tracking-wide text-red-300/95">
                      {profile_state.identity_error}
                    </div>
                  {/if}
                {:else if profile_state.char.id}
                  <div
                    class="flex items-center gap-tight rounded-md border border-white/10 bg-black/25 px-2.5 py-1 font-mono text-[11px] tracking-wider text-slate-200 uppercase">
                    <span style="color: {signature_color};">@{profile_state.char.id.toUpperCase()}</span>
                    <span class="text-slate-500" aria-hidden="true">·</span>
                    <span class="text-slate-300">{profile_state.char.pov === "1st_person" ? "1st person" : "3rd person"}</span>
                  </div>
                {/if}
              </div>

              <!-- Right: Action Buttons -->
              <div class="flex shrink-0 flex-row items-center justify-end gap-tight">
                {#if profile_state.is_editing}
                  <Button
                    variant="primary"
                    square={true}
                    actions={[tooltip]}
                    aria-label="Enhance Profile with AI - overwrites all fields (macros preserved)"
                    disabled={profile_state.is_saving || profile_state.busy_fields.size > 0}
                    onclick={() => {
                      profile_state.enhance_profile(entity_type);
                    }}
                    class="touch-target-coarse">
                    <svg
                      viewBox="0 0 24 24"
                      class={(Array.from(profile_state.busy_fields).some((f) => f !== "visual-prompt") ? "animate-pulse " : "") +
                        "h-5 w-5 fill-none stroke-current"}
                      style="stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;">
                      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="currentColor"></path>
                    </svg>
                  </Button>
                  <Button
                    variant="primary"
                    square={true}
                    actions={[tooltip]}
                    aria-label={`Export ${entity_type === "fractal" ? "Fractal" : "Character"} (V2 Card or RPGlitch JSON)`}
                    disabled={profile_state.is_saving}
                    onclick={() => (show_export_modal = true)}
                    class="touch-target-coarse">
                    <svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current" style="stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </Button>
                  <Button
                    variant="secondary"
                    square={true}
                    actions={[tooltip]}
                    aria-label="Discard unsaved edits and exit editing"
                    disabled={profile_state.is_saving}
                    onclick={() => {
                      profile_state.cancel();
                    }}
                    class="touch-target-coarse">
                    <svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current" style="stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;">
                      <polyline points="1 4 1 10 7 10"></polyline>
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                    </svg>
                  </Button>
                  <Button
                    variant="danger"
                    square={true}
                    actions={[tooltip]}
                    aria-label="Delete this entity"
                    onclick={() => {
                      profile_state.show_delete_confirm = true;
                    }}
                    class="touch-target-coarse">
                    <svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current" style="stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </Button>
                {:else}
                  <Button
                    variant="secondary"
                    square={true}
                    actions={[tooltip]}
                    aria-label="Inspect historical rounds and branch or revert entity state"
                    onclick={() => (is_time_traveling = !is_time_traveling)}
                    class="touch-target-coarse">
                    <svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current" style="stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </Button>
                  <Button
                    variant="secondary"
                    square={true}
                    actions={[tooltip]}
                    disabled={simulation_state.busy || !profile_state.can_edit}
                    aria-label={!profile_state.can_edit ? "Edit locked - entity is in an active story. Enable DevMode to override." : "Edit"}
                    onclick={() => {
                      if (!profile_state.can_edit) return;
                      previous_scroll_top = info_container_el?.scrollTop || 0;
                      profile_state.start_editing();
                      setTimeout(() => {
                        if (info_container_el) info_container_el.scrollTop = previous_scroll_top;
                      }, 0);
                    }}
                    class="touch-target-coarse">
                    <svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current" style="stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </Button>
                {/if}
              </div>
            </div>
          </footer>
        </div>
      </div>

      <!-- Wing Container stays in DOM to animate exit -->
      <aside
        data-wings-container
        class={"relative isolate z-0 flex scrollbar-none gap-standard [&::-webkit-scrollbar]:hidden " +
          (app.viewport.mobile ?
            "col-span-full w-full items-start overflow-x-visible"
          : "col-[9/12] row-start-1 min-h-0 flex-col items-center justify-center-safe overflow-y-auto")}
        bind:this={wings_ref}
        style:pointer-events={has_wings ? "auto" : "none"}>
        <div class={"flex gap-standard " + (app.viewport.mobile ? "w-fit flex-row px-standard" : "w-full flex-col")}>
          {#if profile_state.is_editing}
            <div
              style={app.viewport.mobile ? "width: 85vw; flex-shrink: 0;" : ""}
              class={app.viewport.mobile ? "max-w-sm" : "w-full"}
              transition:fade={{ duration: 250 }}>
              <VisualWing {profile_state} />
            </div>
            <div
              style={app.viewport.mobile ? "width: 85vw; flex-shrink: 0;" : ""}
              class={"flex flex-col gap-standard " + (app.viewport.mobile ? "max-h-[65dvh] max-w-sm scrollbar-none overflow-y-auto pb-standard" : "w-full")}
              transition:fade={{ duration: 250 }}>
              <AudioWing {profile_state} />
              {#if app.settings.dev_mode}
                <DevWing {profile_state} />
              {/if}
            </div>
          {:else if app.settings.dev_mode}
            <div style={app.viewport.mobile ? "width: 85vw; flex-shrink: 0;" : ""} class={app.viewport.mobile ? "max-w-sm" : "w-full"}>
              <DevWing {profile_state} />
            </div>
          {/if}
        </div>
      </aside>
    </div>
  </Modal>
{/if}

{#snippet EntityBody()}
  <div class={entity_body_class} style:grid-template-columns={entity_body_grid_cols} data-testid="profile-fragments">
    <!-- Profile order: Name → Description → quadrant sections → Relationships -->
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
        role="presentation">
        <div class="relative flex w-full flex-col items-center" style={get_inner_section_style(section.id)}>
          <h6
            class="relative m-0 flex items-center justify-center text-center tracking-widest uppercase transition-colors duration-300"
            style="color: var(--signature-color); text-shadow: none;">
            <span
              class={get_label_span_class()}
              style:text-orientation={app.viewport.mobile ? undefined : "mixed"}
              style:writing-mode={app.viewport.mobile ? undefined : "vertical-rl"}>{section.label}</span>
          </h6>
        </div>
      </div>

      <div class={get_fields_container_class(section.fields.length)}>
        {#each section.fields as field (field.key)}
          {@const field_id = `field-${field.key.replace(".", "-")}`}
          {@const raw_val =
            is_time_traveling && reconstructed_timeline_state ?
              field.key === "eternal.physical" ? reconstructed_timeline_state.eternal?.physical
              : field.key === "eternal.non_physical" ? reconstructed_timeline_state.eternal?.non_physical
              : field.key === "present.physical" ? reconstructed_timeline_state.present?.physical
              : field.key === "present.non_physical" ? reconstructed_timeline_state.present?.non_physical
              : field.key === "past" ? reconstructed_timeline_state.past
              : field.key === "future" ? reconstructed_timeline_state.future
              : profile_state.get_safe_value(field.key)
            : profile_state.get_safe_value(field.key)}
          {@const raw =
            typeof raw_val === "string" ? raw_val
            : Array.isArray(raw_val) ?
              raw_val
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
          <div class="relative flex h-full w-full min-w-0 flex-col items-stretch justify-stretch gap-tight">
            {#if field.column_label}
              <Label class="justify-center drop-shadow-md" style="color: var(--signature-color);" disabled={!profile_state.is_editing} for={field_id}
                >{field.column_label}</Label>
            {/if}

            {#snippet bracketed_content()}
              {@const sorted_entries = Object.entries(parsed).sort((a, b) => String(a[1]).length - String(b[1]).length)}
              <div class="flex flex-col divide-y divide-white/5">
                {#each sorted_entries as [k, v] (k)}
                  {@const raw_val = String(v ?? "")}
                  {@const is_hidden = /(?:^|\s)\|(?:\s*(?:hide|private)\b)/i.test(raw_val)}
                  {@const clean_val = raw_val
                    .replace(/\s*\|\s*(?:hide|show|private)\b/gi, "")
                    .replace(/\s*\|\s*w:\s*\d+\b/gi, "")
                    .trim()}
                  {@const key_color = resolve_bracket_target_color(k)}
                  {#if clean_val}
                    <div class="flex flex-col items-start gap-0.5 py-1.5 first:pt-0 last:pb-0 {is_hidden ? 'opacity-55' : ''}">
                      <span
                        style={key_color && !is_hidden ? `color: ${key_color};` : undefined}
                        class="text-left font-mono text-[10px] font-bold tracking-wider uppercase {is_hidden ? 'text-slate-400'
                        : key_color ? ''
                        : 'text-(--signature-color)'}">{k}</span>
                      <span class="text-left text-xs leading-normal {is_hidden ? 'text-slate-400 italic' : 'text-slate-200'}">
                        {@render RenderFormattedValue(clean_val)}
                      </span>
                    </div>
                  {/if}
                {/each}
              </div>
            {/snippet}

            <TextField
              id={field_id}
              is_edit={profile_state.is_editing}
              active={profile_state.active_field?.key === field.key}
              sync_id={section.label}
              {signature_color}
              placeholder={field.description}
              value={raw}
              inline_snippet={inline_macro_text}
              content={!profile_state.is_editing && parsed ? bracketed_content : undefined}
              oninput={(e) => profile_state.set_field_value(field.key, e.target.value)}
              busy={profile_state.busy_fields.has(field.key)}
              onfocus={() => profile_state.set_active_field(field.key, field.label || section.label)}>
              {#snippet status()}
                {#if field.label}
                  <span
                    class="block max-w-full truncate font-sans text-xs font-normal tracking-normal whitespace-nowrap text-white opacity-80 {field.description ?
                      'cursor-help'
                    : 'cursor-default'}"
                    use:tooltip
                    aria-label={field.description}>{field.label}</span>
                {/if}
              {/snippet}

              {#snippet header_actions()}
                {#if profile_state.is_editing}
                  <Button
                    variant="invisible"
                    size="small"
                    square={true}
                    aria-label={"Enhance " + (field.label || section.label || "field") + " with AI"}
                    actions={[tooltip]}
                    disabled={profile_state.busy_fields.has(field.key) || !profile_state.get_safe_value(field.key)}
                    onclick={() => profile_state.enhance(field.key, profile_state.get_safe_value(field.key))}
                    class={get_ai_action_btn_class(field.key)}>
                    <svg viewBox="0 0 24 24" class="size-icon-small fill-none stroke-current stroke-2" style="stroke-linecap: round; stroke-linejoin: round;">
                      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="currentColor"></path>
                    </svg>
                  </Button>
                {/if}
              {/snippet}
            </TextField>

            {#if should_show_bracket_tip(field.key, raw)}
              <div
                class="flex items-center gap-tight rounded-md border border-cyan-500/20 bg-cyan-950/20 px-tight py-1 text-[11px] leading-tight text-cyan-300/80"
                transition:fade={{ duration: 150 }}>
                <span class="shrink-0 font-mono text-[10px] font-semibold tracking-wider text-cyan-400 uppercase">Tip</span>
                <span
                  >The engine reasons best with multiple bracketed directives <code class="font-mono text-[10px] text-cyan-200">[KEY: value]</code> or distinct lines.</span>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/each}

    <div
      class={get_section_class()}
      style:border-color={app.viewport.mobile ? "color-mix(in srgb, var(--signature-color) 30%, transparent)" : undefined}
      data-section="relationships"
      role="presentation">
      <div class="relative flex w-full flex-col items-center" style={get_inner_section_style("relationships")}>
        <h6
          class="relative m-0 flex items-center justify-center text-center tracking-wider uppercase transition-colors duration-300"
          style="color: var(--signature-color); text-shadow: none;">
          <span
            class={get_label_span_class()}
            style:text-orientation={app.viewport.mobile ? undefined : "mixed"}
            style:writing-mode={app.viewport.mobile ? undefined : "vertical-rl"}>Relationships</span>
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
        }} />
    </div>
  </div>
{/snippet}

{#snippet RenderChoiceNodes(nodes)}
  {#each nodes as part, i (i)}
    {#if part.is_var}
      <span
        class="mx-0.5 inline-flex flex-wrap items-center gap-tight rounded border border-dashed border-(--signature-color)/25 bg-(--signature-color)/5 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
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
