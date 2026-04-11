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
  import { fitText } from "@ui/utils/actions/fit-text.js";

  let signature_color = $derived(themeStore.get_signature_color(entity));
  let signature_rgb = $derived(themeStore.hex_to_rgb(signature_color));
  let name = $derived(entity?.name || "Untitled");

  function handleSelect() {
    if (!disabled && onSelect) onSelect();
  }
</script>

<button
  class="drawer-card surface-tilt"
  class:fractal-card={type === "fractal"}
  class:is-disabled={disabled}
  style="--signature-color: {signature_color}; --signature-rgb: {signature_rgb};"
  onclick={handleSelect}
  {disabled}
  title={disabled ? "Already selected" : `Select ${name}`}
  oncontextmenu={(e) => {
    e.preventDefault();
    if (onViewProfile) onViewProfile();
  }}
>
  <div class="card-visual">
    <ProfilePicture {entity} />
  </div>

  <div class="card-info">
    <h5>
      <span class="entity-name" use:fitText>{name}</span>
    </h5>
  </div>

  <div class="signature-bar"></div>
</button>

<style>
  .drawer-card {
    aspect-ratio: 2 / 3;
    background: var(--glass-s);
    backdrop-filter: var(--glass-blur-m);
    border: var(--glass-edge-l);
    border-top: var(--glass-edge-xl); /* Specular highlight */
    border-radius: var(--border-radius-m);
    position: relative;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    padding: 0;
    transition: all var(--motion-fast) var(--motion-elastic);
    text-align: left;
    width: 8.75rem;
    flex: 0 0 auto;
  }

  .drawer-card:hover:not(:disabled, .is-disabled) {
    box-shadow: var(--shadow-m);
    filter: brightness(1.2);
    transform: translateY(-2px);
  }

  .drawer-card.is-disabled {
    opacity: var(--opacity-m);
    filter: grayscale(1);
    cursor: not-allowed;
    pointer-events: none;
  }

  .drawer-card .card-visual {
    flex: 1.5;
    background: var(--glass-xs); /* Sinks deeper for contrast */
    box-shadow: 0 0 0 1px inset var(--glass-edge-l);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
  }

  .drawer-card .card-info {
    flex: 0.6;
    padding: var(--spacing-s);
    display: flex;
    align-items: center;
    background: var(--glass-s);
    border-top: var(--glass-edge-l);
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
    letter-spacing: var(--letter-spacing-s);
    text-wrap: balance;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0;
    padding: 0;
  }
</style>
