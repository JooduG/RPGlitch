<script>
  /**
   * @file src/ui/organisms/Profile.svelte
   * 🧪 ENTITY EDITOR — Primary orchestrator for viewing and editing entities.
   * Flat DOM · Bolted Architecture
   */
  import { auto_resize, click_outside } from "@actions";
  import { Button, Modal, ProfilePicture, TextField, tooltip, Dropdown } from "@atoms";
  import { PROFILE_SECTIONS_BY_TYPE } from "@intelligence";
  import { get_signature_color } from "@media";
  import { AudioWing, DevWing, Dialog, VisualWing } from "@molecules";
  import { ProfileState, ProfileArray, ProfileHeader } from "@organisms";
  import { app, runtime } from "@state";
  import { fade } from "svelte/transition";
  import { NARRATIVE_STYLES } from "@data";

  const get_style_initials = (name) => {
    if (!name || name === "No Narrative Style") return "?";
    return name
      .split(/[\s_-]+/)
      .map((w) => w.charAt(0))
      .join("")
      .slice(0, 3)
      .toUpperCase();
  };

  /** @type {{ entity_type?: "character" | "fractal" }} */
  let { entity_type = "character" } = $props();

  // --- ORCHESTRATION ---
  const profileState = new ProfileState();
  /** @type {HTMLElement | undefined} */
  let footer_el = $state();

  // Local safety interlock rune for unsaved changes
  let show_close_confirm = $state(false);

  // --- DEVMODE LIVE TELEMETRY SYNC ---
  $effect(() => {
    // Keeps the Profile modal Dev Wing synced with live background engine changes
    if (app.settings.dev_mode && profileState.char?.id) {
      const live_entity = [runtime.character, runtime.active_user, runtime.active_fractal].find((e) => e && e.id === profileState.char.id);
      if (live_entity?.dynamics && profileState.char.dynamics) {
        Object.assign(profileState.char.dynamics, live_entity.dynamics);
      }
    }
  });

  // --- DERIVED ---
  const signature_color = $derived(get_signature_color(profileState.char, "var(--color-gunmetal)"));

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
      tag: style.tags ? style.tags.join(", ") : "",
      tooltip: style.tags ? style.tags.join(", ") : undefined,
    }));
  const has_wings = $derived(!app.transitioning_profile && !profileState.is_packing_up && (profileState.is_editing || app.settings.dev_mode));
  const active_sections = $derived(PROFILE_SECTIONS_BY_TYPE[entity_type] || PROFILE_SECTIONS_BY_TYPE.character);
  const target_morph_name = $derived.by(() => {
    if (!profileState.char?.id) return undefined;
    let type = "";
    if (app.selected_ai?.id === profileState.char.id) type = "ai";
    else if (app.selected_user?.id === profileState.char.id) type = "user";
    else if (app.selected_fractal?.id === profileState.char.id) type = "fractal";

    if (!type) return undefined;
    if (app.view === "storyboard") {
      return "card-slot-" + type;
    } else if (app.view === "storymode") {
      return "entity-morph-" + type;
    }
    return undefined;
  });

  // --- STYLELINT SAFE LAYOUT ENGINE STATES ---
  const main_card_class = $derived(
    "flex h-full overflow-hidden border border-solid transition-all duration-300 relative z-10 " +
      (app.viewport.mobile
        ? "col-span-full flex-col rounded-none "
        : (has_wings ? "modal-profile-grid-main" : "modal-profile-grid-flat") + " rounded-2xl ") +
      (entity_type === "fractal" ? "flex-col" : "flex-row"),
  );

  const avatar_container_class = $derived(
    "sticky top-0 z-20 flex shrink-0 items-stretch transition-all duration-300 " +
      (entity_type === "fractal" ? "h-12 min-h-64 w-full " : "h-full w-avatar-medium-size ") +
      (app.viewport.mobile ? "h-auto w-auto items-center justify-center" : ""),
  );

  const profile_pic_wrapper_class = $derived(
    "overflow-hidden border-solid transition-all duration-300 " +
      (entity_type === "fractal"
        ? "h-full w-full border-0 border-b " + (!app.viewport.mobile ? "rounded-t-2xl" : "rounded-none")
        : "h-full w-full border-0 border-r " + (!app.viewport.mobile ? "rounded-l-2xl" : "rounded-none")) +
      (app.viewport.mobile ? "h-avatar-medium-size w-avatar-medium-size border-spacing-border-width-base rounded-md" : ""),
  );

  const info_container_class = $derived(
    "flex min-w-0 flex-1 flex-col p-4 pb-0 gap-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent",
  );

  const main_layout_class = $derived("grow p-0");

  const footer_layout_class = $derived(
    "flex shrink-0 gap-4 pb-4 outline-none " + (app.viewport.mobile ? "w-full flex-col items-stretch" : "justify-end"),
  );

  const entity_body_class = $derived("min-w-0 " + (app.viewport.mobile ? "flex flex-col gap-4" : "grid gap-x-2 gap-y-4"));

  const entity_body_grid_cols = $derived(app.viewport.mobile ? undefined : "2rem 1fr");

  // --- MARKUP CONTEXT SANITIZERS ---
  const get_section_class = (arrayField) => {
    let cls = "relative flex min-w-0 flex-col items-center justify-center overflow-hidden text-center transition-all duration-300 ";
    cls += profileState.is_editing && arrayField ? "cursor-pointer " : "cursor-default ";
    if (app.viewport.mobile) cls += "pr-0";
    return cls;
  };

  const get_inner_section_style = (id) => {
    const shouldTranslate = id === "eternal" && !app.viewport.mobile;
    return shouldTranslate ? "transform: translateY(1rem);" : "";
  };

  const get_hint_span_class = () => {
    let cls = "pointer-events-none shrink-0 font-mono text-base tracking-widest whitespace-nowrap text-white ";
    if (app.viewport.mobile) cls += "text-center";
    return cls;
  };

  const get_label_span_class = () => {
    return app.viewport.mobile ? "" : "block rotate-180";
  };

  const get_fields_container_class = (fieldsLength) => {
    const base = "grid min-w-0 items-stretch gap-4 ";
    return base + (fieldsLength === 2 ? "grid-cols-2" : "grid-cols-1");
  };

  const get_ai_action_btn_class = (fieldKey) => {
    let cls = "text-slate-400 transition-all duration-200 hover:text-(--signature-color) ";
    cls += profileState.active_field?.key === fieldKey ? "opacity-100" : "opacity-0 group-data-[expanded=true]/textfield:opacity-100";
    return cls;
  };

  /**
   * Tokenizes string payloads to detect inline Perchance dynamic variable loops.
   * @param {string} str
   */
  const parseVariants = (str) => {
    if (!str) return [];
    const regex = /\{([^}]+)\}/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ isVar: false, text: str.slice(lastIndex, match.index) });
      }
      parts.push({ isVar: true, choices: match[1].split("|").map((c) => c.trim()) });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < str.length) {
      parts.push({ isVar: false, text: str.slice(lastIndex) });
    }
    return parts.length > 0 ? parts : [{ isVar: false, text: str }];
  };

  // --- EFFECTS ---
  $effect(() => profileState.sync());

  // Operational catchment tracking user DOM actions
  $effect(() => {
    if (profileState.is_editing) {
      const mark_mutated = () => {
        profileState._user_mutated = true;
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

    if (profileState.show_delete_confirm || show_close_confirm) return;
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

    if (profileState.is_dirty) {
      show_close_confirm = true;
      event.preventDefault();
      return;
    }

    event.preventDefault();
    profileState.handle_close();
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (!profileState.char?.id || profileState.show_delete_confirm || show_close_confirm) return;
    if (e.key === "Enter" && !e.shiftKey) {
      const target = /** @type {HTMLElement} */ (e.target);
      if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON" || target.isContentEditable) return;
      e.preventDefault();
      if (profileState.is_editing) {
        footer_el?.focus();
        profileState.save(entity_type);
      } else {
        footer_el?.focus();
        profileState.start_editing();
      }
    }
  }}
/>

{#if profileState.char?.id}
  <Dialog
    type="confirm"
    bind:open={profileState.show_delete_confirm}
    title="Delete {profileState.char.name || 'Entity'}"
    message="This action is irreversible. All associated data, including history and vectors, will be lost."
    confirm_label="Confirm"
    on_confirm={() => profileState.delete(entity_type)}
  />

  <Dialog
    type="confirm"
    bind:open={show_close_confirm}
    title="Discard Unsaved Changes?"
    message="You have unsaved edits. Closing will discard all modifications made during this editing session."
    confirm_label="Confirm"
    on_confirm={() => {
      show_close_confirm = false;
      profileState.handle_close();
    }}
  />

  <Modal
    variant="profile"
    on_close={() => {
      if (profileState.is_dirty) {
        show_close_confirm = true;
      } else {
        profileState.handle_close();
      }
    }}
    is_pass_through={true}
  >
    <div
      class={`m-auto grid w-grid-width grid-cols-12 transition-all duration-300 ${
        app.viewport.mobile ? (has_wings ? "h-auto grid-rows-[auto_auto] gap-y-4 pb-4" : "h-dvh grid-rows-1") : "my-auto h-[90dvh] grid-rows-1"
      }`}
      data-mobile={app.viewport.mobile}
      role="presentation"
    >
      <div
        class={main_card_class}
        style:animation={has_wings ? "main-card-slide-left var(--motion-elastic) forwards" : "main-card-slide-center var(--motion-elastic) forwards"}
        style:background-color="color-mix(in srgb, var(--signature-color) 1%, var(--color-glass-sunken))"
        style:border-color="color-mix(in srgb, var(--signature-color) 30%, transparent)"
        style:backdrop-filter="var(--blur-mist)"
        style:--signature-color={signature_color}
        style:--scrollbar-thumb="color-mix(in srgb, var(--signature-color) 40%, var(--color-gunmetal))"
        style:--scrollbar-thumb-hover="color-mix(in srgb, var(--signature-color) 60%, var(--color-frisk))"
        style:view-transition-name={target_morph_name}
        use:click_outside={handle_click_outside}
      >
        <div class={avatar_container_class + " relative"}>
          <button
            class={[
              profile_pic_wrapper_class,
              "flex appearance-none items-center justify-center p-0 outline-none",
              profileState.is_editing && profileState.char?.profile_picture
                ? "cursor-pointer transition-[filter] duration-200 hover:brightness-110"
                : "cursor-default",
            ]}
            style:border-color="color-mix(in srgb, var(--signature-color) 30%, transparent)"
            style:background="transparent"
            disabled={!profileState.is_editing || !profileState.char?.profile_picture}
            onclick={() => {
              if (profileState.is_editing && profileState.char?.profile_picture) {
                app.open_image_preview({
                  src: profileState.char.profile_picture,
                  metadata: profileState.char.modifiers
                    ? {
                        prompt: profileState.char.modifiers.prompt,
                        negativePrompt: profileState.char.modifiers.negative_prompt,
                        seed: profileState.char.modifiers.last_generated_seed,
                      }
                    : null,
                  on_reroll: () => {
                    const modifiers = profileState.char.modifiers;
                    if (!modifiers || !modifiers.prompt) return;
                    profileState.busy_fields.add("visual-prompt");
                    app.log(`[Profile] Rerolling profile picture...`, "system");
                    app.visual
                      .generate(modifiers.prompt, {
                        mode: profileState.char.type,
                        no_background: profileState.noBackground,
                        negativePrompt: modifiers.negative_prompt || undefined,
                        seed: undefined, // Force a new random seed on reroll
                        returnPayload: true,
                      })
                      .then((payload) => {
                        if (payload?.url) {
                          profileState.char.profile_picture = payload.url;
                          if (payload.metadata?.seed !== undefined) {
                            modifiers.last_generated_seed = payload.metadata.seed;
                          }
                        }
                      })
                      .catch((err) => {
                        app.log(`Generation failed: ${err.message}`, "error");
                      })
                      .finally(() => {
                        profileState.busy_fields.delete("visual-prompt");
                      });
                  },
                });
              }
            }}
          >
            <ProfilePicture entity={profileState.char} contain={true} landscape={entity_type !== "character"} />
          </button>
          {#if entity_type === "fractal" && !app.viewport.mobile}
            {@const is_default_style = !profileState.char.narrative_style || profileState.char.narrative_style === "default"}
            {#if profileState.is_editing || !is_default_style}
              <Dropdown
                bind:value={profileState.char.narrative_style}
                items={author_options}
                label="Select Narrative Style"
                uppercase={false}
                matchWidth={false}
                dropdownHeight="max-h-80"
                dropdownWidth="w-80"
                align="center"
                disabled={!profileState.is_editing}
                trigger_class="group/stylecard absolute right-8 -bottom-10 z-30 flex cursor-pointer flex-col items-center overflow-hidden transform-gpu rounded-xl border border-solid bg-black/40 shadow-lg outline-none {profileState.is_editing
                  ? 'hover:brightness-110'
                  : ''} disabled:pointer-events-none disabled:cursor-default"
                trigger_style="width: calc(var(--spacing-storyboard-character-card-width) * 0.5); height: calc(var(--spacing-storyboard-character-card-width) * 0.5); border-color: {signature_color};"
              >
                {#snippet trigger_content({ selected_item })}
                  <div
                    class="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[inherit] font-heading text-xl font-bold text-white uppercase select-none"
                    style="background-color: {signature_color};"
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

                  {#if profileState.is_editing}
                    <div
                      class="absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-[inherit] bg-black/0 opacity-0 backdrop-blur-sm transition-opacity group-hover/stylecard:opacity-100"
                    >
                      <span class="text-[10px] font-bold tracking-widest text-white uppercase">SWAP</span>
                    </div>
                  {/if}
                {/snippet}
              </Dropdown>
            {/if}
          {/if}
        </div>

        <div class={info_container_class}>
          <ProfileHeader
            bind:name={profileState.char.name}
            bind:description={profileState.char.description}
            is_editing={profileState.is_editing}
            active_field={profileState.active_field?.key}
            {signature_color}
            {entity_type}
            class={entity_type === "fractal" && !app.viewport.mobile ? "pl-10" : ""}
            on_focus_field={(/** @type {string} */ key, /** @type {string} */ label) => profileState.set_active_field(key, label)}
          />

          {#if entity_type === "fractal" && app.viewport.mobile}
            {@const active_style = NARRATIVE_STYLES[profileState.char.narrative_style] || NARRATIVE_STYLES.default}
            {@const is_default_style = !profileState.char.narrative_style || profileState.char.narrative_style === "default"}
            {#if profileState.is_editing || !is_default_style}
              <div class="mt-2 flex w-full flex-col gap-1">
                <span class="text-[10px] font-bold tracking-widest text-slate-400 uppercase"> Narrative Style </span>
                {#if profileState.is_editing}
                  <div class="relative flex w-full max-w-sm rounded-md">
                    <Dropdown
                      bind:value={profileState.char.narrative_style}
                      items={author_options}
                      label="Select Narrative Style"
                      uppercase={false}
                      matchWidth={false}
                      dropdownHeight="max-h-80"
                    />
                  </div>
                {:else}
                  <span class="text-sm text-slate-300 italic">
                    {active_style.name}
                  </span>
                {/if}
              </div>
            {/if}
          {/if}

          <main class={main_layout_class}>
            {@render EntityBody()}
          </main>

          <footer bind:this={footer_el} tabindex="-1" class={footer_layout_class}>
            {#if profileState.is_editing}
              <Button
                variant="primary"
                actions={[tooltip]}
                aria-label="Warning: Overwrites all fields using AI enhancement. Existing macros are preserved."
                disabled={profileState.is_saving || profileState.busy_fields.size > 0}
                onclick={() => {
                  footer_el?.focus();
                  profileState.enhance_profile(entity_type);
                }}
                class="touch-target-coarse"
              >
                {#if Array.from(profileState.busy_fields).some((f) => f !== "visual-prompt")}
                  <span class="animate-pulse">ENHANCING...</span>
                {:else}
                  Enhance Profile
                {/if}
              </Button>
              <Button
                variant="secondary"
                class="touch-target-coarse"
                onclick={() => {
                  footer_el?.focus();
                  profileState.save(entity_type);
                }}>Save</Button
              >
              <Button
                variant="danger"
                class="touch-target-coarse"
                onclick={() => {
                  footer_el?.focus();
                  profileState.show_delete_confirm = true;
                }}>Delete</Button
              >
            {:else}
              <Button
                variant="secondary"
                class="touch-target-coarse"
                onclick={() => {
                  footer_el?.focus();
                  profileState.start_editing();
                }}>Edit</Button
              >
            {/if}
          </footer>
        </div>
      </div>

      <!-- Wing Container stays in DOM to animate exit -->
      <aside
        data-wings-container
        class={"relative isolate z-0 flex scrollbar-none gap-4 [&::-webkit-scrollbar]:hidden " +
          (app.viewport.mobile ? "col-span-full w-full items-start overflow-x-visible" : "col-[9/12] flex-col items-center overflow-y-auto")}
        style:animation={has_wings && !app.viewport.mobile
          ? "wing-slide-out var(--motion-elastic) forwards"
          : !app.viewport.mobile
            ? "wing-slide-in var(--motion-elastic) forwards"
            : ""}
        style:pointer-events={has_wings ? "auto" : "none"}
      >
        <div class={"flex gap-4 " + (app.viewport.mobile ? "w-fit flex-row px-4" : "w-full flex-col")}>
          {#if profileState.is_editing}
            <div
              style={app.viewport.mobile ? "width: 85vw; flex-shrink: 0;" : ""}
              class={app.viewport.mobile ? "max-w-sm" : "w-full"}
              transition:fade={{ duration: 250 }}
            >
              <VisualWing {profileState} />
            </div>
            <div
              style={app.viewport.mobile ? "width: 85vw; flex-shrink: 0;" : ""}
              class={"flex flex-col gap-4 " + (app.viewport.mobile ? "max-h-[65vh] max-w-sm scrollbar-none overflow-y-auto pb-4" : "w-full")}
              transition:fade={{ duration: 250 }}
            >
              <AudioWing {profileState} />
              {#if app.settings.dev_mode}
                <DevWing {profileState} />
              {/if}
            </div>
          {:else if app.settings.dev_mode}
            <div style={app.viewport.mobile ? "width: 85vw; flex-shrink: 0;" : ""} class={app.viewport.mobile ? "max-w-sm" : "w-full"}>
              <DevWing {profileState} />
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
      {@const arrayField = section.fields.find((/** @type {any} */ f) => f.type === "array")}

      <div
        class={get_section_class(arrayField)}
        style:border-color={app.viewport.mobile ? "color-mix(in srgb, var(--signature-color) 30%, transparent)" : undefined}
        data-section={section.id}
        onclick={() => arrayField && profileState.add_vector_item(arrayField.key)}
        onmouseenter={() => (profileState.hovered_section = section.id)}
        onmouseleave={() => (profileState.hovered_section = null)}
        role="presentation"
      >
        <div class="flex w-full flex-col items-center" style={get_inner_section_style(section.id)}>
          <h6
            class="m-0 flex flex-col items-center justify-center text-center tracking-widest uppercase transition-colors duration-300"
            style="color: var(--signature-color); text-shadow: none;"
          >
            {#if profileState.is_editing && profileState.hovered_section === section.id && arrayField}
              <span class={get_hint_span_class()} style:animation="add-hint-fade var(--motion-elastic) forwards">+</span>
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
              <ProfileArray state={profileState} path={field.key} sublabel={field.sublabel || field.label} {signature_color} />
            {:else}
              {@const fieldId = `field-${field.key.replace(".", "-")}`}
              {@const raw = profileState.get_safe_value(field.key) || ""}
              {@const parsed = (() => {
                try {
                  let cleanRaw = raw.trim();
                  if (!cleanRaw) return null;
                  if (!cleanRaw.startsWith("{") && cleanRaw.includes(":")) {
                    cleanRaw = cleanRaw.replace(/,\s*$/, "");
                    cleanRaw = `{ ${cleanRaw} }`;
                  }
                  if (!cleanRaw.startsWith("{")) return null;
                  const p = JSON.parse(cleanRaw);
                  if (typeof p === "object" && p !== null) {
                    const standardized = {};
                    Object.entries(p).forEach(([k, v]) => {
                      if (typeof v === "string") {
                        standardized[k] = v.replace(/,([^\s])/g, ", $1");
                      } else {
                        standardized[k] = v;
                      }
                    });
                    return standardized;
                  }
                  return null;
                } catch {
                  return null;
                }
              })()}

              {#if field.label && section.id === "eternal"}
                <label
                  class="block w-full text-center text-[10px] font-bold tracking-widest text-(--signature-color) uppercase drop-shadow-md"
                  for={fieldId}>{field.label}</label
                >
              {/if}

              {#if !profileState.is_editing && parsed}
                <div
                  id={fieldId}
                  class="relative flex min-h-20 w-full flex-col gap-2 rounded-standard"
                  role="region"
                  aria-label={field.sublabel || field.label}
                  use:auto_resize={{ syncId: section.label }}
                  data-sync-id={section.label}
                >
                  {#if profileState.busy_fields.has(field.key)}
                    <span class="animate-pulse font-mono text-[10px] tracking-widest text-white uppercase">ENHANCING</span>
                  {:else}
                    {@const sortedEntries = Object.entries(parsed).sort((a, b) => String(a[1]).length - String(b[1]).length)}
                    <div class="flex flex-wrap gap-2">
                      {#each sortedEntries as [k, v] (k)}
                        {#if v && String(v).trim()}
                          <div
                            class="flex min-w-23.75 grow flex-col items-start gap-0.5 rounded-md border border-(--signature-color)/15 bg-(--signature-color)/5 px-2.5 py-1.5"
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
              {:else}
                <TextField
                  id={fieldId}
                  is_edit={profileState.is_editing}
                  syncId={section.label}
                  {signature_color}
                  data-active={profileState.active_field?.key === field.key ? true : undefined}
                  placeholder={field.description}
                  value={raw}
                  oninput={(e) => profileState.set_field_value(field.key, e.target.value)}
                  busy={profileState.busy_fields.has(field.key)}
                  onfocus={() => profileState.set_active_field(field.key, field.label || section.label)}
                  onblur={() => profileState.reset_active_field()}
                >
                  {#snippet status()}
                    {#if profileState.busy_fields.has(field.key)}
                      <span class="mt-2 block animate-pulse font-mono text-[10px] tracking-widest text-white uppercase">ENHANCING</span>
                    {:else if field.sublabel}
                      <span class="font-mono text-[10px] tracking-widest text-white uppercase opacity-80">{field.sublabel}</span>
                    {/if}
                  {/snippet}

                  {#snippet header_actions()}
                    {#if profileState.is_editing}
                      <Button
                        variant="invisible"
                        size="small"
                        square={true}
                        aria-label="Enhance with AI"
                        actions={[tooltip]}
                        disabled={profileState.busy_fields.has(field.key) || !profileState.get_safe_value(field.key)}
                        onclick={() => profileState.enhance(field.key, profileState.get_safe_value(field.key))}
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
  </div>
{/snippet}

{#snippet RenderFormattedValue(valStr)}
  {#each parseVariants(valStr) as part, i (i)}
    {#if part.isVar}
      <span
        class="mx-0.5 inline-flex flex-wrap items-center gap-1 rounded border border-dashed border-(--signature-color)/25 bg-(--signature-color)/5 px-1.5 py-0.5 font-mono text-[11px] text-slate-300"
      >
        <span class="mr-0.5 text-[9px] font-bold text-(--signature-color) opacity-70">⌥</span>
        {#each part.choices as choice, idx (idx)}
          <span>{choice}</span>
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

<style>
  @keyframes slide-in-left {
    0% {
      opacity: var(--opacity-none);
      transform: translateX(calc(var(--spacing-spacing-unit) * 5));
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
