<script>
  /**
   * @file TextField.svelte
   * 🕹️ SOTA ATOMIC TEXT INSTRUMENT
   * High-performance, reactive text field with markdown rendering and atmospheric effects.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { use_actions } from "@ui/utils/use-actions.js";
  import { auto_resize } from "@ui/utils/auto-resize.js";
  import { parse_markdown } from "@ui/utils/markdown.js";
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
    no_background = false,
    signature_color = "var(--color-frozen)",
    class: className = "",
    style = "",

    // Slots/Snippets
    header_actions = null, // Header actions snippet
    status = null, // Header status snippet
    actions = [], // Svelte actions for the wrapper

    // Events
    oninput = undefined,
    onfocus = undefined,
    onblur = undefined,
    ...rest
  } = $props();

  // --- LOCAL STATE ---
  let is_focused = $state(false);

  // --- DERIVED LOGIC ---
  const paragraphs = $derived(parse_markdown(value));
  const has_meta = $derived(!!header_actions || !!status);
  const is_expanded = $derived((is_focused || busy) && has_meta);

  // Orchestrate the "Physical" properties of the instrument
  const intensity = $derived(weight / 10);
  const header_opacity = $derived(weight > 0 ? 0.2 + (weight / 10) * 0.8 : 0.8);

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
  {...rest}
  class="wrapper {className}"
  class:is-expanded={is_expanded}
  class:is-busy={busy}
  class:is-no-bg={no_background}
  class:is-disabled={disabled}
  style="{style}; --signature-color: {signature_color}; --weight-intensity: {intensity}; --header-opacity: {header_opacity};"
  onfocusout={handle_blur}
  use:use_actions={actions}
  aria-busy={busy}
  aria-disabled={disabled || busy}
>
  <header class="header">
    <div class="status-zone">
      {#if status && is_expanded}
        <div class="snippet" in:fade={{ duration: 200, delay: 100 }}>
          {@render status()}
        </div>
      {/if}
    </div>

    <div class="action-zone">
      {#if header_actions && is_expanded}
        <div class="snippet" in:fade={{ duration: 200, delay: 150 }}>
          {@render header_actions()}
        </div>
      {/if}
    </div>
  </header>

  {#if is_edit}
    <textarea
      class="body custom-scrollbar is-edit"
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
      class="body custom-scrollbar is-readonly"
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
          <p class="p" class:is-spaced={i > 0}>
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
  .wrapper {
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

  .wrapper.is-no-bg {
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .wrapper.is-expanded {
    border-color: var(--color-white);
    box-shadow: 0 0 15px rgb(var(--color-white-rgb) / 5%);
  }

  .header {
    height: var(--shield-height-dormant);
    border-radius: calc(var(--border-radius-m) - 1px) calc(var(--border-radius-m) - 1px) 0 0;
    background: rgb(from var(--signature-color) r g b / var(--header-opacity));
    box-shadow: 0 0 calc(var(--weight-intensity) * 6px) var(--signature-color);
    position: relative;
    top: 1px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing-s);
    transition:
      height var(--anim-physics),
      top var(--anim-physics),
      opacity var(--motion-m),
      background var(--anim-physics),
      box-shadow var(--anim-physics);
    overflow: hidden;
  }

  .wrapper.is-expanded .header {
    height: var(--shield-height-active);
    top: 0;
    box-shadow: 0 0 calc(var(--weight-intensity) * 12px)
      rgb(from var(--signature-color) r g b / 15%);
    border-bottom: var(--spacing-px) solid rgb(var(--color-white-rgb) / 8%);
  }

  .status-zone,
  .action-zone {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .snippet {
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

  .body.is-edit {
    resize: none;
  }

  .body.is-readonly {
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

  .p {
    width: 100%;
    margin: 0;
  }

  .p.is-spaced {
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

  /* Global child overrides */
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
