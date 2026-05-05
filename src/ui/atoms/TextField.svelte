<script>
  /**
   * @file TextField.svelte
   * @component TextField
   * A high-fidelity, local-first text instrument.
   * Part of the RPGlitch "Chalk Regime" atom collection.
   */
  import { auto_resize } from "@utils/auto-resize.js";
  import { parse_markdown } from "@utils/markdown.js";
  import { fade } from "svelte/transition";

  let {
    // Data
    value = $bindable(""),
    placeholder = "Enter text...",
    syncId = null,

    // State
    is_edit = false,
    busy = false,
    disabled = false,
    weight = 0, // 0-10 for line prominence and atmospheric glow

    // Design
    noBackground = false,
    class: className = "",
    style = "",

    // Slots/Snippets
    actions = null, // Snippet for header actions (right)
    status = null, // Snippet for status indicators (left)

    // Events
    oninput = undefined,
    onfocus = undefined,
    onblur = undefined,
    ...restProps
  } = $props();

  // --- LOCAL STATE ---
  let is_focused = $state(false);

  // --- DERIVED LOGIC ---
  const paragraphs = $derived(parse_markdown(value));
  const has_meta = $derived(!!actions || !!status);
  const is_expanded = $derived((is_focused || busy) && has_meta);

  // Orchestrate the "Physical" properties of the instrument
  const intensity = $derived(weight / 10);
  const header_opacity = $derived(weight > 0 ? 0.2 + (weight / 10) * 0.8 : 0.8);
  const header_bg_mix = $derived(weight > 0 ? (0.2 + (weight / 10) * 0.8) * 100 : 100);

  // --- HANDLERS ---
  /** @param {FocusEvent} e */
  function handle_focus(e) {
    if (disabled || busy) return;
    is_focused = true;
    onfocus?.(e);
  }

  /** @param {FocusEvent} e */
  function handle_blur(e) {
    const target = /** @type {HTMLElement} */ (e.currentTarget);
    if (e.relatedTarget && target.contains(/** @type {Node} */ (e.relatedTarget))) return;
    is_focused = false;
    onblur?.(e);
  }
</script>

<div
  class="textfield {className}"
  class:is-expanded={is_expanded}
  class:is-busy={busy}
  class:no-background={noBackground}
  class:is-disabled={disabled}
  style="{style}; --weight-intensity: {intensity}; --header-opacity: {header_opacity}; --header-bg-mix: {header_bg_mix}%;"
  onfocusout={handle_blur}
  {...restProps}
>
  <header class="header">
    <div class="status">
      {#if status && is_expanded}
        <div in:fade={{ duration: 200, delay: 100 }}>
          {@render status()}
        </div>
      {/if}
    </div>

    <div class="actions">
      {#if actions && is_expanded}
        <div in:fade={{ duration: 200, delay: 150 }}>
          {@render actions()}
        </div>
      {/if}
    </div>
  </header>

  {#if is_edit}
    <textarea
      class="body custom-scrollbar edit-mode"
      class:is-busy={busy}
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
      class="body custom-scrollbar readonly-mode"
      class:is-busy={busy}
      data-sync-id={syncId}
      use:auto_resize={{ syncId }}
      tabindex={disabled ? -1 : 0}
      onfocus={handle_focus}
      role="textbox"
      aria-readonly="true"
      aria-placeholder={placeholder}
    >
      {#if paragraphs.length > 0}
        {#each paragraphs as tokens, i (i)}
          <p class="p" class:spaced={i > 0}>
            {#each tokens as token, j (j)}
              {#if token.type === "text"}
                {token.content}
              {:else if token.type === "strong"}
                <strong class="bold">{token.content}</strong>
              {:else if token.type === "em"}
                <em class="italic">{token.content}</em>
              {:else if token.type === "strong-em"}
                <strong class="bold"><em class="italic">{token.content}</em></strong>
              {/if}
            {/each}
          </p>
        {/each}
      {:else}
        <span class="placeholder">{placeholder}</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .textfield {
    --shield-height-dormant: 2px;
    --shield-height-active: 2.2rem;
    --anim-physics: var(--motion-l) var(--motion-elastic);

    width: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: var(--border-radius-m);
    background: var(--glass-xs);
    border: var(--border-l);
    transition:
      border-color var(--motion-m),
      box-shadow var(--motion-m),
      background var(--motion-m);
    overflow: hidden;
  }

  .textfield.no-background {
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .textfield.is-expanded {
    border-color: var(--color-white);
    box-shadow: 0 0 15px rgb(var(--color-white-rgb) / 5%);
    overflow: visible;
  }

  .header {
    height: var(--shield-height-dormant);
    background: var(--signature-color, var(--color-frozen));
    border-radius: calc(var(--border-radius-m) - 1px) calc(var(--border-radius-m) - 1px) 0 0;
    opacity: var(--header-opacity);
    position: relative;
    top: 1px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing-s);
    transition:
      height var(--anim-physics),
      background var(--anim-physics),
      top var(--anim-physics),
      opacity var(--motion-m);
    box-shadow: 0 0 calc(var(--weight-intensity) * 6px) var(--signature-color);
    overflow: hidden;
  }

  .textfield.is-expanded .header {
    height: var(--shield-height-active);
    top: 0;
    opacity: 1;
    background: color-mix(
      in srgb,
      rgb(var(--color-black-rgb) / 50%),
      var(--signature-color, var(--color-frozen)) var(--header-bg-mix)
    );
    border-bottom: var(--spacing-px) solid rgb(var(--color-white-rgb) / 8%);
    box-shadow: 0 0 calc(var(--weight-intensity) * 12px)
      rgb(from var(--signature-color) r g b / 15%);
  }

  .status,
  .actions {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .body {
    width: 100%;
    min-height: 2.5rem;
    max-height: 15rem;
    padding: var(--spacing-s);
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-white);
    font-family: var(--font-family-body);
    font-size: var(--font-size-s);
    line-height: var(--line-height-m);
    text-align: left;
    box-sizing: border-box;
    margin: 0;
    display: block;
    overflow: hidden auto;
    position: relative;
    z-index: 1;
  }

  .body.edit-mode {
    resize: none;
  }

  .body.readonly-mode {
    display: flex;
    flex-direction: column;
    text-wrap: pretty;
  }

  .body::placeholder,
  .placeholder {
    color: var(--color-frisk);
    font-style: italic;
    font-weight: var(--font-weight-m);
    opacity: 0.7;
  }

  .is-disabled {
    opacity: var(--opacity-s);
    cursor: not-allowed;
  }

  .is-busy .body {
    cursor: wait;
  }

  .textfield.is-busy .header::after {
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

  .p {
    width: 100%;
    margin: 0;
  }

  .p.spaced {
    margin-top: var(--spacing-s);
  }

  .bold {
    font-weight: var(--font-weight-xl);
    color: var(--color-white);
  }

  .italic {
    font-style: italic;
    opacity: 0.9;
  }

  :global(.status-tag) {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xxs);
    font-weight: var(--font-weight-xl);
    letter-spacing: var(--letter-spacing-l);
    text-transform: uppercase;
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
</style>
