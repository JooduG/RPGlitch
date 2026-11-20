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
  import { hide_tooltip, tooltip } from "@primitives";
  import { app } from "@state";
  import { get_signature_color, resolve_display_macro_segments } from "@utils";
  import ContextMenu from "./ContextMenu.svelte";
  import { claim_menu, claim_morph_epoch } from "./ContextMenu.svelte.js";

  let { text = "", owner = null, entities = {}, segment = null, fallback_color = "var(--color-frozen)" } = $props();

  const segments = $derived(segment ? [segment] : resolve_display_macro_segments(String(text ?? ""), owner, entities));

  const color_of = (seg) => (seg.entity ? get_signature_color(seg.entity, fallback_color) : fallback_color);

  let menu_open = $state(false);
  let menu_x = $state(0);
  let menu_y = $state(0);
  let menu_epoch = $state(0);
  let menu_entity = $state(null);

  function open_handle_profile(e, target_entity) {
    e.stopPropagation();
    hide_tooltip();
    app.open_profile(target_entity);
  }

  function open_handle_menu(e, target_entity) {
    e.preventDefault();
    e.stopPropagation();
    hide_tooltip();
    menu_entity = target_entity;
    menu_x = e.clientX;
    menu_y = e.clientY;
    menu_epoch = claim_menu();
    claim_morph_epoch();
    menu_open = true;
  }
</script>

{#each segments as seg, i (i)}
  {#if seg.macro}
    {#if seg.entity}
      <button
        type="button"
        use:tooltip={{ entity: seg.entity, text: seg.entity.name || seg.text }}
        onclick={(e) => open_handle_profile(e, seg.entity)}
        oncontextmenu={(e) => open_handle_menu(e, seg.entity)}
        class="inline cursor-pointer font-mono text-xs font-semibold hover:underline focus:outline-hidden"
        style="color: {color_of(seg)};">{seg.text}</button>
    {:else}
      <span class={seg.text.startsWith("@") ? "font-mono text-xs font-semibold" : undefined} style="color: {color_of(seg)};">{seg.text}</span>
    {/if}
  {:else}
    {seg.text}
  {/if}
{/each}

{#if menu_open}
  <ContextMenu bind:open={menu_open} x={menu_x} y={menu_y} epoch={menu_epoch} actions={[]} signature_color={get_signature_color(menu_entity, fallback_color)} />
{/if}
