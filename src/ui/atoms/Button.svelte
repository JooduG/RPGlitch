<script>
  /**
   * @file Button.svelte
   * 🕹️ SOTA ATOMIC BUTTON COMPONENT
   * High-performance, multi-variant interaction layer.
   * Headless refactor powered by bits-ui/Button and Svelte 5.
   */
  import { controlState } from "@state";
  import { Button } from "bits-ui";

  let {
    // Data
    label = "",
    children = null,

    // State
    variant = "primary", // 'primary' | 'secondary' | 'danger' | 'invisible'
    size = "md", // 'small' | 'md'
    busy = false,
    disabled = false,

    // Design
    cover = false,
    square = false,
    full_width = false,
    class: className = "",

    // Handlers
    actions = [],

    ...rest
  } = $props();

  /** @type {HTMLButtonElement|null} */
  let element = $state(null);

  /** API: Focus the button */
  export function focus() {
    element?.focus();
  }

  const is_interrupt_btn = $derived(
    label?.toLowerCase().includes("interrupt") ||
      rest["aria-label"]?.toLowerCase().includes("interrupt") ||
      className?.toLowerCase().includes("interrupt"),
  );

  let is_disabled = $derived(disabled || (controlState.intent_active && !is_interrupt_btn));
  const is_flank = $derived(className?.toLowerCase().includes("flank"));

  // Svelte 5 Action delegation: Apply Svelte actions dynamically when element reference becomes active
  $effect(() => {
    if (element && actions.length > 0) {
      const active_actions = actions.map((act) => {
        if (Array.isArray(act)) {
          return act[0](element, act[1]);
        } else {
          return act(element);
        }
      });

      return () => {
        active_actions.forEach((res) => res?.destroy?.());
      };
    }
  });
</script>

<Button.Root
  bind:ref={element}
  disabled={is_disabled || busy}
  type="button"
  class="
    pointer-events-auto
    relative
    inline-flex
    h-12
    cursor-pointer
    items-center
    justify-center
    gap-[var(--gap-standard)]
    rounded-[16px]
    border
    border-solid
    border-transparent
    bg-transparent
    px-[var(--padding-standard)]
    font-[inherit]
    text-[var(--font-size-base)]
    leading-normal
    font-extrabold
    text-[var(--font-color-base)]
    no-underline
    shadow-[0_4px_16px_rgba(0,0,0,0.3)]
    select-none

    hover:brightness-110

    focus-visible:outline
    focus-visible:outline-offset-1
    focus-visible:outline-white

    active:scale-[0.96]

    disabled:pointer-events-none
    disabled:transform-none
    disabled:opacity-30
    disabled:shadow-none
    disabled:grayscale

    data-[kinetic=true]:active:scale-100

    [&_.icon]:pointer-events-none

    {!is_flank
    ? `
      transition-[background-color,color,box-shadow,transform,filter,border-color]
      duration-500
      ease-[cubic-bezier(0.34,1.56,0.64,1)]

      data-[kinetic=true]:transition-[background-color,color,box-shadow,filter,border-color]
    `
    : ''}
    {variant === 'primary'
    ? `
      bg-[var(--signature-color,var(--frozen))]

      hover:border-[var(--font-color-base)]
    `
    : ''}
    {variant === 'secondary'
    ? `
      bg-[var(--signature-color,var(--frozen))]

      hover:border-[var(--font-color-base)]
    `
    : ''}
    {variant === 'danger'
    ? `
      bg-[var(--signature-color,var(--frozen))]

      hover:border-[var(--font-color-base)]
      hover:bg-[#ef4444]
      hover:text-[var(--font-color-base)]
      hover:shadow-[0_0_16px_rgba(239,68,68,0.6)]
    `
    : ''}
    {variant === 'invisible'
    ? `
      bg-transparent
      text-[var(--font-color-muted)]
      shadow-none

      hover:bg-transparent
      hover:text-[var(--font-color-base)]
      hover:brightness-110
    `
    : ''}
    {size === 'small'
    ? `
      px-[var(--padding-tight)]
      text-[var(--font-size-small)]
    `
    : ''}
    {square
    ? `
      aspect-square
      shrink-0
      p-0
    `
    : ''}
    {square && size === 'small'
    ? `
      h-4
      w-4
    `
    : square
      ? `
        h-12
        w-12
      `
      : ''}
    {full_width
    ? `
      w-full
      flex-1
    `
    : ''}
    {cover
    ? `
      absolute
      inset-0
      z-10
      h-full
      min-h-0
      w-full
      rounded-[inherit]
      border-none
      bg-transparent
      p-0
      shadow-none
    `
    : ''}
    {busy
    ? `
      pointer-events-none
      cursor-wait
      brightness-90
      grayscale-30
    `
    : ''}
    {is_flank
    ? `
      border-none
      bg-transparent
      text-[var(--font-color-base)]
      opacity-60
      shadow-none
      transition-[transform,color,opacity]
      duration-300
      ease-[cubic-bezier(0.34,1.56,0.64,1)]

      hover:scale-[1.02]
      hover:opacity-100

      active:scale-[0.96]

      disabled:transform-none
      disabled:cursor-not-allowed
      disabled:text-[var(--font-color-muted)]
      disabled:opacity-10

      data-[kinetic=true]:hover:scale-100

      data-[kinetic=true]:active:scale-100

      [&_svg]:fill-[var(--font-color-base)]
      [&_svg]:transition-colors
      [&_svg]:duration-300

      [&_svg]:disabled:fill-[var(--font-color-muted)]
    `
    : ''}
    {className}"
  aria-busy={busy}
  aria-disabled={is_disabled || busy}
  {...rest}
>
  {#if children}
    {@render children()}
  {:else}
    {label}
  {/if}
</Button.Root>
