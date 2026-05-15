<script>
  /**
   * @file StoryboardPill.svelte
   * 🎬 STORYBOARD ORCHESTRATOR
   * The primary control for transitioning from setup to narrative.
   * Standard: Ultra-Lean DOM & Chalk Regime Enforcement
   */
  import Button from "@atoms/Button.svelte";
  import GlassPill from "@atoms/GlassPill.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { app } from "@state/app.svelte.js";
  import { session } from "@state/session.svelte.js";
  import { pickRandom } from "@utils/helpers.js";
  import { pulse, roll, shimmy } from "@utils/kinetic.js";

  // --- ORCHESTRATION ---

  const storyboard = {
    /**
     * Shuffle all selected entities randomly.
     */
    async shuffle() {
      if (!app.ai_list.length) {
        await app.load_entities();
      }
      if (!app.ai_list.length) return;

      // 1. Random AI
      app.selected_ai = pickRandom(Array.isArray(app.ai_list) ? app.ai_list : []);

      // 2. Random User (Cannot be same as AI)
      let available_users = app.user_list;
      if (app.selected_ai && Array.isArray(app.user_list)) {
        available_users = app.user_list.filter((u) => u.id !== app.selected_ai.id);
      }

      if (available_users.length) {
        app.selected_user = pickRandom(available_users);
      } else if (app.user_list.length) {
        app.selected_user = app.user_list[0];
      }

      // 3. Random Fractal
      if (Array.isArray(app.fractal_list) && app.fractal_list.length) {
        app.selected_fractal = pickRandom(Array.isArray(app.fractal_list) ? app.fractal_list : []);
      }

      // Sync title
      if (typeof app.reroll_title === "function") {
        app.reroll_title();
      }
    },

    /**
     * Begin the story with current selections.
     */
    async begin() {
      // 🛡️ LOBBY BYPASS LOGIC
      if (app.settings.dev_mode) {
        app.log("Lobby Bypass Triggered (DEV_MODE)", "system");
        const selection = {
          ai: app.selected_ai || { id: "dev_ai", name: "Dev AI" },
          user: app.selected_user || { id: "dev_user", name: "Dev User" },
          fractal: app.selected_fractal || {
            id: "dev_fractal",
            name: "Dev Fractal",
          },
        };
        await session.start(selection);
        return;
      }

      if (!app.selected_ai || !app.selected_user || !app.selected_fractal) return;

      await session.start({
        ai: app.selected_ai,
        user: app.selected_user,
        fractal: app.selected_fractal,
      });
    },
  };

  // --- DERIVATIONS ---

  let ready_to_begin = $derived(app.is_ready);
  let label_text = $derived(
    ready_to_begin ? "BEGIN STORY" : `SELECT ENTITIES (${app.selected_count}/3)`,
  );
</script>

<div class="root">
  <GlassPill class="orchestrator interactable">
    {#snippet left()}
      <Button
        class="flank"
        variant="invisible"
        {...{ "aria-label": "Shuffle All" }}
        onclick={() => storyboard.shuffle()}
        actions={[shimmy, tooltip]}
      >
        <svg viewBox="0 0 24 24" class="icon-large">
          <path
            fill="currentColor"
            d="M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z"
          />
        </svg>
      </Button>
    {/snippet}

    {#snippet center()}
      <Button
        class="action {ready_to_begin ? 'is-ready' : ''}"
        variant="invisible"
        busy={!ready_to_begin}
        onclick={storyboard.begin}
        actions={[pulse]}
      >
        <div class="content">
          <span class="label">{label_text}</span>
        </div>
      </Button>
    {/snippet}

    {#snippet right()}
      <Button
        class="flank"
        variant="invisible"
        {...{ "aria-label": "Settings" }}
        onclick={app.toggle_control_panel}
        data-testid="settings-button"
        actions={[roll, tooltip]}
      >
        <svg viewBox="0 0 24 24" class="icon-large">
          <path
            fill="currentColor"
            d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.35 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.35 4.5,11.67 4.5,12C4.5,11.67 19.47,11.35 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.35 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.04 4.95,18.95L7.44,17.95C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.95L19.05,18.95C19.27,19.04 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
          />
        </svg>
      </Button>
    {/snippet}
  </GlassPill>
</div>

<style>
  .root {
    display: flex;
    justify-content: center;
    width: 100%;
    position: relative;
    z-index: var(--surface-z-index);
    pointer-events: auto;
    height: 100%;
  }

  :global(.orchestrator .flank.root),
  :global(.orchestrator .action.root) {
    background: transparent;
    border: none;
    box-shadow: none;
    transition:
      color var(--duration-standard),
      opacity var(--duration-standard),
      filter var(--duration-standard);
  }

  :global(.orchestrator .root:hover:not(:disabled)) {
    background: transparent;
    color: var(--pure-white);
    filter: var(--hover-glow);
  }

  :global(.orchestrator .action.root) {
    height: var(--row);
    width: var(--columns-2);
    justify-content: center;
    opacity: var(--opacity-muted);
  }

  :global(.orchestrator .action.root.is-ready) {
    opacity: var(--opacity-solid);
  }

  :global(.orchestrator .action.root.is-ready .label) {
    color: var(--emerald-green);
    /* stylelint-disable scale-unlimited/declaration-strict-value */
    text-shadow: var(--spacing-0) var(--spacing-0) var(--spacing-2)
      rgb(from var(--emerald-green) r g b / var(--opacity-muted));
    /* stylelint-enable scale-unlimited/declaration-strict-value */
  }

  .content {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
  }

  .label {
    font-family: var(--font-family-heading);
    font-weight: var(--font-weight-heavy);
    font-size: var(--font-size-h6);
    letter-spacing: var(--font-spacing-base);
    color: var(--font-color-base);
    text-shadow: var(--shadow-font);
  }
</style>
