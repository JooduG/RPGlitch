<script>
  /**
   * @file App.svelte
   * THE CORE SHELL
   * Central view orchestration shell executing view-switching logic natively.
   * Refactored: Option A — persistent layout hoist.
   * EntityCards and UnifiedConsole are mounted ONCE here and never destroyed
   * during view transitions, enabling true View Transition API morphing.
   */
  import { Skeleton, Tooltip, StyleBadge } from "@atoms";
  import { ImageRegenerate, ImagePreview, openImagePreview, closeImagePreview, EntityCard } from "@molecules";
  import { motion } from "@motion";
  import { CardHand, Layout, Profile, Storyboard, Storymode, UnifiedConsole } from "@organisms";
  import { app, runtime, simulationState, startRegenerate, deliverCandidates, setRegenerateError, register_image_preview_handlers } from "@state";
  import { session_driver } from "@engine";
  import { llm_service } from "@platform";

  import { Audio, visual_engine } from "@media";

  // --- DERIVED RUNES ---

  let fractal_url = $derived(app.selected_fractal?.profile_picture || "");
  let fractal_opacity = $derived("var(--opacity-muted)");

  // --- LIFECYCLE EFFECTS ---

  $effect(() => {
    app.load_entities();
  });

  $effect(() => {
    if (!runtime.is_ready) {
      runtime.sync();
    }
  });

  // Centralized State Reset: Restores engine physics velocity when streaming begins
  $effect(() => {
    if (app.streaming.active) {
      motion.intensity = 1.0;
    }
  });

  // Image Preview Bridge: Wire UI-layer handlers into the state layer's bridge.
  // This must run once at mount to satisfy the import boundary (state cannot import from ui).
  register_image_preview_handlers(openImagePreview, closeImagePreview);

  // Audio Lifecycle Cleanup: Suspend AudioContexts on unmount and pagehide
  // to prevent context leaks across view transitions and story swaps.
  $effect(() => {
    const handlePageHide = () => Audio.destroy();
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      Audio.destroy();
    };
  });

  // --- ENTITY MENU ACTION BUILDERS ---

  const is_locked = $derived(simulationState.busy);

  /** Portrait generation helper — logs a placeholder message immediately, then fills in the image */
  async function take_photo(subject, prompt, kind) {
    if (is_locked) return;
    const entity_map = {
      ai: runtime.active_ai || app.selected_ai,
      user: runtime.active_user || app.selected_user,
      fractal: runtime.active_fractal || app.selected_fractal,
    };
    const label_map = { ai: "AI", user: "User", fractal: "Fractal" };
    const turn_map = { ai: "AI_TURN", user: "USER_TURN", fractal: "SYSTEM_TURN" };
    const entity = entity_map[subject];
    try {
      simulationState.role = subject;
      simulationState.start_generation(subject);

      // Log placeholder message immediately with null src attachment
      const placeholderEntry = await session_driver.log_message("", subject, entity?.name || label_map[subject], {
        turn_type: turn_map[subject],
        attachments: [{ src: null, metadata: {} }],
      });

      const result = await visual_engine.visualize(runtime.story_id, prompt, kind);

      if (result?.imageUrl && placeholderEntry?.id) {
        await session_driver.update_log_attachment(placeholderEntry.id, 0, {
          src: result.imageUrl,
          metadata: { ...result.metadata, prompt: result.refinedPrompt },
        });
      } else if (!result?.imageUrl) {
        app.log(`${label_map[subject] || subject} image generation failed. Please try again.`, "error");
      }
    } catch (err) {
      console.error(`[Photo Error: ${subject}]`, err);
      app.log(`Image generation failed: ${err.message || err}`, "error");
    } finally {
      simulationState.complete();
    }
  }

  /** Group shot helper — logs placeholder immediately, then fills in the image */
  async function take_group_photo() {
    if (is_locked) return;
    try {
      simulationState.role = "fractal";
      simulationState.start_generation("fractal");
      const fractal = runtime.active_fractal || app.selected_fractal;

      const placeholderEntry = await session_driver.log_message("", "fractal", fractal?.name || "Scene", {
        turn_type: "SYSTEM_TURN",
        attachments: [{ src: null, metadata: {} }],
      });

      const result = await visual_engine.visualize(
        runtime.story_id,
        "A scene featuring both the AI character and the user persona together",
        "characters",
      );

      if (result?.imageUrl && placeholderEntry?.id) {
        await session_driver.update_log_attachment(placeholderEntry.id, 0, {
          src: result.imageUrl,
          metadata: { ...result.metadata, prompt: result.refinedPrompt },
        });
      } else if (!result?.imageUrl) {
        app.log("Story Image generation failed. Please try again.", "error");
      }
    } catch (err) {
      console.error("[Story Image Error]", err);
      app.log(`Story Image failed: ${err.message || err}`, "error");
    } finally {
      simulationState.complete();
    }
  }

  /**
   * Regenerate orchestration — generates 3 candidates in the background.
   * The image placeholder shows "Regenerating..." until all 3 are done,
   * then becomes a "Click Here" button that opens the 3-card picker.
   * First regenerate: same prompt, 3 new seeds.
   * Second+ regenerate: re-refines prompt via LLM, then 3 new images.
   * @param {{ prompt: string, negativePrompt?: string, mode?: string, log_id?: string|number, attach_idx?: number, signature_color?: string, regenerate_count?: number }} ctx
   */
  async function regenerate_image(ctx) {
    const { prompt, negativePrompt, mode = "character", log_id, attach_idx = 0, signature_color, regenerate_count = 0 } = ctx;
    const key = `${log_id}:${attach_idx}`;

    startRegenerate(key, {
      signature_color,
      on_select: (candidate) => {
        if (log_id) {
          session_driver.update_log_attachment(log_id, attach_idx, {
            src: candidate.url,
            metadata: { ...candidate.metadata, regenerate_count: regenerate_count + 1 },
          });
        }
      },
    });

    try {
      let finalPrompt = prompt;
      let finalNegative = negativePrompt;

      // Second+ regenerate: re-refine the prompt via LLM
      if (regenerate_count >= 1 && prompt) {
        const refined = await visual_engine.enhance(prompt, mode);
        if (refined?.prompt) {
          finalPrompt = refined.prompt;
          finalNegative = refined.negativePrompt || negativePrompt;
        }
      }

      // SAFETY NET: If enhance() returned a full JSON blob instead of just the prompt field,
      // extract the prompt field from it.
      if (finalPrompt.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(finalPrompt.trim());
          if (parsed.prompt && typeof parsed.prompt === "string") {
            finalPrompt = parsed.prompt;
            if (parsed.negativePrompt) finalNegative = parsed.negativePrompt;
          }
        } catch (_e) {
          const promptMatch = finalPrompt.match(/"prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
          if (promptMatch && promptMatch[1]) {
            finalPrompt = promptMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
          }
        }
      }

      const candidates = await visual_engine.generate_candidates(finalPrompt, {
        mode,
        negativePrompt: finalNegative,
        count: 3,
        min_success: 2,
      });

      if (candidates.length < 2) {
        setRegenerateError("Not enough images generated. Please try again.");
        return;
      }

      deliverCandidates(
        candidates.map((c) => ({
          url: c.url,
          metadata: { ...c.metadata, prompt: finalPrompt, mode },
          signature_color,
        })),
        { prompt: finalPrompt, mode, negativePrompt: finalNegative },
      );
    } catch (err) {
      console.error("[Regenerate Error]", err);
      setRegenerateError(`Regenerate failed: ${err.message || err}`);
    }
  }

  /** Ghostwriter trigger — fires a signal the UnifiedConsole watches */
  function ghostwrite() {
    if (is_locked) return;
    app.ghostwrite_request++;
  }

  // Expose regenerate_image to Message.svelte via the app store
  app.regenerate_image_handler = regenerate_image;

  /** Mock message — streams a placeholder message for the given entity role (devmode only) */
  async function run_mock(role) {
    if (is_locked) return;
    const entity_map = {
      ai: runtime.active_ai || app.selected_ai,
      user: runtime.active_user || app.selected_user,
      fractal: runtime.active_fractal || app.selected_fractal,
    };
    const label_map = { ai: "AI", user: "User", fractal: "Fractal" };
    const turn_map = { ai: "AI_TURN", user: "USER_TURN", fractal: "SYSTEM_TURN" };
    const entity = entity_map[role];
    const content = llm_service.get_mock_message();

    simulationState.start_generation(role);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    simulationState.complete();
    app.start_stream("mock-node", role);

    let buffer = "";
    const words = content.split(" ");
    for (let i = 0; i < words.length; i++) {
      buffer += (i === 0 ? "" : " ") + words[i];
      app.streaming.content = buffer;
      await new Promise((resolve) => setTimeout(resolve, 60));
    }

    await session_driver.log_message(content, role, entity?.name || label_map[role], { turn_type: turn_map[role] });
    app.end_stream();
  }

  // --- ACTION MENU CONFIGS ---

  /**
   * Factory: builds the context-menu action list for an entity slot.
   * Contextual: image actions and ghostwrite are storymode-only; swap is storyboard-only.
   * @param {"ai" | "user" | "fractal"} type
   * @returns {any[]}
   */
  function build_actions(type) {
    const in_storymode = app.view === "storymode";
    const in_dev = app.settings.dev_mode;
    const entity_map = { ai: app.selected_ai, user: app.selected_user, fractal: app.selected_fractal };
    const entity = entity_map[type];

    const photo_label = type === "ai" ? "Generate AI Character Image" : type === "user" ? "Generate User Persona Image" : "Generate Fractal Image";
    const photo_prompt =
      type === "ai"
        ? "A character portrait of the AI character"
        : type === "user"
          ? "A character portrait of the user persona"
          : "An environmental shot of the current setting";

    const items = [
      { label: "Open Profile", onSelect: () => app.toggle_profile(true, entity), disabled: !entity },
      {
        label: "View Profile Picture",
        onSelect: () =>
          app.open_image_preview({
            src: entity?.profile_picture,
            metadata: entity?.modifiers
              ? {
                  prompt: entity.modifiers.prompt,
                  negativePrompt: entity.modifiers.negative_prompt,
                  seed: entity.modifiers.last_generated_seed,
                }
              : null,
          }),
        disabled: !entity?.profile_picture,
      },
      {
        label: Audio.entity_voice[type] ? "Disable Voice" : "Enable Voice",
        active: Audio.entity_voice[type],
        onSelect: () => Audio.toggle_entity_voice(type),
      },
    ];

    if (in_storymode) {
      items.push({ separator: true });
      items.push({
        label: photo_label,
        onSelect: () => take_photo(type, photo_prompt, type),
        disabled: is_locked || visual_engine.isLoading,
      });
      if (type === "fractal") {
        items.push({
          label: "Generate Story Image",
          onSelect: () => take_group_photo(),
          disabled: is_locked || visual_engine.isLoading,
        });
      }
      if (type === "user") {
        items.push({
          label: app.settings.call_mode ? "Disable Microphone" : "Enable Microphone",
          active: app.settings.call_mode,
          onSelect: () => {
            app.settings.call_mode = !app.settings.call_mode;
            app.save_settings();
          },
        });
        items.push({ separator: true });
        items.push({
          label: "Ghostwrite",
          onSelect: () => ghostwrite(),
          disabled: is_locked,
        });
      }
    }

    if (!in_storymode) {
      items.push({ separator: true });
      items.push({
        label: "Swap",
        onSelect: () => app.open_card_hand(type),
      });
    }

    if (in_dev) {
      items.push(
        { separator: true },
        {
          label: "Mock Message",
          onSelect: () => run_mock(type),
          disabled: is_locked,
        },
      );
    }

    return items;
  }

  let ai_actions = $derived(build_actions("ai"));
  let user_actions = $derived(build_actions("user"));
  let fractal_actions = $derived(build_actions("fractal"));
</script>

<main
  class="relative z-10 h-dvh w-full animate-[fade-in_var(--duration-slow)_var(--ease-standard)_forwards] overflow-hidden text-left"
  data-view={app.view}
>
  <div class="pointer-events-none fixed inset-0 z-0 h-dvh w-screen overflow-hidden bg-neutral-900" aria-hidden="true">
    <div data-bg="gradient"></div>

    <div
      class="absolute inset-0 bg-cover bg-center filter-[var(--blur-mist)_brightness(var(--brightness-muted))] transition-all duration-(--duration-ambient) ease-in-out will-change-[opacity,filter]"
      style:background-image={fractal_url ? `url('${fractal_url}')` : "none"}
      style:opacity={fractal_url ? fractal_opacity : 0}
      style:view-transition-name={app.view === "storymode" && !app.transitioning_profile ? "entity-morph-fractal" : undefined}
    ></div>

    <div
      class="pointer-events-none fixed -inset-5 z-max bg-(image:--noise-url) mix-blend-overlay {app.sim_phase === 'generating'
        ? 'animate-[noise-breathing_0.08s_steps(4)_infinite] opacity-[calc(var(--opacity-whisper)+0.1)]'
        : 'animate-[noise-breathing_0.2s_steps(4)_infinite] opacity-ghost'}"
      style:animation-play-state={motion.isReduced ? "paused" : "running"}
    ></div>
  </div>

  <ImagePreview />
  <ImageRegenerate />

  <!--
    PERSISTENT LAYOUT — single instance always in the DOM.
    mode drives column sizing via CSS class matrix in Layout.svelte.
    Only center/header snippets are swapped between views.
  -->
  <Layout mode={app.view === "storymode" ? "storymode" : "storyboard"}>
    {#snippet header()}
      {#if app.view === "storyboard" && app.entities_loaded}
        <Storyboard />
      {/if}
    {/snippet}

    {#snippet left()}
      {#if !app.entities_loaded}
        <Skeleton variant="card" width="100%" height="100%" />
      {:else if app.view === "storymode"}
        <div
          class="flex h-full w-full flex-col items-center justify-center gap-gap-standard transition-transform duration-300 md:translate-x-[calc(var(--spacing-column-unit)*0.5)]"
        >
          <div
            class="flex w-full items-center justify-center"
            style:view-transition-name={app.transitioning_profile && app.transition_target_id === app.selected_ai?.id ? "entity-morph-ai" : undefined}
          >
            <EntityCard
              variant="panel"
              type="ai"
              entity={app.selected_ai}
              role_label="AI Character"
              actions={ai_actions}
              on_select={() => {
                if (app.selected_ai) app.toggle_profile(true, app.selected_ai);
              }}
            />
          </div>
          <div
            class="flex w-full items-center justify-center"
            style:view-transition-name={app.transitioning_profile && app.transition_target_id === app.selected_fractal?.id
              ? "entity-morph-fractal"
              : undefined}
          >
            <EntityCard
              variant="panel"
              type="fractal"
              entity={app.selected_fractal}
              role_label="Fractal"
              actions={fractal_actions}
              on_select={() => {
                if (app.selected_fractal) app.toggle_profile(true, app.selected_fractal);
              }}
            />
          </div>
          <StyleBadge entity={app.selected_fractal} layout="storymode" class="flex w-full justify-center gap-gap-standard" />
        </div>
      {:else}
        <div
          class="flex h-full w-full items-center justify-center"
          style:view-transition-name={app.transitioning_profile && app.transition_target_id === app.selected_ai?.id ? "entity-morph-ai" : undefined}
        >
          <EntityCard
            variant={app.selected_ai ? "panel" : "slot"}
            type="ai"
            entity={app.selected_ai}
            role_label="AI Character"
            actions={ai_actions}
            on_select={() => {
              if (app.selected_ai) {
                app.toggle_profile(true, app.selected_ai);
              } else if (app.view === "storyboard") {
                app.open_card_hand("ai");
              }
            }}
          />
        </div>
      {/if}
    {/snippet}

    {#snippet center()}
      {#if app.view === "storyboard"}
        {#if !app.entities_loaded}
          <Skeleton variant="card" width="100%" height="100%" />
        {:else}
          {@const entity = app.selected_fractal}
          <div
            class="flex h-full w-full items-center justify-center"
            style:view-transition-name={app.transitioning_profile && app.transition_target_id === entity?.id ? "entity-morph-fractal" : undefined}
          >
            <EntityCard
              variant={entity ? "panel" : "slot"}
              type="fractal"
              {entity}
              role_label="Fractal"
              actions={fractal_actions}
              on_select={() => {
                if (entity) {
                  app.toggle_profile(true, entity);
                } else {
                  app.open_card_hand("fractal");
                }
              }}
            />
          </div>
        {/if}
      {:else if app.view === "storymode"}
        <div class="relative flex h-full w-full flex-col overflow-hidden">
          {#if !app.entities_loaded}
            <Skeleton variant="card" width="100%" height="100%" />
          {:else}
            <Storymode />
          {/if}
        </div>
      {/if}
    {/snippet}

    {#snippet right()}
      {#if !app.entities_loaded}
        <Skeleton variant="card" width="100%" height="100%" />
      {:else}
        {@const entity = app.selected_user}
        <div
          class="flex h-full w-full items-center justify-center {app.view === 'storymode'
            ? 'transition-transform duration-300 md:translate-x-[calc(-0.5*var(--spacing-column-unit))]'
            : ''}"
          style:view-transition-name={app.transitioning_profile && app.transition_target_id === entity?.id ? "entity-morph-user" : undefined}
        >
          <EntityCard
            variant={app.view === "storymode" ? "panel" : entity ? "panel" : "slot"}
            type="user"
            {entity}
            role_label="User Persona"
            actions={user_actions}
            on_select={() => {
              if (entity) {
                app.toggle_profile(true, entity);
              } else if (app.view === "storyboard") {
                app.open_card_hand("user");
              }
            }}
          />
        </div>
      {/if}
    {/snippet}

    {#snippet footer()}
      {#if app.entities_loaded}
        <UnifiedConsole />
      {/if}
    {/snippet}
  </Layout>

  {#if app.entities_loaded}
    <CardHand />
  {/if}

  {#if app.profile_open}
    <Profile entity_type={app.profile_target_type} />
  {/if}
</main>

<Tooltip />

{#if app.settings.dev_grid_visible}
  <div data-dev="grid" data-view={app.view} aria-hidden="true">
    {#each ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"] as colId (colId)}
      <div data-axis="col" style:grid-column="col-{colId}">
        <span data-label="col">{colId}</span>
      </div>
    {/each}
    <div data-axis="col" data-end="true" style:grid-column="col-end">
      <span data-label="col">END</span>
    </div>

    {#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as rowId (rowId)}
      <div data-axis="row" style:grid-row="row-{rowId}">
        <span data-label="row">{rowId}</span>
      </div>
    {/each}
    <div data-axis="row" data-end="true" style:grid-row="row-end">
      <span data-label="row">END</span>
    </div>
  </div>
{/if}

<style>
  /* ── Core Shell (Ultra-Lean Stage Matrix) ────────────────────── */

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

  /* ── Global Document Resets ─────────────────────────────────── */

  :global(html),
  :global(body) {
    overflow: hidden;
    width: 100%;
    height: 100%;
  }

  /* ── Kinetic Physics Realization ────────────────────────────── */

  @keyframes fade-in {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  /* ── Diagnostic Global Grid ─────────────────────────────────── */

  [data-dev="grid"] {
    position: fixed;
    inset: 0;
    margin: auto;
    width: var(--spacing-grid-width);
    height: var(--spacing-grid-height);
    display: grid;
    grid-template-columns:
      [col-a] 1fr [col-b] 1fr [col-c] 1fr [col-d] 1fr [col-e] 1fr [col-f] 1fr
      [col-g] 1fr [col-h] 1fr [col-i] 1fr [col-j] 1fr [col-k] 1fr [col-l] 1fr [col-end];
    grid-template-rows:
      [row-1] 1fr [row-2] 1fr [row-3] 1fr [row-4] 1fr [row-5] 1fr [row-6] 1fr
      [row-7] 1fr [row-8] 1fr [row-9] 1fr [row-10] 1fr [row-11] 1fr [row-12] 1fr [row-end];
    pointer-events: none;
    z-index: var(--z-index-max);
    opacity: var(--opacity-whisper);
    border: var(--spacing-spacing-pixel) dashed var(--color-frozen);
    background-image: radial-gradient(
      circle at 0 0,
      var(--color-frozen) calc(var(--spacing-spacing-unit) / 2),
      transparent calc(var(--spacing-spacing-unit) / 2 + var(--spacing-spacing-pixel))
    );
    background-size: calc(100% / 12) calc(100% / 12);
    background-repeat: repeat;
  }

  [data-dev="grid"] [data-axis="col"] {
    border-left: var(--spacing-spacing-pixel) solid var(--color-frozen);
    height: 100%;
    grid-row: 1 / -1;
    position: relative;
  }

  [data-dev="grid"] [data-axis="row"] {
    border-top: var(--spacing-spacing-pixel) solid var(--color-frozen);
    width: 100%;
    grid-column: 1 / -1;
    position: relative;
  }

  [data-dev="grid"] [data-label] {
    position: absolute;
    font-family: var(--font-mono);
    font-size: var(--text-nano);
    color: var(--color-frozen);
    background: var(--color-void-black);
    padding: 0 var(--spacing-padding-tight);
    opacity: var(--opacity-whisper);
  }

  [data-dev="grid"] [data-label="col"] {
    top: calc(var(--spacing-spacing-unit) * 2);
    left: calc(var(--spacing-spacing-unit) * 2);
    text-transform: uppercase;
  }

  [data-dev="grid"] [data-label="row"] {
    left: calc(var(--spacing-spacing-unit) * 2);
    top: calc(var(--spacing-spacing-unit) * 2);
  }
</style>
