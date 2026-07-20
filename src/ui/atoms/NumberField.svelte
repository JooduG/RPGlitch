<script>
  import { use_actions } from "@actions";

  /**
   * @typedef {Object} Props
   * @property {number | null} value - The numeric value.
   * @property {string} [placeholder=""] - Optional placeholder text.
   * @property {boolean} [disabled=false] - Whether the input is disabled.
   * @property {boolean} [readonly=false] - Whether the input is readonly (display-only).
   * @property {string} [id] - Optional ID for the input.
   * @property {string} [class] - Optional additional CSS classes for the wrapper or input.
   * @property {() => void} [oninput] - Event handler for input changes.
   * @property {() => void} [onclick] - Event handler for click (useful in readonly mode).
   * @property {(e: KeyboardEvent) => void} [onkeydown] - Event handler for keydown.
   * @property {Array<any>} [actions] - Array of Svelte actions.
   * @property {any} [rest] - Any other HTML input attributes.
   */

  /** @type {Props} */
  let {
    value = $bindable(null),
    placeholder = "",
    disabled = false,
    readonly = false,
    id,
    class: className = "",
    oninput,
    onclick,
    onkeydown,
    actions = [],
    signature_color = "#475569",
    style = "",
    ...rest
  } = $props();
</script>

<input
  {id}
  type="number"
  bind:value
  {disabled}
  {readonly}
  {oninput}
  {onclick}
  {onkeydown}
  use:use_actions={actions}
  {...rest}
  class="
    box-border
    block
    w-full
    [appearance:textfield]
    rounded-xl
    bg-[color-mix(in_srgb,var(--state-dev-accent)_8%,rgb(23_23_23/0.6))]
    p-2
    text-center
    font-sans
    text-(length:--font-size-base)
    leading-normal
    transition-[background]
    duration-300
    ease-in-out
    outline-none
    placeholder:font-normal
    placeholder:text-slate-600/30
    placeholder:italic
    [&::-webkit-inner-spin-button]:appearance-none
    [&::-webkit-outer-spin-button]:appearance-none
    {readonly
    ? 'cursor-pointer text-slate-300 hover:bg-[color-mix(in_srgb,var(--state-dev-accent)_12%,rgb(23_23_23/0.6))] hover:text-white'
    : 'cursor-text text-slate-50 focus:bg-[color-mix(in_srgb,var(--state-dev-accent)_12%,rgb(23_23_23/0.6))] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'}
    {className}
  "
  style="--state-dev-accent: {signature_color}; {style}"
  {placeholder}
/>
