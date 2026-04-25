<script>
  import { auto_resize } from "@ui/utils/actions/auto-resize.js";
  import { parse_markdown } from "@ui/utils/markdown.js";

  let {
    value = $bindable(""),
    is_edit = false,
    placeholder = "Enter text...",
    syncId = null,
    busy = false,
    disabled = false,
    oninput = undefined,
    onfocus = undefined,
    onblur = undefined,
    class: className = "",
    style = "",
    actions = null, // Snippet for the expanding header
    weight = 0, // 0-10 for the weight line thickness/glow
    noBackground = false, // If true, removes background and border
  } = $props();

  let isFocused = $state(false);
  let paragraphs = $derived(parse_markdown(value));

  // Only allow header expansion if we are editing or specifically allowed
  let canExpand = $derived(is_edit && !!actions);

  function handle_focus(e) {
    if (!is_edit && !actions) return;
    isFocused = true;
    onfocus?.(e);
  }

  function handle_focus_out(e) {
    // If the new focus target is still inside the chassis, don't collapse
    if (e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    isFocused = false;
    onblur?.(e);
  }
</script>

<div
  class="field-chassis {className}"
  class:is-focused={isFocused && canExpand}
  class:has-actions={!!actions}
  class:no-background={noBackground}
  style="{style}; --weight-intensity: {weight / 10}; --header-opacity: {weight > 0
    ? 0.2 + (weight / 10) * 0.8
    : 0.8}; --header-bg-mix: {weight > 0 ? (0.2 + (weight / 10) * 0.8) * 100 : 100}%;"
  onfocusout={handle_focus_out}
>
  {#if actions}
    <div class="field-header">
      <div class="header-actions">
        {@render actions()}
      </div>
    </div>
  {/if}

  <div class="field-body">
    {#if is_edit}
      <textarea
        class="field-foundation"
        class:busy
        class:disabled
        bind:value
        {placeholder}
        {oninput}
        onfocus={handle_focus}
        disabled={disabled || busy}
        use:auto_resize={{ syncId }}
        data-sync-id={syncId}
      ></textarea>
    {:else}
      <div
        class="readonly-field"
        data-sync-id={syncId}
        use:auto_resize={{ syncId }}
        tabindex={actions ? "0" : "-1"}
        onfocus={handle_focus}
        role="textbox"
        aria-readonly="true"
      >
        {#if paragraphs.length > 0}
          {#each paragraphs as tokens, i (i)}
            <div class="paragraph" class:mt={i > 0}>
              {#each tokens as token, j (token.content + j)}
                {#if token.type === "text"}{token.content}{:else if token.type === "strong"}<strong
                    >{token.content}</strong
                  >{:else if token.type === "em"}<em>{token.content}</em
                  >{:else if token.type === "strong-em"}<strong><em>{token.content}</em></strong
                  >{/if}
              {/each}
            </div>
          {/each}
        {:else}
          <span class="placeholder">{placeholder}</span>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .field-chassis {
    width: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    position: relative;
    border-radius: var(--border-radius-m);
    transition: all var(--motion-l) var(--motion-elastic);
    background: var(--glass-xs);
    border: var(--border-l);
    overflow: hidden;
  }

  .field-chassis.no-background {
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .field-chassis.is-focused {
    border-color: var(--color-white);
    box-shadow: 0 0 15px rgb(var(--color-white-rgb) / 5%);
    background: var(--glass-xs);
    overflow: visible; /* Allow tooltips to bleed out */
  }

  /* --- HEADER LOGIC --- */
  .field-header {
    height: 2px; /* Dormant 'Weight Line' */
    background: var(--signature-color, var(--color-frozen));
    transition: all var(--motion-l) var(--motion-elastic);
    display: flex;
    flex-direction: column;
    overflow: visible; /* Allow glow to breathe */
    opacity: var(--header-opacity);
    position: relative;
    top: 1px; /* Visual offset to prevent top-border clash */

    /* Account for 1px chassis border to prevent bleed in dormant state */
    border-radius: calc(var(--border-radius-m) - 1px) calc(var(--border-radius-m) - 1px) 0 0;

    /* Passive Glow */
    box-shadow: 0 0 calc(var(--weight-intensity) * 6px) var(--signature-color);
  }

  .field-chassis.is-focused .field-header {
    height: 2.2rem;
    background: color-mix(
      in srgb,
      rgb(var(--color-black-rgb) / 50%),
      var(--signature-color, var(--color-frozen)) var(--header-bg-mix)
    );
    border-bottom: 1px solid rgb(var(--color-white-rgb) / 8%);
    opacity: 1;
    top: 0; /* Snap back to top in focused state */
    overflow: visible; /* Allow tooltips and glow to breathe */
    box-shadow: 0 0 calc(var(--weight-intensity) * 12px)
      rgb(from var(--signature-color) r g b / 15%);
  }

  .header-actions {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end; /* Align actions to the right */
    padding: 0 var(--spacing-s);
    opacity: 0;
    transform: translateY(-5px);
    transition: all var(--motion-m);
  }

  .field-chassis.is-focused .header-actions {
    opacity: 1;
    transform: translateY(0);
  }

  /* --- BODY LOGIC --- */
  .field-body {
    width: 100%;
    position: relative;
  }

  .field-foundation {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--color-white);
    font-family: var(--font-family-body);
    font-size: var(--font-size-s);
    line-height: var(--line-height-m);
    padding: var(--spacing-s);
    resize: none;
    overflow: hidden auto;
    max-height: 15rem;
    text-align: left;
    outline: none;
  }

  /* Custom Scrollbar */
  .field-foundation::-webkit-scrollbar,
  .readonly-field::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  .field-foundation::-webkit-scrollbar-thumb,
  .readonly-field::-webkit-scrollbar-thumb {
    background: var(--color-border-l);
    border-radius: var(--border-radius-full);
  }

  .field-foundation::placeholder {
    color: var(--color-frisk);
    font-style: italic;
    font-weight: var(--font-weight-m);
    opacity: 1;
  }

  .field-foundation.busy {
    cursor: wait;
  }

  .field-foundation.disabled {
    cursor: not-allowed;
    opacity: var(--opacity-s);
  }

  .readonly-field {
    width: 100%;
    font-size: var(--font-size-s);
    line-height: var(--line-height-m);
    padding: var(--spacing-s);
    white-space: normal;
    background: transparent;
    border: none;
    color: var(--color-white);
    font-family: var(--font-family-body);
    height: auto;
    min-height: 2.5rem;
    max-height: 15rem;
    overflow: hidden auto;
    text-align: left;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    outline: none;
  }

  .paragraph {
    width: 100%;
    text-align: left;
  }

  .paragraph.mt {
    margin-top: var(--spacing-s);
  }

  .placeholder {
    color: var(--color-frisk);
    font-style: italic;
  }
</style>
