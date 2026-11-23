<script>
  /**
   * @file src/ui/molecules/Meter.svelte
   * Interactive bounded value gauge wrapping bits-ui Meter.Root with optional +/- stepper controls.
   */
  import { Button, Icon, Label, tooltip } from "@atoms";
  import { clamp } from "@utils";
  import { Meter } from "bits-ui";

  /**
   * @typedef {Object} Props
   * @property {number} [value] - Current gauge value (bindable)
   * @property {number} [min] - Minimum bound
   * @property {number} [max] - Maximum bound
   * @property {number} [step] - Step increment for +/- buttons
   * @property {string} [label] - Visible header label
   * @property {string} [description] - Optional tooltip description
   * @property {boolean} [editable] - Show +/- steppers and numeric input
   * @property {string} [unit] - Suffix displayed in read-only mode
   * @property {(val: number) => void} [onchange] - Change callback
   * @property {string} [class] - Additional container classes
   */

  /** @type {Props} */
  let {
    value = $bindable(0),
    min = 0,
    max = 100,
    step = 1,
    label = "",
    description = "",
    editable = false,
    unit = "%",
    onchange = undefined,
    class: className = "",
  } = $props();

  const clamped_value = $derived(clamp(Number(value) || 0, min, max));
  const percentage = $derived(max > min ? clamp(((clamped_value - min) / (max - min)) * 100, 0, 100) : 0);

  /** @param {number} next_raw */
  function commit_value(next_raw) {
    const next = clamp(next_raw, min, max);
    value = next;
    onchange?.(next);
  }

  function decrease() {
    commit_value(clamped_value - step);
  }

  function increase() {
    commit_value(clamped_value + step);
  }

  /** @param {Event & { currentTarget: HTMLInputElement }} e */
  function handle_input(e) {
    const parsed = Number(e.currentTarget.value);
    if (!Number.isNaN(parsed)) {
      commit_value(parsed);
    }
  }
</script>

<div
  class={[
    "meter-card group relative flex min-h-16 flex-col items-center justify-center overflow-hidden rounded-sm border border-transparent bg-neutral-900/60 p-standard transition duration-standard ease-in-out select-none",
    editable && "cursor-default focus-within:z-10 hover:z-10 hover:brightness-125",
    className,
  ]}
  use:tooltip={description || null}
  data-editable={editable}>
  {#if label}
    <Label class="meter-label z-10 mb-tight w-auto flex-none justify-center font-mono text-electric-cyan transition-[filter,opacity] duration-150 ease-in-out">
      {label}
    </Label>
  {/if}

  <div class="meter-controls relative z-10 flex w-full items-center justify-center gap-tight">
    {#if editable}
      <Button flank={true} size="small" square class="hover:text-electric-cyan" onclick={decrease} aria-label="Decrease">
        <Icon name="minus" class="size-icon-small" />
      </Button>

      <input
        type="number"
        class="meter-input w-10 [appearance:textfield] bg-transparent py-1 text-center type-data text-frisk outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={clamped_value}
        oninput={handle_input}
        {min}
        {max}
        {step} />

      <Button flank={true} size="small" square class="hover:text-electric-cyan" onclick={increase} aria-label="Increase">
        <Icon name="plus" class="size-icon-small" />
      </Button>
    {:else}
      <span class="meter-value py-1 type-data text-frisk">
        {clamped_value}{unit}
      </span>
    {/if}
  </div>

  <Meter.Root value={clamped_value} {min} {max} class="meter-progress absolute bottom-0 left-0 z-0 h-1 w-full overflow-hidden bg-electric-cyan/20">
    <div
      class="h-full w-full origin-left bg-electric-cyan shadow-[0_0_8px_var(--color-electric-cyan)] transition-transform duration-fast ease-in-out"
      style:transform="scaleX({percentage / 100})">
    </div>
  </Meter.Root>
</div>
