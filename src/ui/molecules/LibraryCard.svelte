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
  class="drawer-card glass-base surface-tilt"
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
    width: 100%;
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    border: none;
    padding: 0;
    background: transparent;
    cursor: pointer;
    border-radius: var(--border-radius-m);
    overflow: hidden;
    border-top: var(--border-xl); /* Maintain specular highlight override */
  }

  .drawer-card:hover:not(:disabled, .is-disabled) {
    box-shadow: var(--shadow-m);
  }

  .drawer-card.is-disabled {
    opacity: var(--opacity-m);
    filter: grayscale(1);
    pointer-events: none;
  }

  .drawer-card .card-visual {
    flex: 1.5;
    background: rgb(var(--color-black-rgb) / 20%); /* Softened from 50% for Nordic look */
    border-top: none; /* Radius handled by parent overflow */
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
    border-top: var(--border-l);
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
