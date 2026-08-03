<script>
  /**
   * @file Dropdown.svelte
   * THE SELECT PRIMITIVE
   * Standalone dropdown select atom using bits-ui/Select and Svelte 5.
   */
  import { tooltip } from "@atoms";
  import { Select } from "bits-ui";
  import { scale } from "svelte/transition";

  let {
    // State
    value = $bindable(),
    items = [], // Array of { value: string, label: string, region?: string, tag?: string, disabled?: boolean, tooltip?: string }
    label = "Select Option",
    id = undefined,
    disabled = false,
    uppercase = true,
    matchWidth = false,
    dropdownWidth = undefined,
    dropdownHeight = undefined,
    rows = 8,
    align = "start",
    variant = "default", // "default" | "bare"
    class: className = "",
    trigger_style = "",
    trigger_content = undefined,

    // Callbacks
    onchange = undefined,
  } = $props();

  // Dynamically derive the currently selected item
  const selected_item = $derived(items.find((item) => item.value === value));

  // Compute row-based max height if explicit dropdownHeight is not passed.
  // `computed_height` is the Tailwind class for the outer clip container;
  // `computed_height_css` is the raw CSS value applied to the scroll container so it
  // actually constrains (the previous `max-height: inherit` chain resolved to
  // `none` because Select.Viewport has no max-height of its own).
  const computed_height = $derived(dropdownHeight || `max-h-[min(70vh,calc(${rows}*3.25rem))]`);
  const computed_height_css = $derived(dropdownHeight || `min(70vh, calc(${rows} * 3.25rem))`);
</script>

<Select.Root type="single" bind:value onValueChange={(val) => onchange?.(val)} {disabled}>
  <Select.Trigger
    {id}
    class={[
      variant === "default" &&
        `
      group/trigger
      inline-flex
      min-h-12
      w-full
      cursor-pointer
      items-center
      justify-between
      gap-2
      rounded-xl
      border
      border-solid
      border-transparent
      bg-(--signature-color,#555d66)
      px-4
      py-2
      text-left
      font-sans
      text-sm
      text-white
      ${uppercase ? "uppercase" : ""}
      transition-[background-color,color,box-shadow,transform,filter,border-color]
      duration-500
      ease-out

      hover:brightness-125

      focus-visible:outline
      focus-visible:outline-offset-1
      focus-visible:outline-white

      active:scale-[0.99]

      disabled:pointer-events-none
      disabled:cursor-not-allowed
      disabled:opacity-30
      disabled:grayscale

      data-[state=open]:brightness-110
    `,
      className,
    ]}
    style={trigger_style}
    aria-label={label}
  >
    {#if trigger_content}
      {@render trigger_content({ selected_item, label })}
    {:else}
      {#if selected_item?.portrait}
        <img src={selected_item.portrait} alt="" class="size-6 shrink-0 rounded object-cover shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
      {/if}
      <span
        class="
          flex-1
          truncate
        "
      >
        {selected_item ? selected_item.label : label}
        {#if selected_item && (selected_item.region || selected_item.tag)}
          <span class="opacity-50"> - {selected_item.region || selected_item.tag}</span>
        {/if}
      </span>
      <svg
        viewBox="0 0 24 24"
        class="
          size-4
          shrink-0
          opacity-60
          transition-transform
          duration-150
          ease-in-out

          group-data-[state=open]/trigger:rotate-180
          group-data-[state=open]/trigger:opacity-100
        "
      >
        <path fill="currentColor" d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
      </svg>
    {/if}
  </Select.Trigger>

  <Select.Portal>
    <Select.Content sideOffset={8} {align}>
      {#snippet child({ wrapperProps, props })}
        <div {...wrapperProps}>
          <div
            {...props}
            data-dropdown-menu
            class="
              z-max
              flex
              {computed_height}
              {dropdownWidth ? dropdownWidth : matchWidth ? 'w-(--bits-select-anchor-width)' : 'w-[calc(var(--bits-select-anchor-width)+3.5rem)]'}
              flex-col
                overflow-hidden
                rounded-xl
                border
                border-solid
                border-transparent
                bg-(--signature-color,#555d66)
                shadow-[0_4px_16px_rgba(0,0,0,0.3)]
              "
            transition:scale={{ duration: 150, start: 0.95, opacity: 0 }}
          >
            <Select.Viewport
              class="
                  overflow-hidden
                  p-0
                "
            >
              <div class="scrollbar-none [&::-webkit-scrollbar]:hidden" style="max-height: {computed_height_css}; overflow-y: auto;">
                {#each items as item (item.value)}
                  <Select.Item
                    class="
                        flex
                        w-full
                        cursor-pointer
                        items-center
                        justify-between
                        gap-4
                        bg-(--signature-color,#555d66)
                        px-3
                        py-2
                        text-left
                        font-sans
                        text-sm
                        text-[#f2f7fa]

                        transition-[background-color,color,box-shadow,transform,filter,border-color]
                        duration-500
                        ease-out

                        outline-none
                        select-none

                        focus:outline-none

                        active:scale-[0.96]

                        aria-selected:brightness-110
                        data-disabled:pointer-events-none
                        data-disabled:cursor-not-allowed
                        data-disabled:opacity-30

                        data-disabled:grayscale
                        data-highlighted:text-white
                        data-highlighted:brightness-125

                        data-[selected=true]:brightness-110

                        data-[state=checked]:brightness-110
                      "
                    value={item.value}
                    label={item.label}
                    disabled={item.disabled}
                  >
                    {#if item.portrait}
                      <img src={item.portrait} alt="" class="size-6 shrink-0 rounded object-cover shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                    {/if}
                    <span
                      use:tooltip={item.tooltip ? { text: item.tooltip, placement: "left" } : undefined}
                      class="
                          flex-1
                          truncate
                          {uppercase ? 'uppercase' : ''}
                        "
                    >
                      {item.label}
                      {#if item.region || item.tag}
                        <span class="opacity-50"> - {item.region || item.tag}</span>
                      {/if}
                    </span>
                  </Select.Item>
                {/each}
              </div>
            </Select.Viewport>
          </div>
        </div>
      {/snippet}
    </Select.Content>
  </Select.Portal>
</Select.Root>
