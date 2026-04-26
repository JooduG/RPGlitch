<script>
  import { auto_resize } from "@ui/utils/actions/auto-resize.js";
  import { parse_markdown } from "@ui/utils/markdown.js";
  import { fade } from "svelte/transition";

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
    status = null, // Snippet for status text (left aligned)
    weight = 0, // 0-10 for the weight line thickness/glow
    noBackground = false, // If true, removes background and border
  } = $props();

  let isFocused = $state(false);
  let paragraphs = $derived(parse_markdown(value));

  // Only allow header expansion if we have actions or status to show
  let canExpand = $derived(!!actions || !!status);

  function handle_focus(e) {
    if (!is_edit && !canExpand) return;
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
  class:is-focused={(isFocused || busy) && canExpand}
  class:is-busy={busy}
  class:has-actions={!!actions}
  class:no-background={noBackground}
  style="{style}; --weight-intensity: {weight / 10}; --header-opacity: {weight > 0
    ? 0.2 + (weight / 10) * 0.8
    : 0.8}; --header-bg-mix: {weight > 0 ? (0.2 + (weight / 10) * 0.8) * 100 : 100}%;"
  onfocusout={handle_focus_out}
>
  {#if canExpand}
    <div class="field-header">
      <div class="header-content">
        <div class="header-status" in:fade={{ duration: 300 }}>
          {#if status}
            {@render status()}
          {/if}
        </div>
        <div class="header-actions">
          {#if actions}
            {@render actions()}
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <div class="field-body">
    {#if is_edit}
      <textarea
        class="field-foundation"
        class:busy
        class:disabled={disabled || busy}
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
        class:busy
        class:disabled={disabled || busy}
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

  .header-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing-s);
    opacity: 0;
    transform: translateY(-5px);
    transition: all var(--motion-m);
  }

  .field-chassis.is-focused .header-content {
    opacity: 1;
    transform: translateY(0);
  }

  .header-status {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    overflow: hidden;
  }

  .header-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
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

  .field-foundation.disabled,
  .readonly-field.disabled {
    opacity: var(--opacity-s);
  }

  .field-foundation.busy,
  .readonly-field.busy {
    cursor: wait !important;
  }

  .field-foundation.disabled:not(.busy),
  .readonly-field.disabled:not(.busy) {
    cursor: not-allowed;
  }

  /* --- STATUS UTILITIES --- */
  :global(.status-tag) {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xxs);
    font-weight: var(--font-weight-xl);
    letter-spacing: var(--letter-spacing-l);
    text-transform: uppercase;
    opacity: 0.9;
    color: var(--color-white);
  }

  :global(.status-msg) {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xxxs);
    opacity: 0.6;
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-m);
    color: var(--color-white);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.5;
    }
  }

  :global(.pulse) {
    animation: pulse 1s infinite ease-in-out;
  }

  /* --- BUSY ANIMATION (The "Something") --- */
  .field-header {
    /* ... existing styles ... */
    overflow: visible; /* Default allow glow to breathe */
  }

  .field-chassis.is-busy .field-header {
    overflow: hidden; /* Clip the scan bar while busy */
  }

  .field-chassis.is-busy .field-header::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgb(var(--color-white-rgb) / 15%) 50%,
      transparent 100%
    );
    width: 100%;
    animation: scan var(--motion-xxl) linear infinite;
  }

  @keyframes scan {
    from {
      transform: translateX(-100%) skewX(-20deg);
    }

    to {
      transform: translateX(100%) skewX(-20deg);
    }
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
