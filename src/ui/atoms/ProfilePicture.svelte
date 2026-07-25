<script>
  /**
   * @file ProfilePicture.svelte
   * 🖼️ SOTA PROFILE IMAGE RENDERER
   * Handles real images, placeholders, and watermark-style initials.
   * Built on bits-ui Avatar for robust loading-state management.
   */
  import { Avatar } from "bits-ui";
  import { NAME_PREFIXES } from "@intelligence";
  import { get_signature_color } from "@media";

  let {
    // Data
    entity = null,
    src = null,
    alt = null,
    placeholder_char = null,
    contain = false,
    landscape = false,
    delay_ms = 200,

    // Design
    class: className = "",

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
      .replace(/['']/g, "")
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
  let loading_status = $state("loading");
  const name = $derived(entity?.name || (placeholder_char ? "" : "Entity"));
  const media_url = $derived(src || entity?.profile_picture);
  const has_media = $derived(!!media_url);
  const signature_color = $derived(get_signature_color(entity));
  const initials = $derived(placeholder_char || calculate_initials(name));

  // 2. Modifiers
  const is_flipped = $derived(entity?.modifiers?.flipped ?? false);
</script>

<Avatar.Root
  bind:loadingStatus={loading_status}
  delayMs={delay_ms}
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
  {...rest}
>
  <!-- Fallback: auto-shown during loading/error/no-media via Avatar.Fallback -->
  {#if !has_media}
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
          [text-shadow:var(--spacing-spacing-pixel)_var(--spacing-spacing-pixel)_0_var(--color-void-black),calc(-1*var(--spacing-spacing-pixel))_var(--spacing-spacing-pixel)_0_var(--color-void-black),var(--spacing-spacing-pixel)_calc(-1*var(--spacing-spacing-pixel))_0_var(--color-void-black),calc(-1*var(--spacing-spacing-pixel))_calc(-1*var(--spacing-spacing-pixel))_0_var(--color-void-black),0_0_calc(var(--spacing-spacing-unit)*2)_var(--signature-color,var(--color-slate-600)),0_0_calc(var(--spacing-spacing-unit)*6)_rgba(from_var(--signature-color,var(--color-slate-600))_r_g_b/0.6)]
        "
      >
        {initials}
      </div>
    </div>
  {:else}
    <Avatar.Fallback
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
          [text-shadow:var(--spacing-spacing-pixel)_var(--spacing-spacing-pixel)_0_var(--color-void-black),calc(-1*var(--spacing-spacing-pixel))_var(--spacing-spacing-pixel)_0_var(--color-void-black),var(--spacing-spacing-pixel)_calc(-1*var(--spacing-spacing-pixel))_0_var(--color-void-black),calc(-1*var(--spacing-spacing-pixel))_calc(-1*var(--spacing-spacing-pixel))_0_var(--color-void-black),0_0_calc(var(--spacing-spacing-unit)*2)_var(--signature-color,var(--color-slate-600)),0_0_calc(var(--spacing-spacing-unit)*6)_rgba(from_var(--signature-color,var(--color-slate-600))_r_g_b/0.6)]
        "
      >
        {initials}
      </div>
    </Avatar.Fallback>

    {#if contain}
      <!-- Blurred Background (resolves aspect ratio discrepancy without stretching artifacts) -->
      {#if loading_status === "loaded"}
        <img
          src={media_url}
          alt=""
          class="
            pointer-events-none
            absolute
            inset-0
            z-0
            block
            h-full
            w-full
            scale-110
            object-cover
            opacity-45
            blur-lg
            saturate-200
            select-none"
          aria-hidden="true"
        />

        <!-- Signature Color Glow (shines through transparent foreground images) -->
        <div
          class="pointer-events-none absolute inset-0 z-5 opacity-25"
          style="background: radial-gradient(circle at center, var(--signature-color) 0%, transparent 70%);"
        ></div>
      {/if}

      <!-- Crisp Foreground (centered on both axes, natural size, cropped by container) -->
      <Avatar.Image
        src={media_url}
        alt={alt || `${name} Profile`}
        class="
          pointer-events-none
          relative
          z-10
          block
          {landscape ? 'h-auto max-h-none w-auto max-w-full' : 'h-auto max-h-full w-auto max-w-none'}
          select-none
          {is_flipped ? '-scale-x-100' : ''}"
      />
    {:else}
      <Avatar.Image
        src={media_url}
        alt={alt || `${name} Profile`}
        class="
          pointer-events-none
          absolute
          inset-0
          z-10
          block
          h-full
          w-full
          object-cover

          {is_flipped ? '-scale-x-100' : ''}"
      />
    {/if}
  {/if}
</Avatar.Root>
