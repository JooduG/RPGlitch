<script>
  /**
   * @file TextField.svelte
   * 🕹️ SOTA ATOMIC TEXT INSTRUMENT
   * High-performance, reactive text field with markdown rendering and atmospheric effects.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { auto_resize } from "@ui/utils/auto-resize.js";
  import { parse_markdown } from "@ui/utils/markdown.js";
  import { use_actions } from "@ui/utils/use-actions.js";
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

    // Snippets
    header_actions = null,
    status = null,
    actions = [],

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
  const is_expanded = $derived((is_focused || busy) && (!!header_actions || !!status));
  const intensity = $derived(weight / 10);
  const header_opacity = $derived(weight > 0 ? 0.2 + intensity * 0.8 : 0.8);

  // --- HANDLERS ---
  /** @param {FocusEvent} e */
  function handle_focus(e) {
    if (disabled || busy) return;
    is_focused = true;
    onfocus?.(e);
  }

  /** @param {FocusEvent} e */
  function handle_blur(e) {
    const root = /** @type {HTMLElement} */ (e.currentTarget);
    if (e.relatedTarget && root.contains(/** @type {Node} */ (e.relatedTarget))) return;
    is_focused = false;
    onblur?.(e);
  }
</script>

<div
  class="wrapper {className}"
  class:is-expanded={is_expanded}
  data-expanded={is_expanded}
  data-busy={busy}
  data-no-bg={no_background}
  data-disabled={disabled || busy}
  style="{style}; --tf-accent: {signature_color}; --weight-intensity: {intensity}; --header-opacity: {header_opacity};"
  onfocusout={handle_blur}
  use:use_actions={actions}
  aria-busy={busy}
  aria-disabled={disabled || busy}
>
  <header class="header">
    {#if is_expanded}
      {#if status}
        <div class="status" in:fade={{ duration: 200, delay: 100 }}>
          {@render status()}
        </div>
      {/if}
      {#if header_actions}
        <div class="actions" in:fade={{ duration: 200, delay: 150 }}>
          {@render header_actions()}
        </div>
      {/if}
    {/if}
  </header>

  {#if is_edit}
    <textarea
      {...rest}
      class="body scrollbar"
      data-mode="edit"
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
      {...rest}
      class="body scrollbar is-readonly"
      data-mode="readonly"
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
          <p class="paragraph" data-spaced={i > 0}>
            {#each tokens as token, j (j)}
              {#if token.type === "text"}
                {token.content}
              {:else if token.type === "strong"}
                <strong class="strong">{token.content}</strong>
              {:else if token.type === "em"}
                <em class="em">{token.content}</em>
              {:else if token.type === "strong-em"}
                <strong class="strong"><em class="em">{token.content}</em></strong>
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
    --tf-shield-dormant: var(--spacing-1);
    --tf-shield-active: var(--spacing-6);

    width: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: var(--radius-standard);
    background: var(--glass-sunken-color); /* Fallback */
    background: rgb(from var(--glass-sunken-color) r g b / var(--opacity-ghost));
    backdrop-filter: var(--glass-sunken-blur);
    transition:
      border-color var(--duration-standard) var(--ease-standard),
      box-shadow var(--duration-standard) var(--ease-standard),
      background var(--duration-standard) var(--ease-standard);
    overflow: hidden;
  }

  .wrapper[data-no-bg="true"] {
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .wrapper[data-expanded="true"] {
    border-color: var(--color-white);
    box-shadow: var(--shadow-heavy);
  }

  .header {
    height: var(--tf-shield-dormant);
    border-radius: var(--radius-standard) var(--radius-standard) 0 0;
    background: rgb(from var(--tf-accent) r g b / var(--header-opacity));
    box-shadow: 0 0 calc(var(--weight-intensity) * var(--spacing-2)) var(--tf-accent);
    position: relative;
    top: var(--spacing-px);
    z-index: var(--z-surface);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing-2);
    transition:
      height var(--duration-standard) var(--ease-elastic),
      top var(--duration-standard) var(--ease-elastic),
      opacity var(--duration-fast) var(--ease-standard),
      background var(--duration-standard) var(--ease-elastic),
      box-shadow var(--duration-standard) var(--ease-elastic);
    overflow: hidden;
  }

  .wrapper[data-expanded="true"] .header {
    height: var(--tf-shield-active);
    top: 0;
    box-shadow: 0 0 calc(var(--weight-intensity) * var(--spacing-4))
      rgb(from var(--tf-accent) r g b / var(--opacity-muted));
    border-bottom: var(--spacing-px) solid rgb(from var(--color-white) r g b / var(--opacity-ghost));
  }

  .status,
  .actions {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .actions {
    margin-left: auto;
  }

  .body {
    width: 100%;
    min-height: var(--spacing-16);
    max-height: 15rem; /* Specific functional limit */
    padding: var(--spacing-4);
    background: transparent;
    border: none;
    outline: none;
    color: var(--font-color-base);
    font-family: var(--font-family-base);
    font-size: var(--font-size-small);
    line-height: var(--font-height-base);
    text-align: left;
    box-sizing: border-box;
    margin: 0;
    display: block;
    overflow: hidden auto;
    position: relative;
    z-index: var(--z-surface);
  }

  .body[data-mode="edit"] {
    resize: none;
  }

  .body[data-mode="readonly"] {
    display: flex;
    flex-direction: column;
    text-wrap: pretty;
  }

  .body::placeholder,
  .placeholder {
    color: var(--font-color-muted);
    font-style: italic;
    font-weight: var(--font-weight-base);
    opacity: var(--opacity-heavy);
  }

  .wrapper[data-disabled="true"] {
    opacity: var(--opacity-muted);
    cursor: not-allowed;
  }

  .wrapper[data-busy="true"] {
    cursor: wait;
    filter: var(--brightness-dim) grayscale(0.5);
  }

  .wrapper[data-busy="true"] > * {
    pointer-events: none;
  }

  .paragraph {
    width: 100%;
    margin: 0;
  }

  .paragraph[data-spaced="true"] {
    margin-top: var(--spacing-4);
  }

  .strong {
    font-weight: var(--font-weight-bold);
    color: var(--color-white);
  }

  .em {
    font-style: italic;
    opacity: var(--opacity-heavy);
  }

  /* Global child overrides for injected snippet content */
  :global(.status-tag) {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--font-spacing-loose);
    text-transform: uppercase;
    color: var(--color-white);
  }

  :global(.status-msg) {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    opacity: var(--opacity-muted);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-base);
    color: var(--color-white);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
