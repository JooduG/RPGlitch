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
   *   onclick?: () => void,
   *   onViewProfile?: () => void,
   * }}
   */
  let { entity, type = "ai", disabled = false, onclick, onViewProfile } = $props();

  import ProfilePicture from "@atoms/ProfilePicture.svelte";
  import { themeStore } from "@theme/palette.svelte.js";
  import { fit_text } from "@utils/fit-text.js";

  // --- STATE ---

  let signature_color = $derived(themeStore.get_signature_color(entity));
  let name = $derived(entity?.name || "Untitled");
  const MIN_SIZE_TOKEN = "var(--font-size-nano)";

  // --- ACTIONS ---

  /**
   *
   */
  function handle_select() {
    if (!disabled && onclick) onclick();
  }
</script>

<div
  class="card glass-elevated interactable"
  class:fractal={type === "fractal"}
  class:disabled
  style="--signature-color: {signature_color};"
  role="button"
  tabindex="0"
  aria-label={disabled ? "Already selected" : `Select ${name}`}
  onclick={handle_select}
  oncontextmenu={(/** @type {MouseEvent} */ e) => {
    e.preventDefault();
    if (onViewProfile) onViewProfile();
  }}
  onkeydown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handle_select();
    }
  }}
>
  <div class="visual">
    <ProfilePicture {entity} />
  </div>

  <div class="info">
    <span class="name" use:fit_text={{ minSize: MIN_SIZE_TOKEN }}>{name}</span>
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
    border-radius: var(--radius-standard);
    overflow: visible; /* Allow tooltips and highlights to bleed */
  }

  .card.disabled {
    opacity: var(--opacity-muted);
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
    border-radius: var(--radius-standard) var(--radius-standard) 0 0;
  }

  /* --- INFO (name footer) --- */
  .info {
    flex: 0.6;
    padding: var(--padding-tight);
    display: flex;
    align-items: center;
    background: var(--glass-base);
    border-radius: 0 0 var(--radius-standard) var(--radius-standard);
    position: relative;
    overflow: hidden;
  }

  .name {
    color: var(--signature-color);
    font-family: var(--font-family-heading);
    font-weight: var(--font-weight-heavy);
    text-transform: uppercase;
    font-size: var(--font-size-small);
    letter-spacing: var(--font-spacing-loose);
    text-wrap: balance;
    display: block;
    line-height: var(--font-height-short);
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
    height: var(--gap-tight);
    background: var(--signature-color);
    opacity: 0.3;
    transition: opacity var(--motion-standard);
  }

  .card:hover:not(:disabled, .disabled) .bar {
    opacity: 1;
  }
</style>
