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
  import { controlState } from "@state/control.svelte.js";

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
    signature_color = "var(--frozen)",
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
  let is_disabled = $derived(disabled || controlState.intent_active);
  const paragraphs = $derived(parse_markdown(value));
  const is_expanded = $derived((is_focused || busy) && (!!header_actions || !!status));
  const intensity = $derived(weight / 10);
  const header_opacity = $derived(weight > 0 ? 0.2 + intensity * 0.8 : 0.8);

  // --- HANDLERS ---
  /** @param {FocusEvent} e */
  function handle_focus(e) {
    if (is_disabled || busy) return;
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
  class="root {className}"
  class:is-expanded={is_expanded}
  data-expanded={is_expanded}
  data-busy={busy}
  data-no-bg={no_background}
  data-disabled={is_disabled || busy}
  style="{style}; --state-dev-accent: {signature_color}; --state-weight-intensity: {intensity}; --header-opacity: {header_opacity};"
  onfocusout={handle_blur}
  use:use_actions={actions}
  aria-busy={busy}
  aria-disabled={is_disabled || busy}
>
  <header class="header">
    {#if is_expanded}
      {#if status}
        <div class="status" in:fade={{ duration: 200, delay: 0 }}>
          {@render status()}
        </div>
      {/if}
      {#if header_actions}
        <div class="actions" in:fade={{ duration: 200, delay: 50 }}>
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
      disabled={is_disabled || busy}
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
      tabindex={is_disabled ? -1 : 0}
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
  .root {
    width: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: var(--radius-standard);
    background: color-mix(in srgb, var(--state-dev-accent) 8%, var(--glass-sunken));
    backdrop-filter: var(--blur-whisper);
    border: var(--spacing-pixel) solid transparent;
    transition:
      border-color var(--duration-standard) var(--ease-standard),
      background var(--duration-standard) var(--ease-standard);
    overflow: hidden;
  }

  /* --- HOLOGRAPHIC BORDER LOGIC --- */
  .root::before {
    content: "";
    position: absolute;
    inset: calc(var(--spacing-unit) * 0);
    pointer-events: none;
    border-radius: inherit;
    padding: var(--spacing-pixel);
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, transparent, var(--state-dev-accent) 40%),
      transparent 40%
    );
    mask:
      linear-gradient(var(--pure-white) calc(var(--spacing-unit) * 0) calc(var(--spacing-unit) * 0))
        content-box,
      linear-gradient(
        var(--pure-white) calc(var(--spacing-unit) * 0) calc(var(--spacing-unit) * 0)
      );
    mask-composite: exclude;
    opacity: var(--opacity-whisper);
    transition: opacity var(--duration-standard);
  }

  .root[data-expanded="true"]::before {
    opacity: var(--opacity-solid);
    background: linear-gradient(
      to bottom,
      var(--state-dev-accent),
      color-mix(in srgb, var(--state-dev-accent), transparent 60%) 30%,
      transparent 80%
    );
  }

  .root[data-no-bg="true"]::before {
    display: none;
  }

  .root[data-no-bg="true"] {
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .root[data-expanded="true"] {
    border-color: transparent;
    box-shadow: none; /* Remove aggressive glow */
    background: color-mix(in srgb, var(--state-dev-accent) 12%, var(--glass-sunken));
    overflow: visible;
  }

  .header {
    height: calc(var(--dev-header-height-dormant) * 1.5);
    border-radius: var(--radius-standard) var(--radius-standard) 0 0;
    background: var(--state-dev-accent);
    opacity: 0.6;
    position: relative;
    top: 0;
    z-index: var(--z-index-surface);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--padding-tight);
    transition:
      height var(--duration-standard) var(--ease-elastic),
      opacity var(--duration-fast) var(--ease-standard),
      background var(--duration-standard) var(--ease-elastic);
    overflow: hidden;
  }

  .root[data-expanded="true"] .header {
    height: var(--dev-header-height-active);
    opacity: 1;
    border-bottom: var(--spacing-pixel) solid
      rgb(from var(--pure-white) r g b / var(--opacity-ghost));
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
    min-height: var(--row-unit);
    max-height: auto; /* Specific functional limit */
    padding: var(--padding-standard);
    background: transparent;
    border: none;
    outline: none;
    color: var(--frisk);
    font-family: var(--font-family-base);
    font-size: var(--font-size-small);
    line-height: var(--font-height-base);
    text-align: left;
    box-sizing: border-box;
    margin: 0;
    display: block;
    overflow: hidden auto;
    position: relative;
    z-index: var(--z-index-surface);
    text-wrap: balance;
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
    color: var(--frozen);
    font-style: italic;
    font-weight: var(--font-weight-base);
    opacity: var(--opacity-whisper);
  }

  .root[data-disabled="true"] {
    opacity: var(--opacity-whisper);
    cursor: not-allowed;
  }

  .root[data-busy="true"],
  .root[data-busy="true"] .body {
    cursor: wait;
  }

  .root[data-busy="true"] {
    filter: var(--brightness-dim) grayscale(0.5);
  }

  .root[data-busy="true"] > * {
    pointer-events: none;
  }

  .paragraph {
    width: 100%;
    margin: 0;
  }

  .paragraph[data-spaced="true"] {
    margin-top: var(--margin-standard);
  }

  .strong {
    font-weight: var(--font-weight-bold);
    color: var(--pure-white);
  }

  .em {
    font-style: italic;
    opacity: var(--opacity-whisper);
  }

  /* Global child overrides for injected snippet content */
  :global(.status-tag) {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--font-spacing-loose);
    text-transform: uppercase;
    color: var(--pure-white);
  }

  :global(.status-msg) {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    opacity: var(--opacity-whisper);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-base);
    color: var(--pure-white);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
