<!-- src/ui/atoms/Toggle.svelte -->
<script>
  import { Switch } from "bits-ui";
  import Label from "./Label.svelte";

  let { value = $bindable(false), label = "", size = "md", disabled = false, class: className = "", onchange = undefined, ...rest } = $props();

  const control_id = $props.id();
  const test_id = $derived(label ? `${label.toLowerCase().replace(/\s+/g, "-")}-toggle` : undefined);
</script>

<div
  class={[
    "group/toggle relative inline-flex cursor-pointer items-center gap-standard transition-opacity duration-300 ease-in-out select-none",
    disabled && "cursor-default! opacity-30",
    className,
  ]}
  aria-disabled={disabled}>
  <Switch.Root bind:checked={value} {disabled} onCheckedChange={(checked) => onchange?.(checked)} id={control_id} {...rest}>
    {#snippet child({ props })}
      <button
        {...props}
        aria-label={label || rest["aria-label"] || undefined}
        class={[
          "group relative box-border shrink-0 cursor-pointer rounded-full border border-white/10 bg-neutral-900/60 backdrop-blur-sm transition-[background-color,box-shadow,filter,transform] duration-fast ease-out group-hover/toggle:brightness-125 focus-visible:outline focus-visible:outline-offset-1 focus-visible:outline-slate-600 active:scale-sink disabled:cursor-default data-disabled:cursor-default data-[state=checked]:border-transparent data-[state=checked]:bg-(--signature-color,#555d66) data-[state=checked]:group-hover/toggle:brightness-125",
          size === "small" ? "h-4 w-7" : "h-6 w-10",
        ]}
        data-testid={test_id}>
        <Switch.Thumb>
          {#snippet child({ props: thumbProps })}
            <span
              {...thumbProps}
              class={[
                "absolute rounded-full bg-frisk transition-[transform,background-color,filter] duration-standard ease-out group-data-[state=checked]:bg-pure-white group-data-[state=checked]:shadow-[0_0_4px_rgba(255,255,255,0.3)] hover:brightness-125 active:scale-[1.1]",
                size === "small" ?
                  "top-0.5 left-0.5 size-3 group-data-[state=checked]:translate-x-3"
                : "top-1 left-1 size-4 group-data-[state=checked]:translate-x-4",
              ]}></span>
          {/snippet}
        </Switch.Thumb>
      </button>
    {/snippet}
  </Switch.Root>

  {#if label}
    <Label for={control_id} {disabled} class="w-auto flex-none text-xs! [text-shadow:0_0_10px_rgba(0,0,0,0.5)] group-hover/toggle:brightness-125">
      {label}
    </Label>
  {/if}
</div>
