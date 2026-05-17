<script>
  /**
   * @file src/ui/profile/Profile.svelte
   * 🧬 ENTITY EDITOR — Primary orchestrator for viewing and editing entities.
   * Chalk Regime UI · Flat DOM · Bolted Architecture
   */
  import Dialog from "@atoms/Dialog.svelte";
  import Button from "@atoms/Button.svelte";
  import Modal from "@atoms/Modal.svelte";
  import ProfilePicture from "@atoms/ProfilePicture.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { PROFILE_SECTIONS, ENTITY_FRAGMENTS } from "@/core/intelligence/entity-fragments.js";
  import DevWing from "@devmode/DevWing.svelte";
  import AudioWing from "@profile/AudioWing.svelte";
  import VisualWing from "@profile/VisualWing.svelte";
  import ProfileArray from "@profile/ProfileArray.svelte";
  import TextField from "@atoms/TextField.svelte";
  import { app } from "@state/app.svelte.js";
  import { themeStore } from "@theme/palette.svelte.js";
  import { fly } from "svelte/transition";

  // State & Utilities
  import { ProfileState } from "./profile.svelte.js";
  import { click_outside } from "@utils/click-outside.js";
  import { fit_text } from "@utils/fit-text.js";
  import { auto_resize } from "@utils/auto-resize.js";

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
        use:click_outside={() => state.handle_close()}
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
                <h1 class="name" use:fit_text={{ maxSize: 32 }}>{state.char.name}</h1>
              {/if}
              <div class="id-badge">{state.char.id}</div>
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
              <Button variant="invisible" onclick={() => state.cancel()}>Cancel</Button>
              <Button variant="primary" onclick={() => state.save(entity_type)}
                >Save Protocol</Button
              >
            {:else}
              <Button variant="invisible" onclick={() => (state.is_editing = true)}
                >Edit Profile</Button
              >
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

            <div class="danger-zone">
              <Button
                variant="danger"
                className="delete-btn"
                onclick={() => (state.show_delete_confirm = true)}
              >
                Terminate Entity
              </Button>
            </div>
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
    {#each PROFILE_SECTIONS as section, i (section.id)}
      {@const arrayField = section.fields.find((f) => f.type === "array")}
      {@const sectionIndex = String(i + 1).padStart(2, "0")}

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
          <h2 class="section-label">
            <span class="label-prefix">[{sectionIndex}]</span>
            <span class="label-text">{section.label}</span>
            {#if state.is_editing && state.hovered_section === section.id && arrayField}
              <span class="add-hint" transition:fly={{ x: -10, duration: 300 }}>+ ADD</span>
            {/if}
          </h2>
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
                signature_color="var(--signature-color)"
              />
            {:else}
              <TextField
                is_edit={state.is_editing}
                syncId={section.label}
                signature_color="var(--signature-color)"
                class="text-area custom-field {state.active_field?.key === field.key
                  ? 'active'
                  : ''}"
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
                      className="enhance-btn"
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
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
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
    padding: var(--padding-header) 0;
    overflow-y: auto;
  }

  .profile-header {
    flex-shrink: 0;
    padding: var(--padding-header);
    border-bottom: var(--border-whisper);
  }

  .profile-content {
    flex-grow: 1;
    padding: var(--spacing-0);
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
    align-items: center;
    gap: var(--gap-standard);
  }

  .avatar-wrapper {
    width: var(--avatar-medium-size);
    height: var(--avatar-medium-size);
    border-radius: var(--radius-standard);
    overflow: hidden;
  }

  .id-badge {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    color: var(--font-color-muted);
    padding: var(--padding-nano) var(--padding-tight);
    border: var(--border-whisper);
    border-radius: var(--radius-sharp);
  }

  /* .profile-fragments, .profile-side, and .profile-fields are now in design.css */

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
    margin: var(--spacing-0);
    font-size: var(--font-size-h5);
    font-weight: var(--font-weight-heavy);
    color: var(--signature-color);
    text-transform: uppercase;
    text-shadow: var(--shadow-font);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--gap-tight);
    transition: all var(--duration-standard);
    position: relative;
    line-height: var(--font-height-short);
    letter-spacing: var(--font-spacing-loose);
  }

  .label-prefix {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-nano);
    font-weight: var(--font-weight-bold);
    opacity: var(--opacity-moderate);
    color: var(--pure-white);
    letter-spacing: var(--font-spacing-loose);
  }

  .label-text {
    font-size: var(--font-size-h5);
    font-weight: var(--font-weight-heavy);
  }

  .add-hint {
    position: absolute;
    left: 0;
    top: calc(100% + var(--gap-standard));
    font-family: var(--font-family-mono);
    font-size: var(--font-size-nano);
    font-weight: var(--font-weight-heavy);
    color: var(--signature-color);
    opacity: var(--opacity-substantial);
    pointer-events: none;
    letter-spacing: var(--font-spacing-loose);
    white-space: nowrap;
    text-shadow: 0 0 var(--spacing-2) var(--signature-color);
  }

  .section-sub {
    margin: var(--spacing-0);
    font-size: var(--font-size-nano);
    color: var(--pure-white);
    font-weight: var(--font-weight-bold);
    opacity: var(--opacity-muted);
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
    font-weight: var(--font-weight-heavy);
    text-transform: uppercase;
    color: var(--signature-color);
    opacity: var(--opacity-solid);
    text-align: left;
    text-shadow: var(--shadow-font);
    margin-bottom: var(--margin-nano);
    width: 100%;
    letter-spacing: var(--font-spacing-loose);
    padding-left: var(--padding-nano);
    border-left: var(--border-width-base) solid var(--signature-color);
  }

  :global(.action-btn) {
    flex: 1;
    font-weight: var(--font-weight-heavy) !important;
    letter-spacing: var(--font-spacing-loose) !important;
    text-transform: uppercase !important;
  }

  :global(.action-btn.edit-trigger) {
    flex: 2;
  }

  .status {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-nano);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);
    color: var(--pure-white);
    opacity: var(--opacity-moderate);
    display: block;
    margin-top: var(--gap-tight);
  }

  :global(.text-area.custom-field) {
    height: 100%;
  }

  :global(.enhance-btn) {
    color: var(--pure-white);
    border: none;
    outline: none;
    box-shadow: none;
    background: transparent;
    filter: drop-shadow(
      0 var(--spacing-pixel) var(--spacing-2)
        rgb(from var(--void-black) r g b / var(--opacity-substantial))
    );
  }

  :global(.enhance-btn:hover) {
    background: transparent;
    color: var(--pure-white);
    transform: var(--scale-zoom);
  }

  /* --- RESPONSIVE OVERRIDES --- */

  .profile-fragments.is-mobile {
    display: flex;
    flex-direction: column;
    gap: var(--gap-loose);
  }

  .profile-modal.is-mobile .profile-side {
    text-align: center;
    border-bottom: var(--border-width-base) solid
      rgb(from var(--signature-color) r g b / var(--opacity-substantial));
    padding-right: var(--spacing-0);
    padding-bottom: var(--padding-tight);
    align-items: center;
  }

  .profile-modal.is-mobile .section-label {
    align-items: center;
  }

  .profile-modal.is-mobile .add-hint {
    position: relative;
    right: auto;
    top: auto;
    margin-top: var(--gap-tight);
  }
</style>
