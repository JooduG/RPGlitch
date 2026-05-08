<script>
  /**
   * @file StoryboardCard.svelte
   * 🃏 THE SELECTION TAROT
   * Refactored: Mariana Trench SOTA Refactor
   * Standard: Ultra-Lean DOM & Chalk Regime Enforcement
   */
  /**
   * @typedef {Object} Props
   * @property {any} [entity] - The entity to display
   * @property {string} [role_label] - Label for the role (e.g., "Narrator")
   * @property {"ai" | "fractal" | "user"} [type] - The type of card
   * @property {import('svelte/elements').MouseEventHandler<HTMLButtonElement>} [on_select] - Click handler for card selection
   * @property {import('svelte/elements').MouseEventHandler<HTMLButtonElement>} [on_view_profile] - Click handler for profile view
   */

  /** @type {Props} */
  let {
    entity,
    role_label = "",
    type = "user",
    on_select = () => {},
    on_view_profile = () => {},
  } = $props();

  import { themeStore } from "@theme/palette.svelte.js";
  import Button from "@atoms/Button.svelte";
  import ProfilePicture from "@atoms/ProfilePicture.svelte";
  import { fit_text } from "@utils/fit-text.js";
  import { tooltip } from "@atoms/Tooltip.svelte";

  // --- STATE & DERIVATIONS ---

  let is_empty = $derived(!entity);
  let signature_color = $derived(
    is_empty ? "var(--color-frisk)" : themeStore.get_signature_color(entity),
  );
  let signature_rgb = $derived(themeStore.hex_to_rgb(signature_color));

  let a11y_label = $derived(is_empty ? `Select ${role_label}` : `Change ${role_label}`);
</script>

<div
  class="card {type}-card glass-l interactable"
  use:tooltip={{ text: a11y_label }}
  style="--signature-color: {signature_color}; --signature-rgb: {signature_rgb};"
  aria-label={a11y_label}
  data-testid="storyboard-card"
>
  {#if is_empty}
    <!-- Empty State / Placeholder -->
    <Button variant="invisible" cover={true} onclick={on_select} className="placeholder">
      <div class="placeholder-content">
        {#if type === "fractal"}
          <svg viewBox="0 0 24 24" class="icon-xl icon-outline">
            <path d="M19,12L12,22L5,12L12,2M12,2L19,12H5L12,2Z" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" class="icon-xl icon-outline">
            <path
              d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
            />
          </svg>
        {/if}
        <span class="label">{role_label}</span>
      </div>
    </Button>
  {:else}
    <!-- Occupied State -->
    <Button variant="invisible" cover={true} onclick={on_select} className="body">
      <ProfilePicture {entity} />
    </Button>

    <div class="overlay">
      <h3 use:fit_text={{ minSize: 26 }}>{entity.name}</h3>
      <p>{entity.description || "No description provided."}</p>
    </div>

    <div class="actions">
      <Button
        className="action-btn"
        actions={[tooltip]}
        tooltip="View {entity.name} Profile"
        variant="invisible"
        aria-label="View {entity.name} Profile"
        onclick={on_view_profile}
        tabindex="-1"
      >
        <svg viewBox="0 0 24 24" class="icon-s icon-solid">
          <path
            d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"
          />
        </svg>
      </Button>
    </div>
  {/if}
</div>

<style>
  /* --- CARD SHELL --- */
  .card {
    position: relative;
    width: var(--card-width-m);
    height: var(--card-height-m);
    overflow: hidden;
    border-radius: var(--border-radius-l);
  }

  /* Landscape Orientation for Fractals */
  .fractal-card {
    width: var(--card-height-m);
    height: var(--card-width-m);
  }

  /* Structural Border (Pseudo-element) */
  .card::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: var(--border-radius-l);
    box-shadow: inset 0 0 0 var(--spacing-px) transparent;
    transition: box-shadow var(--motion-m) ease;
    z-index: var(--z-index-xl);
  }

  .card:hover::after {
    box-shadow: inset 0 0 0 var(--spacing-border) var(--signature-color);
  }

  .card:focus-visible {
    outline: none;
  }

  .card:focus-visible::after {
    box-shadow: inset 0 0 0 var(--spacing-border) var(--signature-color);
  }

  /* --- PLACEHOLDER --- */
  .card :global(.button.placeholder) {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .placeholder-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-m);
    color: var(--font-color-s);
    opacity: var(--opacity-m);
    transition: opacity var(--motion-m) ease;
  }

  .card:hover .placeholder-content {
    opacity: var(--opacity-max);
  }

  .placeholder-content .label {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-tiny);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-l);
  }

  /* --- BODY --- */
  .card :global(.button.body) {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  /* --- OVERLAY --- */
  .overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(
      to top,
      var(--color-chalk) 0%,
      rgb(from var(--color-chalk) r g b / var(--opacity-xl)) 50%,
      transparent 100%
    );
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: var(--spacing-xl) var(--spacing-m) var(--spacing-m);
    z-index: var(--z-index-l);
    pointer-events: none;
  }

  .overlay h3 {
    margin: 0;
    font-family: var(--font-family-heading);
    color: rgb(var(--signature-rgb));
    text-shadow: var(--shadow-font);
    font-size: var(--font-size-h3);
    line-height: 1;
    letter-spacing: var(--letter-spacing-s);
    max-width: 80%;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .overlay p {
    margin: var(--spacing-xxs) 0 0;
    font-size: var(--font-size-small);
    color: var(--font-color-m);
    line-height: var(--line-height-s);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    opacity: var(--opacity-xl);
  }

  /* --- ACTIONS --- */
  .actions {
    position: absolute;
    top: var(--spacing-m);
    right: var(--spacing-m);
    z-index: var(--z-index-xxl);
    visibility: hidden;
    opacity: 0;
    transition: all var(--motion-m) ease;
    transform: translateY(calc(var(--spacing-xs) * -1));
  }

  .card:hover .actions {
    visibility: visible;
    opacity: 1;
    transform: translateY(0);
  }

  .actions :global(.button.action-btn) {
    width: var(--icon-xl);
    height: var(--icon-xl);
    border-radius: var(--border-radius-full);
    background: var(--glass-xxl);
    backdrop-filter: var(--blur-xl);
    color: var(--color-white);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--motion-m) var(--motion-elastic);
  }

  .actions :global(.button.action-btn:hover) {
    background: color-mix(in srgb, var(--glass-xxl), var(--color-white) var(--opacity-s));
    transform: scale(1.15);
    box-shadow: 0 0 var(--spacing-m) rgb(from var(--signature-color) r g b / var(--opacity-m));
  }
</style>
