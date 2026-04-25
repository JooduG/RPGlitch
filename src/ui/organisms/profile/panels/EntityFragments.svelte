<script>
  /**
   * @file src/ui/organisms/profile/panels/EntityFragments.svelte
   * 🧩 THE TEMPORAL HYBRID FIELDS
   * Dynamically renders the Eternal, Present, Past, and Future sections.
   */
  import { llm_service } from "@core/intelligence/llm-service.js";
  import { prompt_builder } from "@core/intelligence/prompt-builder.js";
  import Button from "@ui/atoms/Button.svelte";
  import TextField from "@ui/atoms/TextField.svelte";
  import { get_value, set_value } from "@ui/utils/field-path.js";
  import { fly } from "svelte/transition";
  import { PROFILE_SECTIONS } from "../profile-config.js";
  import VectorArray from "./VectorArray.svelte";

  let { char = $bindable(), is_editing, busy_fields, active_field = $bindable() } = $props();

  // Track which section is hovered for the "Aperture" peek
  let hovered_section = $state(null);

  // Storage for VectorArray instances to call add_item()
  let vector_refs = $state({});

  /**
   * Utility to ensure the textarea receives an empty string for empty data.
   */
  const safe_get = (path) => {
    const val = get_value(char, path);
    return val === undefined || val === null ? "" : val;
  };

  function handle_label_click(sectionId, fieldKey) {
    if (!is_editing) return;
    if (vector_refs[fieldKey]) {
      vector_refs[fieldKey].add_item();
    }
  }
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

<div class="content" data-testid="profile-fragments">
  {#each PROFILE_SECTIONS as section (section.label)}
    <div class="row">
      <div
        class="label"
        class:interactive={is_editing && section.fields.some((f) => f.type === "array")}
        onclick={() => {
          const arrayField = section.fields.find((f) => f.type === "array");
          if (arrayField) handle_label_click(section.id, arrayField.key);
        }}
        onmouseenter={() => (hovered_section = section.id)}
        onmouseleave={() => (hovered_section = null)}
        role="presentation"
      >
        <div class="label-box">
          <h2 class="dynamic-label">
            {#if is_editing && hovered_section === section.id && section.fields.some((f) => f.type === "array")}
              <span class="label-add" transition:fly={{ x: -10, duration: 300 }}> ADD </span>
            {/if}
            {section.label}
          </h2>
          <p>{section.sublabel}</p>
        </div>
      </div>

      <div class={section.fields.length === 2 ? "split" : "full"}>
        {#each section.fields as field (field.key)}
          <div class="field-group tooltip-container">
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
                oninput={(e) => set_value(char, field.key, e.target.value)}
                busy={busy_fields.has(field.key)}
                onfocus={() => {
                  active_field = {
                    key: field.key,
                    label: field.label || section.label,
                  };
                }}
              >
                {#snippet actions()}
                  {#if is_editing}
                    <Button
                      variant="ghost"
                      size="sm"
                      square={true}
                      aria-label="Enhance with AI"
                      className="enhance-btn"
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
  .content {
    flex: 1;
    overflow: visible;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
  }

  .content .row {
    display: grid;
    grid-template-columns: var(--spacing-xxxxl) 1fr;
    gap: var(--spacing-s);
    min-width: 0;
  }

  .content .row .label {
    text-align: right;
    align-self: center;
    padding: 0;
    cursor: default;
    transition: all var(--motion-l);
  }

  .content .row .label.interactive {
    cursor: pointer;
  }

  .label-box {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .content .row .label h2 {
    margin: 0;
    font-size: var(--font-size-l);
    font-weight: var(--font-weight-l);
    color: var(--signature-color);
    text-transform: uppercase;
    text-shadow: var(--shadow-font);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    transition: all var(--motion-l);
    position: relative;
  }

  .label-add {
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

  .content .row .label.interactive:hover {
    filter: none;
    backdrop-filter: none;
  }

  .content .row .label p {
    margin: 0;
    font-size: var(--font-size-xs);
    color: var(--font-color-m);
    font-weight: var(--font-weight-l);
    opacity: var(--opacity-l);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-l);
    text-shadow: var(--shadow-font);
  }

  .content .row .split,
  .content .row .full {
    display: grid;
    gap: var(--spacing-m);
    min-width: 0;
  }

  .content .row .split {
    grid-template-columns: 1fr 1fr;
  }

  .content .row .full {
    grid-template-columns: 1fr;
  }

  .content .row .field-group {
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

  .content .row .field-group:hover {
    z-index: calc(var(--z-index-xxl) + 1); /* Above everything in the shell */
  }

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

  .content .row .field-group .field-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-xl);
    text-transform: uppercase;
    color: var(--signature-color);
    opacity: var(--opacity-full);
    margin-left: 0;
    text-align: center;
    text-shadow: var(--shadow-font);
    margin-bottom: var(--spacing-xxs);
    width: 100%;
  }
</style>
