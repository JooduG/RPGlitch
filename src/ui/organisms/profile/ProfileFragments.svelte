<script>
  /**
   * @file ProfileFragments.svelte
   * 🧩 THE TEMPORAL HYBRID FIELDS
   * Dynamically renders the Eternal, Present, Past, and Future sections.
   */

  import TextField from "@ui/atoms/TextField.svelte";
  import { PROFILE_SECTIONS } from "./config.js";
  import VectorPanel from "./VectorPanel.svelte";
  let {
    char = $bindable(),
    is_editing,
    get_value,
    set_value,
    busy_fields,
    render_markdown,
    active_field = $bindable(), // eslint-disable-line no-useless-assignment
  } = $props();
  /**
   * Utility to ensure the textarea receives an empty string for empty data.
   * This is required for the HTML 'placeholder' attribute to trigger.
   */
  const safe_get = (path) => {
    const val = get_value(char, path);
    return val === undefined || val === null ? "" : val;
  };
</script>

<div class="content" data-testid="profile-fragments">
  {#each PROFILE_SECTIONS as section (section.label)}
    <div class="row">
      <div class="label">
        <h2>{section.label}</h2>
        <p>{section.sublabel}</p>
      </div>
      <div class={section.fields.length === 2 ? "split" : "full"}>
        {#each section.fields as field (field.key)}
          <div class="field-group">
            {#if field.label && section.id === "eternal"}
              <span class="field-label">{field.label}</span>
            {/if}
            {#if field.type === "array"}
              <VectorPanel
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
                class="text-area custom-field"
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
                {render_markdown}
              />
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
    grid-template-columns: var(--spacing-xxxl) 1fr;
    gap: var(--spacing-s);
    min-width: 0;
  }

  .content .row .label {
    text-align: right;
    align-self: center;
    padding: 0;
  }

  .content .row .label h2 {
    margin: 0;
    font-size: var(--font-size-l);
    font-weight: var(--font-weight-l);
    color: var(--signature-color);
    text-transform: uppercase;
    text-shadow:
      var(--shadow-font),
      0 0 var(--spacing-s) rgb(var(--signature-rgb) / var(--opacity-m));
    display: inline-block;
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
    justify-content: center;
  }

  .content .row .field-group .field-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-xl);
    text-transform: uppercase;
    color: var(--signature-color);
    opacity: var(--opacity-full);
    margin-left: var(--spacing-xxs);
    text-align: center;
    text-shadow: var(--shadow-font);
    margin-bottom: var(--spacing-xxs);
  }
</style>
