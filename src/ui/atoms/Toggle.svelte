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
   * @property {(e: Event) => void} [onchange] - Change callback.
   */

  import { controlState } from "@state";
  import { use_actions } from "@actions";
  import { Switch } from "bits-ui";

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

  let is_disabled = $derived(disabled || controlState.intent_active);
</script>

<label
  class="
    root
    {className}"
  class:is-disabled={is_disabled || busy}
  class:is-busy={busy}
  class:is-small={size === "small"}
  aria-busy={busy}
  aria-disabled={is_disabled || busy}
  {style}
  use:use_actions={actions}
>
  <Switch.Root
    bind:checked={value}
    disabled={is_disabled || busy}
    onCheckedChange={() => onchange?.(new Event("change"))}
    {...rest}
  >
    {#snippet child({ props })}
      <button {...props} class="switch-root" data-testid={test_id}>
        <Switch.Thumb>
          {#snippet child({ props: thumbProps })}
            <span {...thumbProps} class="switch-thumb"></span>
          {/snippet}
        </Switch.Thumb>
      </button>
    {/snippet}
  </Switch.Root>

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
    gap: var(--gap-standard);
    padding: var(--padding-tight) 0;

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
    opacity: var(--opacity-whisper);
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

  /* The Switch Root (button primitive) */
  .switch-root {
    all: unset;
    box-sizing: border-box;
    position: relative;
    flex-shrink: 0;
    width: var(--state-toggle-width);
    height: var(--state-toggle-height);
    background-color: rgb(from var(--gunmetal) r g b / var(--opacity-whisper));
    backdrop-filter: var(--blur-whisper);
    border-radius: var(--radius-full);
    cursor: pointer;
    transition:
      background-color var(--duration-standard) var(--ease-standard),
      box-shadow var(--duration-standard) var(--ease-standard);
  }

  /* The Switch Thumb */
  .switch-thumb {
    position: absolute;
    top: var(--state-toggle-thumb-offset);
    left: var(--state-toggle-thumb-offset);
    width: var(--state-toggle-thumb-size);
    height: var(--state-toggle-thumb-size);
    background-color: var(--frisk);
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
    color: var(--frozen);
    letter-spacing: var(--font-spacing-loose);
    text-transform: uppercase;
    white-space: nowrap;
    transition: color var(--duration-standard) var(--ease-standard);
  }

  /* --- STATES --- */

  /* Hover Interaction */
  .root:hover:not(.is-disabled) .switch-thumb {
    filter: var(--brightness-glow);
  }

  .root:hover:not(.is-disabled) .label {
    color: var(--pure-white);
  }

  /* Checked Appearance */
  .switch-root[data-state="checked"] {
    background-color: rgb(from var(--frozen) r g b / var(--opacity-whisper));
  }

  .switch-root[data-state="checked"] .switch-thumb {
    background-color: var(--pure-white);
    /* stylelint-disable scss/operator-no-newline-after, scss/operator-no-unspaced */
    transform: translateX(
      calc(
        var(--state-toggle-width) - var(--state-toggle-thumb-size) -
          (var(--state-toggle-thumb-offset) * 2)
      )
    );
    /* stylelint-enable scss/operator-no-newline-after, scss/operator-no-unspaced */
    box-shadow: 0 0 var(--spacing-unit) rgb(from var(--pure-white) r g b / var(--opacity-whisper));
  }

  /* Accessibility Focus */
  .switch-root:focus-visible {
    outline: var(--border-width-base) solid var(--frozen);
    outline-offset: var(--border-width-base);
  }
</style>
