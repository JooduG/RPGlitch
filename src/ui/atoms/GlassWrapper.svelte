<script>
  /**
   * @file GlassWrapper.svelte
   * 🪞 ATOMIC GLASS WRAPPER
   * Encapsulates the massive 30-line Tailwind class string for glassmorphism
   * input containers, preventing "white font white" redundancy in organisms.
   */

  let { is_expanded = false, signature_color = "var(--color-signature-color)", children, class: className = "", ...rest } = $props();
</script>

<div
  class="
    relative
    flex
    w-(--state-fill-end)
    rounded-standard
    border-transparent
    bg-[color-mix(in_srgb,var(--signature-color)_4%,var(--color-glass-sunken))]
    transition-[border-color,box-shadow,background]
    duration-(--duration-fast)
    ease-(--ease-standard)
    before:pointer-events-none
    before:absolute
    before:inset-0
    before:rounded-[inherit]
    before:mask-border-solid
    before:p-pixel
    before:opacity-whisper
    before:transition-opacity
    before:duration-(--duration-standard)
    before:content-['']
    before:[background:linear-gradient(to_bottom,color-mix(in_srgb,transparent,var(--signature-color)_40%),transparent_40%)]
    focus-within:border-transparent
    focus-within:bg-[color-mix(in_srgb,var(--signature-color)_8%,var(--color-glass-sunken))]
    focus-within:before:opacity-solid
    focus-within:before:[background:linear-gradient(to_bottom,var(--signature-color),color-mix(in_srgb,var(--signature-color),transparent_60%)_30%,transparent_80%)]
    data-[expanded=true]:border-transparent
    data-[expanded=true]:bg-[color-mix(in_srgb,var(--signature-color)_8%,var(--color-glass-sunken))]
    data-[expanded=true]:before:opacity-solid
    data-[expanded=true]:before:[background:linear-gradient(to_bottom,var(--signature-color),color-mix(in_srgb,var(--signature-color),transparent_60%)_30%,transparent_80%)]
    {className}
  "
  data-expanded={is_expanded}
  style="--signature-color: {signature_color};"
  {...rest}
>
  {@render children?.()}
</div>
