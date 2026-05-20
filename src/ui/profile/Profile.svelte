<script>
  /**
   * @file src/ui/profile/Profile.svelte
   * 🧬 ENTITY EDITOR — Primary orchestrator for viewing and editing entities.
   * Chalk Regime UI · Flat DOM · Bolted Architecture
   */
  import { ENTITY_FRAGMENTS, PROFILE_SECTIONS } from "@/core/intelligence/entity-fragments.js";
  import Button from "@atoms/Button.svelte";
  import Dialog from "@atoms/Dialog.svelte";
  import Modal from "@atoms/Modal.svelte";
  import ProfilePicture from "@atoms/ProfilePicture.svelte";
  import TextField from "@atoms/TextField.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import DevWing from "@devmode/DevWing.svelte";
  import AudioWing from "@profile/AudioWing.svelte";
  import ProfileArray from "@profile/ProfileArray.svelte";
  import VisualWing from "@profile/VisualWing.svelte";
  import { app } from "@state/app.svelte.js";
  import { themeStore } from "@theme/palette.svelte.js";
  import { fly } from "svelte/transition";
  // State & Utilities
  import { auto_resize } from "@utils/auto-resize.js";
  import { click_outside } from "@utils/click-outside.js";
  import { ProfileState } from "./profile.svelte.js";

  /** @type {{ entity_type?: "character" | "fractal" }} */
  let { entity_type = "character" } = $props();

  // --- ORCHESTRATION ---
  const state = new ProfileState();

  // --- DERIVED ---
  const signature_color = $derived(themeStore.get_signature_color(state.char, "var(--gunmetal)"));
  const has_wings = $derived(state.is_editing || app.settings.dev_mode);

  // --- EFFECTS ---
  $effect(() => state.sync());

  // --- HANDLERS ---
  // All handlers migrated to ProfileState

  /** @param {MouseEvent} event */
  function handle_click_outside(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    // Ignore clicks if delete confirm dialog is active
    if (state.show_delete_confirm) return;

    // Ignore clicks inside the wings container (VisualWing, AudioWing, DevWing)
    if (target.closest(".wings-container")) return;

    // Ignore clicks inside dropdown menus or portaled elements from wings
    if (target.closest(".menu") || target.closest(".tooltip-portal")) return;

    // Ignore clicks inside other dialog/mini modals
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
      <!-- 🧬 THE CORE: Profile Container -->
      <div
        class="profile-container no-scrollbar glass-elevated"
        class:readonly={!has_wings}
        class:has-wings={has_wings}
        style="--signature-color: {signature_color};"
        use:click_outside={handle_click_outside}
      >
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <ProfilePicture entity={state.char} />
          </div>
        </div>

        <div class="right">
          <!-- 🏷️ HEADER -->
          <header class="profile-header">
            <div class="identity-info">
              {#if state.is_editing}
                <h1 class="name edit" class:is-active={state.active_field?.key === "name"}>
                  <span
                    contenteditable="true"
                    bind:innerText={state.char.name}
                    role="textbox"
                    tabindex="0"
                    aria-label="Entity Name"
                    data-placeholder={ENTITY_FRAGMENTS.name}
                    onfocus={() => state.set_active_field("name", "Entity Name")}
                    >{state.char.name}</span
                  >
                </h1>
              {:else}
                <h1 class="name">{state.char.name}</h1>
              {/if}
            </div>

            {#if state.is_editing}
              <textarea
                class="description edit scrollbar"
                placeholder={ENTITY_FRAGMENTS.description}
                bind:value={state.char.description}
                use:auto_resize
                onfocus={() => state.set_active_field("description", "Description")}
              ></textarea>
            {:else if state.char.description}
              <p class="description">{state.char.description}</p>
            {/if}
          </header>

          <!-- 📜 CONTENT -->
          <main class="profile-content no-scrollbar">
            {@render EntityBody()}
          </main>

          <!-- 🏁 FOOTER -->
          <footer class="profile-footer">
            {#if state.is_editing}
              <Button variant="danger" onclick={() => (state.show_delete_confirm = true)}>
                Deleter
              </Button>
              <Button variant="invisible" onclick={() => state.cancel()}>Cancel</Button>
              <Button variant="primary" onclick={() => state.save(entity_type)}>Save</Button>
            {:else}
              <Button variant="invisible" onclick={() => (state.is_editing = true)}>Edit</Button>
              <Button variant="primary" onclick={() => state.handle_close()}>Close</Button>
            {/if}
          </footer>
        </div>
      </div>

      <!-- 🦇 THE WINGS: Stacking on the right -->
      {#if has_wings}
        <aside class="wings-container no-scrollbar" transition:fly={{ x: 20, duration: 400 }}>
          {#if app.settings.dev_mode}
            <DevWing profileState={state} />
          {/if}

          {#if state.is_editing}
            <AudioWing profileState={state} />
            <VisualWing profileState={state} />
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
    {#each PROFILE_SECTIONS as section (section.id)}
      {@const arrayField = section.fields.find((f) => f.type === "array")}

      <!-- SECTION LABEL (Left Column) -->
      <div
        class="profile-side"
        class:interactive={state.is_editing && arrayField}
        onclick={() => arrayField && state.add_vector_item(arrayField.key)}
        onmouseenter={() => (state.hovered_section = section.id)}
        onmouseleave={() => (state.hovered_section = null)}
        role="presentation"
      >
        <div class="label-wrapper">
          <h5 class="section-label">
            {section.label}
            {#if state.is_editing && state.hovered_section === section.id && arrayField}
              <span class="add-hint" transition:fly={{ x: -10, duration: 300 }}>+ ADD</span>
            {/if}
          </h5>
          {#if section.sublabel}
            <p class="section-sub">{section.sublabel}</p>
          {/if}
        </div>
      </div>

      <!-- SECTION FIELDS (Right Column) -->
      <div class="profile-fields" data-columns={section.fields.length}>
        {#each section.fields as field (field.key)}
          <div class="group">
            {#if field.label && (section.id === "eternal" || section.id === "present")}
              <span class="field-label">{field.label}</span>
            {/if}

            {#if field.type === "array"}
              <ProfileArray
                {state}
                path={field.key}
                unit_label={field.unitLabel}
                {signature_color}
              />
            {:else}
              <TextField
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
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .profile-modal {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  .profile-container {
    grid-column: 4 / 10;
    display: flex;
    flex-direction: row;
    height: 100%;
    overflow: hidden;
    transition: grid-column var(--motion-standard);
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
    gap: var(--gap-standard);
    padding: var(--padding-standard) 0;
    overflow-y: auto;
  }

  .profile-header {
    flex-shrink: 0;
    width: 100%;
    min-width: 0;
    min-height: calc(var(--font-size-h3) * 1.5);
    padding: var(--padding-standard);
    border-bottom: var(--border-whisper);
    display: flex;
    flex-direction: column;
    gap: var(--gap-tight);
  }

  .identity-info {
    width: 100%;
    min-width: 0;
    flex-shrink: 0;
  }

  .name {
    color: var(--signature-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    font-size: clamp(var(--font-size-h3), 6vw, var(--font-size-h1));
  }

  .name.edit {
    white-space: normal;
    overflow: visible;
    font-size: var(--font-size-h3) !important; /* Force stability in edit mode */
  }

  .name.edit span {
    display: inline-block;
    width: 100%;
    padding: var(--padding-tight);
  }

  .name.edit span:empty::before {
    content: attr(data-placeholder);
    color: var(--frozen);
    font-style: italic;
    opacity: var(--opacity-whisper);
    pointer-events: none;
  }

  .description {
    font-size: var(--font-size-small);
    line-height: var(--font-height-base);
    color: var(--frisk);
    opacity: var(--opacity-muted);
    margin: 0;
    text-align: left;
    white-space: pre-wrap;
    text-wrap: pretty;
  }

  textarea.description.edit {
    width: 100%;
    min-height: calc(var(--row-unit) * 1.5);
    max-height: calc(var(--row-unit) * 4);
    padding: var(--padding-standard);
    color: var(--frisk);
    font-family: var(--font-family-base);
    font-size: var(--font-size-small);
    line-height: var(--font-height-base);
    resize: none;
  }

  textarea.description.edit::placeholder {
    color: var(--frozen);
    font-style: italic;
    opacity: var(--opacity-whisper);
  }

  /* Shared Input Edit Styling */
  .name.edit span,
  textarea.description.edit {
    background: color-mix(in srgb, var(--signature-color) 4%, var(--glass-sunken));
    border: var(--border-width-base) solid
      color-mix(in srgb, var(--signature-color) 20%, transparent);
    border-radius: var(--radius-standard);
    transition:
      border-color var(--duration-fast) var(--ease-standard),
      box-shadow var(--duration-fast) var(--ease-standard),
      background var(--duration-fast) var(--ease-standard);
  }

  .name.edit span:hover,
  textarea.description.edit:hover {
    border-color: color-mix(in srgb, var(--signature-color) 40%, transparent);
  }

  .name.edit span:focus,
  textarea.description.edit:focus {
    outline: none;
    border-color: var(--signature-color);
    box-shadow: var(--signature-glow);
    background: color-mix(in srgb, var(--signature-color) 8%, var(--glass-sunken));
  }

  .profile-content {
    flex-grow: 1;
    padding: 0;
    overflow-y: auto;
  }

  .profile-footer {
    flex-shrink: 0;
    padding: var(--padding-standard);
    border-top: var(--border-whisper);
    display: flex;
    justify-content: flex-end;
    gap: var(--gap-standard);
  }

  .avatar-section {
    display: flex;
    align-items: stretch;
    height: 100%;
    width: var(--avatar-medium-size);
    flex-shrink: 0;
  }

  .avatar-wrapper {
    width: 100%;
    height: 100%;
    border-radius: 0;
    overflow: hidden;
    border: none;
    border-right: var(--border-width-base) solid
      color-mix(in srgb, var(--signature-color) 30%, transparent);
  }

  .profile-fragments {
    display: grid;
    grid-template-columns: var(--profile-fragment-column) 1fr;
    gap: var(--gap-standard);
    padding: var(--padding-standard);
    min-width: 0;
  }

  .profile-side {
    text-align: right;
    cursor: default;
    transition: all var(--duration-standard);
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
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
    gap: var(--gap-tight);
    width: 100%;
  }

  .profile-side.interactive {
    cursor: pointer;
  }

  .section-label {
    color: var(--signature-color);
    text-transform: uppercase;
    text-shadow: var(--shadow-font);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--gap-tight);
    transition: all var(--duration-standard);
    position: relative;
    letter-spacing: var(--font-spacing-loose);
  }

  .add-hint {
    position: absolute;
    left: 0;
    top: calc(100% + var(--gap-standard));
    font-family: var(--font-family-mono);
    font-size: var(--font-size-nano);
    font-weight: var(--font-weight-bold);
    color: var(--signature-color);
    opacity: var(--opacity-whisper);
    pointer-events: none;
    letter-spacing: var(--font-spacing-loose);
    white-space: nowrap;
    text-shadow: 0 0 calc(var(--spacing-unit) * 2) var(--signature-color);
  }

  .section-sub {
    margin: 0;
    font-size: var(--font-size-nano);
    color: var(--pure-white);
    font-weight: var(--font-weight-bold);
    opacity: var(--opacity-whisper);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);
    text-shadow: var(--shadow-font);
    font-style: italic;
  }

  .profile-fields[data-columns="2"] {
    grid-template-columns: 1fr 1fr;
  }

  .profile-fields[data-columns="1"] {
    grid-template-columns: 1fr;
  }

  .group {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--gap-tight);
    min-width: 0;
    justify-content: stretch;
    align-items: stretch;
  }

  .field-label {
    font-size: var(--font-size-nano);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    color: var(--signature-color);
    opacity: var(--opacity-solid);
    text-align: center;
    text-shadow: var(--shadow-font);
    margin-bottom: var(--margin-tight);
    width: 100%;
    letter-spacing: var(--font-spacing-loose);
    padding-left: var(--padding-tight);
  }

  .status {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-nano);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);
    color: var(--pure-white);
    opacity: var(--opacity-whisper);
    display: block;
    margin-top: var(--gap-tight);
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
    overflow-y: auto;
  }

  .profile-modal.is-mobile .profile-content,
  .profile-modal.is-mini .profile-content {
    overflow-y: visible;
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
    position: relative;
    right: auto;
    top: auto;
    margin-top: var(--gap-tight);
  }
</style>
