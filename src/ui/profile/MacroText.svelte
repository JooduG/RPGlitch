<script>
  /**
   * @file MacroText.svelte
   * 🖍️ MACRO-AWARE INLINE TEXT
   * Renders text with {{macro}} placeholders resolved to entity names, each
   * colored by the referenced entity's signature color. Unresolved macros fall
   * back to a muted frozen color so raw {{...}} syntax never leaks to the
   * reader and unresolved references take up as little attention as possible.
   *
   * Pass either `text` + `owner` + `entities` (to resolve inline), or a
   * precomputed `segment` from `resolve_display_macro_segments`.
   */
  import { get_signature_color } from "@media";
  import { resolve_display_macro_segments } from "@intelligence";

  let { text = "", owner = null, entities = {}, segment = null, fallback_color = "var(--color-frozen)" } = $props();

  const segments = $derived(segment ? [segment] : resolve_display_macro_segments(String(text ?? ""), owner, entities));

  const color_of = (seg) => (seg.entity ? get_signature_color(seg.entity, fallback_color) : fallback_color);
</script>

{#each segments as seg, i (i)}
  {#if seg.macro}
    <span style="color: {color_of(seg)};">{seg.text}</span>
  {:else}
    {seg.text}
  {/if}
{/each}
