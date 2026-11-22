<script>
  /**
   * @file src/ui/atoms/Accordion.svelte
   * Collapsible section atom with ARIA support via bits-ui Collapsible.
   */
  import { Collapsible } from "bits-ui";

  /**
   * @typedef {Object} Props
   * @property {string} [label] - Trigger text.
   * @property {boolean} [open] - Controlled open state (bindable).
   * @property {boolean} [default_open] - Uncontrolled initial open state.
   * @property {boolean} [disabled] - Disable toggling.
   * @property {string} [class] - External class on the root.
   * @property {string} [content_class] - External class on the content wrapper.
   * @property {import("svelte").Snippet} [children] - Section content.
   */

  /** @type {Props} */
  let { label = "", open = $bindable(false), default_open = false, disabled = false, class: className = "", content_class = "", children } = $props();
</script>

<Collapsible.Root bind:open {default_open} {disabled} class={["w-full", className]}>
  <Collapsible.Trigger
    class="group flex w-full cursor-pointer items-center justify-between py-tight text-left text-slate-400 transition-colors hover:text-pure-white">
    <span class="type-uppercase-label">{label}</span>
    <span class={["type-data opacity-50 transition-transform", open && "rotate-180"]}>▼</span>
  </Collapsible.Trigger>
  <Collapsible.Content forceMount>
    {#snippet child({ props })}
      <div
        {...props}
        class={["grid min-h-0 w-full transition-[grid-template-rows] duration-standard ease-in-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"]}>
        <div class="min-h-0 overflow-hidden">
          <div class={["pt-tight pb-standard", content_class]}>
            {@render children?.()}
          </div>
        </div>
      </div>
    {/snippet}
  </Collapsible.Content>
</Collapsible.Root>
