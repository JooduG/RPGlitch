<script>
  /**
   * @file Button.svelte
   * 🕹️ SOTA ATOMIC BUTTON COMPONENT
   * High-performance, multi-variant interaction layer.
   * Headless refactor powered by bits-ui/Button and Svelte 5.
   */
  import { simulationState } from "@state";
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
    flank = false,
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

  const is_exempt_btn = $derived(
    label?.toLowerCase().includes("interrupt") ||
      label?.toLowerCase().includes("settings") ||
      rest["aria-label"]?.toLowerCase().includes("interrupt") ||
      rest["aria-label"]?.toLowerCase().includes("settings") ||
      className?.toLowerCase().includes("interrupt") ||
      className?.toLowerCase().includes("settings"),
  );

  let is_disabled = $derived(disabled || (simulationState.intent_active && !is_exempt_btn));
  const is_flank = $derived(flank || className?.toLowerCase().includes("flank"));

  const height_class = $derived(cover ? "" : square && size === "small" ? "h-4" : square ? "h-12" : size === "small" ? "h-8" : "h-10");

  const width_class = $derived(cover ? "" : square && size === "small" ? "w-4" : square ? "w-12" : full_width ? "w-full" : "");

  const padding_class = $derived(cover ? "" : square ? "p-0" : size === "small" ? "px-2" : "px-4");

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
    {cover ? '' : 'relative'}
    inline-flex
    {height_class}
    {width_class}
    {padding_class}
    cursor-pointer
    items-center
    justify-center
    gap-2
    rounded-xl
    border
    border-solid
    border-transparent
    font-[inherit]
    text-base
    leading-normal
    font-extrabold
    text-white
    no-underline
    shadow-sm
    shadow-black/20
    select-none

    hover:brightness-125

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
      ease-out

      data-[kinetic=true]:transition-[background-color,color,box-shadow,filter,border-color]
    `
    : ''}
    {variant === 'primary' ? 'bg-slate-600 hover:brightness-125' : ''}
    {variant === 'secondary' ? 'bg-(--signature-color) text-white hover:brightness-125' : ''}
    {variant === 'danger' ? 'bg-slate-600 hover:bg-red-500 hover:text-slate-50 hover:shadow-lg hover:shadow-red-500/60 hover:brightness-125' : ''}
    {variant === 'invisible' ? 'bg-transparent text-slate-600 shadow-none! hover:bg-transparent hover:text-slate-50 hover:brightness-125' : ''}
    {size === 'small' ? 'text-xs' : ''}
    {square ? 'aspect-square shrink-0' : ''}
    {full_width && !square ? 'flex-1' : ''}
    {cover ? 'absolute inset-0 z-10 h-full min-h-0 w-full rounded-[inherit] border-none bg-transparent p-0 shadow-none!' : ''}
    {busy ? 'pointer-events-none cursor-wait brightness-90 grayscale-30' : ''}
    {is_flank
    ? 'border-none bg-transparent text-slate-50 opacity-60 shadow-none! transition-[transform,color,opacity] duration-300 ease-out hover:scale-[1.02] hover:opacity-100 active:scale-[0.96] disabled:pointer-events-none disabled:transform-none disabled:opacity-30 disabled:grayscale data-[kinetic=true]:hover:scale-100 data-[kinetic=true]:active:scale-100 [&_svg]:fill-slate-50 [&_svg]:transition-colors [&_svg]:duration-300 [&_svg]:disabled:fill-slate-600'
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
