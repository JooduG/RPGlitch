<script>
  /**
   * @file src/ui/organisms/Profile.svelte
   * 🧪 ENTITY EDITOR — Primary orchestrator for viewing and editing entities.
   * Chalk Regime UI · Flat DOM · Bolted Architecture
   */
  import { auto_resize, click_outside } from "@actions";
  import { Button, Modal, ProfilePicture, TextField, tooltip } from "@atoms";
  import { PROFILE_SECTIONS_BY_TYPE } from "@intelligence";
  import { get_signature_color } from "@media";
  import { AudioWing, DevWing, Dialog, VisualWing } from "@molecules";
  import { ProfileArray, ProfileHeader } from "@organisms";
  import { app, runtime } from "@state";
  import { ProfileState } from "./profile.svelte.js";

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
  const has_wings = $derived(profileState.is_editing || app.settings.dev_mode);
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
    "flex h-full overflow-y-auto overflow-x-hidden rounded-2xl border border-solid transition-all duration-300 scrollbar-thin scrollbar-track-transparent " +
      (app.viewport.mobile || app.viewport.mini ? "col-span-full flex-col " : has_wings ? "modal-profile-grid-main " : "modal-profile-grid-flat ") +
      (entity_type === "fractal" ? "flex-col" : "flex-row"),
  );

  const avatar_container_class = $derived(
    "sticky top-0 z-20 flex shrink-0 items-stretch " +
      (entity_type === "fractal" ? "h-12 min-h-50 w-full " : "h-full w-avatar-medium-size ") +
      (app.viewport.mobile || app.viewport.mini ? "h-auto w-auto items-center justify-center p-4" : ""),
  );

  const profile_pic_wrapper_class = $derived(
    "overflow-hidden border-solid " +
      (entity_type === "fractal" ? "h-full w-full rounded-none border-0 border-b " : "h-full w-full rounded-none border-0 border-r ") +
      (app.viewport.mobile || app.viewport.mini ? "h-avatar-medium-size w-avatar-medium-size border-spacing-border-width-base rounded-md" : ""),
  );

  const info_container_class = $derived("flex min-w-0 flex-1 flex-col p-4 pb-0 gap-4");

  const main_layout_class = $derived("grow p-0");

  const footer_layout_class = $derived(
    "flex shrink-0 gap-4 pb-4 outline-none " + (app.viewport.mobile || app.viewport.mini ? "w-full flex-col items-stretch" : "justify-end"),
  );

  const entity_body_class = $derived("min-w-0 " + (app.viewport.mobile || app.viewport.mini ? "flex flex-col gap-4" : "grid gap-x-2 gap-y-4"));

  const entity_body_grid_cols = $derived(app.viewport.mobile || app.viewport.mini ? undefined : "2rem 1fr");

  // --- MARKUP CONTEXT SANITIZERS ---
  const get_section_class = (arrayField) => {
    let cls = "relative flex min-w-0 flex-col items-center justify-center overflow-hidden text-center transition-all duration-300 ";
    cls += profileState.is_editing && arrayField ? "cursor-pointer " : "cursor-default ";
    if (app.viewport.mobile || app.viewport.mini) cls += "border-b pr-0 pb-2";
    return cls;
  };

  const get_inner_section_style = (id) => {
    const shouldTranslate = id === "eternal" && !(app.viewport.mobile || app.viewport.mini);
    return shouldTranslate ? "transform: translateY(1rem);" : "";
  };

  const get_hint_span_class = () => {
    let cls = "pointer-events-none shrink-0 font-mono text-base tracking-widest whitespace-nowrap text-white ";
    if (app.viewport.mobile || app.viewport.mini) cls += "text-center";
    return cls;
  };

  const get_label_span_class = () => {
    return app.viewport.mobile || app.viewport.mini ? "" : "block rotate-180";
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
      target.closest("[data-modal-variant='lightbox']")
    )
      return;
    if (target.closest("[data-backdrop='mini']") || target.closest(".root.mini")) return;

    if (profileState.is_dirty) {
      show_close_confirm = true;
      return;
    }

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
      class="m-auto my-8 grid h-auto w-grid-width grid-cols-12"
      data-mobile={app.viewport.mobile}
      data-mini={app.viewport.mini}
      role="presentation"
    >
      <div
        class={main_card_class}
        style:background-color="color-mix(in srgb, var(--signature-color) 1%, var(--color-glass-sunken))"
        style:border-color="color-mix(in srgb, var(--signature-color) 30%, transparent)"
        style:backdrop-filter="var(--blur-mist)"
        style:--signature-color={signature_color}
        style:--scrollbar-thumb="color-mix(in srgb, var(--signature-color) 40%, var(--color-gunmetal))"
        style:--scrollbar-thumb-hover="color-mix(in srgb, var(--signature-color) 60%, var(--color-frisk))"
        style:view-transition-name={target_morph_name}
        use:click_outside={handle_click_outside}
      >
        <div class={avatar_container_class}>
          <button
            class={[
              profile_pic_wrapper_class,
              "flex appearance-none items-center justify-center p-0 outline-none",
              profileState.is_editing && profileState.char?.profile_picture ? "cursor-pointer transition-opacity hover:opacity-80" : "cursor-default",
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
                        seed: profileState.char.modifiers.profile_picture_seed,
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
                            modifiers.profile_picture_seed = payload.metadata.seed;
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
        </div>

        <div class={info_container_class}>
          <ProfileHeader
            bind:name={profileState.char.name}
            bind:description={profileState.char.description}
            is_editing={profileState.is_editing}
            active_field={profileState.active_field?.key}
            {signature_color}
            on_focus_field={(/** @type {string} */ key, /** @type {string} */ label) => profileState.set_active_field(key, label)}
          />

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
              >
                {#if Array.from(profileState.busy_fields).some((f) => f !== "visual-prompt")}
                  <span class="animate-pulse">ENHANCING...</span>
                {:else}
                  Enhance Profile
                {/if}
              </Button>
              <Button
                variant="secondary"
                onclick={() => {
                  footer_el?.focus();
                  profileState.save(entity_type);
                }}>Save</Button
              >
              <Button
                variant="danger"
                onclick={() => {
                  footer_el?.focus();
                  profileState.show_delete_confirm = true;
                }}>Delete</Button
              >
            {:else}
              <Button
                variant="secondary"
                onclick={() => {
                  footer_el?.focus();
                  profileState.start_editing();
                }}>Edit</Button
              >
            {/if}
          </footer>
        </div>
      </div>

      {#if has_wings}
        <aside
          data-wings-container
          class="col-[9/12] flex scrollbar-none flex-col items-center gap-4 overflow-y-auto [&::-webkit-scrollbar]:hidden"
          style:animation="slide-in-left var(--motion-elastic) forwards"
        >
          <div class="my-auto flex w-full flex-col gap-4">
            {#if profileState.is_editing}
              <VisualWing {profileState} />
              <AudioWing {profileState} />
            {/if}
            {#if app.settings.dev_mode}
              <DevWing {profileState} />
            {/if}
          </div>
        </aside>
      {/if}
    </div>
  </Modal>
{/if}

{#snippet EntityBody()}
  <div class={entity_body_class} style:grid-template-columns={entity_body_grid_cols} data-testid="profile-fragments">
    {#each active_sections as section (section.id)}
      {@const arrayField = section.fields.find((/** @type {any} */ f) => f.type === "array")}

      <div
        class={get_section_class(arrayField)}
        style:border-color={app.viewport.mobile || app.viewport.mini ? "color-mix(in srgb, var(--signature-color) 30%, transparent)" : undefined}
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
              style:text-orientation={app.viewport.mobile || app.viewport.mini ? undefined : "mixed"}
              style:writing-mode={app.viewport.mobile || app.viewport.mini ? undefined : "vertical-rl"}>{section.label}</span
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
                            class="flex min-w-[95px] grow flex-col items-start gap-0.5 rounded-md border border-(--signature-color)/15 bg-(--signature-color)/5 px-2.5 py-1.5"
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
