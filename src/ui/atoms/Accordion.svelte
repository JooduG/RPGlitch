<script>
  /**
   * @file src/ui/atoms/Accordion.svelte
   * Collapsible section atom with ARIA support via bits-ui Collapsible.
   */
  import { Collapsible } from "bits-ui";

  let { label = "", class: className = "", content_class = "", children } = $props();
  let open = $state(false);
</script>

<Collapsible.Root bind:open class={["w-full", className]}>
  <Collapsible.Trigger
    class="group flex w-full cursor-pointer items-center justify-between py-tight text-left text-slate-400 transition-colors hover:text-pure-white disabled:cursor-not-allowed disabled:opacity-40">
    <span class="type-uppercase-label">{label}</span>
    <span class={["type-data opacity-50 transition-transform", open && "rotate-180"]}>▼</span>
  </Collapsible.Trigger>
  <Collapsible.Content forceMount>
    {#snippet child({ props })}
      <div
        {...props}
        inert={!open}
        class="grid min-h-0 w-full overflow-hidden transition-[grid-template-rows] duration-standard ease-in-out"
        style:grid-template-rows={open ? "1fr" : "0fr"}>
        <div class="min-h-0 overflow-hidden">
          <div class={["pt-tight pb-standard", content_class]}>
            {@render children?.()}
          </div>
        </div>
      </div>
    {/snippet}
  </Collapsible.Content>
</Collapsible.Root>
