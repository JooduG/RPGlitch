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
  import { hide_tooltip, pin_tooltip_menu, tooltip } from "@primitives";
  import { app } from "@state";
  import { get_signature_color, resolve_display_macro_segments } from "@utils";
  import { build_entity_preview_actions } from "./ContextMenu.svelte.js";

  let { text = "", owner = null, entities = {}, segment = null, fallback_color = "var(--color-frozen)" } = $props();

  const segments = $derived(segment ? [segment] : resolve_display_macro_segments(String(text ?? ""), owner, entities));

  const color_of = (seg) => (seg.entity ? get_signature_color(seg.entity, fallback_color) : fallback_color);

  function open_handle_profile(e, target_entity) {
    e.stopPropagation();
    hide_tooltip();
    app.open_profile(target_entity);
  }

  function open_handle_menu(e, target_entity, fallback_text = "") {
    e.preventDefault();
    e.stopPropagation();
    const actions = build_entity_preview_actions(target_entity, {
      on_open_profile: (ent) => app.open_profile(ent),
      on_open_image_preview: (payload) => app.open_image_preview(payload),
    });
    pin_tooltip_menu(e.currentTarget, { entity: target_entity, text: target_entity.name || fallback_text, actions, x: e.clientX, y: e.clientY });
  }
</script>

{#each segments as seg, i (i)}
  {#if seg.macro}
    {#if seg.entity}
      <button
        type="button"
        use:tooltip={{ entity: seg.entity, text: seg.entity.name || seg.text }}
        onclick={(e) => open_handle_profile(e, seg.entity)}
        oncontextmenu={(e) => open_handle_menu(e, seg.entity, seg.text)}
        class="inline cursor-pointer font-mono text-xs font-semibold hover:underline focus:outline-hidden"
        style="color: {color_of(seg)};">{seg.text}</button>
    {:else}
      <span class={seg.text.startsWith("@") ? "font-mono text-xs font-semibold" : undefined} style="color: {color_of(seg)};">{seg.text}</span>
    {/if}
  {:else}
    {seg.text}
  {/if}
{/each}
