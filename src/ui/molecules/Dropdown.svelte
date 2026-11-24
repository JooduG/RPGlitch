<script>
  /**
   * @file src/ui/molecules/Dropdown.svelte
   * Dropdown select molecule wrapping bits-ui Select and @atoms.
   */
  import { Icon, tooltip } from "@atoms";
  import { motion } from "@media";
  import { Select } from "bits-ui";
  import { scale } from "svelte/transition";

  let {
    value = $bindable(),
    items = [],
    label = "Select Option",
    id = undefined,
    disabled = false,
    matchWidth = false,
    dropdownWidth = undefined,
    align = "start",
    variant = "default",
    class: className = "",
    trigger_style = "",
    trigger_content = undefined,
    onchange = undefined,
  } = $props();

  const selected_item = $derived(items.find((item) => item.value === value));

  let is_open = $derived.by(() => {
    void disabled;
    return false;
  });
</script>

<Select.Root
  type="single"
  bind:value
  bind:open={
    () => !disabled && is_open,
    (next) => {
      is_open = !disabled && next;
    }
  }
  onValueChange={(val) => onchange?.(val)}
  {disabled}>
  <Select.Trigger
    {id}
    class={[
      variant === "default" &&
        "group/trigger inline-flex min-h-12 w-full cursor-pointer items-center justify-between gap-tight rounded-xl border border-solid border-transparent bg-(--signature-color,#555d66) px-standard py-tight text-left type-interact text-pure-white transition-[background-color,color,box-shadow,transform,filter,border-color] duration-fast ease-out hover:brightness-125 focus-visible:outline focus-visible:outline-offset-1 focus-visible:outline-white active:scale-[0.99] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-30 disabled:grayscale data-[state=open]:brightness-110",
      className,
    ]}
    style={trigger_style}
    aria-label={label}>
    {#if trigger_content}
      {@render trigger_content({ selected_item, label })}
    {:else}
      {#if selected_item?.portrait}
        <img src={selected_item.portrait} alt="" class="size-6 shrink-0 rounded object-cover shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
      {/if}
      <span class="flex-1 truncate">
        {selected_item ? selected_item.label : label}
        {#if selected_item && (selected_item.region || selected_item.tag)}
          <span class="opacity-50"> - {selected_item.region || selected_item.tag}</span>
        {/if}
      </span>
      <Icon
        name="chevron_down"
        class="size-4 shrink-0 opacity-60 transition-transform duration-150 ease-in-out group-data-[state=open]/trigger:rotate-180 group-data-[state=open]/trigger:opacity-100" />
    {/if}
  </Select.Trigger>

  <Select.Portal>
    <Select.Content sideOffset={8} {align}>
      {#snippet child({ wrapperProps, props })}
        <div {...wrapperProps} style:z-index="var(--z-index-tooltip)">
          <div
            {...props}
            data-dropdown-menu
            class={[
              "flex flex-col overflow-hidden rounded-xl border border-solid border-transparent bg-(--signature-color,#555d66) shadow-[0_4px_16px_rgba(0,0,0,0.3)]",
              dropdownWidth ? dropdownWidth
              : matchWidth ? "w-(--bits-select-anchor-width)"
              : "w-[calc(var(--bits-select-anchor-width)+3.5rem)]",
            ]}
            transition:scale={{ duration: motion.is_reduced ? 0 : 150, start: 0.95, opacity: 0 }}>
            <Select.Viewport class="scrollbar-none overflow-y-auto p-0 [&::-webkit-scrollbar]:hidden" style="max-height: min(70dvh, calc(8 * 3.25rem));">
              {#each items as item (item.value)}
                <Select.Item
                  class="flex w-full cursor-pointer items-center justify-between gap-standard bg-(--signature-color,#555d66) px-3 py-tight text-left type-interact text-frisk transition-[background-color,color,box-shadow,transform,filter,border-color] duration-fast ease-out outline-none select-none focus:outline-none active:scale-sink aria-selected:brightness-110 data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-30 data-disabled:grayscale data-highlighted:text-pure-white data-highlighted:brightness-125 data-[selected=true]:brightness-110 data-[state=checked]:brightness-110"
                  value={item.value}
                  label={item.label}
                  disabled={item.disabled}>
                  {#if item.portrait}
                    <img src={item.portrait} alt="" class="size-6 shrink-0 rounded object-cover shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                  {/if}
                  <span use:tooltip={item.tooltip ? { text: item.tooltip, placement: "left" } : undefined} class="flex-1 truncate">
                    {item.label}
                    {#if item.region || item.tag}
                      <span class="opacity-50"> - {item.region || item.tag}</span>
                    {/if}
                  </span>
                </Select.Item>
              {/each}
            </Select.Viewport>
          </div>
        </div>
      {/snippet}
    </Select.Content>
  </Select.Portal>
</Select.Root>
