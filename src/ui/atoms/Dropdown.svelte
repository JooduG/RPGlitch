<script>
  /**
   * @file Dropdown.svelte
   * ðŸ’§ THE CHALK REGIME SELECT PRIMITIVE
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

    // Callbacks
    onchange = undefined,
  } = $props();

  // Dynamically derive the currently selected item
  const selected_item = $derived(items.find((item) => item.value === value));
</script>

<Select.Root type="single" bind:value onValueChange={(val) => onchange?.(val)} {disabled}>
  <Select.Trigger class="dropdown-trigger" aria-label={label}>
    <span class="truncate">
      {selected_item ? selected_item.label : label}
    </span>
    <!-- Subtle arrow/caret indicator inline with design language -->
    <svg viewBox="0 0 24 24" class="caret-icon">
      <path fill="currentColor" d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
    </svg>
  </Select.Trigger>

  <Select.Portal>
    <Select.Content class="dropdown-content" sideOffset={8} forceMount>
      {#snippet child({ wrapperProps, props, open })}
        {#if open}
          <div {...wrapperProps} class="dropdown-portal-wrapper">
            <div
              {...props}
              class="dropdown-menu glass-elevated"
              transition:scale={{ duration: 150, start: 0.95, opacity: 0 }}
            >
              <Select.Viewport class="dropdown-viewport">
                <ScrollArea class="dropdown-scroll-area" style="max-height: inherit;">
                  {#each items as item (item.value)}
                    <Select.Item
                      class="dropdown-item"
                      value={item.value}
                      label={item.label}
                      disabled={item.disabled}
                    >
                      <span class="label">{item.label}</span>
                      {#if item.region || item.tag}
                        <div class="tags">
                          <span>{item.region || item.tag}</span>
                        </div>
                      {/if}
                    </Select.Item>
                  {/each}
                </ScrollArea>
              </Select.Viewport>
            </div>
          </div>
        {/if}
      {/snippet}
    </Select.Content>
  </Select.Portal>
</Select.Root>

<style>
  /* --- TRIGGER BUTTON --- */

  :global(.dropdown-trigger) {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-tight);
    text-align: left;
    min-height: calc(var(--spacing-unit) * 12);
    border-radius: var(--radius-standard);
    font-family: var(--font-family-base);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-bold);
    background: var(--signature-color, var(--frozen));
    color: var(--pure-white);
    box-shadow: var(--shadow-ghost);
    border: transparent solid;
    padding: var(--padding-tight) var(--padding-standard);
    width: 100%;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-standard);
    user-select: none;
    outline: none;
  }

  :global(.dropdown-trigger:hover:not(:disabled)) {
    filter: var(--brightness-glow);
  }

  :global(.dropdown-trigger:active:not(:disabled)) {
    transform: var(--scale-sink);
  }

  /* Trigger Active state mapping (bits-ui data state) */
  :global(.dropdown-trigger[data-state="open"]) {
    filter: var(--brightness-glow);
  }

  :global(.dropdown-trigger:disabled) {
    opacity: var(--opacity-whisper);
    filter: grayscale(var(--opacity-solid));
    pointer-events: none;
    cursor: not-allowed;
  }

  :global(.dropdown-trigger .caret-icon) {
    width: var(--font-size-h6);
    height: var(--font-size-h6);
    flex-shrink: 0;
    transition: transform var(--duration-fast) var(--ease-standard);
    opacity: var(--opacity-muted);
  }

  :global(.dropdown-trigger[data-state="open"] .caret-icon) {
    transform: rotate(180deg);
    opacity: var(--opacity-solid);
  }

  /* --- PORTAL WRAPPER --- */

  :global(.dropdown-portal-wrapper) {
    /* Supreme z-index overlay to prevent collision under modal backdrops */
    z-index: var(--z-index-max);
  }

  /* --- DROPDOWN MENU --- */

  :global(.dropdown-menu) {
    border-radius: var(--radius-standard);
    border: var(--border-width-base) solid var(--border-whisper);
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-standard);
    overflow: hidden;

    /* Dimensions derived from Constants */
    max-height: calc(var(--row-unit) * 3); /* DROPDOWN_MAX_HEIGHT */
  }

  :global(.dropdown-viewport) {
    padding: 0;
    overflow: hidden;
  }

  /* --- MENU ITEMS --- */

  :global(.dropdown-item) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-standard);
    border-radius: 0;
    text-align: left;
    color: var(--frisk);
    border-bottom: var(--border-width-base) solid var(--border-whisper);
    width: 100%;
    padding: var(--padding-tight) var(--padding-standard);
    font-family: var(--font-family-base);
    font-size: var(--font-size-small);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-standard);
    user-select: none;
    outline: none;
  }

  :global(.dropdown-item:last-child) {
    border-bottom: none;
  }

  /* Hover / Highlighted (using bits-ui data attributes) */
  :global(.dropdown-item[data-highlighted]) {
    background: var(--glass-sunken);
    color: var(--pure-white);
    filter: var(--brightness-glow);
  }

  /* Active / Selected (using bits-ui data attributes) */
  :global(.dropdown-item[data-selected="true"]),
  :global(.dropdown-item[data-state="checked"]),
  :global(.dropdown-item[aria-selected="true"]) {
    background: var(--glass-base);
    color: var(--frisk);
    filter: var(--brightness-glow);
  }

  :global(.dropdown-item[data-disabled]) {
    opacity: var(--opacity-whisper);
    filter: grayscale(var(--opacity-solid));
    pointer-events: none;
    cursor: not-allowed;
  }

  .truncate,
  :global(.dropdown-item .label) {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    flex: 1;
  }

  :global(.dropdown-item .tags) {
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-end;
    gap: var(--gap-tight);
    font-size: var(--font-size-tiny);
    text-transform: uppercase;
    font-weight: var(--font-weight-bold);
    color: var(--frozen);
    letter-spacing: var(--font-spacing-loose);
    line-height: 1;
    text-align: right;
    flex-shrink: 0;
  }
</style>
