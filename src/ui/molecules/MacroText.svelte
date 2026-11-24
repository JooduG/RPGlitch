<script>
  /**
   * @file src/ui/molecules/MacroText.svelte
   * Renders prose with resolved `@ID` handles colored by signature hue and interactive hover/context-menu previews.
   */
  import { hide_tooltip, pin_tooltip_menu, tooltip } from "@atoms";
  import { get_signature_color, resolve_display_macro_segments } from "@utils";

  let { text = "", owner = null, entities = {}, segment = null, on_select = null } = $props();

  const segments = $derived(segment ? [segment] : resolve_display_macro_segments(String(text ?? ""), owner, entities));
  const color_of = (seg) => (seg.entity ? get_signature_color(seg.entity, "var(--color-frozen)") : "var(--color-frozen)");

  function open_handle_menu(e, target_entity, fallback_text = "") {
    e.preventDefault();
    e.stopPropagation();
    pin_tooltip_menu(e.currentTarget, { preview: { entity: target_entity }, text: target_entity.name || fallback_text, x: e.clientX, y: e.clientY });
  }
</script>

{#each segments as seg, i (i)}
  {#if seg.macro}
    {#if seg.entity}
      {#if typeof on_select === "function"}
        <button
          type="button"
          use:tooltip={{ preview: { entity: seg.entity }, text: seg.entity.name || seg.text }}
          onclick={(e) => {
            e.stopPropagation();
            hide_tooltip();
            on_select(seg.entity);
          }}
          oncontextmenu={(e) => open_handle_menu(e, seg.entity, seg.text)}
          class="inline cursor-pointer type-data font-semibold hover:underline focus:outline-hidden"
          style:color={color_of(seg)}>{seg.text}</button>
      {:else}
        <span
          role="button"
          tabindex="-1"
          use:tooltip={{ preview: { entity: seg.entity }, text: seg.entity.name || seg.text }}
          oncontextmenu={(e) => open_handle_menu(e, seg.entity, seg.text)}
          class="inline type-data font-semibold"
          style:color={color_of(seg)}>{seg.text}</span>
      {/if}
    {:else}
      <span class={seg.text.startsWith("@") ? "type-data font-semibold" : undefined} style:color={color_of(seg)}>{seg.text}</span>
    {/if}
  {:else}
    {seg.text}
  {/if}
{/each}
