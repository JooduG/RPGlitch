<script>
  /**
   * @file src/App.svelte
   * Central view orchestration shell executing view-switching logic natively.
   * Console mounts once here while Storyboard and Storymode swap inside the persistent 12-column root grid.
   */
  import { LayoutGrid, Tooltip, unpin_tooltip } from "@atoms";
  import { Audio, capture_storyboard_flight, fly_storyboard_cards_into_prologue, motion } from "@media";
  import { ContextMenu, EntityCard, ImagePreview } from "@organisms";
  import { parse_think_block } from "@simulation";
  import { app, execution, session } from "@state";
  import { Console, Profile, Storyboard, storyboard, Storymode } from "@ui";
  import { get_signature_color } from "@utils";
  import { tick } from "svelte";
  import { fade } from "svelte/transition";

  const is_mobile = $derived(app.viewport.mobile);
  const is_storymode = $derived(app.view === "storymode");
  const active_fractal = $derived(session.active_fractal || app.selected_fractal);
  const fractal_url = $derived(active_fractal?.profile_picture || "");

  // Restore physics intensity whenever streaming starts
  $effect(() => {
    if (execution.stream.active) motion.intensity = 1.0;
  });

  // Suspend AudioContexts on unmount and pagehide
  $effect(() => {
    const handle_page_hide = () => Audio.destroy();
    window.addEventListener("pagehide", handle_page_hide);
    return () => {
      window.removeEventListener("pagehide", handle_page_hide);
      Audio.destroy();
    };
  });

  // Begin-story flight watcher: flies storyboard title + cards into prologue once streaming produces visible prose
  $effect(() => {
    if (!app.begin_story_pending || storyboard.begin_flight_started || app.begin_flight_claimed) return;
    if (!session.feed.some((entry) => entry.meta?.is_prologue)) return;
    if (!execution.stream.active || !execution.stream.content) return;

    const content = String(execution.stream.content);
    if (!/<\/think\s*>/i.test(content) && !parse_think_block(content).content.trim()) return;

    storyboard.begin_flight_started = true;
    app.begin_flight_claimed = true;
    const assets = capture_storyboard_flight();

    Promise.resolve().then(async () => {
      try {
        await tick();
        if (!app.begin_story_pending) return;
        await app.set_view("storymode");
        await tick();
        if (!app.begin_story_pending) return;

        const row = document.querySelector("[data-msg-prologue]");
        if (!row) return;

        const vp = document.querySelector("[data-id='storymode-scroll-area'] .scroll-area-viewport");
        if (vp) vp.scrollTop = 0;

        /** @type {Record<string, DOMRect>} */
        const dst_rects = {};
        for (const type of ["ai", "fractal", "user"]) {
          const card = row.querySelector(`[data-msg-card="${type}"] [data-card-root]`);
          if (card) dst_rects[type] = card.getBoundingClientRect();
        }
        const title_el = row.querySelector("[data-msg-title]");
        if (title_el) dst_rects.title = title_el.getBoundingClientRect();

        fly_storyboard_cards_into_prologue(assets, dst_rects);
      } finally {
        app.begin_story_pending = false;
        app.suppress_card_transitions = false;
        app.begin_flight_claimed = false;
      }
    });
  });
</script>

<main
  id="main-content"
  class="relative z-10 h-dvh w-full animate-[fade-in_var(--transition-duration-slow)_var(--ease-out)_forwards] overflow-hidden text-left"
  data-view={app.view}>
  <div class="pointer-events-none fixed inset-0 z-0 h-dvh w-screen overflow-hidden bg-neutral-900" aria-hidden="true">
    <div data-bg="gradient"></div>

    <div class="absolute inset-0" style:view-transition-name={is_storymode && !app.transitioning_profile ? "entity-morph-fractal" : undefined}>
      {#key fractal_url}
        {#if fractal_url}
          <div
            class="absolute inset-0 bg-cover bg-center opacity-muted filter-[var(--blur-mist)_brightness(var(--brightness-muted))]"
            style:background-image={`url('${fractal_url}')`}
            transition:fade={{ duration: motion.is_reduced ? 0 : 1200 }}>
          </div>
        {/if}
      {/key}
    </div>

    <div
      class={[
        "pointer-events-none fixed -inset-5 z-overlay bg-(image:--noise-url) mix-blend-overlay",
        execution.phase === "generating" ?
          "animate-[noise-breathing_0.08s_steps(4)_infinite] opacity-[calc(var(--opacity-whisper)+0.1)]"
        : "animate-[noise-breathing_0.2s_steps(4)_infinite] opacity-ghost",
      ]}
      style:animation-play-state={motion.is_reduced ? "paused" : "running"}>
    </div>
  </div>

  <!-- Persistent Stage Grid -->
  <div
    class={[
      "fixed inset-0 z-sticky m-auto grid w-grid-width overflow-hidden text-white transition-opacity duration-300",
      is_mobile && is_storymode ? "h-dvh grid-cols-2 grid-rows-[min-content_16rem_1fr_min-content]" : "h-grid-height grid-cols-12 grid-rows-12",
    ]}>
    {#if app.view === "storyboard"}
      <Storyboard />
    {:else if is_storymode}
      <Storymode />
    {/if}

    <div
      role="contentinfo"
      class={[
        "pointer-events-none relative z-sticky flex justify-center",
        is_mobile ?
          is_storymode ? "inset-auto col-span-full row-4 h-auto items-center"
          : "inset-auto col-start-1 col-end-13 row-start-12 h-full items-end"
        : is_storymode ? "col-start-1 col-end-13 row-start-12 h-row-unit items-start self-stretch"
        : "col-start-2 col-end-12 row-start-11 h-row-unit items-center self-stretch",
      ]}>
      {#if app.entities_loaded}
        <Console on_shuffle={() => storyboard.shuffle()} on_begin={() => storyboard.begin()} is_shuffling={storyboard.is_shuffling} />
      {/if}
    </div>
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
    <div class="perspective-distant" data-testid="relational-hover-card">
      <div class="relative" data-card-flip-rotor data-pinned={is_pinned} data-closing={Boolean(closing)} data-reduced={motion.is_reduced}>
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
    transition: none;
  }
</style>
