<script>
  /**
   * @file StoryboardCard.svelte
   * 🃏 THE SELECTION TAROT
   * Handles the display and selection of Characters or Fractals.
   * RUTHLESSLY FLATTENED — Zero backward compatibility.
   */
  let {
    entity,
    role_label = "",
    type = "user", // "ai" | "fractal" | "user"
    on_select = () => {},
    on_view_profile = () => {},
  } = $props();

  import { themeStore } from "@theme/palette.svelte.js";
  import Button from "@ui/atoms/Button.svelte";
  import ProfilePicture from "@ui/atoms/ProfilePicture.svelte";
  import { fitText } from "@ui/utils/actions/fit-text.js";

  // --- DERIVED STATE ---
  let is_empty = $derived(!entity);

  // Theme Store now natively handles top-level signature_color
  let signature_color = $derived(
    is_empty ? "var(--color-frisk)" : themeStore.get_signature_color(entity),
  );
  let signature_rgb = $derived(themeStore.hex_to_rgb(signature_color));
</script>

<div
  class="storyboard-stack {type}-card glass-base"
  class:is-empty={is_empty}
  style="--signature-color: {signature_color}; --signature-rgb: {signature_rgb};"
  data-testid="storyboard-card"
>
  {#if is_empty}
    <Button
      className="storyboard-empty"
      variant="ghost"
      onclick={on_select}
      aria-label="Select {role_label}"
    >
      <div class="empty-content">
        <div class="empty-icon-wrap">
          {#if type === "fractal"}
            <svg viewBox="0 0 24 24" class="icon">
              <path fill="currentColor" d="M19,12L12,22L5,12L12,2M12,2L19,12H5L12,2Z" />
            </svg>
          {:else}
            <svg viewBox="0 0 24 24" class="icon">
              <path
                fill="currentColor"
                d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
              />
            </svg>
          {/if}
        </div>
        <span class="empty-slug">{role_label}</span>
      </div>
    </Button>
  {:else}
    <div class="storyboard-card">
      <!-- Info Layer (Bottom-up Gradient Scrim) -->
      <div class="card-info-scrim">
        <div class="info-content">
          <h2 use:fitText={{ maxSize: 32, minSize: 16, lineHeight: "1.1" }} title={entity.name}>
            {entity.name}
          </h2>
          <p class="description">{entity.description || "No description provided."}</p>
        </div>
      </div>

      <!-- Action Layer (Top-level Pointer Target) -->
      <Button
        className="card-action-overlay"
        variant="ghost"
        onclick={on_select}
        aria-label="Change {role_label}"
      >
        <div class="visual-anchor">
          <ProfilePicture {entity} />
        </div>
      </Button>

      <!-- Profile Quick-Link -->
      <Button
        className="profile-quick-link"
        variant="ghost"
        onclick={on_view_profile}
        aria-label="View {entity.name} Profile"
      >
        <svg viewBox="0 0 24 24" class="icon-s">
          <path
            fill="currentColor"
            d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"
          />
        </svg>
      </Button>
    </div>
  {/if}
</div>

<style>
  .storyboard-stack {
    position: relative;
    width: 280px;
    height: 400px;
    border-radius: var(--border-radius-l);
    overflow: hidden;
    transition: all var(--motion-fast) var(--motion-elastic);
  }

  /* Fractal Overrides: Landscape (Z x Y) */
  .fractal-card {
    width: 400px;
    height: 280px;
  }

  .storyboard-stack:hover {
    border-color: var(--signature-color);
    box-shadow:
      0 12px 24px -12px rgb(from var(--signature-color) r g b / 40%),
      0 0 0 1px var(--signature-color);
    filter: brightness(1.1);
  }

  /* Prevent over-exposure by suppressing the overlay's internal brightness */
  :global(.storyboard-stack .card-action-overlay.btn:hover) {
    filter: none;
    background: var(--glass-xs);
  }

  /* --- EMPTY STATE --- */
  :global(.storyboard-empty.btn) {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
  }

  .empty-content {
    display: flex;
    flex-direction: column;
    z-index: var(--z-index-l);
    padding: var(--spacing-s);

    /* opacity removed to prevent contrast violations - jules review */
    transition: transform var(--motion-fast) ease;
  }

  :global(.storyboard-empty.btn:hover) .empty-content {
    transform: scale(1.05);
  }

  .empty-icon-wrap {
    color: var(--font-color-s);
  }

  .empty-slug {
    font-family: var(--font-family-heading);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-l);
    color: var(--font-color-s);
    filter: brightness(1.5); /* Ensure readability even when container is de-emphasized */
  }

  /* --- POPULATED CARD --- */
  .storyboard-card {
    position: relative;
    width: 100%;
    height: 100%;
  }

  /* Info Layer: Visual bottom scrim */
  .card-info-scrim {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(
      to top,
      var(--color-chalk) 0%,
      rgb(from var(--color-chalk) r g b / 80%) 40%,
      transparent 100%
    );
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: var(--spacing-xl) var(--spacing-m) var(--spacing-m);
    z-index: var(--z-index-l);
    pointer-events: none; /* Let overlay button handle clicks */
  }

  .info-content h2 {
    margin: 0;
    font-family: var(--font-family-heading);
    color: rgb(var(--signature-rgb));
    text-shadow: 0 2px 4px rgb(0 0 0 / 50%);
  }

  .description {
    margin: var(--spacing-xs) 0 0;
    font-size: var(--font-size-s);
    color: var(--font-color-s);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Action Layer: Full card click */
  :global(.card-action-overlay.btn) {
    position: absolute;
    inset: 0;
    z-index: var(--z-index-m);
    border: none;
    border-radius: 0;
    padding: 0;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .visual-anchor {
    width: 100%;
    height: 100%;
  }

  /* Profile Link: Floating button on top */
  :global(.profile-quick-link.btn) {
    position: absolute;
    top: var(--spacing-m);
    right: var(--spacing-m);
    z-index: var(--z-index-l);
    width: 36px;
    height: 36px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(0 0 0 / 40%);
    backdrop-filter: blur(12px);
    border: var(--glass-edge-l);
    border-radius: 50%;
    color: var(--color-white);
    opacity: var(--opacity-none);
    transition:
      opacity var(--motion-slow) ease,
      border-color var(--motion-fast) ease,
      box-shadow var(--motion-fast) ease;
    box-shadow: var(--shadow-l);
  }

  .storyboard-stack:hover :global(.profile-quick-link.btn) {
    opacity: var(--opacity-l);
  }

  :global(.storyboard-stack .profile-quick-link.btn:hover) {
    opacity: var(--opacity-full);
    background: rgb(0 0 0 / 60%);
  }
</style>
