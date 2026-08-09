<script>
  /**
   * @file src/ui/profile/Profile.svelte
   * 🧪 ENTITY EDITOR — Primary orchestrator for viewing and editing entities.
   * Flat DOM · Bolted Architecture
   */
  import { auto_resize, click_outside } from "@ui";
  import { safe_parse_pseudo_json } from "@utils";
  import { Button, Modal, TextField, Toggle, tooltip, Dropdown, Label } from "@primitives";
  import { ProfilePicture } from "@image";
  import { get_signature_color } from "@media";
  import { Dialog } from "@primitives";
  import AudioWing from "./AudioWing.svelte";
  import DevWing from "./DevWing.svelte";
  import VisualWing from "./VisualWing.svelte";
  import { ProfileState } from "./Profile.svelte.js";
  import Vectors from "./Vectors.svelte";
  import Header from "./Header.svelte";
  import { app, runtime, simulation_state } from "@state";
  import { fade } from "svelte/transition";
  import { NARRATIVE_STYLES, VISUAL_STYLES, PROFILE_SECTIONS_BY_TYPE } from "@data";
  import { get_style_initials } from "@utils";

  /** @type {{ entity_type?: "character" | "fractal" }} */
  let { entity_type = "character" } = $props();

  // --- ORCHESTRATION ---
  const profile_state = new ProfileState();
  /** @type {HTMLElement | undefined} */
  let footer_el = $state();
  /** @type {HTMLElement | undefined} */
  let info_container_el = $state();
  let previous_scroll_top = $state(0);

  // --- DEVMODE LIVE TELEMETRY SYNC ---
  $effect(() => {
    // Keeps the Profile modal Dev Wing synced with live background engine changes
    if (app.settings.dev_mode && profile_state.char?.id) {
      const live_entity = [runtime.character, runtime.active_user, runtime.active_fractal].find((e) => e && e.id === profile_state.char.id);
      if (live_entity?.dynamics && profile_state.char.dynamics) {
        Object.assign(profile_state.char.dynamics, live_entity.dynamics);
      }
    }
  });

  // --- DERIVED ---
  const signature_color = $derived(get_signature_color(profile_state.char, "var(--color-gunmetal)"));

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
    "flex min-w-0 flex-1 flex-col p-4 pb-0 gap-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent",
  );

  const main_layout_class = $derived("grow p-0");

  const footer_layout_class = $derived(
    "flex shrink-0 gap-4 pb-4 outline-none " + (app.viewport.mobile ? "w-full flex-col items-stretch" : "justify-end"),
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
        profile_state._user_mutated = true;
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
      target.closest("[data-modal-backdrop='lightbox']")
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
</script>

<svelte:window
  onkeydown={(e) => {
    if (!profile_state.char?.id || profile_state.show_delete_confirm) return;
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

{#if profile_state.char?.id}
  <Dialog
    type="confirm"
    bind:open={profile_state.show_delete_confirm}
    title="Delete {profile_state.char.name || 'Entity'}"
    message="This action is irreversible. All associated data, including history and memories, will be lost."
    confirm_label="Confirm"
    on_confirm={() => profile_state.delete(entity_type)}
  />

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
            class={[profile_pic_wrapper_class, "flex appearance-none items-center justify-center p-0 outline-none", "cursor-default"]}
            style="border-color: color-mix(in srgb, var(--signature-color) 30%, transparent); background: transparent;"
            disabled
          >
            <ProfilePicture entity={profile_state.char} contain={true} landscape={entity_type !== "character"} />
          </Button>
          {#if entity_type === "fractal" && !app.viewport.mobile}
            {@const is_default_style = !profile_state.char.narrative_style || profile_state.char.narrative_style === "default"}
            {@const is_default_visual = !profile_state.char.visual_style || profile_state.char.visual_style === "none"}
            <div class="absolute right-8 -bottom-16 z-30 flex flex-col items-end gap-3">
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
                  class="group/stylecard flex transform-gpu cursor-pointer flex-col items-center overflow-hidden rounded-xl border border-solid bg-black/40 text-white uppercase shadow-lg outline-none {profile_state.is_editing
                    ? 'hover:brightness-110'
                    : ''} disabled:cursor-default data-disabled:cursor-default"
                  trigger_style="width: 8.5rem; height: 8.5rem; border-color: {signature_color};"
                >
                  {#snippet trigger_content({ selected_item })}
                    <div
                      class="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[inherit] font-heading text-lg font-bold select-none"
                      style="background-color: {signature_color};"
                      use:tooltip={profile_state.is_editing ? undefined : selected_item?.tooltip}
                    >
                      {#if selected_item?.portrait}
                        <img
                          src={selected_item.portrait}
                          alt={selected_item.label}
                          class="h-full w-full object-cover object-center"
                          draggable="false"
                        />
                      {:else}
                        {get_style_initials(selected_item?.label || "No Narrative Style")}
                      {/if}
                    </div>

                    {#if profile_state.is_editing}
                      <div
                        class="absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-[inherit] bg-black/0 opacity-0 backdrop-blur-sm transition-opacity group-hover/stylecard:opacity-100"
                      >
                        <span class="text-[10px] font-bold tracking-widest">NARRATIVE STYLE</span>
                      </div>
                    {/if}
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
                  class="group/visualcard flex transform-gpu cursor-pointer flex-col items-center overflow-hidden rounded-xl border border-solid bg-black/40 text-white uppercase shadow-lg outline-none {profile_state.is_editing
                    ? 'hover:brightness-110'
                    : ''} disabled:cursor-default data-disabled:cursor-default"
                  trigger_style="width: 8.5rem; height: 8.5rem; border-color: {signature_color};"
                  onchange={() => (profile_state._user_mutated = true)}
                >
                  {#snippet trigger_content({ selected_item })}
                    {@const vname = selected_item?.label || "No Visual Style"}
                    {@const vfontsize = vname.length > 12 ? "text-[8px]" : vname.length > 8 ? "text-[9px]" : "text-[10px]"}
                    <div
                      class="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[inherit] text-center font-heading {vfontsize} leading-tight font-bold tracking-tighter wrap-break-word hyphens-auto select-none"
                      style="background-color: {signature_color};"
                      use:tooltip={profile_state.is_editing ? undefined : selected_item?.tooltip}
                    >
                      {#if selected_item?.portrait}
                        <img
                          src={selected_item.portrait}
                          alt={selected_item.label}
                          class="h-full w-full object-cover object-center"
                          draggable="false"
                        />
                      {:else}
                        {vname}
                      {/if}
                    </div>

                    {#if profile_state.is_editing}
                      <div
                        class="absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-[inherit] bg-black/0 opacity-0 backdrop-blur-sm transition-opacity group-hover/visualcard:opacity-100"
                      >
                        <span class="text-[10px] font-bold tracking-widest">VISUAL STYLE</span>
                      </div>
                    {/if}
                  {/snippet}
                </Dropdown>
              {/if}
            </div>
          {/if}
        </div>

        <div class={info_container_class} bind:this={info_container_el}>
          <Header
            bind:name={profile_state.char.name}
            bind:description={profile_state.char.description}
            is_editing={profile_state.is_editing}
            active_field={profile_state.active_field?.key}
            {signature_color}
            {entity_type}
            class={entity_type === "fractal" && !app.viewport.mobile ? "pr-44 pl-10" : ""}
            on_focus_field={(/** @type {string} */ key, /** @type {string} */ label) => profile_state.set_active_field(key, label)}
          />

          {#if entity_type === "fractal" && app.viewport.mobile}
            {@const active_style = NARRATIVE_STYLES[profile_state.char.narrative_style] || NARRATIVE_STYLES.default}
            {@const is_default_style = !profile_state.char.narrative_style || profile_state.char.narrative_style === "default"}
            {#if profile_state.is_editing || !is_default_style}
              <div class="mt-2 flex w-full flex-col gap-1">
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
            {@const active_vstyle = VISUAL_STYLES[profile_state.char.visual_style] || VISUAL_STYLES.none}
            {@const is_default_vstyle = !profile_state.char.visual_style || profile_state.char.visual_style === "none"}
            {#if profile_state.is_editing || !is_default_vstyle}
              <div class="mt-2 flex w-full flex-col gap-1">
                <span class="text-[10px] font-bold tracking-widest text-slate-400 uppercase"> Visual Style (Story Exclusive) </span>
                {#if profile_state.is_editing}
                  <div class="relative flex w-full max-w-sm rounded-md">
                    <Dropdown
                      bind:value={profile_state.char.visual_style}
                      items={visual_style_options}
                      label="Select Visual Style"
                      uppercase={false}
                      matchWidth={true}
                      onchange={() => (profile_state._user_mutated = true)}
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

          <footer bind:this={footer_el} tabindex="-1" class={footer_layout_class}>
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
    {#each active_sections as section (section.id)}
      {@const array_field = section.fields.find((/** @type {any} */ f) => f.type === "array")}

      <div
        class={get_section_class()}
        style:border-color={app.viewport.mobile ? "color-mix(in srgb, var(--signature-color) 30%, transparent)" : undefined}
        data-section={section.id}
        onclick={() => {
          if (array_field) {
            profile_state.add_vector_item(array_field.key);
          } else if (profile_state.is_editing && section.fields.length > 0) {
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
            {#if profile_state.is_editing && profile_state.hovered_section === section.id && array_field}
              <span
                class="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-base tracking-widest text-white"
                style:animation="add-hint-fade var(--motion-elastic) forwards">+</span
              >
            {/if}
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
          <div class="relative flex h-full w-full min-w-0 flex-col items-stretch justify-stretch gap-2">
            {#if field.type === "array"}
              <Vectors
                state={profile_state}
                path={field.key}
                sublabel={field.sublabel || field.label}
                description={field.description}
                {signature_color}
              />
            {:else}
              {@const field_id = `field-${field.key.replace(".", "-")}`}
              {@const raw = profile_state.get_safe_value(field.key) || ""}
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

              {#if field.label}
                <Label
                  class="justify-center drop-shadow-md"
                  style="color: var(--signature-color);"
                  disabled={!profile_state.is_editing}
                  for={field_id}>{field.label}</Label
                >
              {/if}

              {#if !profile_state.is_editing && parsed}
                <div
                  id={field_id}
                  class="relative flex h-full min-h-20 w-full flex-col overflow-hidden rounded-xl border border-transparent transition-all duration-300"
                  role="region"
                  aria-label={field.sublabel || field.label}
                  use:auto_resize={{ sync_id: section.label }}
                  data-sync-id={section.label}
                >
                  {#if field.sublabel || field.label}
                    <header
                      style="position: relative; top: 0; z-index: 10; display: flex !important; align-items: center !important; justify-content: space-between !important; border-radius: 0.75rem; background-color: var(--color-dev-accent) !important; padding: 0.175rem 0.75rem; opacity: 1 !important; min-height: 1.5rem !important; height: auto !important; --color-dev-accent: {signature_color};"
                      class="w-full"
                    >
                      <div
                        style="margin-right: 0.5rem; display: flex !important; align-items: center !important; flex: 1 1 0% !important; min-width: 0; overflow: hidden;"
                      >
                        <span
                          class="block max-w-full cursor-default truncate font-sans text-xs font-normal tracking-normal whitespace-nowrap text-white opacity-90"
                          use:tooltip
                          aria-label={field.description}>{field.sublabel || field.label}</span
                        >
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
                          {#if v && String(v).trim()}
                            <div
                              class="flex min-w-23.75 grow flex-col items-start gap-0.5 rounded-xl border border-(--signature-color)/15 bg-(--signature-color)/5 px-2.5 py-1.5"
                            >
                              <span class="text-left font-mono text-[10px] font-bold tracking-wider text-(--signature-color) uppercase opacity-85"
                                >{k}</span
                              >
                              <span class="text-left text-xs leading-normal text-slate-200">
                                {@render RenderFormattedValue(String(v))}
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
                  oninput={(e) => profile_state.set_field_value(field.key, e.target.value)}
                  busy={profile_state.busy_fields.has(field.key)}
                  onfocus={() => profile_state.set_active_field(field.key, field.label || section.label)}
                >
                  {#snippet status()}
                    {#if field.sublabel}
                      <span
                        class="block max-w-full cursor-default truncate font-sans text-xs font-normal tracking-normal whitespace-nowrap text-white opacity-80"
                        use:tooltip
                        aria-label={field.description}>{field.sublabel}</span
                      >
                    {/if}
                  {/snippet}

                  {#snippet header_actions()}
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
              {/if}
            {/if}
          </div>
        {/each}
      </div>
    {/each}

    {#if entity_type !== "fractal"}
      <div class="col-start-2 mt-0 flex w-full flex-col items-center gap-1.5 py-1">
        <Label for="perspective-toggle" class="justify-center" disabled={!profile_state.is_editing}>Perspective</Label>
        <div class="flex w-full items-center justify-center gap-3">
          <Button
            variant="bare"
            class="{profile_state.is_editing ? 'cursor-pointer' : 'cursor-default'} text-xs font-medium transition-colors select-none {profile_state
              .char.pov === '1st_person'
              ? 'font-semibold text-slate-100'
              : 'text-slate-400 hover:text-slate-200'}"
            disabled={!profile_state.is_editing}
            onclick={() => {
              if (profile_state.is_editing) {
                profile_state.char.pov = "1st_person";
                profile_state._user_mutated = true;
              }
            }}
          >
            1st Person
          </Button>
          <Toggle
            id="perspective-toggle"
            value={profile_state.char.pov === "3rd_person"}
            disabled={!profile_state.is_editing}
            always_signature={true}
            style="--signature-color: {signature_color};"
            onchange={() => {
              profile_state.char.pov = profile_state.char.pov === "3rd_person" ? "1st_person" : "3rd_person";
              profile_state._user_mutated = true;
            }}
          />
          <Button
            variant="bare"
            class="{profile_state.is_editing ? 'cursor-pointer' : 'cursor-default'} text-xs font-medium transition-colors select-none {profile_state
              .char.pov === '3rd_person'
              ? 'font-semibold text-slate-100'
              : 'text-slate-400 hover:text-slate-200'}"
            disabled={!profile_state.is_editing}
            onclick={() => {
              if (profile_state.is_editing) {
                profile_state.char.pov = "3rd_person";
                profile_state._user_mutated = true;
              }
            }}
          >
            3rd Person
          </Button>
        </div>
      </div>
    {/if}
  </div>
{/snippet}

{#snippet RenderChoiceNodes(nodes)}
  {#each nodes as part, i (i)}
    {#if part.is_var}
      <span
        class="mx-0.5 inline-flex flex-wrap items-center gap-1 rounded border border-dashed border-(--signature-color)/25 bg-(--signature-color)/5 px-1.5 py-0.5 font-mono text-[11px] text-slate-300"
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
  {@render RenderChoiceNodes(parse_variants(val_str))}
{/snippet}

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

  @keyframes add-hint-fade {
    0% {
      opacity: var(--opacity-none);
      transform: scale(0.6);
    }

    100% {
      opacity: var(--opacity-solid);
      transform: scale(1);
    }
  }
</style>
