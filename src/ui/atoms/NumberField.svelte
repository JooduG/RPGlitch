<script>
  import { use_actions } from "@actions";

  /**
   * @typedef {Object} Props
   * @property {number | null} value - The numeric value.
   * @property {string} [placeholder=""] - Optional placeholder text.
   * @property {boolean} [disabled=false] - Whether the input is disabled.
   * @property {boolean} [readonly=false] - Whether the input is readonly.
   * @property {string} [id] - Optional ID for the input.
   * @property {string} [class] - Optional additional CSS classes for the wrapper or input.
   * @property {() => void} [oninput] - Event handler for input changes.
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
  use:use_actions={actions}
  {...rest}
  class="
    [appearance:textfield]
    rounded-xl
    border
    px-3
    py-2
    font-mono
    text-sm
    text-slate-50
    transition-colors
    outline-none
    placeholder:font-sans
    placeholder:font-normal
    placeholder:text-slate-600/30
    placeholder:italic
    [&::-webkit-inner-spin-button]:appearance-none
    [&::-webkit-outer-spin-button]:appearance-none
    {readonly
    ? 'cursor-pointer border-white/5 bg-[color-mix(in_srgb,var(--state-dev-accent)_8%,rgb(23_23_23/0.6))] text-center text-slate-300 hover:bg-[color-mix(in_srgb,var(--state-dev-accent)_15%,rgb(23_23_23/0.6))]'
    : 'border-transparent bg-[color-mix(in_srgb,var(--state-dev-accent)_5%,rgb(23_23_23/0.6))] focus:border-white/10 disabled:opacity-50'}
    {className}
  "
  style="--state-dev-accent: {signature_color}; {style}"
  {placeholder}
/>
