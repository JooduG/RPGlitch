<script>
  /**
   * @file LibraryCard.svelte
   * 🃏 THE ARCHIVE TAROT
   * A compact version of StoryboardCard for the Library drawer.
   * Flattened Schema Compliant.
   */
  let {
    entity,
    type = "ai", // "ai" | "user" | "fractal"
    disabled = false,
    onSelect,
    onViewProfile,
  } = $props();

  import { themeStore } from "@theme/palette.svelte.js";
  import ProfilePicture from "@ui/atoms/ProfilePicture.svelte";
  import Button from "@ui/atoms/Button.svelte";
  import { fitText } from "@ui/utils/actions/fit-text.js";

  let signature_color = $derived(themeStore.get_signature_color(entity));
  let signature_rgb = $derived(themeStore.hex_to_rgb(signature_color));
  let name = $derived(entity?.name || "Untitled");

  function handleSelect() {
    if (!disabled && onSelect) onSelect();
  }
</script>

<div
  class="drawer-card glass-l surface-tilt"
  class:fractal-card={type === "fractal"}
  class:is-disabled={disabled}
  style="--signature-color: {signature_color}; --signature-rgb: {signature_rgb};"
>
  <Button
    variant="invisible"
    cover={true}
    onclick={handleSelect}
    {disabled}
    aria-label={disabled ? "Already selected" : `Select ${name}`}
    className="no-tooltip"
    oncontextmenu={(e) => {
      e.preventDefault();
      if (onViewProfile) onViewProfile();
    }}
  />

  <div class="card-visual">
    <ProfilePicture {entity} />
  </div>

  <div class="card-info">
    <h5>
      <span class="entity-name" use:fitText>{name}</span>
    </h5>
    <div class="signature-bar"></div>
  </div>
</div>

<style>
  .drawer-card {
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

  .drawer-card:hover:not(:disabled, .is-disabled) {
    box-shadow: var(--shadow-m);
    transform: scale(1.02);
    filter: var(--hover-brightness);
  }

  .drawer-card:active:not(:disabled, .is-disabled) {
    transform: scale(var(--motion-click));
  }

  .drawer-card.is-disabled {
    opacity: var(--opacity-m);
    filter: grayscale(1);
    pointer-events: none;
  }

  .drawer-card .card-visual {
    flex: 1.5;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    border-radius: var(--border-radius-m) var(--border-radius-m) 0 0;
  }

  .drawer-card .card-info {
    flex: 0.6;
    padding: var(--spacing-s);
    display: flex;
    align-items: center;
    background: var(--glass-s);
    border-radius: 0 0 var(--border-radius-m) var(--border-radius-m);
    position: relative;
    overflow: hidden;
  }

  .drawer-card .card-info h5 {
    margin: 0;
    padding: 0;
    width: 100%;
  }

  .drawer-card .card-info .entity-name {
    color: var(--signature-color);
    font-family: var(--font-family-heading);
    font-weight: var(--font-weight-xl);
    text-transform: uppercase;
    font-size: var(--font-size-xs);
    letter-spacing: var(--letter-spacing-m);
    text-wrap: balance;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0;
    padding: 0;
    text-align: center;
  }

  .signature-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--signature-color);
    opacity: 0.3;
    transition: opacity var(--motion-l);
  }

  .drawer-card:hover:not(:disabled, .is-disabled) .signature-bar {
    opacity: 1;
  }
</style>
