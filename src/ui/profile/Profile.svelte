<script>
  /**
   * @file src/ui/profile/Profile.svelte
   * 🧬 ENTITY EDITOR — Primary orchestrator for viewing and editing entities.
   * Chalk Regime UI · Flat DOM · Bolted Architecture
   */
  import { entities } from "@/data/repository.js";
  import Dialog from "@atoms/Dialog.svelte";
  import Button from "@atoms/Button.svelte";
  import Modal from "@atoms/Modal.svelte";
  import ProfilePicture from "@atoms/ProfilePicture.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { PROFILE_SECTIONS, ENTITY_FRAGMENTS } from "@/core/intelligence/entity-fragments.js";
  import { llm_service } from "@core/intelligence/llm-service.js";
  import { prompt_builder } from "@core/intelligence/prompt-builder.js";
  import { normalize } from "@data/content-normaliser.js";
  import { get_value, set_value } from "@utils/field-path.js";
  import DevWing from "@devmode/DevWing.svelte";
  import AudioWing from "@profile/AudioWing.svelte";
  import VisualWing from "@profile/VisualWing.svelte";
  import VectorArray from "@profile/VectorArray.svelte";
  import TextField from "@atoms/TextField.svelte";
  import { app } from "@state/app.svelte.js";
  import { runtime } from "@state/runtime.svelte.js";
  import { themeStore } from "@theme/palette.svelte.js";
  import { auto_resize } from "@utils/auto-resize.js";
  import { fit_text } from "@utils/fit-text.js";
  import { SvelteSet } from "svelte/reactivity";
  import { fly } from "svelte/transition";

  const DEFAULT_FIELD = { key: "visual-prompt", label: "Image Prompt" };

  /** @type {{ entity_type?: "character" | "fractal" }} */
  let { entity_type = "character" } = $props();

  // --- STATE ---

  let is_editing = $state(false);
  let is_saving = $state(false);
  let show_delete_confirm = $state(false);

  /** @type {SvelteSet<string>} */
  let busy_fields = new SvelteSet();

  /** @type {{key: string, label: string} | null} */
  let active_field = $state(DEFAULT_FIELD);

  /** @type {any} */
  let char = $state(normalize(app.editing_entity || runtime.character));

  /** @type {string | null} */
  let hovered_section = $state(null);

  /** @type {Record<string, any>} */
  let vector_refs = $state({});

  // --- DERIVED ---

  const signature_color = $derived(themeStore.get_signature_color(char));
  const is_name_active = $derived(active_field?.key === "name");

  // --- EFFECTS ---

  $effect(() => {
    if (app.editing_entity) char = normalize(app.editing_entity);
  });

  // --- HANDLERS ---

  /**
   * Closes the profile modal or exits editing mode.
   */
  function handle_close() {
    if (is_editing) {
      is_editing = false;
    } else {
      app.toggle_profile(false);
    }
  }

  /**
   * Saves the current entity state to the repository.
   */
  async function handle_save() {
    is_editing = false;
    is_saving = true;
    try {
      await runtime.save_entity(entity_type, char);

      if (entity_type === "character") {
        const characters = await entities.list("character");
        app.ai_list = characters;
        app.user_list = characters;

        const updated = characters.find((/** @type {any} */ e) => e.id === char.id);
        if (app.selected_ai?.id === char.id) app.selected_ai = updated;
        if (app.selected_user?.id === char.id) app.selected_user = updated;
      } else if (entity_type === "fractal") {
        const fractals = await entities.list("fractal");
        app.fractal_list = fractals;

        const updated = fractals.find((/** @type {any} */ e) => e.id === char.id);
        if (app.selected_fractal?.id === char.id) app.selected_fractal = updated;
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
      is_editing = true;
    } finally {
      is_saving = false;
    }
  }

  /**
   * Deletes the current entity after confirmation.
   */
  async function handle_delete() {
    try {
      await runtime.delete_entity(entity_type, char.id);
      handle_close();
    } catch (err) {
      console.error("Failed to delete entity:", err);
    }
  }

  /**
   * Resets active field when focus leaves the card.
   */
  function handle_focus_out() {
    setTimeout(() => {
      const active = document.activeElement;
      const is_input =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable);
      const is_wing = active?.closest?.(".wings, .dropdown");

      if (!is_input && !is_wing && busy_fields.size === 0) {
        active_field = DEFAULT_FIELD;
      }
    }, 50);
  }

  /** @param {MouseEvent} e */
  function handle_bg_click(e) {
    const target = e.target instanceof Element ? e.target : null;
    if (
      !target?.closest?.(
        "textarea, input, button, .swatch, .wings, .dropdown, .card, [contenteditable]",
      )
    ) {
      if (is_editing) {
        is_editing = false;
        active_field = DEFAULT_FIELD;
      } else {
        handle_close();
      }
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    }
  }

  // --- FRAGMENT HANDLERS ---

  /**
   * Returns the field value, defaulting to an empty string.
   * @param {string} path
   */
  const safe_get = (path) => {
    const val = get_value(char, path);
    return val === undefined || val === null ? "" : val;
  };

  /**
   * Delegates to a VectorArray instance to prepend a new item.
   * @param {string | undefined} fieldKey
   */
  function handle_add_click(fieldKey) {
    if (!is_editing || !fieldKey) return;
    vector_refs[fieldKey]?.add_item();
  }

  /**
   * Streams an AI enhancement for a plain-text field.
   * @param {string} fieldKey
   * @param {string} value
   */
  async function handle_enhance(fieldKey, value) {
    if (!value || busy_fields.has(fieldKey)) return;
    busy_fields.add(fieldKey);
    try {
      const payload = prompt_builder.build_enhancement(fieldKey, value);
      const result = await llm_service.enhance(payload);
      if (result) set_value(char, fieldKey, result);
    } catch (err) {
      console.error("Enhance failed:", err);
    } finally {
      busy_fields.delete(fieldKey);
    }
  }
</script>

{#if char?.id}
  <Dialog
    type="confirm"
    bind:open={show_delete_confirm}
    title="Delete {char.name || 'Entity'}"
    message="This action is irreversible. All associated data, including history and vectors, will be lost."
    confirm_label="Delete Permanently"
    on_confirm={handle_delete}
  />

  <Modal variant="profile" on_close={handle_close}>
    <div
      class="root"
      class:is-editing={is_editing}
      class:is-dev={app.settings.dev_mode}
      class:is-mobile={app.viewport.mobile}
      class:is-mini={app.viewport.mini}
      onclick={handle_bg_click}
      onfocusout={handle_focus_out}
      role="presentation"
      data-is-editing={is_editing}
    >
      <!-- 🧱 BOLTED ASSEMBLY: Card + Wings -->
      <div class="card scrollbar" style="--signature-color: {signature_color};">
        <div class="signature-bar"></div>

        <div class="avatar-column">
          <ProfilePicture entity={char} />
        </div>

        <!-- ── Header ────────────────────────────────────────── -->
        <header
          class="header"
          class:is-editing={is_editing}
          class:is-mobile={app.viewport.mobile}
          class:is-mini={app.viewport.mini}
          data-testid="profile-header"
        >
          {#if is_editing}
            <h1
              class="name edit"
              class:is-active={is_name_active}
              use:tooltip={{ text: "Edit Entity Name" }}
              aria-label="Edit Entity Name"
            >
              <span
                contenteditable="true"
                bind:innerText={char.name}
                role="textbox"
                tabindex="0"
                data-placeholder={ENTITY_FRAGMENTS.name}
                onfocus={() => (active_field = { key: "name", label: "Entity Name" })}
              ></span>
            </h1>
          {:else}
            <h1
              class="name"
              use:tooltip={{ text: "Entity Name" }}
              aria-label="Entity Name"
              use:fit_text={{ minSize: 40 }}
            >
              {char.name || ENTITY_FRAGMENTS.name}
            </h1>
          {/if}

          {#if is_editing}
            <textarea
              class="description edit scrollbar"
              use:tooltip={{ text: "Edit Entity Description" }}
              placeholder={ENTITY_FRAGMENTS.description}
              bind:value={char.description}
              use:auto_resize
              aria-label="Edit Entity Description"
              onfocus={() => (active_field = null)}
            ></textarea>
          {:else}
            <p class="description" data-placeholder={ENTITY_FRAGMENTS.description}>
              {char.description || ""}
            </p>
          {/if}
        </header>

        <!-- ── Body ──────────────────────────────────────────── -->
        <div class="body scrollbar">
          <div class="content">
            {@render EntityBody()}
          </div>
        </div>

        <!-- ── Footer ────────────────────────────────────────── -->
        <footer
          class="footer"
          class:is-mobile={app.viewport.mobile}
          class:is-mini={app.viewport.mini}
          data-testid="entity-footer"
        >
          <div class="actions">
            {#if is_editing}
              <Button
                variant="danger"
                className="action-btn"
                onclick={() => (show_delete_confirm = true)}
                disabled={is_saving}
                data-testid="delete-button"
              >
                Delete Entity
              </Button>
              <Button
                variant="secondary"
                className="action-btn"
                onclick={handle_save}
                disabled={is_saving}
                data-testid="save-button"
              >
                {is_saving ? "Finalizing..." : "Commit Changes"}
              </Button>
            {:else}
              <div class="footer-meta">
                <span class="meta-label">ID:</span>
                <span class="meta-value">{char.id.slice(0, 8)}</span>
              </div>
              <Button
                variant="secondary"
                className="action-btn edit-trigger"
                onclick={() => (is_editing = true)}
                data-testid="edit-button"
              >
                Initialize Edit Mode
              </Button>
            {/if}
          </div>
        </footer>
      </div>

      <aside class="wings scrollbar" class:is-visible={is_editing || app.settings.dev_mode}>
        {#if is_editing}
          <VisualWing bind:char {is_editing} {busy_fields} bind:active_field />
          <AudioWing bind:char {is_editing} />
        {/if}
        {#if app.settings.dev_mode}
          <DevWing bind:char {is_editing} />
        {/if}
      </aside>
    </div>
  </Modal>
{/if}

{#snippet EntityBody()}
  <div
    class="fragments"
    class:is-mobile={app.viewport.mobile}
    class:is-mini={app.viewport.mini}
    data-testid="profile-fragments"
  >
    {#each PROFILE_SECTIONS as section, i (section.id)}
      {@const arrayField = section.fields.find((f) => f.type === "array")}
      {@const sectionIndex = String(i + 1).padStart(2, "0")}

      <!-- SECTION LABEL (Left Column) -->
      <div
        class="side"
        class:interactive={is_editing && arrayField}
        onclick={() => handle_add_click(arrayField?.key)}
        onmouseenter={() => (hovered_section = section.id)}
        onmouseleave={() => (hovered_section = null)}
        role="presentation"
      >
        <div class="label-wrapper">
          <h2 class="section-label">
            <span class="label-prefix">[{sectionIndex}]</span>
            <span class="label-text">{section.label}</span>
            {#if is_editing && hovered_section === section.id && arrayField}
              <span class="add-hint" transition:fly={{ x: -10, duration: 300 }}>+ ADD</span>
            {/if}
          </h2>
          {#if section.sublabel}
            <p class="section-sub">{section.sublabel}</p>
          {/if}
        </div>
      </div>

      <!-- SECTION FIELDS (Right Column) -->
      <div class="fields-container" data-columns={section.fields.length}>
        {#each section.fields as field (field.key)}
          <div class="group">
            {#if field.label && (section.id === "eternal" || section.id === "present")}
              <span class="field-label">{field.label}</span>
            {/if}

            {#if field.type === "array"}
              <VectorArray
                bind:this={vector_refs[field.key]}
                {char}
                path={field.key}
                {is_editing}
                {get_value}
                {set_value}
                unit_label={field.unitLabel}
                signature_color="var(--signature-color)"
              />
            {:else}
              <TextField
                is_edit={is_editing}
                syncId={section.label}
                signature_color="var(--signature-color)"
                class="text-area custom-field {active_field?.key === field.key ? 'active' : ''}"
                placeholder={field.description}
                value={safe_get(field.key)}
                oninput={(/** @type {any} */ e) =>
                  set_value(char, field.key, e.currentTarget.value)}
                busy={busy_fields.has(field.key)}
                onfocus={() => {
                  active_field = {
                    key: field.key,
                    label: field.label || section.label || "",
                  };
                }}
              >
                {#snippet status()}
                  {#if busy_fields.has(field.key)}
                    <span class="status pulse">ENHANCING</span>
                  {/if}
                {/snippet}

                {#snippet header_actions()}
                  {#if is_editing}
                    <Button
                      variant="invisible"
                      size="small"
                      square={true}
                      aria-label="Enhance with AI"
                      className="enhance-btn"
                      actions={[tooltip]}
                      disabled={busy_fields.has(field.key) || !safe_get(field.key)}
                      onclick={() => handle_enhance(field.key, safe_get(field.key))}
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
  /* ── Root 12x12 Grid ───────────────────────────────────────── */

  .root {
    display: grid;
    grid-template-columns:
      [col-a] 1fr
      [col-b] 1fr
      [col-c] 1fr
      [col-d] 1fr
      [col-e] 1fr
      [col-f] 1fr
      [col-g] 1fr
      [col-h] 1fr
      [col-i] 1fr
      [col-j] 1fr
      [col-k] 1fr
      [col-l] 1fr
      [col-end];
    grid-template-rows:
      [row-1] 1fr
      [row-2] 1fr
      [row-3] 1fr
      [row-4] 1fr
      [row-5] 1fr
      [row-6] 1fr
      [row-7] 1fr
      [row-8] 1fr
      [row-9] 1fr
      [row-10] 1fr
      [row-11] 1fr
      [row-12] 1fr
      [row-end];
    width: var(--grid-width);
    height: var(--grid-height);
    margin: auto;
    overflow: visible;
    position: relative;
    pointer-events: none;
  }

  /* ── Wings sidebar ─────────────────────────────────────────── */

  .wings {
    grid-column: col-j / col-l; /* Anchor to columns 10-11 */
    grid-row: row-3 / row-11;
    width: 100%;
    height: 100%;
    opacity: 0;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: var(--gap-standard);
    z-index: var(--overlay-peak-z-index);
    transition: all var(--duration-standard) var(--ease-standard);
    transform: scale(0.95) translateX(var(--spacing-4));
    --scrollbar-thumb: rgb(from var(--pure-white) r g b / var(--opacity-muted));
    --scrollbar-thumb-hover: rgb(from var(--pure-white) r g b / var(--opacity-heavy));
  }

  .wings.is-visible {
    opacity: var(--opacity-solid);
    pointer-events: auto;
    transform: scale(1) translateX(0);
    overflow-y: auto;
  }

  .root.is-editing .wings {
    grid-column: col-i / col-l;
  }

  /* ── Card (glassmorphic entity panel) ─────────────────────── */

  .card {
    grid-column: col-d / col-j; /* Bolted position: Centered (3-6-3) */
    grid-row: row-3 / row-11;
    pointer-events: auto;
    width: 100%;
    height: 100%;
    background: var(--glass-elevated);
    backdrop-filter: var(--glass-elevated-blur);
    border-radius: var(--radius-standard);
    box-shadow: var(--shadow-heavy);
    position: relative;
    overflow: hidden;
    z-index: var(--overlay-z-index);

    /* Internal Bolted Grid */
    display: grid;
    grid-template-columns: var(--avatar-medium-size) 1fr;
    grid-template-rows: [header] auto [body] 1fr [footer] auto;
    gap: 0;
    transition: all var(--duration-standard) var(--ease-standard);
  }

  .root.is-editing .card {
    grid-column: col-b / col-h;
  }

  /* ── Signature accent bar ──────────────────────────────────── */

  .signature-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: var(--spacing-pixel);
    background: linear-gradient(
      90deg,
      transparent,
      var(--signature-color) 15%,
      var(--signature-color) 85%,
      transparent
    );
    z-index: var(--max-z-index);
    pointer-events: none;
    box-shadow: 0 0 var(--spacing-2) var(--signature-color);
    opacity: 0.8;
  }

  /* ── Avatar column ─────────────────────────────────────────── */

  .avatar-column {
    grid-column: 1;
    grid-row: 1 / -1; /* Bolt to full height */
    width: var(--avatar-medium-size);
    height: 100%;
    display: flex;
    flex-direction: column;
    background: transparent;
    overflow: hidden;
    border-right: var(--spacing-pixel) solid
      rgb(from var(--pure-white) r g b / var(--opacity-ghost));
  }

  /* ── Header ────────────────────────────────────────────────────────── */

  .header {
    grid-column: 2;
    grid-row: header;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    width: 100%;
    padding: var(--spacing-4);
    background: color-mix(
      in srgb,
      rgb(from var(--gunmetal) r g b / var(--opacity-ghost)),
      var(--signature-color) 8%
    );
    z-index: var(--surface-z-index);
    border-bottom: var(--spacing-pixel) solid
      rgb(from var(--pure-white) r g b / var(--opacity-ghost));
  }

  .name {
    width: 100%;
    margin: 0;
    padding: var(--spacing-1);
    color: var(--signature-color);
    font-size: var(--font-size-h3);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--font-spacing-tight);
    text-shadow: var(--shadow-font);
    text-align: left;
    line-height: var(--font-height-short);
    min-height: calc(var(--spacing-12) * 1.5);
    outline: none;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    transition: all var(--duration-standard);
  }

  .name.edit {
    cursor: text;
    caret-color: var(--signature-color);
  }

  .name.edit span {
    display: inline-block;
    min-width: var(--spacing-pixel);
    outline: none;
  }

  .name.edit span:empty::before {
    content: attr(data-placeholder);
    color: var(--frisk);
    opacity: var(--opacity-muted);
    font-style: italic;
    pointer-events: none;
  }

  .description {
    width: 100%;
    margin: 0;
    margin-top: var(--spacing-pixel);
    padding: var(--spacing-1) var(--spacing-2);
    color: var(--pure-white);
    font-family: var(--font-family-base);
    font-size: var(--font-size-base);
    line-height: var(--font-height-base);
    opacity: 0.7;
    white-space: pre-wrap;
    transition: opacity var(--duration-fast);
  }

  .description.edit {
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    opacity: var(--opacity-heavy);
  }

  .description.edit:focus {
    opacity: var(--opacity-solid);
  }

  .description:empty::before {
    content: attr(data-placeholder);
    color: var(--frisk);
    opacity: var(--opacity-muted);
    font-style: italic;
  }

  /* ── Body column (scrollable container) ───────────────────── */

  .body {
    grid-column: 2;
    grid-row: body;
    overflow-y: auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .content {
    flex: 1;
    padding: var(--spacing-2) 0;
  }

  /* ── Footer ────────────────────────────────────────────────────────── */

  .footer {
    grid-column: 2;
    grid-row: footer;
    position: relative;
    padding: var(--padding-standard);
    background: color-mix(
      in srgb,
      rgb(from var(--gunmetal) r g b / var(--opacity-whisper)),
      var(--signature-color) 10%
    );
    z-index: var(--overlay-z-index);
    border-top: var(--spacing-pixel) solid rgb(from var(--pure-white) r g b / var(--opacity-ghost));
  }

  .actions {
    display: flex;
    gap: var(--spacing-4);
    width: 100%;
  }

  :global(.actions > *) {
    flex: 1;
  }

  /* ── Responsive ────────────────────────────────────────────── */

  .root.is-mobile {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    height: 100%;
    justify-content: flex-start;
    padding: 0;
    overflow-y: auto;
    pointer-events: auto;
  }

  .root.is-mobile .card {
    grid-column: auto;
    grid-row: auto;
    flex: 1 0 auto;
    border-radius: 0;
    display: flex;
    flex-direction: column;
    overflow: visible;
  }

  .root.is-mobile .avatar-column {
    flex: 0 0 auto;
    aspect-ratio: var(--aspect-square);
    border-radius: 0;
    border-right: none;
    border-bottom: var(--spacing-pixel) solid
      rgb(from var(--pure-white) r g b / var(--opacity-ghost));
  }

  .root.is-mobile .header,
  .root.is-mobile .body,
  .root.is-mobile .footer {
    grid-column: auto;
    grid-row: auto;
    width: 100%;
  }

  .root.is-mobile .header {
    padding: var(--spacing-4);
  }

  .root.is-mobile .body {
    overflow-y: visible;
    padding: 0;
  }

  .root.is-mobile .wings {
    grid-column: auto;
    grid-row: auto;
    width: 100%;
    max-height: 40vh;
    padding: var(--spacing-4);
    transform: none;
    opacity: 1;
    pointer-events: auto;
  }

  .root.is-mini .header {
    padding: var(--spacing-2);
  }

  .root.is-mini .name {
    font-size: var(--font-size-h5);
  }

  /* --- FRAGMENTS GRID --- */

  .fragments {
    display: grid;
    grid-template-columns: var(--profile-fragment-column) 1fr;
    gap: var(--spacing-10) var(--spacing-6);
    padding: var(--spacing-6) var(--spacing-4);
    min-width: 0;
  }

  .side {
    text-align: left;
    cursor: default;
    transition: all var(--duration-standard);
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    border-left: var(--spacing-pixel) solid
      rgb(from var(--signature-color) r g b / var(--opacity-substantial));
    padding-left: var(--spacing-4);
  }

  .label-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    width: 100%;
  }

  .side.interactive {
    cursor: pointer;
  }

  .section-label {
    margin: 0;
    font-size: var(--font-size-h5);
    font-weight: var(--font-weight-heavy);
    color: var(--signature-color);
    text-transform: uppercase;
    text-shadow: var(--shadow-font);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-1);
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
    top: calc(100% + var(--spacing-2));
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
    margin: 0;
    font-size: var(--font-size-nano);
    color: var(--pure-white);
    font-weight: var(--font-weight-bold);
    opacity: var(--opacity-muted);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);
    text-shadow: var(--shadow-font);
    font-style: italic;
  }

  .fields-container {
    display: grid;
    gap: var(--spacing-4);
    min-width: 0;
    align-items: stretch;
  }

  .fields-container[data-columns="2"] {
    grid-template-columns: 1fr 1fr;
  }

  .fields-container[data-columns="1"] {
    grid-template-columns: 1fr;
  }

  .group {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
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
    margin-bottom: var(--spacing-1);
    width: 100%;
    letter-spacing: var(--font-spacing-loose);
    padding-left: var(--spacing-1);
    border-left: var(--spacing-pixel) solid var(--signature-color);
  }

  .footer-meta {
    display: flex;
    gap: var(--spacing-2);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-nano);
    opacity: var(--opacity-moderate);
    align-items: center;
  }

  .meta-label {
    color: var(--signature-color);
  }

  .meta-value {
    color: var(--pure-white);
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
      var(--spacing-0) var(--spacing-pixel) var(--spacing-2)
        rgb(from var(--void-black) r g b / var(--opacity-substantial))
    );
  }

  :global(.enhance-btn:hover) {
    background: transparent;
    color: var(--pure-white);
    transform: var(--scale-zoom);
  }

  /* --- RESPONSIVE OVERRIDES --- */

  .fragments.is-mobile {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-8);
  }

  .root.is-mobile .side {
    text-align: center;
    border-bottom: var(--spacing-pixel) solid
      rgb(from var(--signature-color) r g b / var(--opacity-substantial));
    padding-right: 0;
    padding-bottom: var(--spacing-2);
    align-items: center;
  }

  .root.is-mobile .section-label {
    align-items: center;
  }

  .root.is-mobile .add-hint {
    position: relative;
    right: auto;
    top: auto;
    margin-top: var(--spacing-2);
  }
</style>
