<script>
  /**
   * @typedef {Object} Props
   * @property {boolean} [value] - Current toggle state.
   * @property {string} [label] - Optional label text.
   * @property {"md" | "small"} [size] - Component scale.
   * @property {boolean} [disabled] - Interactive lock state.
   * @property {boolean} [busy] - Async lock state.
   * @property {any[]} [actions] - Svelte actions.
   * @property {string} [class] - External styling.
   * @property {string} [style] - Inline styling.
   * @property {(e: Event & { currentTarget: HTMLInputElement }) => void} [onchange] - Change callback.
   */

  import { use_actions } from "@ui/utils/use-actions.js";

  /** @type {Props} */
  let {
    value = $bindable(false),
    label = "",
    size = "md",
    disabled = false,
    busy = false,
    actions = [],
    class: className = "",
    style = "",
    onchange = undefined,
    ...rest
  } = $props();

  // Derived identifier for testing
  const test_id = $derived(
    label ? `${label.toLowerCase().replace(/\s+/g, "-")}-toggle` : undefined,
  );
</script>

<label
  class="root {className}"
  class:is-disabled={disabled || busy}
  class:is-busy={busy}
  class:is-small={size === "small"}
  aria-busy={busy}
  aria-disabled={disabled || busy}
  {style}
  use:use_actions={actions}
>
  <input
    type="checkbox"
    {...rest}
    bind:checked={value}
    disabled={disabled || busy}
    {onchange}
    data-testid={test_id}
  />
  <span class="track"></span>

  {#if label}
    <span class="label">{label}</span>
  {/if}
</label>

<style>
  .root {
    /* Layout */
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-1) var(--spacing-0);

    /* Interaction */
    cursor: pointer;
    user-select: none;
    transition: opacity var(--duration-standard) var(--ease-standard);

    /* Internal Geometry (Chalk Regime Mapping) */
    --state-toggle-width: var(--toggle-width);
    --state-toggle-height: var(--toggle-height);
    --state-toggle-thumb-size: var(--toggle-thumb-size);
    --state-toggle-thumb-offset: var(--toggle-thumb-offset);
  }

  /* --- MODIFIERS --- */

  .root.is-disabled {
    opacity: var(--opacity-muted);
    cursor: default;
  }

  .root.is-busy {
    cursor: wait;
    filter: var(--brightness-dim) grayscale(0.5);
  }

  .root.is-busy > * {
    pointer-events: none;
  }

  .root.is-small {
    --state-toggle-width: var(--toggle-small-width);
    --state-toggle-height: var(--toggle-small-height);
    --state-toggle-thumb-size: var(--toggle-small-thumb-size);
    --state-toggle-thumb-offset: calc(
      (var(--toggle-small-height) - var(--toggle-small-thumb-size)) / 2
    );
  }

  /* --- ELEMENTS --- */

  /* Logic Kernel (Hidden Input) */
  input {
    position: absolute;
    width: var(--spacing-0);
    height: var(--spacing-0);
    opacity: var(--opacity-none);
    pointer-events: none;
  }

  /* The Track */
  .track {
    position: relative;
    flex-shrink: 0;
    width: var(--state-toggle-width);
    height: var(--state-toggle-height);
    background-color: rgb(from var(--color-gunmetal) r g b / var(--opacity-muted));
    backdrop-filter: var(--blur-whisper);
    border-radius: var(--radius-full);
    transition:
      background-color var(--duration-standard) var(--ease-standard),
      box-shadow var(--duration-standard) var(--ease-standard);
  }

  /* The Thumb */
  .track::before {
    content: "";
    position: absolute;
    top: var(--state-toggle-thumb-offset);
    left: var(--state-toggle-thumb-offset);
    width: var(--state-toggle-thumb-size);
    height: var(--state-toggle-thumb-size);
    background-color: var(--color-frisk);
    border-radius: var(--radius-full);
    transition:
      transform var(--duration-standard) var(--ease-elastic),
      background-color var(--duration-standard) var(--ease-standard);
  }

  /* Label Styling */
  .label {
    font-family: var(--font-family-base);
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-bold);
    color: var(--font-color-muted);
    letter-spacing: var(--font-spacing-loose);
    text-transform: uppercase;
    white-space: nowrap;
    transition: color var(--duration-standard) var(--ease-standard);
  }

  /* --- STATES --- */

  /* Hover Interaction */
  .root:hover:not(.is-disabled) .track::before {
    filter: var(--hover-glow);
  }

  .root:hover:not(.is-disabled) .label {
    color: var(--color-white);
  }

  /* Checked Appearance */
  input:checked + .track {
    background-color: rgb(from var(--color-frozen) r g b / var(--opacity-heavy));
  }

  input:checked + .track::before {
    background-color: var(--color-white);
    /* stylelint-disable scss/operator-no-newline-after, scss/operator-no-unspaced */
    transform: translateX(
      calc(
        var(--state-toggle-width) - var(--state-toggle-thumb-size) -
          (var(--state-toggle-thumb-offset) * 2)
      )
    );
    /* stylelint-enable scss/operator-no-newline-after, scss/operator-no-unspaced */
    box-shadow: var(--spacing-0) var(--spacing-0) var(--spacing-1)
      rgb(from var(--color-white) r g b / var(--opacity-muted));
  }

  /* Accessibility Focus */
  input:focus-visible + .track {
    outline: var(--spacing-pixel) solid var(--color-frozen);
    outline-offset: var(--spacing-pixel);
  }
</style>
