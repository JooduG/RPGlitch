<script>
  /**
   * @file src/ui/atoms/Button.svelte
   * Multi-variant interactive button atom built on bits-ui Button.Root.
   */
  import { Button } from "bits-ui";
  import { onDestroy } from "svelte";

  let {
    label = "",
    children = null,
    variant = "primary",
    size = "md",
    busy = false,
    disabled = false,
    cover = false,
    square = false,
    flank = false,
    class: className = "",
    actions = [],
    ...rest
  } = $props();

  /** @type {HTMLButtonElement | null} */
  let element = $state(null);
  /** @type {Map<Function, { result: any, param: any }>} */
  const mounted_actions = new Map();

  const is_flank = $derived(
    flank ||
      String(className ?? "")
        .toLowerCase()
        .includes("flank"),
  );

  const size_class = $derived(
    variant === "bare" || cover ? ""
    : square ?
      size === "small" ?
        "size-4 p-0"
      : "size-12 p-0"
    : size === "small" ? "h-8 px-tight"
    : "h-10 px-standard",
  );

  // Reconcile actions by function identity so array literals don't tear down active tooltips/animations
  $effect(() => {
    const el = element;
    if (!el) return;

    const entries = actions.map((act) => (Array.isArray(act) ? { fn: act[0], param: act[1] } : { fn: act, param: undefined }));
    const active_fns = new Set(entries.map((e) => e.fn));

    for (const [fn, record] of mounted_actions) {
      if (!active_fns.has(fn)) {
        record.result?.destroy?.();
        mounted_actions.delete(fn);
      }
    }

    for (const { fn, param } of entries) {
      const existing = mounted_actions.get(fn);
      if (existing) {
        if (existing.param !== param) {
          existing.param = param;
          existing.result?.update?.(param);
        }
      } else {
        mounted_actions.set(fn, { result: fn(el, param), param });
      }
    }
  });

  onDestroy(() => {
    for (const record of mounted_actions.values()) record.result?.destroy?.();
    mounted_actions.clear();
  });
</script>

<Button.Root
  bind:ref={element}
  disabled={disabled || busy}
  type="button"
  class={[
    variant !== "bare" && [
      "pointer-events-auto inline-flex cursor-pointer items-center justify-center gap-tight rounded-xl border border-solid border-transparent type-interact text-pure-white no-underline shadow-sm shadow-black/20 select-none focus-visible:outline focus-visible:outline-offset-1 focus-visible:outline-white active:scale-sink disabled:pointer-events-none disabled:transform-none disabled:opacity-30 disabled:shadow-none disabled:grayscale data-[kinetic=true]:active:scale-100 [&_.icon]:pointer-events-none",
      !cover && "relative",
      size_class,
    ],
    !is_flank &&
      variant !== "bare" &&
      "transition-[background-color,color,box-shadow,transform,filter,border-color] duration-fast ease-out data-[kinetic=true]:transition-[background-color,color,box-shadow,filter,border-color]",
    variant === "primary" && "bg-slate-600 hover:bg-(--signature-color)",
    variant === "secondary" && "bg-(--signature-color) hover:brightness-125",
    variant === "danger" && "bg-slate-600 hover:bg-red-500",
    variant === "invisible" && "bg-transparent text-slate-600 shadow-none! hover:bg-transparent hover:text-slate-50 hover:brightness-125",
    variant === "bare" && "border-none bg-transparent p-0 outline-none",
    square && variant !== "bare" && "aspect-square shrink-0",
    cover && variant !== "bare" && "absolute inset-0 z-10 h-full min-h-0 w-full rounded-[inherit] border-none bg-transparent p-0 shadow-none!",
    busy && "pointer-events-none cursor-wait brightness-90 grayscale-30",
    is_flank &&
      variant !== "bare" &&
      "border-none bg-transparent text-slate-50 opacity-60 shadow-none! transition-[transform,color,opacity] duration-fast ease-out hover:scale-[1.02] hover:opacity-100 active:scale-sink disabled:pointer-events-none disabled:transform-none disabled:opacity-30 disabled:grayscale data-[kinetic=true]:hover:scale-100 data-[kinetic=true]:active:scale-100 [&_svg]:fill-slate-50 [&_svg]:transition-colors [&_svg]:duration-fast [&_svg]:disabled:fill-slate-600",
    className,
  ]}
  aria-busy={busy}
  aria-disabled={disabled || busy}
  {...rest}>
  {#if children}
    {@render children()}
  {:else}
    {label}
  {/if}
</Button.Root>
