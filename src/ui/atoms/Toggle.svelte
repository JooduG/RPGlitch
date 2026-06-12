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
  let { value = $bindable(false), label = "", size = "md", disabled = false, busy = false, actions = [], class: className = "", style = "", onchange = undefined, ...rest } = $props();

  // Derived identifier for testing
  const test_id = $derived(label ? `${label.toLowerCase().replace(/\s+/g, "-")}-toggle` : undefined);

  let is_disabled = $derived(disabled || controlState.intent_active);
</script>

<label
  class="
    group/toggle
    relative
    inline-flex
    cursor-pointer
    items-center
    gap-4
    py-1
    transition-opacity
    duration-300
    ease-in-out
    select-none

    {is_disabled || busy
    ? `
      cursor-default!
      opacity-30
    `
    : ''}
    {busy
    ? `
      cursor-wait!
      brightness-90
      grayscale-50

      *:pointer-events-none
    `
    : ''}
    {size === 'small'}
    {className}"
  aria-busy={busy}
  aria-disabled={is_disabled || busy}
  {style}
  use:use_actions={actions}
>
  <Switch.Root bind:checked={value} disabled={is_disabled || busy} onCheckedChange={() => onchange?.(new Event("change"))} {...rest}>
    {#snippet child({ props })}
      <button
        {...props}
        class="
          group
          relative
          box-border
          shrink-0
          cursor-pointer
          rounded-full
          bg-neutral-900/60
          backdrop-blur-sm
          transition-[background-color,box-shadow,filter,transform]
          duration-300
          ease-in-out
          group-hover/toggle:brightness-125
          focus-visible:outline
          focus-visible:outline-offset-1
          focus-visible:outline-slate-600
          active:scale-[0.96]

          data-[state=checked]:bg-(--signature-color,#555d66)
          data-[state=checked]:group-hover/toggle:brightness-125

          {size === 'small'
          ? `
            h-4
            w-7
          `
          : `
            h-6
            w-10
          `}"
        data-testid={test_id}
      >
        <Switch.Thumb>
          {#snippet child({ props: thumbProps })}
            <span
              {...thumbProps}
              class="
                absolute
                rounded-full
                bg-slate-50
                transition-[transform,background-color,filter]
                duration-300
                ease-out

                group-data-[state=checked]:bg-white
                group-data-[state=checked]:shadow-[0_0_4px_rgba(255,255,255,0.3)]

                hover:brightness-125
                active:scale-[1.1]

                {size === 'small'
                ? `
                  top-[2px]
                  left-[2px]
                  size-3

                  group-data-[state=checked]:translate-x-3
                `
                : `
                  top-[4px]
                  left-[4px]
                  size-4

                  group-data-[state=checked]:translate-x-4
                `}"
            ></span>
          {/snippet}
        </Switch.Thumb>
      </button>
    {/snippet}
  </Switch.Root>

  {#if label}
    <span
      class="
        font-sans
        text-xs
        font-bold
        tracking-widest
        whitespace-nowrap
        text-(--signature-color,#555d66)
        uppercase
        transition-[color,filter]
        duration-300
        ease-in-out
        [text-shadow:0_0_10px_rgba(0,0,0,0.5)]

        group-hover/toggle:brightness-125
      "
    >
      {label}
    </span>
  {/if}
</label>
