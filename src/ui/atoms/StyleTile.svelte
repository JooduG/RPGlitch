<script>
  /**
   * @file src/ui/atoms/StyleTile.svelte
   * Unified signature-bordered style tile used by Profile, EntityCard, and prologue EntityTrio.
   */
  import Avatar from "./Avatar.svelte";
  import { tooltip } from "./Tooltip.svelte";

  /**
   * @typedef {Object} Props
   * @property {{ portrait?: string, name?: string, description?: string } | null} tile
   * @property {string} [signature_color="var(--color-gunmetal)"]
   * @property {boolean} [show_label_overlay=false]
   * @property {string} [tooltip_text]
   * @property {string} [fallback_class="text-lg"]
   * @property {string} [class]
   */

  /** @type {Props} */
  let {
    tile,
    signature_color = "var(--color-gunmetal)",
    show_label_overlay = false,
    tooltip_text = undefined,
    fallback_class = "text-lg",
    class: className = "",
  } = $props();
</script>

{#if tile}
  <div
    use:tooltip={tooltip_text}
    style:--signature-color={signature_color}
    class={[
      "group/badge pointer-events-auto relative flex items-center justify-center overflow-hidden border border-solid border-(--signature-color) bg-black/40 shadow-md transition duration-300 ease-in-out",
      className,
    ]}>
    <Avatar src={tile.portrait || ""} alt={tile.name || "Style"} {signature_color} {fallback_class} class="rounded-[inherit]">
      {#snippet overlay()}
        {#if show_label_overlay && tile.name}
          <div
            class="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center justify-end overflow-hidden rounded-b-[inherit] bg-linear-to-t from-black/95 via-black/75 via-45% to-transparent px-1 pt-standard pb-tight text-center opacity-0 transition-opacity duration-standard ease-in-out group-hover/badge:opacity-100">
            <span
              class="line-clamp-2 w-full text-center type-uppercase-label wrap-break-word text-(--signature-color,var(--color-frisk)) [text-shadow:0_2px_4px_var(--color-void-black)]">
              {tile.name}
            </span>
          </div>
        {/if}
      {/snippet}
    </Avatar>
  </div>
{/if}
