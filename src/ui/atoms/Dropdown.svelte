<script>
  /**
   * @file Dropdown.svelte
   * THE SELECT PRIMITIVE
   * Standalone dropdown select atom using bits-ui/Select and Svelte 5.
   */
  import { ScrollArea } from "@atoms";
  import { Select } from "bits-ui";
  import { scale } from "svelte/transition";

  let {
    // State
    value = $bindable(),
    items = [], // Array of { value: string, label: string, region?: string, tag?: string, disabled?: boolean }
    label = "Select Option",
    disabled = false,
    uppercase = true,
    matchWidth = false,
    dropdownHeight = "max-h-36",

    // Callbacks
    onchange = undefined,
  } = $props();

  // Dynamically derive the currently selected item
  const selected_item = $derived(items.find((item) => item.value === value));
</script>

<Select.Root type="single" bind:value onValueChange={(val) => onchange?.(val)} {disabled}>
  <Select.Trigger
    class="
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
      {uppercase ? 'uppercase' : ''}
      transition-[background-color,color,box-shadow,transform,filter,border-color]
      duration-500
      ease-out

      hover:brightness-125

      focus-visible:outline
      focus-visible:outline-offset-1
      focus-visible:outline-white

      active:scale-[0.96]

      disabled:pointer-events-none
      disabled:cursor-not-allowed
      disabled:opacity-30
      disabled:grayscale

      data-[state=open]:brightness-110
    "
    aria-label={label}
  >
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
  </Select.Trigger>

  <Select.Portal>
    <Select.Content sideOffset={8} align="start">
      {#snippet child({ wrapperProps, props })}
        <div {...wrapperProps}>
          <div
            {...props}
            data-dropdown-menu
            class="
              z-max
              flex
              {dropdownHeight}
              {matchWidth ? 'w-(--bits-select-anchor-width)' : 'w-[calc(var(--bits-select-anchor-width)+3.5rem)]'}
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
                  p-1.5
                "
            >
              <ScrollArea style="max-height: inherit;">
                {#each items as item (item.value)}
                  <Select.Item
                    class="
                        flex
                        w-full
                        cursor-pointer
                        items-center
                        justify-between
                        gap-4
                        rounded-lg
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
                    <span
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
              </ScrollArea>
            </Select.Viewport>
          </div>
        </div>
      {/snippet}
    </Select.Content>
  </Select.Portal>
</Select.Root>
