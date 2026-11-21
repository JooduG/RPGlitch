<script>
  /**
   * @file src/App.svelte
   * THE CORE SHELL
   * Central view orchestration shell executing view-switching logic natively.
   * Console is mounted ONCE here and never destroyed during view transitions,
   * while Storyboard and Storymode own their respective stage regions inside the
   * persistent 12-column root grid.
   */
  import { app, execution, session } from "@state";
  import { Audio, motion } from "@media";
  import { LayoutGrid, Tooltip, unpin_tooltip } from "@atoms";
  import { ContextMenu, EntityCard, ImagePreview } from "@organisms";
  import { get_signature_color } from "@utils";
  import { Console, Profile, Storyboard, Storymode } from "@ui";

  // --- DERIVED RUNES ---

  const FRACTAL_OPACITY = "var(--opacity-muted)";
  let active_fractal = $derived(session.active_fractal || app.selected_fractal);
  let fractal_url = $derived(active_fractal?.profile_picture || "");

  let container_class = $derived.by(() => {
    if (app.viewport.mobile && app.view === "storymode") {
      return "h-[100dvh] w-grid-width grid-cols-2 grid-rows-[min-content_16rem_1fr_min-content] overflow-hidden";
    }
    return "h-grid-height w-grid-width grid-cols-12 grid-rows-12 overflow-hidden";
  });

  let footer_class = $derived.by(() => {
    if (app.viewport.mobile) {
      if (app.view === "storymode") {
        return "relative inset-auto col-span-full row-4 h-auto items-center";
      }
      return "relative inset-auto col-start-1 col-end-13 row-start-12 h-full items-end justify-center";
    }
    if (app.view === "storymode") {
      return "col-start-1 col-end-13 row-start-12 h-row-unit items-start self-stretch";
    }
    return "col-start-2 col-end-12 row-start-11 h-row-unit items-center self-stretch";
  });

  // --- LIFECYCLE EFFECTS ---

  // Centralized State Reset: Restores engine physics velocity when streaming begins
  $effect(() => {
    if (execution.stream.active) {
      motion.intensity = 1.0;
    }
  });

  // Audio Lifecycle Cleanup: Suspend AudioContexts on unmount and pagehide
  // to prevent context leaks across view transitions and story swaps.
  $effect(() => {
    const handle_page_hide = () => Audio.destroy();
    window.addEventListener("pagehide", handle_page_hide);
    return () => {
      window.removeEventListener("pagehide", handle_page_hide);
      Audio.destroy();
    };
  });
</script>

<main
  id="main-content"
  class="relative z-10 h-dvh w-full animate-[fade-in_var(--transition-duration-slow)_var(--ease-out)_forwards] overflow-hidden text-left"
  data-view={app.view}>
  <div class="pointer-events-none fixed inset-0 z-0 h-dvh w-screen overflow-hidden bg-neutral-900" aria-hidden="true">
    <div data-bg="gradient"></div>

    <div
      class="absolute inset-0 bg-cover bg-center filter-[var(--blur-mist)_brightness(var(--brightness-muted))] transition-[opacity,filter] duration-ambient ease-in-out will-change-[opacity,filter]"
      style:background-image={fractal_url ? `url('${fractal_url}')` : "none"}
      style:opacity={fractal_url ? FRACTAL_OPACITY : 0}
      style:view-transition-name={app.view === "storymode" && !app.transitioning_profile ? "entity-morph-fractal" : undefined}>
    </div>

    <div
      class="pointer-events-none fixed -inset-5 z-overlay bg-(image:--noise-url) mix-blend-overlay {execution.phase === 'generating' ?
        'animate-[noise-breathing_0.08s_steps(4)_infinite] opacity-[calc(var(--opacity-whisper)+0.1)]'
      : 'animate-[noise-breathing_0.2s_steps(4)_infinite] opacity-ghost'}"
      style:animation-play-state={motion.is_reduced ? "paused" : "running"}>
    </div>
  </div>

  <!-- PERSISTENT STAGE GRID: Storyboard / Storymode stage + persistent Console footer -->
  <div class="fixed inset-0 z-sticky m-auto grid overflow-hidden text-white transition-opacity duration-300 {container_class}">
    {#if app.view === "storyboard"}
      <Storyboard />
    {:else if app.view === "storymode"}
      <Storymode />
    {/if}

    <!-- display:flex inline: unlayered normalize.css v3 resets footer to block, defeating Tailwind's layered flex utility -->
    <footer style="display: flex;" class="pointer-events-none relative z-sticky flex justify-center {footer_class}">
      {#if app.entities_loaded}
        <Console />
      {/if}
    </footer>
  </div>

  {#if app.profile_open}
    <Profile entity_type={app.profile_target_type} />
  {/if}

  <ImagePreview />
  <ContextMenu />
</main>

<Tooltip>
  {#snippet preview_content({ preview, pinned, closing })}
    {@const preview_entity = preview?.entity ?? preview}
    {@const is_pinned = Boolean(pinned)}
    {@const is_closing = Boolean(closing)}
    <div class="perspective-distant" data-testid="relational-hover-card">
      <div class="relative" data-card-flip-rotor data-pinned={is_pinned} data-closing={is_closing} data-reduced={motion.is_reduced}>
        <div class="pointer-events-none transform-[rotateY(0deg)] rounded-standard backface-hidden">
          <EntityCard
            variant="library"
            preview={true}
            entity={preview_entity}
            type={preview_entity?.type === "fractal" ? "fractal" : "ai"}
            launch_gesture={false}
            bracket_items={preview?.bracket_items ?? null}
            description_owner={preview?.description_owner ?? null}
            incoming_only={preview?.incoming_only ?? false} />
        </div>
        <div
          class={[
            "absolute inset-0 transform-[rotateY(180deg)] overflow-hidden rounded-standard backface-hidden",
            is_pinned ? "pointer-events-auto" : "pointer-events-none",
          ]}>
          <ContextMenu
            embedded={true}
            open={is_pinned}
            entity={preview_entity}
            surface="preview"
            target_name={preview_entity?.name || ""}
            portrait_src={preview_entity?.profile_picture || ""}
            signature_color={get_signature_color(preview_entity)}
            on_close={unpin_tooltip} />
        </div>
      </div>
    </div>
  {/snippet}
</Tooltip>

{#if app.settings.dev_grid_visible}
  <LayoutGrid view={app.view} />
{/if}

<style>
  /* ── Atmospheric Stage Configuration ────────────────────────── */

  [data-bg="gradient"] {
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle at 15% 50%, var(--color-background-gradient-1), transparent 50%),
      radial-gradient(circle at 85% 30%, var(--color-background-gradient-2), transparent 50%),
      radial-gradient(circle at 50% 80%, var(--color-background-gradient-3), transparent 50%),
      radial-gradient(circle at 50% 10%, var(--color-background-gradient-4), transparent 50%);
    background-size: cover;
    background-attachment: fixed;
    background-repeat: no-repeat;
  }

  /* ── 3D Hover Preview Card-Back Rotor ───────────────────────── */

  [data-card-flip-rotor] {
    transform-style: preserve-3d;
    transform: rotateY(0deg);
    transition: transform var(--transition-duration-standard) var(--ease-drawer);
  }

  [data-card-flip-rotor][data-pinned="true"] {
    transform: rotateY(180deg);
  }

  [data-card-flip-rotor][data-pinned="true"][data-closing="true"] {
    transform: rotateY(270deg) scale(0.92);
    opacity: 0;
    transition:
      transform 250ms var(--ease-drawer),
      opacity 200ms var(--ease-out);
  }

  @starting-style {
    [data-card-flip-rotor][data-pinned="true"] {
      transform: rotateY(0deg);
    }
  }

  [data-card-flip-rotor][data-reduced="true"] {
    transition: none !important;
  }
</style>
