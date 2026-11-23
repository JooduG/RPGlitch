<script>
  /**
   * @file src/ui/atoms/Avatar.svelte
   * Pure avatar image renderer with blurred contain backdrop and error/no-media initials fallback.
   * Wraps bits-ui Avatar without domain entity coupling.
   */
  import { Avatar } from "bits-ui";

  let {
    src = null,
    alt = "",
    initials = "?",
    signature_color = "var(--color-gunmetal)",
    flipped = false,
    contain = false,
    landscape = false,
    tint = false,
    fallback_class = "",
    overlay = null,
    delay_ms = 200,
    class: className = "",
    ...rest
  } = $props();

  let loading_status = $state("loading");
  const has_media = $derived(Boolean(src));
</script>

{#snippet fallback_initials()}
  <!-- ignore-next-line -->
  <div
    data-card-text
    class={[
      "pointer-events-none flex h-full w-full items-center justify-center p-0 text-center font-heading text-[clamp(0.6rem,60cqi,6rem)] font-bold text-nowrap text-pure-white uppercase opacity-95 filter-[drop-shadow(0_8px_16px_rgba(from_var(--signature-color,#555d66)_r_g_b/0.6))] select-none [text-shadow:var(--spacing-pixel)_var(--spacing-pixel)_0_var(--color-void-black),calc(-1*var(--spacing-pixel))_var(--spacing-pixel)_0_var(--color-void-black),var(--spacing-pixel)_calc(-1*var(--spacing-pixel))_0_var(--color-void-black),calc(-1*var(--spacing-pixel))_calc(-1*var(--spacing-pixel))_0_var(--color-void-black),0_0_calc(var(--spacing-unit)*2)_var(--signature-color,var(--color-slate-600)),0_0_calc(var(--spacing-unit)*6)_rgba(from_var(--signature-color,var(--color-slate-600))_r_g_b/0.6)]",
      fallback_class,
    ]}>
    {initials}
  </div>
{/snippet}

<Avatar.Root
  bind:loadingStatus={loading_status}
  delayMs={delay_ms}
  class={["@container-size relative isolate flex h-full w-full items-center justify-center overflow-hidden", className]}
  style="--signature-color: {signature_color};"
  {...rest}>
  {#if !has_media}
    <div class="absolute inset-0 z-0 flex h-full w-full items-center justify-center bg-(--signature-color,#555d66)" aria-hidden="true">
      {@render fallback_initials()}
    </div>
  {:else}
    {#if loading_status === "error"}
      <Avatar.Fallback class="absolute inset-0 z-0 flex h-full w-full items-center justify-center bg-(--signature-color,#555d66)" aria-hidden="true">
        {@render fallback_initials()}
      </Avatar.Fallback>
    {/if}

    {#if contain}
      {#if loading_status === "loaded"}
        <img
          {src}
          alt=""
          class="pointer-events-none absolute inset-0 z-0 block h-full w-full scale-125 object-cover opacity-45 blur-lg saturate-200 select-none"
          aria-hidden="true" />

        <div
          class="pointer-events-none absolute inset-0 z-10 opacity-25"
          style="background: radial-gradient(circle at center, var(--signature-color) 0%, transparent 70%);">
        </div>
      {/if}

      <Avatar.Image
        {src}
        {alt}
        class={[
          "pointer-events-none relative z-10 block select-none",
          landscape ? "h-auto max-h-none w-auto max-w-full" : "h-auto max-h-full w-auto max-w-none",
          flipped && "-scale-x-100",
          tint && "mix-blend-luminosity brightness-110",
        ]} />
    {:else}
      <Avatar.Image
        {src}
        {alt}
        class={[
          "pointer-events-none absolute inset-0 z-10 block h-full w-full object-cover",
          flipped && "-scale-x-100",
          tint && "mix-blend-luminosity brightness-110",
        ]} />
    {/if}
  {/if}
  {#if overlay}
    {@render overlay()}
  {/if}
</Avatar.Root>
