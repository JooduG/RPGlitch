<script>
  /**
   * @file LibraryCard.svelte
   * 🃏 THE ARCHIVE TAROT
   * Compact entity card for the Library drawer.
   */

  /**
   * @type {{
   *   entity: any,
   *   type?: 'ai' | 'user' | 'fractal',
   *   disabled?: boolean,
   *   onSelect?: () => void,
   *   onViewProfile?: () => void,
   * }}
   */
  let { entity, type = "ai", disabled = false, onSelect, onViewProfile } = $props();

  import { themeStore } from "@theme/palette.svelte.js";
  import ProfilePicture from "@atoms/ProfilePicture.svelte";
  import Button from "@atoms/Button.svelte";
  import { fit_text } from "@utils/fit-text.js";

  // --- STATE ---

  let signature_color = $derived(themeStore.get_signature_color(entity));
  let signature_rgb = $derived(themeStore.hex_to_rgb(signature_color));
  let name = $derived(entity?.name || "Untitled");

  // --- ACTIONS ---

  function handle_select() {
    if (!disabled && onSelect) onSelect();
  }
</script>

<div
  class="card glass-l"
  class:fractal={type === "fractal"}
  class:disabled
  style="--signature-color: {signature_color}; --signature-rgb: {signature_rgb};"
>
  <Button
    variant="invisible"
    cover={true}
    onclick={handle_select}
    {disabled}
    aria-label={disabled ? "Already selected" : `Select ${name}`}
    oncontextmenu={(/** @type {MouseEvent} */ e) => {
      e.preventDefault();
      if (onViewProfile) onViewProfile();
    }}
  />

  <div class="visual">
    <ProfilePicture {entity} />
  </div>

  <div class="info">
    <span class="name" use:fit_text={{ minSize: 14 }}>{name}</span>
    <div class="bar"></div>
  </div>
</div>

<style>
  /* --- CARD SHELL --- */
  .card {
    position: relative;
    width: 100%;
    aspect-ratio: 2 / 3;
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    border: none;
    padding: 0;
    background: transparent;
    cursor: pointer;
    border-radius: var(--border-radius-m);
    overflow: visible; /* Allow tooltips and highlights to bleed */
    border-top: var(--border-xl); /* Maintain specular highlight override */
    transition:
      transform var(--motion-l) var(--motion-elastic),
      filter var(--motion-l),
      box-shadow var(--motion-l) var(--motion-elastic);
  }

  .card:hover:not(:disabled, .disabled) {
    box-shadow: var(--shadow-m);
    transform: scale(1.02);
    filter: var(--hover-brightness);
  }

  .card:active:not(:disabled, .disabled) {
    transform: scale(var(--motion-click));
  }

  .card.disabled {
    opacity: var(--opacity-m);
    filter: grayscale(1);
    pointer-events: none;
  }

  /* --- VISUAL (image area) --- */
  .visual {
    flex: 1.5;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    border-radius: var(--border-radius-m) var(--border-radius-m) 0 0;
  }

  /* --- INFO (name footer) --- */
  .info {
    flex: 0.6;
    padding: var(--spacing-s);
    display: flex;
    align-items: center;
    background: var(--glass-s);
    border-radius: 0 0 var(--border-radius-m) var(--border-radius-m);
    position: relative;
    overflow: hidden;
  }

  .name {
    color: var(--signature-color);
    font-family: var(--font-family-heading);
    font-weight: var(--font-weight-xl);
    text-transform: uppercase;
    font-size: clamp(var(--font-size-xs), 2vw + 0.5rem, var(--font-size-xxl));
    letter-spacing: var(--letter-spacing-s);
    text-wrap: balance;
    display: block;
    line-height: 1.2;
    max-height: 100%;
    overflow: hidden;
    margin: 0;
    padding: 0;
    text-align: center;
    width: 100%;
  }

  /* --- SIGNATURE BAR --- */
  .bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--signature-color);
    opacity: 0.3;
    transition: opacity var(--motion-l);
  }

  .card:hover:not(:disabled, .disabled) .bar {
    opacity: 1;
  }
</style>
