<script>
  /**
   * @file ProfilePicture.svelte
   * 🖼️ SOTA PROFILE IMAGE RENDERER
   * Handles real images, placeholders, and watermark-style initials.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { NAME_PREFIXES } from "@intelligence";
  import { themeStore } from "@media";
  import { use_actions } from "@actions";

  let {
    // Data
    entity = null,
    src = null,
    alt = null,
    placeholder_char = null,

    // Design
    class: className = "",

    // Slots/Snippets
    actions = [],

    ...rest
  } = $props();

  /**
   * Generates initials from entity name, filtering common stop words.
   * @param {string} str
   * @returns {string}
   */
  const calculate_initials = (str) => {
    if (!str) return "?";
    const words = str
      .replace(/[^\p{L}\s]/gu, " ")
      .trim()
      .split(/\s+/);
    const stop_words = new Set(NAME_PREFIXES.map((w) => w.replace(/\.$/, "")));
    let filtered = words.filter((w) => !stop_words.has(w.toLowerCase()));

    return (
      (filtered.length ? filtered : words)
        .slice(0, 3)
        .map((w) => w.charAt(0))
        .join("")
        .toUpperCase() || "?"
    );
  };

  // 1. Reactive State
  let image_failed = $state(false);
  const name = $derived(entity?.name || (placeholder_char ? "" : "Entity"));
  const media_url = $derived(!image_failed && (src || entity?.profile_picture));
  const signature_color = $derived(themeStore.get_signature_color(entity));
  const initials = $derived(placeholder_char || calculate_initials(name));

  // 2. Modifiers
  const is_flipped = $derived(entity?.modifiers?.flipped ?? false);
</script>

<div
  {...rest}
  class="
    @container-size
    relative
    flex
    h-full
    w-full
    items-center
    justify-center
    overflow-hidden

    {className}"
  style="--signature-color: {signature_color};"
  use:use_actions={actions}
>
  <div
    class="
      absolute
      inset-0
      z-0
      flex
      h-full
      w-full
      items-center
      justify-center
      bg-(--signature-color,#555d66)
    "
    aria-hidden="true"
  >
    <div
      class="
        text-shadow-bloom
        pointer-events-none
        flex
        h-full
        w-full
        items-center
        justify-center
        p-0
        text-center
        font-['Ubuntu']
        text-[clamp(0.6rem,60cqi,6rem)]
        leading-[0.7]
        font-bold
        tracking-tight
        text-nowrap
        text-white
        uppercase
        opacity-95
        filter-[drop-shadow(0_8px_16px_rgba(from_var(--signature-color,#555d66)_r_g_b/0.6))]
        select-none
      "
    >
      {initials}
    </div>
  </div>

  {#if media_url}
    <img
      src={media_url}
      alt={alt || `${name} Profile`}
      class="
        absolute
        inset-0
        z-10
        block
        h-full
        w-full
        object-cover

        {is_flipped ? '-scale-x-100' : ''}"
      onerror={() => (image_failed = true)}
    />
  {/if}
</div>

<style>
  /* Retaining an ultra-lean style target solely for the intricate multi-layered text bloom */
  .text-shadow-bloom {
    text-shadow:
      1px 1px 0 #000,
      -1px 1px 0 #000,
      1px -1px 0 #000,
      -1px -1px 0 #000,
      0 0 8px var(--signature-color, #555d66),
      0 0 24px rgba(from var(--signature-color, #555d66) r g b / 0.6);
  }
</style>
