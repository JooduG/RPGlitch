<script>
  /**
   * @file StoryboardCard.svelte
   * 🃏 THE SELECTION TAROT
   * Handles the display and selection of Characters or Fractals.
   * RUTHLESSLY FLATTENED  Zero backward compatibility.
   */
  let {
    entity,
    role_label = "",
    type = "user", // "ai" | "fractal" | "user"
    on_select = () => {},
    on_view_profile = () => {},
  } = $props();

  import { themeStore } from "@theme/palette.svelte.js";
  import Button from "@atoms/Button.svelte";
  import ProfilePicture from "@atoms/ProfilePicture.svelte";
  import { fit_text } from "@utils/fit-text.js";
  import { tooltip } from "@atoms/Tooltip.svelte";

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
  use:tooltip={{ text: is_empty ? `Select ${role_label}` : `Change ${role_label}` }}
  style="--signature-color: {signature_color}; --signature-rgb: {signature_rgb};"
  aria-label={is_empty ? `Select ${role_label}` : `Change ${role_label}`}
  data-testid="storyboard-card"
>
  {#if is_empty}
    <Button variant="invisible" cover={true} onclick={on_select}>
      <div class="card-shell">
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
      </div>
    </Button>
  {:else}
    <div class="card-shell">
      <div class="storyboard-card">
        <Button variant="invisible" cover={true} onclick={on_select}>
          <div class="visual-anchor">
            <ProfilePicture {entity} />
          </div>
        </Button>

        <!-- Info Layer (Bottom-up Gradient Scrim) -->
        <div class="card-info-scrim">
          <div class="info-content">
            <h2 use:fit_text={{ minSize: 26 }}>
              {entity.name}
            </h2>
            <div class="description-wrap">
              <p class="description">{entity.description || "No description provided."}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile Quick-Link (Wrapped to prevent opacity layer flattening for tooltip) -->
    <div class="quick-link-wrapper">
      <Button
        className="profile-quick-link"
        actions={[tooltip]}
        tooltip="View {entity.name} Profile"
        variant="invisible"
        aria-label="View {entity.name} Profile"
        onclick={on_view_profile}
        tabindex="-1"
      >
        <div class="button-surface"></div>
        <svg viewBox="0 0 24 24" class="icon-s">
          <path
            fill="currentColor"
            d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"
          />
        </svg>
      </Button>
    </div>
  {/if}

  <!-- Border Highlight (Dedicated layer to prevent ::after collisions) -->
  <div class="card-border"></div>
</div>

<style>
  .storyboard-stack {
    position: relative;
    width: var(--card-width-m);
    height: var(--card-height-m);
    overflow: visible; /* Allow tooltips and specular highlights to bleed */
    transition: all var(--motion-l) var(--motion-elastic);
  }

  /* Master clipping shell */
  .card-shell {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: var(--border-radius-l);
    background: var(--glass-l);
    box-shadow: var(--shadow-m);
    transition: inherit;
  }

  /* Overlay border highlight (Above the shell) */
  .card-border {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: var(--border-radius-l);
    transition: box-shadow var(--motion-l) ease;
    z-index: var(--z-index-xl); /* Above the shell and scrims */
  }

  /* Fractal Overrides: Landscape (Z x Y) */
  .fractal-card {
    width: var(--card-height-m);
    height: var(--card-width-m);
  }

  .storyboard-stack:hover .card-border {
    box-shadow: inset 0 0 0 1.5px var(--signature-color);
  }

  .storyboard-stack:hover .card-shell {
    box-shadow: 0 12px 24px -12px rgb(from var(--signature-color) r g b / 40%);
  }

  .storyboard-stack:focus-visible {
    outline: none;
  }

  .storyboard-stack:focus-visible .card-border {
    box-shadow: inset 0 0 0 2.5px var(--signature-color);
  }

  /* --- EMPTY STATE --- */
  .empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    gap: var(--spacing-m);
    padding: var(--spacing-xl);
    text-align: center;
  }

  .empty-icon-wrap {
    color: var(--font-color-s);
    opacity: var(--opacity-m);
  }

  .empty-icon-wrap :global(svg) {
    width: 64px;
    height: 64px;
  }

  .empty-slug {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-l);
    color: var(--font-color-s);
    opacity: var(--opacity-m);
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
    height: 45%;
    background: linear-gradient(
      to top,
      var(--color-chalk) 0%,
      rgb(from var(--color-chalk) r g b / 50%) 40%,
      transparent 100%
    );
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: var(--spacing-xxl) var(--spacing-m) var(--spacing-m);
    z-index: var(--z-index-l);
    pointer-events: none; /* Let overlay button handle clicks */
    border-bottom-left-radius: var(--border-radius-l);
    border-bottom-right-radius: var(--border-radius-l);
  }

  .info-content h2 {
    margin: 0;
    font-family: var(--font-family-heading);
    color: rgb(var(--signature-rgb));
    text-shadow: var(--shadow-font);
    font-size: 32px;
    line-height: 1;
    letter-spacing: -0.01em;
    max-width: 75%;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .description-wrap {
    position: relative;
    margin-top: var(--spacing-xs);
  }

  .description {
    margin: 0;
    font-size: 14px; /* Fixed standard label size */
    color: var(--font-color-m);
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .visual-anchor {
    width: 100%;
    height: 100%;
    border-radius: var(--border-radius-l);
    overflow: hidden; /* Mask the individual profile picture */
  }

  /* Profile Link Wrapper: Static anchor for tooltips (NO OPACITY TRANSITIONS) */
  .quick-link-wrapper {
    position: absolute;
    top: var(--spacing-m);
    right: var(--spacing-m);
    z-index: var(--z-index-max);
    width: 36px;
    height: 36px;
    visibility: hidden; /* Hide tooltip interaction when not hovered */
  }

  .storyboard-stack:hover .quick-link-wrapper {
    visibility: visible;
  }

  /* Profile Link Button: Handles visual transitions ONLY */
  :global(.profile-quick-link) {
    width: 100%;
    height: 100%;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: var(--color-white);
    opacity: var(--opacity-none);
    transition: opacity var(--motion-s) ease;
    filter: none;
  }

  .button-surface {
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--glass-xxl);
    border: var(--border-xl);
    backdrop-filter: var(--blur-xl);
    border-radius: 50%;
    transition:
      background var(--motion-l) ease,
      border-color var(--motion-l) ease,
      backdrop-filter var(--motion-l) ease;
  }

  .quick-link-wrapper:hover .button-surface {
    background: color-mix(in srgb, var(--glass-xxl), var(--color-white) 15%);
    border-color: var(--color-white);
  }

  .storyboard-stack:hover :global(.profile-quick-link.button) {
    opacity: var(--opacity-l);
  }

  .quick-link-wrapper:hover :global(.profile-quick-link.button) {
    opacity: var(--opacity-full);
  }
</style>
