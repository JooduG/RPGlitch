<script>
  /**
   * @file src/ui/profile/EntityFragments.svelte
   * THE TEMPORAL HYBRID FIELDS
   * Dynamically renders the Eternal, Present, Past, and Future sections.
   */
  import { llm_service } from "@core/intelligence/llm-service.js";
  import { prompt_builder } from "@core/intelligence/prompt-builder.js";
  import Button from "@atoms/Button.svelte";
  import TextField from "@atoms/TextField.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { get_value, set_value } from "@utils/field-path.js";
  import { fly } from "svelte/transition";
  import { PROFILE_SECTIONS } from "@core/intelligence/entity-fragments.js";
  import VectorArray from "@profile/VectorArray.svelte";

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

<div class="wrapper" data-testid="profile-fragments">
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
                      <svg viewBox="0 0 24 24" class="icon-xs icon-outline">
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
    gap: var(--spacing-l);
    margin: 0 calc(-1 * var(--spacing-m));
    padding: var(--spacing-xl) var(--spacing-m) var(--spacing-m);
  }

  .row {
    display: grid;
    grid-template-columns: minmax(60px, 80px) 1fr;
    gap: var(--spacing-m);
    min-width: 0;
  }

  /* --- SIDE LABEL --- */

  .side {
    text-align: right;
    align-self: center;
    padding: 0;
    cursor: default;
    transition: all var(--motion-l);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .side.interactive {
    cursor: pointer;
  }

  .section-label {
    margin: 0;
    font-size: var(--font-size-s);
    font-weight: var(--font-weight-xl);
    color: var(--signature-color);
    text-transform: uppercase;
    text-shadow: var(--shadow-font);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    transition: all var(--motion-l);
    position: relative;
  }

  .add-hint {
    position: absolute;
    right: calc(100% + var(--spacing-xxs));
    top: 50%;
    transform: translateY(-50%);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-xl);
    color: var(--color-white);
    opacity: 0.8;
    pointer-events: none;
    letter-spacing: var(--letter-spacing-l);
    white-space: nowrap;
    text-shadow: 0 0 8px rgb(var(--color-white-rgb) / 40%);
  }

  .section-sub {
    margin: 0;
    font-size: 10px;
    color: var(--font-color-m);
    font-weight: var(--font-weight-m);
    opacity: var(--opacity-m);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-l);
    text-shadow: var(--shadow-font);
  }

  /* --- BODY GRID --- */

  .body {
    display: grid;
    gap: var(--spacing-m);
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
    gap: var(--spacing-xxs);
    min-width: 0;
    justify-content: stretch;
    align-items: stretch;
    transition: z-index 0s;
  }

  .group:hover {
    z-index: calc(var(--z-index-xxl) + 1);
  }

  .field-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-xl);
    text-transform: uppercase;
    color: var(--signature-color);
    opacity: var(--opacity-full);
    text-align: center;
    text-shadow: var(--shadow-font);
    margin-bottom: var(--spacing-xxs);
    width: 100%;
  }

  /* --- STATUS --- */

  .status {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xxs);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-l);
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
    filter: drop-shadow(0 1px 2px rgb(var(--color-black-rgb) / 80%));
  }

  :global(.enhance-btn:hover) {
    background: transparent;
    color: var(--color-white);
    transform: scale(1.1);
  }

  /* --- RESPONSIVE --- */

  @media (width <= 600px) {
    .row {
      grid-template-columns: 1fr;
      gap: var(--spacing-xs);
    }

    .side {
      text-align: left;
      align-items: flex-start;
    }

    .body[data-columns] {
      grid-template-columns: 1fr;
    }
  }
</style>
