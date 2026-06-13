<script>
  /**
   * @file src/ui/organisms/Profile.svelte
   * 🧪 ENTITY EDITOR — Primary orchestrator for viewing and editing entities.
   * Chalk Regime UI · Flat DOM · Bolted Architecture
   */
  import { click_outside } from "@actions";
  import { Button, Modal, ProfilePicture, ScrollArea, TextField, tooltip } from "@atoms";
  import { PROFILE_SECTIONS_BY_TYPE } from "@intelligence";
  import { get_signature_color } from "@media";
  import { AudioWing, DevWing, Dialog, VisualWing } from "@molecules";
  import { ProfileArray, ProfileHeader } from "@organisms";
  import { app } from "@state";
  import { ProfileState } from "./profile.svelte.js";

  /** @type {{ entity_type?: "character" | "fractal" }} */
  let { entity_type = "character" } = $props();

  // --- ORCHESTRATION ---
  const profileState = new ProfileState();
  /** @type {HTMLElement | undefined} */
  let footer_el = $state();

  // --- DERIVED ---
  const signature_color = $derived(get_signature_color(profileState.char, "var(--color-gunmetal)"));
  const has_wings = $derived(profileState.is_editing || app.settings.dev_mode);
  const active_sections = $derived(PROFILE_SECTIONS_BY_TYPE[entity_type] || PROFILE_SECTIONS_BY_TYPE.character);

  // --- STYLELINT SAFE LAYOUT ENGINE STATES ---
  const main_card_class = $derived(
    "flex h-full scrollbar-none overflow-auto border-solid transition-all duration-300 [&::-webkit-scrollbar]:hidden " +
      (app.viewport.mobile || app.viewport.mini ? "col-span-full flex-col " : has_wings ? "modal-profile-grid-main " : "modal-profile-grid-flat ") +
      (entity_type === "fractal" ? "flex-col" : "flex-row"),
  );

  const avatar_container_class = $derived("sticky top-0 z-20 flex shrink-0 items-stretch " + (entity_type === "fractal" ? "h-12 min-h-50 w-full " : "h-full w-avatar-medium-size ") + (app.viewport.mobile || app.viewport.mini ? "h-auto w-auto items-center justify-center p-4" : ""));

  const profile_pic_wrapper_class = $derived(
    "overflow-hidden border-solid " +
      (entity_type === "fractal" ? "h-full w-full rounded-none border-0 border-b " : "h-full w-full rounded-none border-0 border-r ") +
      (app.viewport.mobile || app.viewport.mini ? "h-avatar-medium-size w-avatar-medium-size border-spacing-border-width-base rounded-md" : ""),
  );

  const info_container_class = $derived("flex min-w-0 flex-1 flex-col justify-between " + (entity_type === "fractal" ? "h-auto" : "min-h-0"));

  const main_layout_class = $derived("grow p-0 scrollbar-none [&::-webkit-scrollbar]:hidden " + (entity_type === "fractal" ? "h-auto overflow-visible" : "overflow-visible"));

  const footer_layout_class = $derived("flex shrink-0 gap-4 p-4 outline-none " + (app.viewport.mobile || app.viewport.mini ? "w-full flex-col items-stretch" : "justify-end"));

  const entity_body_class = $derived("min-w-0 p-4 pb-8 " + (app.viewport.mobile || app.viewport.mini ? "flex flex-col gap-4" : "grid gap-x-2 gap-y-4"));

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
    cls += profileState.active_field?.key === fieldKey ? "opacity-100" : "opacity-0";
    return cls;
  };

  // --- EFFECTS ---
  $effect(() => profileState.sync());

  /** @param {MouseEvent} event */
  function handle_click_outside(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (profileState.show_delete_confirm) return;
    if (target.closest("[data-wings-container] > *")) return;
    if (target.closest(".menu") || target.closest("[data-dropdown-menu]") || target.closest(".dropdown-portal-wrapper") || target.closest(".tooltip-portal")) return;
    if (target.closest("[data-backdrop='mini']") || target.closest(".root.mini")) return;

    profileState.handle_close();
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (!profileState.char?.id || profileState.show_delete_confirm) return;
    if (e.key === "Enter" && !e.shiftKey) {
      const target = /** @type {HTMLElement} */ (e.target);
      if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON" || target.isContentEditable) return;
      e.preventDefault();
      if (profileState.is_editing) {
        footer_el?.focus();
        profileState.save(entity_type);
      } else {
        footer_el?.focus();
        profileState.is_editing = true;
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
    confirm_label="Delete Permanently"
    on_confirm={() => profileState.delete(entity_type)}
  />

  <Modal variant="profile" on_close={() => profileState.handle_close()} is_pass_through={true}>
    <div class="m-auto grid h-grid-height w-grid-width grid-cols-12 overflow-hidden" data-mobile={app.viewport.mobile} data-mini={app.viewport.mini} role="presentation">
      <div class={main_card_class} style:border-color="color-mix(in srgb, var(--signature-color) 30%, transparent)" style:backdrop-filter="var(--blur-mist)" style:--signature-color={signature_color} use:click_outside={handle_click_outside}>
        <div class={avatar_container_class}>
          <div class={profile_pic_wrapper_class} style:border-color="color-mix(in srgb, var(--signature-color) 30%, transparent)">
            <ProfilePicture entity={profileState.char} />
          </div>
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
            <ScrollArea style={entity_type === "fractal" ? "height: auto; overflow: visible;" : "height: 100%;"}>
              {@render EntityBody()}
            </ScrollArea>
          </main>

          <footer bind:this={footer_el} tabindex="-1" class={footer_layout_class}>
            {#if profileState.is_editing}
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
                  profileState.is_editing = true;
                }}>Edit</Button
              >
            {/if}
          </footer>
        </div>
      </div>

      {#if has_wings}
        <aside data-wings-container class="flex scrollbar-none flex-col justify-center gap-4 overflow-y-auto [&::-webkit-scrollbar]:hidden" style:animation="slide-in-left var(--motion-elastic) forwards">
          {#if profileState.is_editing}
            <VisualWing {profileState} />
            <AudioWing {profileState} />
          {/if}
          {#if app.settings.dev_mode}
            <DevWing {profileState} />
          {/if}
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
          <h6 class="m-0 flex flex-col items-center justify-center text-center tracking-widest uppercase transition-colors duration-300" style="color: var(--signature-color); text-shadow: none;">
            {#if profileState.is_editing && profileState.hovered_section === section.id && arrayField}
              <span class={get_hint_span_class()} style:animation="add-hint-fade var(--motion-elastic) forwards">+</span>
            {/if}
            <span class={get_label_span_class()} style:text-orientation={app.viewport.mobile || app.viewport.mini ? undefined : "mixed"} style:writing-mode={app.viewport.mobile || app.viewport.mini ? undefined : "vertical-rl"}>{section.label}</span>
          </h6>
        </div>
      </div>

      <div class={get_fields_container_class(section.fields.length)}>
        {#each section.fields as field (field.key)}
          <div class="relative flex h-full w-full min-w-0 flex-col items-stretch justify-stretch gap-2">
            {#if field.type === "array"}
              <ProfileArray state={profileState} path={field.key} unit_label={field.unitLabel} {signature_color} />
            {:else}
              {@const fieldId = `field-${field.key.replace(".", "-")}`}
              {#if field.label && section.id === "eternal"}
                <label class="block w-full text-center text-[10px] font-bold tracking-widest text-(--signature-color) uppercase drop-shadow-md" for={fieldId}>{field.label}</label>
              {/if}
              <TextField
                id={fieldId}
                is_edit={profileState.is_editing}
                syncId={section.label}
                {signature_color}
                data-active={profileState.active_field?.key === field.key ? true : undefined}
                placeholder={field.description}
                value={profileState.get_safe_value(field.key)}
                oninput={(/** @type {any} */ e) => profileState.set_field_value(field.key, e.currentTarget.value)}
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
                      <svg viewBox="0 0 24 24" class="size-icon-small fill-none stroke-current stroke-2" style="stroke-linecap: round; stroke-linejoin: round;">
                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="currentColor"></path>
                      </svg>
                    </Button>
                  {/if}
                {/snippet}
              </TextField>
            {/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>
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
