<script>
  /**
   * @file src/ui/organisms/Profile.svelte
   * 🧪 ENTITY EDITOR — Primary orchestrator for viewing and editing entities.
   * Chalk Regime UI · Flat DOM · Bolted Architecture
   */
  import { Button, Modal, ProfilePicture, ScrollArea, TextField, tooltip } from "@atoms";
  import { PROFILE_SECTIONS_BY_TYPE } from "@intelligence";
  import { themeStore } from "@media";
  import { AudioWing, VisualWing, DevWing, Dialog } from "@molecules";
  import { ProfileArray, ProfileHeader } from "@organisms";
  import { app } from "@state";
  import { click_outside } from "@actions";
  import { ProfileState } from "./profile.svelte.js";

  /** @type {{ entity_type?: "character" | "fractal" }} */
  let { entity_type = "character" } = $props();

  // --- ORCHESTRATION ---
  const state = new ProfileState();

  // --- DERIVED ---
  const signature_color = $derived(themeStore.get_signature_color(state.char, "var(--gunmetal)"));
  const has_wings = $derived(state.is_editing || app.settings.dev_mode);
  const active_sections = $derived(
    PROFILE_SECTIONS_BY_TYPE[entity_type] || PROFILE_SECTIONS_BY_TYPE.character,
  );

  // --- EFFECTS ---
  $effect(() => state.sync());

  /** @param {MouseEvent} event */
  function handle_click_outside(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (state.show_delete_confirm) return;
    if (target.closest(".wings-container > *")) return;
    if (
      target.closest(".menu") ||
      target.closest(".dropdown-menu") ||
      target.closest(".dropdown-portal-wrapper") ||
      target.closest(".tooltip-portal")
    )
      return;
    if (target.closest(".mini-backdrop") || target.closest(".root.mini")) return;

    state.handle_close();
  }
</script>

{#if state.char?.id}
  <Dialog
    type="confirm"
    bind:open={state.show_delete_confirm}
    title="Delete {state.char.name || 'Entity'}"
    message="This action is irreversible. All associated data, including history and vectors, will be lost."
    confirm_label="Delete Permanently"
    on_confirm={() => state.delete(entity_type)}
  />

  <Modal variant="profile" on_close={() => state.handle_close()} is_pass_through={true}>
    <div
      class="profile-modal"
      class:is-mobile={app.viewport.mobile}
      class:is-mini={app.viewport.mini}
      role="presentation"
    >
      <div
        class="profile-container no-scrollbar glass-elevated"
        class:readonly={!has_wings}
        class:has-wings={has_wings}
        data-entity-type={entity_type}
        style:--signature-color={signature_color}
        use:click_outside={handle_click_outside}
      >
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <ProfilePicture entity={state.char} />
          </div>
        </div>

        <div class="right">
          <ProfileHeader
            bind:name={state.char.name}
            bind:description={state.char.description}
            is_editing={state.is_editing}
            active_field={state.active_field?.key}
            on_focus_field={(/** @type {string} */ key, /** @type {string} */ label) =>
              state.set_active_field(key, label)}
          />

          <main class="profile-content no-scrollbar">
            <ScrollArea style="height: var(--state-fill-end);">
              {@render EntityBody()}
            </ScrollArea>
          </main>

          <footer class="profile-footer">
            {#if state.is_editing}
              <Button variant="secondary" onclick={() => state.save(entity_type)}>Save</Button>
              <Button variant="danger" onclick={() => (state.show_delete_confirm = true)}
                >Delete</Button
              >
              <Button variant="primary" onclick={() => state.cancel()}>Cancel</Button>
            {:else}
              <Button variant="secondary" onclick={() => (state.is_editing = true)}>Edit</Button>
              <Button variant="primary" onclick={() => state.handle_close()}>Close</Button>
            {/if}
          </footer>
        </div>
      </div>

      {#if has_wings}
        <aside class="wings-container no-scrollbar">
          {#if state.is_editing}
            <VisualWing profileState={state} />
            <AudioWing profileState={state} />
          {/if}
          {#if app.settings.dev_mode}
            <DevWing profileState={state} />
          {/if}
        </aside>
      {/if}
    </div>
  </Modal>
{/if}

{#snippet EntityBody()}
  <div
    class="profile-fragments"
    class:is-mobile={app.viewport.mobile}
    class:is-mini={app.viewport.mini}
    data-testid="profile-fragments"
  >
    {#each active_sections as section (section.id)}
      {@const arrayField = section.fields.find((/** @type {any} */ f) => f.type === "array")}

      <div
        class="profile-side"
        class:interactive={state.is_editing && arrayField}
        data-section={section.id}
        onclick={() => arrayField && state.add_vector_item(arrayField.key)}
        onmouseenter={() => (state.hovered_section = section.id)}
        onmouseleave={() => (state.hovered_section = null)}
        role="presentation"
      >
        <div class="label-wrapper">
          <h6 class="section-label">
            {#if state.is_editing && state.hovered_section === section.id && arrayField}
              <span class="add-hint">+</span>
            {/if}
            <span class="vertical-label-text">{section.label}</span>
          </h6>
        </div>
      </div>

      <div class="profile-fields" data-columns={section.fields.length}>
        {#each section.fields as field (field.key)}
          <div class="group">
            {#if field.type === "array"}
              <ProfileArray
                {state}
                path={field.key}
                unit_label={field.unitLabel}
                {signature_color}
              />
            {:else}
              {@const fieldId = `field-${field.key.replace(".", "-")}`}
              {#if field.label && section.id === "eternal"}
                <label class="field-label" for={fieldId}>{field.label}</label>
              {/if}
              <TextField
                id={fieldId}
                is_edit={state.is_editing}
                syncId={section.label}
                {signature_color}
                class={state.active_field?.key === field.key ? "active" : ""}
                placeholder={field.description}
                value={state.get_safe_value(field.key)}
                oninput={(/** @type {any} */ e) =>
                  state.set_field_value(field.key, e.currentTarget.value)}
                busy={state.busy_fields.has(field.key)}
                onfocus={() => state.set_active_field(field.key, field.label || section.label)}
              >
                {#snippet status()}
                  {#if state.busy_fields.has(field.key)}
                    <span class="status pulse">ENHANCING</span>
                  {:else if field.sublabel}
                    <span class="status-msg">{field.sublabel}</span>
                  {/if}
                {/snippet}

                {#snippet header_actions()}
                  {#if state.is_editing}
                    <Button
                      variant="invisible"
                      size="small"
                      square={true}
                      aria-label="Enhance with AI"
                      actions={[tooltip]}
                      disabled={state.busy_fields.has(field.key) ||
                        !state.get_safe_value(field.key)}
                      onclick={() => state.enhance(field.key, state.get_safe_value(field.key))}
                    >
                      <svg viewBox="0 0 24 24" class="icon-small icon-outline">
                        <path
                          d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"
                          fill="var(--pure-white)"
                        ></path>
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
  .right {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .profile-modal {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    width: var(--grid-width);
    height: var(--grid-height);
    margin: auto;
    overflow: hidden;
  }

  .profile-container {
    grid-column: 4 / 10;
    display: flex;
    flex-direction: row;
    height: var(--state-fill-end);
    overflow: auto;
    transition: grid-column var(--motion-standard);
    border: var(--border-width-base) solid
      color-mix(in srgb, var(--signature-color) 30%, transparent);
  }

  .profile-container.readonly {
    grid-column: 4 / 10;
  }

  .profile-container.has-wings {
    grid-column: 2 / 8;
  }

  .wings-container {
    grid-column: 9 / 12;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--gap-standard);
    overflow-y: auto;
    animation: slide-in-left var(--motion-elastic);
  }

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

  .profile-content {
    flex-grow: 1;
    padding: 0;
    overflow: visible;
  }

  .profile-footer {
    flex-shrink: 0;
    padding: var(--padding-standard);
    display: flex;
    justify-content: flex-end;
    gap: var(--gap-standard);
  }

  .profile-modal.is-mobile .profile-footer,
  .profile-modal.is-mini .profile-footer {
    flex-direction: column;
    align-items: stretch;
    width: var(--state-fill-end);
  }

  .avatar-section {
    display: flex;
    align-items: stretch;
    height: var(--state-fill-end);
    width: var(--avatar-medium-size);
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: var(--z-index-surface);
  }

  .avatar-wrapper {
    width: var(--state-fill-end);
    height: var(--state-fill-end);
    border-radius: 0;
    overflow: hidden;
    border: none;
    border-right: var(--border-width-base) solid
      color-mix(in srgb, var(--signature-color) 30%, transparent);
  }

  .profile-container[data-entity-type="fractal"] {
    flex-direction: column;
    overflow-y: auto;
  }

  .profile-container[data-entity-type="fractal"] .avatar-section {
    width: var(--state-fill-end);
    height: calc(var(--row-unit) * 3);
    min-height: calc(var(--spacing-unit) * 50);
    flex-shrink: 0;
  }

  .profile-container[data-entity-type="fractal"] .avatar-wrapper {
    border-right: none;
    border-bottom: var(--border-width-base) solid
      color-mix(in srgb, var(--signature-color) 30%, transparent);
  }

  .profile-container[data-entity-type="fractal"] .right {
    height: auto;
    display: flex;
    flex-direction: column;
  }

  .profile-container[data-entity-type="fractal"] .profile-content {
    height: auto;
    overflow: visible;
  }

  .profile-container[data-entity-type="fractal"] :global(.scroll-area-readonly),
  .profile-container[data-entity-type="fractal"] :global(.scroll-area-viewport) {
    height: auto !important;
    overflow: visible !important;
  }

  .profile-fragments {
    display: grid;
    grid-template-columns: calc(var(--gap-standard) * 2) 1fr;
    gap: var(--gap-standard) var(--gap-tight);
    padding: var(--padding-standard);
    padding-bottom: var(--padding-loose);
    min-width: 0;
  }

  .profile-side {
    text-align: center;
    cursor: default;
    transition: all var(--duration-standard);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    min-width: 0;
    overflow: hidden;
  }

  .profile-fields {
    display: grid;
    gap: var(--gap-standard);
    min-width: 0;
    align-items: stretch;
  }

  .label-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: var(--state-fill-end);
  }

  .profile-side.interactive {
    cursor: pointer;
  }

  .section-label {
    color: var(--signature-color);
    text-transform: uppercase;
    text-shadow: var(--shadow-font);
    text-align: center;
    letter-spacing: var(--font-spacing-loose);
    transition: color var(--duration-standard);
    hyphens: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .vertical-label-text {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transform: rotate(180deg);
    display: block;
  }

  .add-hint {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    color: var(--pure-white);
    opacity: var(--opacity-solid);
    pointer-events: none;
    letter-spacing: var(--font-spacing-loose);
    white-space: nowrap;
    flex-shrink: 0;
    animation: add-hint-fade var(--motion-elastic);
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

  .profile-fields[data-columns="2"] {
    grid-template-columns: 1fr 1fr;
  }

  .profile-fields[data-columns="1"] {
    grid-template-columns: 1fr;
  }

  .group {
    position: relative;
    width: var(--state-fill-end);
    height: var(--state-fill-end);
    display: flex;
    flex-direction: column;
    gap: var(--gap-tight);
    min-width: 0;
    justify-content: stretch;
    align-items: stretch;
  }

  .field-label {
    display: block;
    font-size: var(--font-size-nano);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    color: var(--signature-color);
    opacity: var(--opacity-solid);
    text-align: center;
    text-shadow: var(--shadow-font);
    width: var(--state-fill-end);
    letter-spacing: var(--font-spacing-loose);
  }

  .status {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-nano);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);
    color: var(--pure-white);
    opacity: var(--opacity-solid);
    display: block;
    margin-top: var(--gap-tight);
  }

  .profile-modal:not(.is-mobile, .is-mini) .profile-side[data-section="eternal"] .label-wrapper {
    transform: translateY(var(--padding-standard));
  }

  /* --- RESPONSIVE OVERRIDES --- */
  .profile-fragments.is-mobile,
  .profile-fragments.is-mini {
    display: flex;
    flex-direction: column;
    gap: var(--gap-standard);
  }

  .profile-modal.is-mobile .profile-container,
  .profile-modal.is-mini .profile-container {
    flex-direction: column;
  }

  .profile-modal.is-mobile .profile-container[data-entity-type="fractal"],
  .profile-modal.is-mini .profile-container[data-entity-type="fractal"] {
    overflow-y: auto;
  }

  .profile-modal.is-mobile .profile-container[data-entity-type="fractal"] .profile-content,
  .profile-modal.is-mini .profile-container[data-entity-type="fractal"] .profile-content {
    overflow-y: visible;
  }

  .profile-modal.is-mobile .profile-container:not([data-entity-type="fractal"]),
  .profile-modal.is-mini .profile-container:not([data-entity-type="fractal"]) {
    overflow: visible;
    height: var(--state-fill-end);
  }

  .profile-modal.is-mobile .profile-container:not([data-entity-type="fractal"]) .right,
  .profile-modal.is-mini .profile-container:not([data-entity-type="fractal"]) .right {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .profile-modal.is-mobile .profile-container:not([data-entity-type="fractal"]) .profile-content,
  .profile-modal.is-mini .profile-container:not([data-entity-type="fractal"]) .profile-content {
    flex-grow: 1;
    overflow: visible;
  }

  .profile-modal.is-mobile .avatar-section,
  .profile-modal.is-mini .avatar-section {
    width: auto;
    height: auto;
    align-items: center;
    justify-content: center;
    padding: var(--padding-standard) var(--padding-standard) 0 var(--padding-standard);
    flex-shrink: 0;
  }

  .profile-modal.is-mobile .avatar-wrapper,
  .profile-modal.is-mini .avatar-wrapper {
    width: var(--avatar-medium-size);
    height: var(--avatar-medium-size);
    border-radius: var(--radius-standard);
    border: var(--border-width-base) solid
      color-mix(in srgb, var(--signature-color) 30%, transparent);
  }

  .profile-modal.is-mobile .profile-side,
  .profile-modal.is-mini .profile-side {
    text-align: center;
    border-bottom: var(--border-width-base) solid
      rgb(from var(--signature-color) r g b / var(--opacity-whisper));
    padding-right: 0;
    padding-bottom: var(--padding-tight);
    align-items: center;
  }

  .profile-modal.is-mobile .section-label,
  .profile-modal.is-mini .section-label {
    align-items: center;
  }

  .profile-modal.is-mobile .add-hint,
  .profile-modal.is-mini .add-hint {
    text-align: center;
  }
</style>
