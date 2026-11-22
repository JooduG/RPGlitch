<script>
  /**
   * @file src/ui/Profile.svelte
   * Entity profile modal orchestrating viewing, editing, time-travel inspection, and auxiliary wings.
   */
  import { serialize_character_card, serialize_entity_for_export } from "@data";
  import {
    NARRATIVE_STYLES,
    PROFILE_FIELDS,
    PROFILE_SECTIONS_BY_TYPE,
    VISUAL_STYLES,
    get_narrative_style,
    get_visual_style,
    resolve_entity_style_tiles,
  } from "@definitions";
  import { motion } from "@media";
  import { safe_parse_pseudo_json } from "@simulation";
  import { app, execution, session } from "@state";
  import { auto_resize, download_json_file, entity_avatar_props, get_signature_color, to_style_dropdown_items } from "@utils";
  import { Avatar, Button, Icon, Label, Shimmer, tooltip } from "@atoms";
  import { BracketList, Dialog, Dropdown, MacroText, Modal, TextField } from "@molecules";
  import { AudioWing, DevWing, RelationalGraph, VisualWing } from "@organisms";
  import { ProfileState } from "./Profile.svelte.js";
  import { fade } from "svelte/transition";

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
    if (app.settings.dev_mode && !profile_state.is_editing && profile_state.char?.id) {
      const live_entity = [session.active_user, session.active_ai, session.active_fractal].find((e) => e && e.id === profile_state.char.id);
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

  const known_entities = $derived(
    [session.active_ai, session.active_user, session.active_fractal, ...(app.ai_list || []), ...(app.user_list || []), ...(app.fractal_list || [])].filter(
      Boolean,
    ),
  );

  const display_entities = $derived({
    AI: session.active_ai || app.selected_ai,
    USER: session.active_user || app.selected_user,
    FRACTAL: session.active_fractal || app.selected_fractal,
    ALL: known_entities,
  });

  const author_options = to_style_dropdown_items(NARRATIVE_STYLES, "default");
  const visual_style_options = to_style_dropdown_items(VISUAL_STYLES, "none");

  const has_wings = $derived(!app.transitioning_profile && !profile_state.is_packing_up && (profile_state.is_editing || app.settings.dev_mode));

  // --- WING CHOREOGRAPHY GATE ---
  let card_ref = $state(undefined);
  let wings_ref = $state(undefined);
  let _prev_has_wings = null;

  /** Slides `el` from one translateX to another via a CSS transition (FLIP). */
  function slide_x(el, from_x, to_x, ease = "var(--ease-drawer)", duration = "var(--transition-duration-standard)") {
    if (el._slide_timer) clearTimeout(el._slide_timer);
    if (motion.is_reduced) {
      el.style.transition = "";
      el.style.transform = "";
      el._slide_timer = null;
      return;
    }
    el.style.transition = "none";
    el.style.transform = `translateX(${from_x})`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = `transform ${duration} ${ease}`;
        el.style.transform = `translateX(${to_x})`;
      });
    });
    el._slide_timer = setTimeout(() => {
      el.style.transition = "";
      el.style.transform = "";
      el._slide_timer = null;
    }, 1000);
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
        if (card_ref) slide_x(card_ref, "-33.33%", "0", "var(--ease-out)");
        if (wings_ref) slide_x(wings_ref, "0", "-165%", "var(--ease-drawer)");
      }
    }
  });

  let content_dipping = $state(false);
  let _prev_is_editing = null;

  $effect(() => {
    const editing = profile_state.is_editing;
    if (app.transitioning_profile || app.viewport.mobile || motion.is_reduced) {
      _prev_is_editing = editing;
      content_dipping = false;
      return;
    }
    if (_prev_is_editing === null) {
      _prev_is_editing = editing;
      return;
    }
    if (_prev_is_editing !== editing) {
      _prev_is_editing = editing;
      content_dipping = true;
      const timer = setTimeout(() => {
        content_dipping = false;
      }, 90);
      return () => clearTimeout(timer);
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
    "flex overflow-hidden border border-solid transition-[grid-template-columns,grid-template-rows,transform,opacity] duration-300 relative z-10 " +
      (app.viewport.mobile ?
        "col-span-full h-full flex-col rounded-none "
      : (has_wings ? "md:col-[2/8] row-start-1 my-auto h-[90dvh]" : "md:col-[4/10] row-start-1 my-auto h-[90dvh]") + " rounded-2xl ") +
      (entity_type === "fractal" ? "flex-col" : "flex-row"),
  );

  const avatar_container_class = $derived(
    "sticky top-0 z-20 flex shrink-0 items-stretch transition-[transform,opacity] duration-300 " +
      (entity_type === "fractal" ? "h-12 min-h-64 w-full " : "h-full w-[calc(var(--spacing-column-unit)*2)] ") +
      (app.viewport.mobile ? "h-auto w-auto items-center justify-center" : ""),
  );

  const profile_pic_wrapper_class = $derived(
    "overflow-hidden border-solid transition-[border-radius] duration-300 " +
      (entity_type === "fractal" ?
        "h-full w-full border-0 border-b " + (!app.viewport.mobile ? "rounded-t-2xl" : "rounded-none")
      : "h-full w-full border-0 " + (!app.viewport.mobile ? "rounded-l-2xl" : "rounded-none")) +
      (app.viewport.mobile ? "h-48 w-full border-(--spacing-pixel) rounded-md" : ""),
  );

  const info_container_class = $derived(
    "flex min-h-0 min-w-0 flex-1 flex-col gap-standard overflow-x-hidden overflow-y-auto p-standard scrollbar-thin scrollbar-track-transparent [&::-webkit-scrollbar-track]:mb-(--footer-h) transition-opacity duration-fast ease-out",
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
    download_json_file(export_entity_filename("json"), serialize_entity_for_export({ ...profile_state.char, type: entity_type }));
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

  <Dialog
    bind:open={show_export_modal}
    title={`Export ${entity_type === "fractal" ? "Fractal" : "Character"}`}
    message="V2 Card is the standard character format for other apps (Tavern, Chub, Janitor). Keep in mind: some RPGlitch data - memories, vectors, seeds, styling - is lost when exporting as V2 Card. RPGlitch JSON is a full-fidelity backup."
    layer="modal">
    {#snippet footer()}
      <div class="flex w-full gap-standard">
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
    {/snippet}
  </Dialog>

  <Modal
    animate={false}
    dismissible={!profile_state.show_delete_confirm && !show_export_modal}
    on_close={() => {
      if (profile_state.is_editing) {
        profile_state.save(entity_type);
      } else {
        profile_state.handle_close(entity_type);
      }
    }}>
    <div
      class={`pointer-events-none m-auto grid w-grid-width grid-cols-12 transition-[grid-template-rows,transform,opacity] duration-300 ${
        app.viewport.mobile ?
          has_wings ? "h-auto grid-rows-[auto_auto] gap-y-standard pb-standard"
          : "h-dvh grid-rows-1"
        : "my-auto h-dvh grid-rows-1"
      }`}
      data-mobile={app.viewport.mobile}
      role="presentation">
      <div
        class={[main_card_class, "pointer-events-auto"]}
        bind:this={card_ref}
        style:background-color="color-mix(in srgb, var(--signature-color) 1%, var(--color-glass-sunken))"
        style:border-color="color-mix(in srgb, var(--signature-color) 30%, transparent)"
        style:backdrop-filter="var(--blur-mist)"
        style:--signature-color={signature_color}
        style:view-transition-name={target_morph_name}>
        <div class={avatar_container_class + " relative"}>
          <Button
            variant="bare"
            class={[profile_pic_wrapper_class, "relative flex appearance-none items-center justify-center overflow-hidden p-0 outline-none", "cursor-default"]}
            style="border-color: color-mix(in srgb, var(--signature-color) 30%, transparent); background: transparent;"
            disabled>
            {#if profile_state.busy_fields.has("generating-image")}
              <Shimmer color={signature_color || "var(--color-electric-cyan)"} class="rounded-[inherit]" />
            {/if}
            <Avatar {...entity_avatar_props(profile_state.char)} contain={true} landscape={entity_type !== "character"} />
          </Button>
          {#if entity_type === "fractal" && !app.viewport.mobile}
            {@const is_default_style = !profile_state.char.narrative_style || profile_state.char.narrative_style === "default"}
            {@const is_default_visual = !profile_state.char.visual_style || profile_state.char.visual_style === "none"}
            <div class="absolute right-8 -bottom-16 z-30 flex flex-col items-end gap-tight">
              {#if profile_state.is_editing || !is_default_style}
                {@const n_tile = resolve_entity_style_tiles(profile_state.char, { include_defaults: true }).narrative}
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
                    <div
                      use:tooltip={selected_item?.tooltip}
                      class="group/badge pointer-events-auto relative flex h-full w-full transform-gpu items-center justify-center overflow-hidden rounded-xl border border-solid border-(--signature-color) bg-black/40 opacity-100 shadow-md transition duration-300 ease-in-out"
                      style="--signature-color: {signature_color};">
                      <Avatar
                        src={n_tile?.portrait || ""}
                        alt={n_tile?.name || "No Narrative Style"}
                        initials={n_tile?.fallback || "?"}
                        {signature_color}
                        fallback_class="text-lg"
                        class="rounded-[inherit]" />
                    </div>
                  {/snippet}
                </Dropdown>
              {/if}

              {#if profile_state.is_editing || !is_default_visual}
                {@const v_tile = resolve_entity_style_tiles(profile_state.char, { include_defaults: true }).visual}
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
                    <div
                      use:tooltip={selected_item?.tooltip}
                      class="group/badge pointer-events-auto relative flex h-full w-full transform-gpu items-center justify-center overflow-hidden rounded-xl border border-solid border-(--signature-color) bg-black/40 opacity-100 shadow-md transition duration-300 ease-in-out"
                      style="--signature-color: {signature_color};">
                      <Avatar
                        src={v_tile?.portrait || ""}
                        alt={v_tile?.name || "No Visual Style"}
                        initials={v_tile?.fallback || "?"}
                        {signature_color}
                        fallback_class="text-lg"
                        class="rounded-[inherit]" />
                    </div>
                  {/snippet}
                </Dropdown>
              {/if}
            </div>
          {/if}
        </div>

        <div class="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div
            class={info_container_class}
            class:opacity-0={content_dipping && !motion.is_reduced}
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
                <h1
                  class={["text-balance", entity_type === "fractal" ? "text-left" : "text-right"]}
                  style="color: {signature_color}; filter: drop-shadow(0 4px 16px rgb(0 0 0 / 0.4));">
                  {#if profile_state.is_editing}
                    <span class="glass-input" data-expanded={profile_state.active_field?.key === "name"} style="--signature-color: {signature_color};">
                      <input
                        bind:this={name_input}
                        value={profile_state.draft_name ?? profile_state.char.name ?? ""}
                        aria-label={PROFILE_FIELDS.name.label}
                        class="z-20 box-border w-full border-none bg-transparent p-standard text-inherit outline-none"
                        oninput={(event) => {
                          profile_state.draft_name = event.currentTarget.value;
                          profile_state.identity_error = "";
                          profile_state.mark_mutated();
                        }}
                        onfocus={() => profile_state.set_active_field("name", PROFILE_FIELDS.name.label)}
                        onblur={() => {
                          if (!profile_state.commit_draft_name()) {
                            profile_state.identity_error = "Name is required.";
                          }
                          profile_state.set_active_field("", "");
                        }} />
                    </span>
                  {:else}
                    {format_header_name(profile_state.char.name)}
                  {/if}
                </h1>
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
                    type-body
                    text-sm
                    [text-wrap:auto]
                    text-frisk
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
                    placeholder={PROFILE_FIELDS.description?.description || PROFILE_FIELDS.description?.label}
                    bind:value={profile_state.char.description}
                    use:auto_resize
                    onfocus={() => profile_state.set_active_field("description", PROFILE_FIELDS.description.label)}
                    onblur={() => profile_state.set_active_field("", "")}></textarea>
                </div>
              {:else if profile_state.char.description}
                <p
                  class="
                  m-0
                  rounded-md
                  type-body
                  {entity_type === 'fractal' ? 'text-left' : 'text-right'}
                  text-sm
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
                  <span class="type-uppercase-label text-slate-400"> Narrative Style </span>
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
                    <span class="cursor-default type-body text-sm text-slate-300 italic" use:tooltip={`${active_style.name}: ${active_style.description}`}>
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
                  <span class="type-uppercase-label text-slate-400"> Visual Style (Story Exclusive) </span>
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
              <div class="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden {!app.viewport.mobile ? 'pl-[calc(2rem+var(--spacing-standard))]' : ''}">
                {#if profile_state.is_editing}
                  <div class="flex min-w-0 items-center gap-tight type-data" style="color: {signature_color};">
                    <span aria-hidden="true" class="shrink-0 opacity-70">@</span>
                    <input
                      type="text"
                      value={profile_state.draft_id ?? profile_state.char.id ?? ""}
                      placeholder="SLUG"
                      maxlength="36"
                      aria-label={PROFILE_FIELDS.id.label}
                      use:tooltip={PROFILE_FIELDS.id.description}
                      class="w-24 max-w-28 min-w-0 flex-1 border-b border-white/25 bg-transparent px-1 py-0.5 type-uppercase-label text-slate-100 outline-none focus:border-white/60"
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
                      onfocus={() => profile_state.set_active_field("id", PROFILE_FIELDS.id.label)} />
                    <span class="shrink-0 text-slate-400" aria-hidden="true">·</span>
                    <button
                      type="button"
                      aria-label={PROFILE_FIELDS.pov.label}
                      use:tooltip={PROFILE_FIELDS.pov.description}
                      class="shrink-0 cursor-pointer rounded-md border border-white/15 bg-black/25 px-2 py-0.5 type-uppercase-label whitespace-nowrap text-slate-200 transition-colors outline-none hover:border-white/35"
                      onclick={() => {
                        profile_state.char.pov = profile_state.char.pov === "3rd_person" ? "1st_person" : "3rd_person";
                        profile_state.mark_mutated();
                      }}
                      onfocus={() => profile_state.set_active_field("pov", PROFILE_FIELDS.pov.label)}
                      onblur={() => profile_state.set_active_field("", "")}>
                      {profile_state.char.pov === "1st_person" ? "1st person" : "3rd person"}
                    </button>
                  </div>
                  {#if profile_state.identity_error}
                    <div role="alert" class="type-data text-red-300/95">
                      {profile_state.identity_error}
                    </div>
                  {/if}
                {:else if profile_state.char.id}
                  <div class="flex items-center gap-tight rounded-md border border-white/10 bg-black/25 px-2.5 py-1 type-uppercase-label text-slate-200">
                    <span class="cursor-help" style="color: {signature_color};" use:tooltip={PROFILE_FIELDS.id.description}
                      >@{profile_state.char.id.toUpperCase()}</span>
                    <span class="text-slate-500" aria-hidden="true">·</span>
                    <span class="cursor-help text-slate-300" use:tooltip={PROFILE_FIELDS.pov.description}
                      >{profile_state.char.pov === "1st_person" ? "1st person" : "3rd person"}</span>
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
                    <Icon
                      name="ai_enhance"
                      class={(Array.from(profile_state.busy_fields).some((f) => f !== "visual-prompt") ? "animate-pulse " : "") + "size-5"} />
                  </Button>
                  <Button
                    variant="primary"
                    square={true}
                    actions={[tooltip]}
                    aria-label={`Export ${entity_type === "fractal" ? "Fractal" : "Character"} (V2 Card or RPGlitch JSON)`}
                    disabled={profile_state.is_saving}
                    onclick={() => (show_export_modal = true)}
                    class="touch-target-coarse">
                    <Icon name="download" class="size-5" />
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
                    <Icon name="reset" class="size-5" />
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
                    <Icon name="trash" class="size-5" />
                  </Button>
                {:else}
                  <Button
                    variant="secondary"
                    square={true}
                    actions={[tooltip]}
                    disabled={execution.busy || !profile_state.can_edit}
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
                    <Icon name="edit" class="size-5" />
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
            "col-span-full w-full items-start overflow-x-auto"
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
            class="relative flex items-center justify-center text-center transition-colors duration-standard"
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
          {@const raw_val = profile_state.get_safe_value(field.key)}
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
              <BracketList record={parsed} owner={profile_state.char} entities={display_entities} on_select={(ent) => app.open_profile(ent)} />
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
                    class="block max-w-full truncate type-interact text-xs whitespace-nowrap text-pure-white opacity-80 {field.description ? 'cursor-help' : (
                      'cursor-default'
                    )}"
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
                    <Icon name="ai_enhance" class="size-icon-small" />
                  </Button>
                {/if}
              {/snippet}
            </TextField>

            {#if should_show_bracket_tip(field.key, raw)}
              <div
                class="flex items-center gap-tight rounded-md border border-cyan-500/20 bg-cyan-950/20 px-tight py-1 text-xs text-cyan-300/80"
                transition:fade={{ duration: 150 }}>
                <span class="shrink-0 type-uppercase-label text-cyan-400">Tip</span>
                <span>The engine reasons best with multiple bracketed directives <code class="text-cyan-200">[KEY: value]</code> or distinct lines.</span>
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
          class="relative flex items-center justify-center text-center transition-colors duration-standard"
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

{#snippet inline_macro_text(text)}
  <MacroText {text} owner={profile_state.char} entities={display_entities} on_select={(ent) => app.open_profile(ent)} />
{/snippet}
