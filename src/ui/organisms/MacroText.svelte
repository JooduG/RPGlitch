<script>
  /**
   * @file src/ui/organisms/MacroText.svelte
   * Renders prose with resolved `@ID` handles colored by signature hue and interactive hover/context-menu previews.
   */
  import { hide_tooltip, pin_tooltip_menu, tooltip } from "@atoms";
  import { app } from "@state";
  import { get_signature_color, resolve_display_macro_segments } from "@utils";

  let { text = "", owner = null, entities = {}, segment = null, fallback_color = "var(--color-frozen)", on_select = null } = $props();

  const segments = $derived(segment ? [segment] : resolve_display_macro_segments(String(text ?? ""), owner, entities));
  const color_of = (seg) => (seg.entity ? get_signature_color(seg.entity, fallback_color) : fallback_color);

  function open_handle_profile(e, target_entity) {
    e.stopPropagation();
    hide_tooltip();
    if (typeof on_select === "function") {
      on_select(target_entity);
    } else {
      app.open_profile(target_entity);
    }
  }

  function open_handle_menu(e, target_entity, fallback_text = "") {
    e.preventDefault();
    e.stopPropagation();
    pin_tooltip_menu(e.currentTarget, { preview: { entity: target_entity }, text: target_entity.name || fallback_text, x: e.clientX, y: e.clientY });
  }
</script>

{#each segments as seg, i (i)}
  {#if seg.macro}
    {#if seg.entity}
      {#if on_select || on_select === null}
        <button
          type="button"
          use:tooltip={{ preview: { entity: seg.entity }, text: seg.entity.name || seg.text }}
          onclick={(e) => open_handle_profile(e, seg.entity)}
          oncontextmenu={(e) => open_handle_menu(e, seg.entity, seg.text)}
          class="inline cursor-pointer font-mono text-xs font-semibold hover:underline focus:outline-hidden"
          style="color: {color_of(seg)};">{seg.text}</button>
      {:else}
        <span
          role="button"
          tabindex="-1"
          use:tooltip={{ preview: { entity: seg.entity }, text: seg.entity.name || seg.text }}
          oncontextmenu={(e) => open_handle_menu(e, seg.entity, seg.text)}
          class="inline font-mono text-xs font-semibold"
          style="color: {color_of(seg)};">{seg.text}</span>
      {/if}
    {:else}
      <span class={seg.text.startsWith("@") ? "font-mono text-xs font-semibold" : undefined} style="color: {color_of(seg)};">{seg.text}</span>
    {/if}
  {:else}
    {seg.text}
  {/if}
{/each}
