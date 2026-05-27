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
  import { themeStore } from "@media";

  // --- STATE ---

  let signature_color = $derived(themeStore.get_signature_color(entity));
  let name = $derived(entity?.name || "Untitled");

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
    <span class="name">{name}</span>
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
    border: var(--border-whisper);
    border-color: rgb(from var(--signature-color) r g b / var(--opacity-whisper));
    padding: 0;
    background: transparent;
    border-radius: var(--radius-standard);
    overflow: visible; /* Allow tooltips and highlights to bleed */
    transition:
      transform var(--duration-fast) var(--ease-standard),
      filter var(--duration-fast) var(--ease-standard),
      opacity var(--duration-fast) var(--ease-standard),
      border-color var(--duration-fast) var(--ease-standard),
      box-shadow var(--duration-fast) var(--ease-standard);
    container-type: inline-size;
  }

  .card:hover:not(.disabled) {
    border-color: var(--signature-color);
    box-shadow: 0 0 calc(var(--spacing-unit) * 4)
      rgb(from var(--signature-color) r g b / var(--opacity-whisper));
  }

  .card.disabled {
    pointer-events: none;
  }

  .card.disabled .visual {
    filter: saturate(0.5) brightness(0.9);
    opacity: 0.8;
  }

  .card.disabled .name {
    opacity: 0.8;
  }

  /* --- VISUAL (image area) --- */
  .visual {
    flex: 1.5;
    background: var(--signature-color, var(--frisk));
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
    min-width: 0; /* Stabilize for fit_text */
  }

  .name {
    color: var(--signature-color, var(--frisk));
    font-family: var(--font-family-heading);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    line-height: 1;
    max-height: 100%;
    margin: 0;
    padding: 0;
    text-align: center;
    width: 100%;
    flex-shrink: 0; /* Never squash the name */
    font-size: clamp(var(--font-size-nano), 12cqi, var(--font-size-small));
  }

  /* --- SIGNATURE BAR --- */
  .bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--gap-tight);
    background: var(--signature-color, var(--frisk));
    opacity: 0.3;
    transition: opacity var(--motion-standard);
  }

  .card:hover:not(:disabled, .disabled) .bar {
    opacity: 1;
  }
</style>
