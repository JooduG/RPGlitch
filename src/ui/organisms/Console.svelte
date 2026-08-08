<script>
  /**
   * @file UnifiedConsole.svelte
   * 🎛️ THE SOVEREIGN CORE CONSOLE
   * Polymorphic command control system merging GlassPill, StoryboardPill, ControlPanel, and InputBar.
   * Standard: Ultra-Lean DOM
   */
  import { click_outside } from "@utils";
  import { Accordion, Backdrop, Button, ProgressBar, ScrollArea, TextField, tooltip } from "@atoms";
  import { stories, NAME_PREFIXES, VISUAL_STYLES, NARRATIVE_STYLES } from "@data";
  import { pick_random } from "@utils";
  import { chrono_engine, session_driver } from "@engine";
  import { gamemaster } from "@intelligence";
  import { get_signature_color } from "@media";
  import { StoryManager, ConsoleInputBar, AudioControls, DevControls } from "@molecules";
  import { motion, pulse, roll, shimmy, fly_card_in, fly_card_out, capture_storyboard_flight, fly_storyboard_cards_into_prologue } from "@motion";
  import { app, runtime, simulation_state, simulation_log } from "@state";

  // --- CORE VIEW ENGINE STATE ---
  let models_ready = $derived(app.models_ready);
  let ready_to_begin = $derived(app.is_ready && models_ready);
  let label_text = $derived(ready_to_begin ? "BEGIN STORY" : `SELECT ENTITIES (${app.selected_count}/3)`);

  // --- STORYMODE CONSOLE STATE ---
  let is_focused = $state(false);

  let is_locked = $derived(simulation_state.busy);
  let story_locked = $derived(simulation_state.phase === "locked");
  let signature_color = $derived(get_signature_color(runtime.active_user || app.selected_user, "var(--color-gunmetal)"));

  // --- STORYBOARD NARRATIVE ORCHESTRATION ---
  let shuffle_active = $state(false);

  /** Derives card initials from an entity name, skipping common prefixes. */
  function compute_initials(str) {
    const words = String(str || "")
      .replace(/['']/g, "")
      .replace(/[^\p{L}\s]/gu, " ")
      .trim()
      .split(/\s+/);
    const stop_words = new Set(NAME_PREFIXES.map((w) => w.replace(/\.$/, "")));
    const filtered = words.filter((w) => !stop_words.has(w.toLowerCase()));
    return (
      (filtered.length ? filtered : words)
        .slice(0, 3)
        .map((w) => w.charAt(0))
        .join("")
        .toUpperCase() || "?"
    );
  }

  /**
   * Re-dresses a flying card clone with the newly drawn entity's appearance, so
   * the deal-in doesn't carry the swapped-out card's face up to the slot.
   * @param {HTMLElement} clone
   * @param {any} entity
   */
  function dress_deal_card(clone, entity) {
    if (!entity) return;
    const color = get_signature_color(entity, "var(--color-gunmetal)");
    clone.style.setProperty("--signature-color", color);
    clone.querySelectorAll("[style]").forEach((el) => {
      if (el.style.getPropertyValue("--signature-color")) {
        el.style.setProperty("--signature-color", color);
      }
    });
    const pic = entity.profile_picture;
    if (pic) {
      clone.querySelectorAll("img").forEach((img) => {
        img.src = pic;
        img.removeAttribute("srcset");
      });
    }
    const name_span = clone.querySelector(".bg-linear-to-t > span");
    if (name_span) name_span.textContent = entity.name || "Untitled";
    const desc = clone.querySelector(".bg-linear-to-t p");
    if (desc) desc.textContent = entity.description || "No description provided.";
    const initials = compute_initials(entity.name);
    clone.querySelectorAll("[class*='text-[clamp(0.6rem']").forEach((el) => {
      el.textContent = initials;
    });
  }

  const storyboard = {
    async shuffle() {
      if (app.simulation.loading) return;
      if (!app.ai_list.length) {
        await app.load_entities();
      }
      if (!app.ai_list.length) return;

      const pick_ai = pick_random(Array.isArray(app.ai_list) ? app.ai_list : []);
      let available_users = Array.isArray(app.user_list) ? app.user_list : [];
      if (pick_ai) {
        available_users = available_users.filter((u) => u.id !== pick_ai.id);
      }
      const pick_user = available_users.length ? pick_random(available_users) : app.user_list?.[0] || null;

      let pick_fractal = null;
      if (Array.isArray(app.fractal_list) && app.fractal_list.length) {
        const random_fractal = pick_random(app.fractal_list);
        if (random_fractal) {
          pick_fractal = {
            ...random_fractal,
            visual_style: pick_random(Object.keys(VISUAL_STYLES)),
            narrative_style: pick_random(Object.keys(NARRATIVE_STYLES)),
          };
        }
      }

      const commit = () => {
        app.selected_ai = pick_ai;
        app.selected_user = pick_user;
        app.selected_fractal = pick_fractal;
        if (typeof app.regenerate_title === "function") {
          app.regenerate_title();
        }
      };

      const slots = ["ai", "user", "fractal"].map((type) => {
        const wrapper = document.querySelector(`[data-slot-type="${type}"]`);
        const root = wrapper?.querySelector("[data-card-root]") || wrapper || null;
        return { type, wrap: wrapper, root, rect: root ? root.getBoundingClientRect() : null };
      });

      const dealable = !motion.is_reduced && app.view === "storyboard" && !shuffle_active;
      if (!dealable || slots.some((s) => !s.root || !s.rect)) {
        // If a deal is already airborne, ignore the click rather than double-committing.
        if (!shuffle_active) commit();
        return;
      }

      // 🃏 THE SHUFFLE DEAL — current cards return to the deck, then the newly
      // drawn cards deal out to their slots, staggered like a real hand.
      shuffle_active = true;
      slots.forEach((s) => {
        s.wrap?.classList.remove("deal-reveal", "deal-revealed");
        s.wrap?.classList.add("deal-reveal");
      });
      const occupied = { ai: app.selected_ai, user: app.selected_user, fractal: app.selected_fractal };
      const picks = { ai: pick_ai, user: pick_user, fractal: pick_fractal };
      const viewport_w = window.innerWidth;
      const viewport_h = window.innerHeight;
      let title_done = false;

      slots.forEach((s, i) => {
        const r = /** @type {{ left: number, top: number, width: number, height: number }} */ (s.rect);
        const deck = {
          left: Math.max(0, viewport_w / 2 - (r.width * 0.62) / 2),
          top: Math.max(0, viewport_h - r.height * 0.62 * 1.25),
          width: r.width * 0.62,
          height: r.height * 0.62,
        };

        // Phase 1: return the current occupant to the deck (snappy exit).
        if (occupied[s.type] && s.root) {
          s.root.style.transition = "none";
          s.root.style.opacity = "0";
          fly_card_out(s.root, deck, { duration_ms: 210 });
        }

        // Phase 2: deal the new card in, staggered per slot.
        setTimeout(() => {
          if (!s.root || !s.rect) return;
          fly_card_in(s.root, deck, s.rect, {
            tag: "data-deal-in",
            on_clone: (clone) => dress_deal_card(clone, picks[s.type]),
            on_land: () => {
              if (s.root) {
                s.root.style.opacity = "";
                s.root.style.transition = "";
              }
              s.wrap?.classList.add("deal-revealed");
              app.selected_ai = picks.ai;
              app.selected_user = picks.user;
              app.selected_fractal = picks.fractal;
              // One title roll per shuffle — each slot's on_land used to
              // regenerate the dynamic storyboard title (3x per shuffle).
              if (!title_done && typeof app.regenerate_title === "function") {
                title_done = true;
                app.regenerate_title();
              }
            },
          });
        }, i * 90);
      });

      setTimeout(() => {
        shuffle_active = false;
      }, 180 + 700);
    },
    async begin() {
      // Reset the begin-flight latch so a fresh begin can orchestrate again.
      begin_flight_started = false;
      if (app.settings.dev_mode) {
        app.log("Lobby Bypass Triggered (DEV_MODE)", "system");
        const selection = {
          ai: app.selected_ai || { id: "dev_ai", name: "Dev AI" },
          user: app.selected_user || { id: "dev_user", name: "Dev User" },
          fractal: app.selected_fractal || { id: "dev_fractal", name: "Dev Fractal" },
        };
        motion.intensity = 0.4;
        await chrono_engine.start(selection);
        await app.load_entities();
        return;
      }
      if (!app.selected_ai || !app.selected_user || !app.selected_fractal) return;
      const claimed = new Set(await stories.active_entity_ids());
      const locked = [app.selected_ai, app.selected_user, app.selected_fractal]
        .filter(Boolean)
        .find((e) => e.id != null && claimed.has(String(e.id)));
      if (locked) {
        app.log(`"${locked.name || "Entity"}" is claimed by an active story — end or delete that story first.`, "error");
        return;
      }
      motion.intensity = 0.4;
      await chrono_engine.start({
        ai: app.selected_ai,
        user: app.selected_user,
        fractal: app.selected_fractal,
      });
      await app.load_entities(); // Claim the new story's entities immediately
    },
  };

  // --- BEGIN-STORY FLIGHT ORCHESTRATION ---
  // chrono.start now leaves the storyboard VISIBLE while the prologue
  // generates (no empty viewport). The moment the real prologue entry lands in
  // the feed, we capture the storyboard cards, flip to storymode, and fly the
  // cards from the storyboard into the prologue message.
  let begin_flight_started = $state(false);
  $effect(() => {
    const _pending = app.begin_story_pending;
    if (!_pending) return;
    const has_real_prologue = simulation_log.feed.some((entry) => entry.meta?.is_prologue && !entry.busy);
    if (!has_real_prologue || begin_flight_started) return;
    begin_flight_started = true;
    // Capture BEFORE the flip — the storyboard unmounts on the view change.
    const assets = capture_storyboard_flight();
    app._begin_flight_assets = assets;
    // Defer out of the effect stack: set_view runs flushSync, which must not
    // execute synchronously inside an effect body.
    setTimeout(() => {
      if (!app.begin_story_pending) return; // already handled elsewhere
      app.set_view("storymode");
      setTimeout(() => {
        if (!app.begin_story_pending) return; // already handled elsewhere
        if (!document.querySelector("[data-msg-prologue]")) {
          // Bail gracefully: no prologue message to land in.
          app.begin_story_pending = false;
          app.suppress_card_transitions = false;
          app._begin_flight_assets = null;
          return;
        }
        const vp = document.querySelector("[data-id='storymode-scroll-area'] .scroll-area-viewport");
        if (vp) vp.scrollTop = 0;
        const dst_rects = {};
        const row = document.querySelector("[data-msg-prologue]");
        if (row) {
          for (const type of ["ai", "fractal", "user"]) {
            const card = row.querySelector(`[data-msg-card="${type}"] [data-card-root]`);
            if (card) dst_rects[type] = card.getBoundingClientRect();
          }
        }
        fly_storyboard_cards_into_prologue(assets, dst_rects);
        app.begin_story_pending = false;
        app.suppress_card_transitions = false;
        app._begin_flight_assets = null;
      }, 350);
    }, 0);
  });

  let is_ending_story = $state(false);

  async function handle_end_story() {
    if (is_ending_story || !runtime.story_id) return;
    is_ending_story = true;
    try {
      await gamemaster.execute_epilogue(runtime.story_id);
      // Conclude the story so its entities are released back to the lobby and
      // the story card reports "concluded".
      await stories.conclude(runtime.story_id);
      await app.load_entities();
      simulation_state.lock();
    } catch (e) {
      console.error("[End Story Error]", e);
      app.log(`End Story failed: ${e.message || e}`, "error");
    } finally {
      is_ending_story = false;
    }
  }

  function handle_window_keydown(e) {
    if (e.key === "Escape" && app.control_panel_open) {
      e.preventDefault();
      app.control_panel_open = false;
    }
  }
</script>

<svelte:window onkeydown={handle_window_keydown} />

<div class="pointer-events-none relative flex h-full w-full justify-center {app.control_panel_open ? 'z-50' : 'z-10'}">
  {#if app.control_panel_open}
    <Backdrop layer="console" onclick={() => (app.control_panel_open = false)} />
  {/if}

  <div
    use:click_outside={(event) => {
      const target = event?.target;
      if (
        target instanceof Element &&
        (target.closest(".menu") ||
          target.closest("[data-dropdown-menu]") ||
          target.closest(".dropdown-portal-wrapper") ||
          target.closest(".tooltip-portal") ||
          target.closest("[data-backdrop]") ||
          target.closest("[data-modal-variant]"))
      ) {
        return;
      }
      app.control_panel_open = false;
    }}
    class="
      pointer-events-auto
      z-50
      flex flex-col
      {app.control_panel_open ? 'justify-end' : 'justify-center'}
      bg-glass-elevated
      shadow-2xl
      shadow-black/50 [backdrop-filter:var(--blur-mist)]
      transition-all
      duration-500
      ease-in-out
      md:max-h-[calc(var(--spacing-row-unit)*9)]

      {app.control_panel_open
      ? 'absolute bottom-0 w-full rounded-none p-4 md:w-[calc(var(--spacing-column-unit)*5)] md:rounded-[calc(var(--spacing-row-unit)*0.5)]'
      : 'relative h-auto w-full rounded-none px-4 py-2 md:absolute md:bottom-0 md:h-auto md:min-h-[calc(var(--spacing-row-unit)*0.5)] md:rounded-[calc(var(--spacing-row-unit)*0.5)]'}
    {!app.control_panel_open && story_locked
      ? 'md:w-[max(20rem,calc(var(--spacing-column-unit)*3))]'
      : !app.control_panel_open && is_focused && app.view === 'storymode'
        ? `
      border-(--signature-color,var(--color-slate-600))
      shadow-[0_0_calc(var(--spacing-unit)*4)_color-mix(in_srgb,var(--signature-color,var(--color-slate-600))_30%,transparent)]
      md:w-[calc(var(--spacing-column-unit)*5)]
    `
        : !app.control_panel_open
          ? 'md:w-[max(24rem,calc(var(--spacing-column-unit)*4))]'
          : ''}
  "
    style:--signature-color={app.view === "storymode" ? signature_color : undefined}
    style:view-transition-name="unified-console"
    data-testid="unified-console"
  >
    {#if app.simulation.loading}
      <div class="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-[inherit]" aria-hidden="true">
        <div class="console-shimmer h-full w-full"></div>
      </div>
    {/if}
    <!-- ACCORDION SETTINGS (VERTICAL EXPANSION) -->
    <div
      class="grid min-h-0 w-full transition-[grid-template-rows] duration-500 ease-in-out {app.control_panel_open
        ? 'mt-2 grid-rows-[1fr]'
        : 'grid-rows-[0fr]'}"
    >
      <div class="flex min-h-0 w-full flex-col overflow-hidden">
        <div
          class="mx-auto flex min-h-0 w-full flex-col gap-4 py-2 pb-4 opacity-0 transition-opacity md:w-[calc(var(--spacing-column-unit)*5-2rem)] {app.control_panel_open
            ? 'opacity-100 delay-300 duration-200'
            : 'delay-0 duration-150'}"
        >
          <ScrollArea class="min-h-0 w-full">
            <div class="flex w-full flex-col gap-2 px-2" style="--signature-color: var(--color-frozen);">
              <!-- DECK A: AUDIO -->
              <Accordion label="Audio" content_class="flex flex-col gap-4">
                <AudioControls />
              </Accordion>

              <!-- DECK B: STORYBOARD (Contextual) -->
              {#if app.view === "storyboard"}
                <Accordion label="Storyboard" content_class="flex flex-col gap-6">
                  <div class="w-full">
                    <TextField is_edit={true} placeholder="Optional Prologue Instructions" bind:value={app.prologue} />
                  </div>
                </Accordion>
              {/if}

              <!-- DECK C: STORYMODE (Contextual) -->
              {#if app.view === "storymode"}
                <Accordion label="Storymode" content_class="flex flex-row flex-wrap items-center gap-4">
                  <Button
                    label="Return to Storyboard"
                    variant="secondary"
                    size="small"
                    onclick={async () => {
                      await session_driver.clear_active();
                      await app.load_entities(); // Keep lobby lists in sync with active-story claims
                      app.set_view("storyboard");
                    }}
                  />

                  <Button
                    label="END STORY"
                    variant="danger"
                    size="small"
                    loading={is_ending_story}
                    busy={is_ending_story}
                    disabled={is_ending_story || is_locked}
                    onclick={handle_end_story}
                  />
                </Accordion>
              {/if}

              <!-- DECK D: LIBRARY (Always available) -->
              <Accordion label="Library" content_class="flex flex-col gap-4">
                <StoryManager />
              </Accordion>

              <!-- DECK E: ADVANCED -->
              <Accordion label="Advanced" content_class="flex w-full items-center justify-between gap-4">
                <DevControls />
              </Accordion>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>

    <!-- BOTTOM CONSOLE / INPUT AREA -->
    <div class="flex w-full items-center justify-between gap-2 transition-colors duration-300 {app.control_panel_open ? 'pt-2' : ''}">
      {#if app.view === "storyboard"}
        <Button
          flank={true}
          variant={app.control_panel_open ? "secondary" : "invisible"}
          aria-label="Settings"
          onclick={app.toggle_control_panel}
          data-testid="settings-button"
          actions={[roll, tooltip]}
          class="touch-target-coarse"
        >
          <svg
            viewBox="0 0 24 24"
            class="block size-icon-medium {app.control_panel_open ? 'rotate-90 opacity-100 transition-transform' : 'transition-transform'}"
          >
            <path
              fill="currentColor"
              d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.35 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.35 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.04 4.95,18.95L7.44,17.95C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.95L19.05,18.95C19.27,19.04 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
            />
          </svg>
        </Button>

        {#if !models_ready}
          <ProgressBar value={app.models_progress} class="flex-1" />
        {:else}
          <Button
            class="group touch-target-coarse"
            data-ready={ready_to_begin}
            variant="invisible"
            busy={!ready_to_begin || app.simulation.loading}
            disabled={app.control_panel_open}
            onclick={storyboard.begin}
            actions={[pulse]}
          >
            <h6
              class="m-0 tracking-widest transition-all duration-300 {ready_to_begin
                ? 'group-hover:scale-105 group-hover:brightness-125'
                : 'text-slate-400 opacity-80'}"
              style={ready_to_begin
                ? "color: var(--color-emerald-green); text-shadow: 0 0 0.5rem color-mix(in srgb, var(--color-emerald-green) 25%, transparent);"
                : undefined}
            >
              {app.simulation.loading ? "WRITING PROLOGUE…" : label_text}
            </h6>
          </Button>
        {/if}

        <Button
          flank={true}
          variant="invisible"
          aria-label="Shuffle Entities"
          disabled={app.control_panel_open || app.simulation.loading}
          onclick={() => storyboard.shuffle()}
          actions={[shimmy, tooltip]}
          class="touch-target-coarse"
        >
          <svg viewBox="0 0 24 24" class="block size-icon-medium">
            <path
              fill="currentColor"
              d="M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z"
            />
          </svg>
        </Button>
      {:else if story_locked}
        <Button
          flank={true}
          variant={app.control_panel_open ? "secondary" : "invisible"}
          onclick={() => app.toggle_control_panel()}
          aria-label="Settings"
          actions={[roll, tooltip]}
          class="touch-target-coarse"
        >
          <svg
            class="block size-icon-medium {app.control_panel_open ? 'rotate-90 opacity-100 transition-transform' : 'transition-transform'}"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
            />
          </svg>
        </Button>

        <Button
          label="Return to Storyboard"
          variant="secondary"
          size="small"
          full_width={true}
          onclick={async () => {
            await session_driver.clear_active();
            app.set_view("storyboard");
          }}
        />
      {:else}
        <Button
          flank={true}
          variant={app.control_panel_open ? "secondary" : "invisible"}
          onclick={() => app.toggle_control_panel()}
          aria-label="Settings"
          actions={[roll, tooltip]}
          class="touch-target-coarse"
        >
          <svg
            class="block size-icon-medium {app.control_panel_open ? 'rotate-90 opacity-100 transition-transform' : 'transition-transform'}"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
            />
          </svg>
        </Button>

        <ConsoleInputBar bind:is_focused />
      {/if}
    </div>
  </div>
</div>

<style>
  /* Prologue-writing shimmer — a light band sweeps the console left-to-right
     while loading (reading/progress direction). Animated via background-position
     (NOT transform): the console carries a view-transition-name, and transform
     keyframe animations freeze on view-transition-captured elements. */
  .console-shimmer {
    position: absolute;
    background: linear-gradient(115deg, transparent 42%, color-mix(in srgb, var(--color-electric-cyan) 10%, transparent) 50%, transparent 58%);
    background-size: 250% 100%;
    animation: console-shimmer-sweep 2.4s linear infinite;
  }

  @keyframes console-shimmer-sweep {
    0% {
      background-position: 100% 0;
    }

    100% {
      background-position: -150% 0;
    }
  }

  /* Shuffle deal reveal — flying clones are art-only (strip_card_text); the
     landed cards fade their text/badges back in after arrival. */
  :global(.deal-reveal [data-card-text]),
  :global(.deal-reveal [data-card-badge]) {
    opacity: 0 !important;
    transition: none !important;
  }

  :global(.deal-revealed [data-card-text]),
  :global(.deal-revealed [data-card-badge]) {
    opacity: 1 !important;
    transition: opacity 0.45s ease 0.1s !important;
  }
</style>
