<script>
  /**
   * @file src/ui/Profile.svelte
   * Entity profile modal orchestrating viewing, editing, time-travel inspection, and auxiliary wings.
   */
  import { Avatar, Button, Icon, Label, Shimmer, StyleTile, tooltip } from "@atoms";
  import { serialize_character_card, serialize_entity_for_export } from "@data";
  import { NARRATIVE_STYLES, PROFILE_FIELDS, PROFILE_SECTIONS_BY_TYPE, VISUAL_STYLES, get_narrative_style, get_visual_style } from "@definitions";
  import { motion } from "@media";
  import { BracketList, Dialog, Dropdown, MacroText, Modal, TextField } from "@molecules";
  import { AudioWing, DevWing, RelationalGraph, VisualWing } from "@organisms";
  import { safe_parse_pseudo_json } from "@simulation";
  import { app, execution, session } from "@state";
  import { auto_resize, download_json_file, entity_avatar_props, get_signature_color, normalize_comma_spacing, to_style_dropdown_items } from "@utils";
  import { fade } from "svelte/transition";
  import { ProfileState } from "./Profile.svelte.js";

  /** @type {{ entity_type?: "character" | "fractal" }} */
  let { entity_type = "character" } = $props();

  const TEMPORAL_FIELDS = new Set(["eternal.physical", "eternal.non_physical", "present.physical", "present.non_physical", "past", "future"]);
  const AUTHOR_OPTIONS = to_style_dropdown_items(NARRATIVE_STYLES, "default");
  const VISUAL_STYLE_OPTIONS = to_style_dropdown_items(VISUAL_STYLES, "none");

  // --- ORCHESTRATION ---
  const profile_state = new ProfileState();
  /** @type {HTMLElement | undefined} */
  let info_container_el = $state();
  /** @type {HTMLInputElement | undefined} */
  let name_input = $state();
  /** @type {HTMLElement | undefined} */
  let card_ref = $state();
  /** @type {HTMLElement | undefined} */
  let wings_ref = $state();
  // Local Dialog open state: rebound to true when handle_close refuses (invalid ID),
  // otherwise a refused close would leave app.profile_open true with no visible modal
  // (and the storyboard card stuck at opacity 0 via its profile_open gate).
  let modal_open = $state(true);

  let show_export_modal = $state(false);
  let content_dipping = $state(false);
  let _prev_has_wings = null;
  let _prev_is_editing = null;

  // --- DERIVED ---
  const is_fractal = $derived(entity_type === "fractal");
  const is_mobile = $derived(app.viewport.mobile);
  const signature_color = $derived(get_signature_color(profile_state.char, "var(--color-gunmetal)"));
  const active_sections = $derived(PROFILE_SECTIONS_BY_TYPE[entity_type] || PROFILE_SECTIONS_BY_TYPE.character);
  const has_wings = $derived(!app.transitioning_profile && !profile_state.is_packing_up && (profile_state.is_editing || app.settings.dev_mode));
  const wing_card_class = $derived(is_mobile ? "w-[85vw] max-w-sm shrink-0" : "w-full");

  const target_morph_name = $derived.by(() => {
    const id = profile_state.char?.id;
    if (!id) return undefined;
    if (app.selected_ai?.id === id) return "card-slot-ai";
    if (app.selected_user?.id === id) return "card-slot-user";
    if (app.selected_fractal?.id === id) return "card-slot-fractal";
    return undefined;
  });

  const fractal_styles = $derived.by(() => {
    if (!is_fractal || !profile_state.char) return [];
    return [
      {
        key: "narrative_style",
        label: "Narrative Style",
        aria_label: "Select Narrative Style",
        items: AUTHOR_OPTIONS,
        is_default: !profile_state.char.narrative_style || profile_state.char.narrative_style === "default",
        active: get_narrative_style(profile_state.char.narrative_style),
        match_width_mobile: false,
      },
      {
        key: "visual_style",
        label: "Visual Style (Story Exclusive)",
        aria_label: "Select Visual Style",
        items: VISUAL_STYLE_OPTIONS,
        is_default: !profile_state.char.visual_style || profile_state.char.visual_style === "none",
        active: get_visual_style(profile_state.char.visual_style),
        match_width_mobile: true,
      },
    ];
  });

  // --- EFFECTS ---
  $effect(() => profile_state.sync());

  $effect(() => {
    if (profile_state.is_editing && profile_state.active_field?.key === "name" && name_input) {
      name_input.focus();
      name_input.select();
    }
  });

  // DevMode live telemetry sync
  $effect(() => {
    if (!app.settings.dev_mode || profile_state.is_editing || !profile_state.char?.id) return;
    const live_entity = [session.active_user, session.active_ai, session.active_fractal].find((e) => e?.id === profile_state.char.id);
    if (live_entity?.dynamics && profile_state.char.dynamics) {
      Object.assign(profile_state.char.dynamics, live_entity.dynamics);
    }
  });

  // Scoped mutation tracking (ignores pass-through background UI outside the card)
  $effect(() => {
    if (!profile_state.is_editing || !card_ref) return;
    const root = card_ref;
    const mark_mutated = () => profile_state.mark_mutated();
    root.addEventListener("input", mark_mutated, { capture: true });
    root.addEventListener("change", mark_mutated, { capture: true });
    return () => {
      root.removeEventListener("input", mark_mutated, { capture: true });
      root.removeEventListener("change", mark_mutated, { capture: true });
    };
  });

  // Wing choreography FLIP gate
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
      for (const el of [card_ref, wings_ref]) {
        if (!el) continue;
        if (el._slide_timer) clearTimeout(el._slide_timer);
        el.style.transition = "";
        el.style.transform = "";
        el.style.opacity = "";
      }
      return;
    }
    if (is_mobile || _prev_has_wings === null) {
      _prev_has_wings = hw;
      return;
    }
    if (_prev_has_wings !== hw) {
      _prev_has_wings = hw;
      if (card_ref) slide_x(card_ref, hw ? "33.33%" : "-33.33%", "0", hw ? "var(--ease-drawer)" : "var(--ease-out)");
      if (wings_ref) slide_x(wings_ref, hw ? "-165%" : "0", hw ? "0" : "-165%", "var(--ease-drawer)");
    }
  });

  // Brief opacity dip on edit-mode swap
  $effect(() => {
    const editing = profile_state.is_editing;
    if (app.transitioning_profile || is_mobile || motion.is_reduced) {
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
      const timer = setTimeout(() => (content_dipping = false), 90);
      return () => clearTimeout(timer);
    }
  });

  // --- HELPERS ---
  function normalize_field_value(raw_val) {
    if (typeof raw_val === "string") return raw_val;
    if (Array.isArray(raw_val)) {
      return raw_val
        .map((item) => (typeof item === "object" ? item?.content || item?.directive || "" : String(item || "")))
        .filter(Boolean)
        .join("\n");
    }
    return raw_val || "";
  }

  function parse_bracket_field(raw) {
    const res = safe_parse_pseudo_json(raw);
    if (!res || !Object.keys(res).length || res.__raw_prose__) return null;
    const standardized = {};
    for (const [k, v] of Object.entries(res)) {
      standardized[k] = typeof v === "string" ? normalize_comma_spacing(v) : v;
    }
    return standardized;
  }

  function should_show_bracket_tip(field_key, value) {
    if (!profile_state.is_editing || !value || !TEMPORAL_FIELDS.has(field_key)) return false;
    const trimmed = String(value).trim();
    return trimmed.length >= 120 && !trimmed.includes("\n") && !trimmed.includes("[");
  }

  function export_entity(format) {
    if (!profile_state.char) return;
    const slug =
      String(profile_state.char.name || "entity")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48) || "entity";
    const payload = { ...profile_state.char, type: entity_type };
    if (format === "v2") {
      download_json_file(`${slug}.v2.json`, serialize_character_card(payload));
    } else {
      download_json_file(`${slug}.json`, serialize_entity_for_export(payload));
    }
    show_export_modal = false;
  }

  function enter_edit_mode() {
    if (!profile_state.can_edit) return;
    const scroll_top = info_container_el?.scrollTop || 0;
    profile_state.start_editing();
    queueMicrotask(() => {
      if (info_container_el) info_container_el.scrollTop = scroll_top;
    });
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (!profile_state.char || profile_state.show_delete_confirm || profile_state.pending_swap_confirm || show_export_modal) return;
    if (e.key !== "Enter" || e.shiftKey) return;
    const target = /** @type {HTMLElement} */ (e.target);
    if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON" || target.isContentEditable || target.closest("[data-wings-container]")) return;
    e.preventDefault();
    /** @type {HTMLElement | null} */ (document.activeElement)?.blur();
    if (profile_state.is_editing) profile_state.save(entity_type);
    else if (profile_state.can_edit) profile_state.start_editing();
  }} />

{#if profile_state.char}
  <Dialog
    type="confirm"
    bind:open={profile_state.pending_swap_confirm}
    title="Discard unsaved changes?"
    message={`You have unsaved edits to ${profile_state.char?.name || "this profile"}. Open the other entity and discard them?`}
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
    title={`Export ${is_fractal ? "Fractal" : "Character"}`}
    message="V2 Card is the standard character format for other apps (Tavern, Chub, Janitor). Keep in mind: some RPGlitch data - memories, vectors, seeds, styling - is lost when exporting as V2 Card. RPGlitch JSON is a full-fidelity backup."
    layer="modal">
    {#snippet footer()}
      <div class="flex w-full gap-standard">
        <Button variant="secondary" class="flex-1 justify-center" onclick={() => export_entity("v2")}>V2 Card (.json)</Button>
        <Button variant="primary" class="flex-1 justify-center" onclick={() => export_entity("json")}>RPGlitch JSON (.json)</Button>
      </div>
    {/snippet}
  </Dialog>

  <Modal
    bind:open={modal_open}
    animate={false}
    dismissible={!profile_state.show_delete_confirm && !show_export_modal}
    on_close={async () => {
      // Dismiss already hid the dialog: route through handle_close so edit-mode
      // outside clicks save AND release app.profile_open (restoring the card).
      const ok = await profile_state.handle_close(entity_type);
      if (!ok) modal_open = true;
    }}>
    <div
      class={[
        "pointer-events-none m-auto grid w-grid-width grid-cols-12 transition-[grid-template-rows,transform,opacity] duration-300",
        is_mobile ?
          has_wings ? "h-auto grid-rows-[auto_auto] gap-y-standard pb-standard"
          : "h-dvh grid-rows-1"
        : "my-auto h-dvh grid-rows-1",
      ]}
      data-mobile={is_mobile}
      role="presentation">
      <article
        bind:this={card_ref}
        class={[
          "pointer-events-auto relative z-10 flex overflow-hidden border border-solid transition-[grid-template-columns,grid-template-rows,transform,opacity] duration-300",
          is_mobile ?
            "col-span-full h-full flex-col rounded-none"
          : [has_wings ? "md:col-[2/8]" : "md:col-[4/10]", "row-start-1 my-auto h-[90dvh] rounded-2xl", is_fractal ? "flex-col" : "flex-row"],
        ]}
        style:background-color="color-mix(in srgb, var(--signature-color) 1%, var(--color-glass-sunken))"
        style:border-color="color-mix(in srgb, var(--signature-color) 30%, transparent)"
        style:backdrop-filter="var(--blur-mist)"
        style:--signature-color={signature_color}
        style:view-transition-name={target_morph_name}>
        <!-- Portrait / Banner -->
        <div
          class={[
            "relative top-0 z-20 flex shrink-0 items-stretch transition-[transform,opacity] duration-300",
            is_mobile ? "h-48 w-full items-center justify-center"
            : is_fractal ? "h-12 min-h-64 w-full"
            : "h-full w-[calc(var(--spacing-column-unit)*2)]",
          ]}>
          <div
            class={[
              "relative flex h-full w-full items-center justify-center overflow-hidden border-solid transition-[border-radius] duration-300",
              is_mobile ? "rounded-md border-(--spacing-pixel)"
              : is_fractal ? "rounded-t-2xl border-0 border-b"
              : "rounded-l-2xl border-0",
            ]}
            style:border-color="color-mix(in srgb, var(--signature-color) 30%, transparent)">
            {#if profile_state.busy_fields.has("generating-image")}
              <Shimmer color={signature_color || "var(--color-electric-cyan)"} class="rounded-[inherit]" />
            {/if}
            <Avatar {...entity_avatar_props(profile_state.char)} contain={true} landscape={is_fractal} />
          </div>

          {#if is_fractal && !is_mobile}
            <div class="absolute right-8 -bottom-16 z-30 flex flex-col items-end gap-tight">
              {#each fractal_styles as style_cfg (style_cfg.key)}
                {#if profile_state.is_editing || !style_cfg.is_default}
                  <Dropdown
                    bind:value={profile_state.char[style_cfg.key]}
                    items={style_cfg.items}
                    label={style_cfg.aria_label}
                    matchWidth={false}
                    dropdownWidth="w-80"
                    align="center"
                    disabled={!profile_state.is_editing}
                    variant="bare"
                    class="block cursor-pointer p-0 outline-none data-disabled:cursor-default"
                    trigger_style="width: 8.5rem; height: 8.5rem;"
                    onchange={() => profile_state.mark_mutated()}>
                    {#snippet trigger_content({ selected_item })}
                      <StyleTile tile={style_cfg.active} {signature_color} tooltip_text={selected_item?.tooltip} class="size-full transform-gpu rounded-xl" />
                    {/snippet}
                  </Dropdown>
                {/if}
              {/each}
            </div>
          {/if}
        </div>

        <!-- Scrollable Body + Sticky Frosted Footer -->
        <div
          bind:this={info_container_el}
          class={[
            "flex min-h-0 min-w-0 flex-1 scrollbar-none scrollbar-track-transparent flex-col gap-standard overflow-x-clip overflow-y-auto pt-standard transition-opacity duration-fast ease-out",
            content_dipping && !motion.is_reduced && "opacity-0",
          ]}>
          <header
            data-testid="profile-header"
            class={["flex min-h-10 w-full min-w-0 shrink-0 flex-col gap-tight px-standard", is_fractal && !is_mobile && "pr-44 pl-10"]}>
            <!-- ignore-next-line -->
            <!-- normalize shield: h1 font-size/margin MUST be inline - platform normalize.css v3 (unlayered h1{font-size:2em;margin:.67em 0}) beats all layered Tailwind (see check-typography.mjs rule 1 carve-out) -->
            <h1
              class={["w-full min-w-0 text-[clamp(3rem,7vw,6rem)] leading-[1.1] text-balance", is_fractal ? "text-left" : "text-right"]}
              style="/* stylelint-disable-next-line property-disallowed-list */
              color: {signature_color}; filter: drop-shadow(0 4px 16px rgb(0 0 0 / 0.4)); font-size: clamp(3rem, 7vw, 6rem); margin: 0;">
              {#if profile_state.is_editing}
                <span class="glass-input" data-expanded={profile_state.active_field?.key === "name"} style:--signature-color={signature_color}>
                  <input
                    bind:this={name_input}
                    value={profile_state.draft_name ?? profile_state.char.name ?? ""}
                    aria-label={PROFILE_FIELDS.name.label}
                    class="z-20 box-border w-full border-none bg-transparent p-standard text-inherit outline-none"
                    oninput={(e) => {
                      profile_state.draft_name = e.currentTarget.value;
                      profile_state.identity_error = "";
                      profile_state.mark_mutated();
                    }}
                    onfocus={() => profile_state.set_active_field("name", PROFILE_FIELDS.name.label)}
                    onblur={() => {
                      if (!profile_state.commit_draft_name()) profile_state.identity_error = "Name is required.";
                      profile_state.set_active_field("", "");
                    }} />
                </span>
              {:else}
                {(profile_state.char.name ?? "").trim()}
              {/if}
            </h1>

            {#if profile_state.is_editing}
              <div class="glass-input" data-expanded={profile_state.active_field?.key === "description"} style:--signature-color={signature_color}>
                <textarea
                  class="z-20 m-0 max-h-[calc(var(--spacing-row-unit)*4)] min-h-row-unit w-full resize-none [scrollbar-color:color-mix(in_srgb,var(--signature-color)_40%,var(--color-gunmetal))_transparent] border-none bg-transparent p-standard text-left type-body [text-wrap:auto] text-frisk outline-none placeholder:text-slate-400 placeholder:italic placeholder:opacity-60 [&::-webkit-scrollbar]:h-[calc(var(--spacing-unit)*2)] [&::-webkit-scrollbar]:w-[calc(var(--spacing-unit)*2)] [&::-webkit-scrollbar-thumb]:rounded-standard [&::-webkit-scrollbar-thumb]:bg-[color-mix(in_srgb,var(--signature-color)_40%,var(--color-gunmetal))] hover:[&::-webkit-scrollbar-thumb]:bg-[color-mix(in_srgb,var(--signature-color)_60%,var(--color-frisk))] [&::-webkit-scrollbar-track]:bg-transparent"
                  placeholder={PROFILE_FIELDS.description?.description || PROFILE_FIELDS.description?.label}
                  bind:value={profile_state.char.description}
                  use:auto_resize
                  onfocus={() => profile_state.set_active_field("description", PROFILE_FIELDS.description.label)}
                  onblur={() => profile_state.set_active_field("", "")}></textarea>
              </div>
            {:else if profile_state.char.description}
              <p class={["m-0 type-body text-balance whitespace-pre-wrap text-slate-200 opacity-90", is_fractal ? "text-left" : "text-right"]}>
                {profile_state.char.description}
              </p>
            {/if}
          </header>

          {#if is_fractal && is_mobile}
            {#each fractal_styles as style_cfg (style_cfg.key)}
              {#if profile_state.is_editing || !style_cfg.is_default}
                <div class="mt-tight flex w-full flex-col gap-tight px-standard">
                  <span class="type-uppercase-label text-slate-400">{style_cfg.label}</span>
                  {#if profile_state.is_editing}
                    <Dropdown
                      bind:value={profile_state.char[style_cfg.key]}
                      items={style_cfg.items}
                      label={style_cfg.aria_label}
                      matchWidth={style_cfg.match_width_mobile}
                      class="w-full max-w-sm"
                      onchange={() => profile_state.mark_mutated()} />
                  {:else}
                    <span class="cursor-default type-body text-slate-300 italic" use:tooltip={`${style_cfg.active.name}: ${style_cfg.active.description}`}>
                      {style_cfg.active.name}
                    </span>
                  {/if}
                </div>
              {/if}
            {/each}
          {/if}

          <section
            data-testid="profile-fragments"
            class={["min-w-0 grow px-standard", is_mobile ? "flex flex-col gap-standard" : "grid items-center gap-x-tight gap-y-standard"]}
            style:grid-template-columns={is_mobile ? undefined : "2rem 1fr"}>
            {#each active_sections as section (section.id)}
              {@render SectionLabel(section.id, section.label, section.fields[0]?.key)}

              <div class={["my-auto grid min-w-0 items-stretch gap-standard", section.fields.length === 2 ? "grid-cols-2" : "grid-cols-1"]}>
                {#each section.fields as field (field.key)}
                  {@const field_id = `field-${field.key.replace(".", "-")}`}
                  {@const raw = normalize_field_value(profile_state.get_safe_value(field.key))}
                  {@const parsed = parse_bracket_field(raw)}
                  <div class="relative flex h-full w-full min-w-0 flex-col gap-tight">
                    {#if field.column_label}
                      <Label class="justify-center drop-shadow-md" style="color: var(--signature-color);" disabled={!profile_state.is_editing} for={field_id}>
                        {field.column_label}
                      </Label>
                    {/if}

                    {#snippet bracketed_content()}
                      <BracketList record={parsed} owner={profile_state.char} entities={session.display_entities} on_select={(ent) => app.open_profile(ent)} />
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
                            class={[
                              "block max-w-full truncate type-interact whitespace-nowrap text-pure-white opacity-80",
                              field.description ? "cursor-help" : "cursor-default",
                            ]}
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
                            aria-label={`Enhance ${field.label || section.label || "field"} with AI`}
                            actions={[tooltip]}
                            disabled={profile_state.busy_fields.has(field.key) || !profile_state.get_safe_value(field.key)}
                            onclick={() => profile_state.enhance(field.key, profile_state.get_safe_value(field.key))}
                            class={[
                              "text-white/70 transition duration-200 hover:text-white",
                              profile_state.active_field?.key === field.key ? "opacity-100" : "opacity-0 group-data-[expanded=true]/textfield:opacity-100",
                            ]}>
                            <Icon name="ai_enhance" class="size-icon-small" />
                          </Button>
                        {/if}
                      {/snippet}
                    </TextField>

                    {#if should_show_bracket_tip(field.key, raw)}
                      <p
                        class="m-0 flex items-center gap-tight rounded-md border border-cyan-500/20 bg-cyan-950/20 px-tight py-1 text-xs text-cyan-300/80"
                        transition:fade={{ duration: 150 }}>
                        <span class="shrink-0 type-uppercase-label text-cyan-400">Tip</span>
                        <span
                          >The engine reasons best with multiple bracketed directives <code class="text-cyan-200">[KEY: value]</code> or distinct lines.</span>
                      </p>
                    {/if}
                  </div>
                {/each}
              </div>
            {/each}

            {@render SectionLabel("relationships", "Relationships")}

            <div class="min-w-0">
              <RelationalGraph entity={profile_state.char} on_select_entity={(selected) => selected && app.open_profile(selected)} />
            </div>
          </section>

          <!-- Sticky Frosted Footer: Unified Readonly & Edit Geometry -->
          <footer
            class={[
              "sticky bottom-0 z-30 mt-auto flex shrink-0 items-center justify-between gap-tight overflow-hidden px-standard py-standard",
              is_mobile && "flex-wrap",
            ]}>
            <!-- Mirrored photographic frost backdrop -->
            <div aria-hidden="true" class="pointer-events-none absolute inset-0 z-0 flex overflow-hidden select-none">
              {#if profile_state.char.profile_picture}
                {#each [0, 1, 2, 3, 4, 5] as tile (tile)}
                  <img
                    src={profile_state.char.profile_picture}
                    alt=""
                    draggable={false}
                    class={[
                      "h-full min-w-0 flex-1 object-cover object-bottom opacity-70 blur-2xl saturate-200",
                      tile % 2 === 0 ? "scale-125" : "scale-[-1.25_1.25]",
                    ]} />
                {/each}
              {/if}
              <div
                class="absolute inset-0 backdrop-blur-lg"
                style:background={!is_fractal && !is_mobile ?
                  "linear-gradient(to right, transparent 0%, color-mix(in srgb, var(--color-glass-sunken) 65%, transparent) 35%, color-mix(in srgb, var(--color-glass-sunken) 65%, transparent) 100%)"
                : "color-mix(in srgb, var(--color-glass-sunken) 65%, transparent)"}>
              </div>
            </div>

            <!-- Left: Single Unified @ID · POV Pill -->
            <div class={["relative z-10 flex min-w-0 flex-col gap-1", !is_mobile && "ml-[calc(2rem+var(--spacing-tight))]"]}>
              {#if profile_state.is_editing || profile_state.char.id}
                <div
                  class={[
                    "inline-flex max-w-full items-center gap-tight rounded-md border bg-black/25 px-2.5 py-1 type-uppercase-label whitespace-nowrap transition-colors",
                    profile_state.identity_error ? "border-red-400/60" : "border-white/10",
                    profile_state.is_editing && "focus-within:border-white/35",
                  ]}>
                  <span class="inline-flex min-w-0 items-center" style:color={signature_color}>
                    <span aria-hidden="true">@</span>
                    {#if profile_state.is_editing}
                      <input
                        type="text"
                        value={profile_state.draft_id ?? profile_state.char.id ?? ""}
                        placeholder="SLUG"
                        maxlength="36"
                        size={Math.max(4, (profile_state.draft_id ?? profile_state.char.id ?? "").length)}
                        aria-label={PROFILE_FIELDS.id.label}
                        use:tooltip={PROFILE_FIELDS.id.description}
                        class="field-sizing-content max-w-36 min-w-6 border-none bg-transparent p-0 text-inherit uppercase outline-none placeholder:text-slate-500"
                        oninput={(e) => {
                          profile_state.draft_id = e.currentTarget.value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 36);
                          profile_state.identity_error = "";
                          profile_state.mark_mutated();
                        }}
                        onfocus={() => profile_state.set_active_field("id", PROFILE_FIELDS.id.label)}
                        onblur={() => {
                          if (!profile_state.commit_draft_id()) profile_state.identity_error = "ID must be 2–36 chars (A–Z, a–z, 0–9, _ or -).";
                          profile_state.set_active_field("", "");
                        }} />
                    {:else}
                      <span class="cursor-help" use:tooltip={PROFILE_FIELDS.id.description}>{profile_state.char.id.toUpperCase()}</span>
                    {/if}
                  </span>

                  <span aria-hidden="true" class="text-slate-500">·</span>

                  <button
                    type="button"
                    aria-label={PROFILE_FIELDS.pov.label}
                    aria-disabled={!profile_state.is_editing}
                    tabindex={profile_state.is_editing ? 0 : -1}
                    use:tooltip={PROFILE_FIELDS.pov.description}
                    class={[
                      "border-none bg-transparent p-0 type-uppercase-label transition-colors outline-none",
                      profile_state.is_editing ?
                        "cursor-pointer text-white hover:text-(--signature-color) focus-visible:underline"
                      : "cursor-help text-slate-300",
                    ]}
                    onclick={() => {
                      if (!profile_state.is_editing) return;
                      profile_state.char.pov = profile_state.char.pov === "3rd_person" ? "1st_person" : "3rd_person";
                      profile_state.mark_mutated();
                    }}
                    onfocus={() => profile_state.is_editing && profile_state.set_active_field("pov", PROFILE_FIELDS.pov.label)}
                    onblur={() => profile_state.set_active_field("", "")}>
                    {profile_state.char.pov === "1st_person" ? "1st person" : "3rd person"}
                  </button>
                </div>
              {/if}

              {#if profile_state.is_editing && profile_state.identity_error}
                <p role="alert" class="m-0 type-data text-red-300/95">{profile_state.identity_error}</p>
              {/if}
            </div>

            <!-- Right: Action Controls -->
            <div class="relative z-10 ml-auto flex shrink-0 items-center gap-tight">
              {#if profile_state.is_editing}
                <Button
                  variant="secondary"
                  square={true}
                  actions={[tooltip]}
                  aria-label="Enhance Profile with AI - overwrites all fields (macros preserved)"
                  disabled={profile_state.is_saving || profile_state.busy_fields.size > 0}
                  onclick={() => profile_state.enhance_profile(entity_type)}
                  class="touch-target-coarse">
                  <Icon name="ai_enhance" class={["size-5", Array.from(profile_state.busy_fields).some((f) => f !== "visual-prompt") && "animate-pulse"]} />
                </Button>
                <Button
                  variant="secondary"
                  square={true}
                  actions={[tooltip]}
                  aria-label={`Export ${is_fractal ? "Fractal" : "Character"} (V2 Card or RPGlitch JSON)`}
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
                  onclick={() => profile_state.cancel()}
                  class="touch-target-coarse">
                  <Icon name="reset" class="size-5" />
                </Button>
                <span aria-hidden="true" class="mx-0.5 h-5 w-px bg-white/10"></span>
                <Button
                  variant="danger"
                  square={true}
                  actions={[tooltip]}
                  aria-label="Delete this entity"
                  onclick={() => (profile_state.show_delete_confirm = true)}
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
                  onclick={enter_edit_mode}
                  class="touch-target-coarse">
                  <Icon name="edit" class="size-5" />
                </Button>
              {/if}
            </div>
          </footer>
        </div>
      </article>

      <!-- Wing Container stays in DOM to animate exit -->
      <aside
        data-wings-container
        bind:this={wings_ref}
        style:pointer-events={has_wings ? "auto" : "none"}
        class={[
          "relative isolate z-0 flex scrollbar-none gap-standard [&::-webkit-scrollbar]:hidden",
          is_mobile ?
            "col-span-full w-full flex-row items-start overflow-x-auto px-standard"
          : "col-[9/12] row-start-1 min-h-0 flex-col items-center justify-center-safe overflow-y-auto",
        ]}>
        {#if profile_state.is_editing}
          <div class={wing_card_class} transition:fade={{ duration: 250 }}>
            <VisualWing {profile_state} />
          </div>
          <div
            class={[wing_card_class, "flex flex-col gap-standard", is_mobile && "max-h-[65dvh] scrollbar-none overflow-y-auto pb-standard"]}
            transition:fade={{ duration: 250 }}>
            <AudioWing {profile_state} />
            {#if app.settings.dev_mode}
              <DevWing {profile_state} />
            {/if}
          </div>
        {:else if app.settings.dev_mode}
          <div class={wing_card_class}>
            <DevWing {profile_state} />
          </div>
        {/if}
      </aside>
    </div>
  </Modal>
{/if}

{#snippet SectionLabel(id, label, first_field_key = "")}
  <h6
    data-section={id}
    class={[
      "my-auto flex w-full min-w-0 items-center justify-center text-center transition-colors duration-standard",
      !is_mobile && "rotate-180 [text-orientation:mixed] [writing-mode:vertical-rl]",
    ]}
    style="color: var(--signature-color); text-shadow: none;">
    {#if profile_state.is_editing && first_field_key}
      <!-- ignore-next-line -->
      <button
        type="button"
        class="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[length:inherit] leading-[inherit] tracking-[inherit] text-inherit uppercase outline-none focus-visible:underline"
        onclick={() => document.getElementById(`field-${first_field_key.replace(".", "-")}`)?.focus()}>
        {label}
      </button>
    {:else}
      {label}
    {/if}
  </h6>
{/snippet}

{#snippet inline_macro_text(text)}
  <MacroText {text} owner={profile_state.char} entities={session.display_entities} on_select={(ent) => app.open_profile(ent)} />
{/snippet}
