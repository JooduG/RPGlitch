<script>
  /**
   * @file src/ui/profile/EntityFragments.svelte
   * THE TEMPORAL HYBRID FIELDS
   * Dynamically renders the Eternal, Present, Past, and Future sections.
   */
  import Button from "@atoms/Button.svelte";
  import TextField from "@atoms/TextField.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { PROFILE_SECTIONS } from "@core/intelligence/entity-fragments.js";
  import { llm_service } from "@core/intelligence/llm-service.js";
  import { prompt_builder } from "@core/intelligence/prompt-builder.js";
  import VectorArray from "@profile/VectorArray.svelte";
  import { app } from "@state/app.svelte.js";
  import { get_value, set_value } from "@utils/field-path.js";
  import { fly } from "svelte/transition";

  let { char = $bindable(), is_editing, busy_fields, active_field = $bindable() } = $props();

  /** @type {string | null} */
  let hovered_section = $state(null);

  /** @type {Record<string, any>} */
  let vector_refs = $state({});

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

<div
  class="wrapper"
  class:is-mobile={app.viewport.mobile}
  class:is-mini={app.viewport.mini}
  data-testid="profile-fragments"
>
  {#each PROFILE_SECTIONS as section (section.id)}
    {@const arrayField = section.fields.find((f) => f.type === "array")}
    <div class="row">
      <div
        class="side"
        class:interactive={is_editing && arrayField}
        onclick={() => handle_add_click(arrayField?.key)}
        onmouseenter={() => (hovered_section = section.id)}
        onmouseleave={() => (hovered_section = null)}
        role="presentation"
      >
        <h2 class="section-label">
          {#if is_editing && hovered_section === section.id && arrayField}
            <span class="add-hint" transition:fly={{ x: -10, duration: 300 }}>ADD</span>
          {/if}
          {section.label}
        </h2>
        {#if section.sublabel}
          <p class="section-sub">{section.sublabel}</p>
        {/if}
      </div>

      <div class="body" data-columns={section.fields.length}>
        {#each section.fields as field (field.key)}
          <div class="group">
            {#if field.label && section.id === "eternal"}
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
                    label: field.label || section.label,
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
                      size="sm"
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
                          fill="var(--color-white)"
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
    </div>
  {/each}
</div>

<style>
  /* --- LAYOUT --- */

  .wrapper {
    flex: 1;
    overflow: visible;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
    margin: 0 calc(-1 * var(--spacing-4));
    padding: var(--spacing-8) var(--spacing-4) var(--spacing-4);
  }

  .row {
    display: grid;
    grid-template-columns: minmax(60px, 80px) 1fr;
    gap: var(--spacing-4);
    min-width: 0;
  }

  /* --- SIDE LABEL --- */

  .side {
    text-align: right;
    align-self: center;
    padding: 0;
    cursor: default;
    transition: all var(--duration-standard);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .side.interactive {
    cursor: pointer;
  }

  .section-label {
    margin: 0;
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-heavy);
    color: var(--signature-color);
    text-transform: uppercase;
    text-shadow: var(--shadow-font);
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    transition: all var(--duration-standard);
    position: relative;
  }

  .add-hint {
    position: absolute;
    right: calc(100% + var(--spacing-1));
    top: 50%;
    transform: translateY(-50%);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-heavy);
    color: var(--color-white);
    opacity: 0.8;
    pointer-events: none;
    letter-spacing: var(--font-spacing-l);
    white-space: nowrap;
    text-shadow: var(--spacing-0) var(--spacing-0) var(--spacing-2)
      rgb(from var(--color-white) r g b / 40%);
  }

  .section-sub {
    margin: 0;
    font-size: var(--font-size-tiny);
    color: var(--font-color-base);
    font-weight: var(--font-weight-bold);
    opacity: var(--opacity-muted);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-l);
    text-shadow: var(--shadow-font);
  }

  /* --- BODY GRID --- */

  .body {
    display: grid;
    gap: var(--spacing-4);
    min-width: 0;
  }

  .body[data-columns="2"] {
    grid-template-columns: 1fr 1fr;
  }

  .body[data-columns="1"] {
    grid-template-columns: 1fr;
  }

  /* --- FIELD GROUP --- */

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
    transition: z-index 0s;
  }

  .group:hover {
    z-index: var(--overlay-peak-z-index);
  }

  .field-label {
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-heavy);
    text-transform: uppercase;
    color: var(--signature-color);
    opacity: var(--opacity-full);
    text-align: center;
    text-shadow: var(--shadow-font);
    margin-bottom: var(--spacing-1);
    width: 100%;
  }

  /* --- STATUS --- */

  .status {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-nano);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-l);
    color: var(--color-white);
    opacity: 0.7;
  }

  /* --- GLOBAL OVERRIDES --- */

  :global(.text-area.custom-field) {
    height: 100%;
  }

  :global(.enhance-btn) {
    color: var(--color-white);
    border: none;
    outline: none;
    box-shadow: none;
    background: transparent;
    filter: drop-shadow(
      var(--spacing-0) var(--spacing-px) var(--spacing-xxxs)
        rgb(from var(--color-black) r g b / 80%)
    );
  }

  :global(.enhance-btn:hover) {
    background: transparent;
    color: var(--color-white);
    transform: scale(1.1);
  }

  /* --- RESPONSIVE --- */

  .wrapper.is-mobile .row {
    grid-template-columns: 1fr;
    gap: var(--spacing-2);
  }

  .wrapper.is-mobile .side {
    text-align: left;
    align-items: flex-start;
  }

  .wrapper.is-mobile .body[data-columns] {
    grid-template-columns: 1fr;
  }
</style>
