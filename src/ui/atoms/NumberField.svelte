<script>
  /**
   * @typedef {Object} Props
   * @property {number | null} value - The numeric value.
   * @property {string} [placeholder=""] - Optional placeholder text.
   * @property {boolean} [disabled=false] - Whether the input is disabled.
   * @property {boolean} [readonly=false] - Whether the input is readonly.
   * @property {string} [id] - Optional ID for the input.
   * @property {string} [class] - Optional additional CSS classes for the wrapper or input.
   * @property {() => void} [oninput] - Event handler for input changes.
   */

  /** @type {Props} */
  let { value = $bindable(null), placeholder = "", disabled = false, readonly = false, id, class: className = "", oninput } = $props();
</script>

<input
  {id}
  type="number"
  bind:value
  {disabled}
  {readonly}
  {oninput}
  class="
    [appearance:textfield]
    rounded-lg
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
    ? 'border-white/5 bg-black/20 text-center text-slate-300'
    : 'border-transparent bg-[color-mix(in_srgb,var(--color-slate-400)_5%,rgb(23_23_23/0.6))] focus:border-white/10 disabled:opacity-50'}
    {className}
  "
  {placeholder}
/>
