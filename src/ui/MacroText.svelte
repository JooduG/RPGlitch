<script>
  /**
   * @file MacroText.svelte
   * 🖍️ MACRO-AWARE INLINE TEXT
   * Renders text with @ENTITY / role placeholders resolved to canonical @ID handles,
   * each colored by the referenced entity's signature color and interactive on hover
   * to preview the entity's library card. Unresolved macros fall back to a muted
   * frozen color so raw tokens take up as little attention as possible.
   *
   * Pass either `text` + `owner` + `entities` (to resolve inline), or a
   * precomputed `segment` from `resolve_display_macro_segments`.
   */
  import { tooltip } from "@primitives";
  import { get_signature_color, resolve_display_macro_segments } from "@utils";

  let { text = "", owner = null, entities = {}, segment = null, fallback_color = "var(--color-frozen)" } = $props();

  const segments = $derived(segment ? [segment] : resolve_display_macro_segments(String(text ?? ""), owner, entities));

  const color_of = (seg) => (seg.entity ? get_signature_color(seg.entity, fallback_color) : fallback_color);
</script>

{#each segments as seg, i (i)}
  {#if seg.macro}
    {#if seg.entity}
      <span
        use:tooltip={{ entity: seg.entity, text: seg.entity.name || seg.text }}
        class="cursor-help font-mono text-xs font-semibold"
        style="color: {color_of(seg)};">{seg.text}</span>
    {:else}
      <span class={seg.text.startsWith("@") ? "font-mono text-xs font-semibold" : undefined} style="color: {color_of(seg)};">{seg.text}</span>
    {/if}
  {:else}
    {seg.text}
  {/if}
{/each}
