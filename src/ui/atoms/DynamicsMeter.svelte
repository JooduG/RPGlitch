<script>
  /**
   * @file src/ui/atoms/DynamicsMeter.svelte
   * 🎛️ DYNAMICS METER
   * Encapsulates the dynamic value square, hover controls, and the underlying progress line.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { Button, tooltip } from "@atoms";
  import { Meter } from "bits-ui";

  /**
   * @typedef {Object} Props
   * @property {any} profileState - The profile state controller
   * @property {{ source: string; key: string; label: string; desc: string }} dynamic - Dynamic axis descriptor
   */

  /** @type {Props} */
  let { profileState, dynamic } = $props();

  // --- DERIVED STATE ---
  let is_editing = $derived(profileState.is_editing);

  // Safe boundary-checked value resolver
  let value = $derived.by(() => {
    try {
      const char = profileState?.char;
      if (!char) return 0;
      const source = char[dynamic?.source];
      if (!source) return 0;
      const val = Number(source[dynamic?.key]);
      return isNaN(val) ? 0 : val;
    } catch {
      return 0;
    }
  });

  let percentage = $derived(Math.max(0, Math.min(100, value)));

  // --- ACTIONS ---
  function decrease() {
    if (!profileState?.char?.[dynamic.source]) return;
    const current = Number(profileState.char[dynamic.source][dynamic.key]) || 0;
    profileState.char[dynamic.source][dynamic.key] = Math.max(0, current - 1);
  }

  function increase() {
    if (!profileState?.char?.[dynamic.source]) return;
    const current = Number(profileState.char[dynamic.source][dynamic.key]) || 0;
    profileState.char[dynamic.source][dynamic.key] = Math.min(100, current + 1);
  }

  /** @param {Event & { currentTarget: HTMLInputElement }} e */
  function handle_input(e) {
    if (!profileState?.char?.[dynamic.source]) return;
    const val = Number(e.currentTarget.value);
    if (!isNaN(val)) {
      profileState.char[dynamic.source][dynamic.key] = Math.max(0, Math.min(100, val));
    }
  }
</script>

<!-- eslint-disable better-tailwindcss/no-unknown-classes -->
<div
  class="
    meter-card
    group
    relative
    flex
    min-h-16
    flex-col
    items-center
    justify-center
    overflow-hidden
    rounded-sm
    border
    border-transparent
    bg-neutral-900/60
    p-4
    transition-all
    duration-300
    ease-in-out
    select-none

    {is_editing
    ? `
      cursor-help
      focus-within:z-10
      hover:z-10
      hover:brightness-125
    `
    : ''}
  "
  use:tooltip={dynamic.desc}
  data-editable={is_editing}
>
  <span
    class="
      meter-label
      z-10
      mb-2
      text-[10px]
      font-(--font-family-mono)
      tracking-widest
      text-(--electric-cyan)
      uppercase
      transition-[filter,opacity]
      duration-150
      ease-in-out
    "
  >
    {dynamic.label}
  </span>

  <div
    class="
      meter-controls
      relative
      z-10
      flex
      w-full
      items-center
      justify-center
      gap-1
    "
  >
    {#if is_editing}
      <Button
        flank={true}
        size="small"
        square
        class="hover:text-(--electric-cyan)"
        onclick={decrease}
        aria-label="Decrease"
      >
        <svg
          viewBox="0 0 24 24"
          class="size-(--icon-small)"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 12h14" />
        </svg>
      </Button>

      <input
        type="number"
        class="
          meter-input
          w-10
          [appearance:textfield]
          bg-transparent
          py-1
          text-center
          text-base
          font-(--font-family-mono)
          text-slate-50
          outline-none
          [&::-webkit-inner-spin-button]:appearance-none
          [&::-webkit-outer-spin-button]:appearance-none
        "
        {value}
        oninput={handle_input}
        min="0"
        max="100"
      />

      <Button
        flank={true}
        size="small"
        square
        class="hover:text-(--electric-cyan)"
        onclick={increase}
        aria-label="Increase"
      >
        <svg
          viewBox="0 0 24 24"
          class="size-(--icon-small)"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Button>
    {:else}
      <span class="meter-value py-1 text-base font-(--font-family-mono) text-slate-50">
        {value}%
      </span>
    {/if}
  </div>

  {#key is_editing}
    <Meter.Root
      {value}
      min={0}
      max={100}
      class="
        meter-progress
        absolute
        bottom-0
        left-0
        z-0
        h-px
        w-full
        overflow-hidden
        bg-(--electric-cyan)/10
      "
    >
      <div
        class="
          h-full
          bg-(--electric-cyan)
          shadow-[0_0_8px_var(--electric-cyan)]
          transition-[width]
          duration-150
          ease-in-out
        "
        style="width: {percentage}%;"
      ></div>
    </Meter.Root>
  {/key}
</div>
