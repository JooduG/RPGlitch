<script>
  /**
   * @file src/ui/Console.svelte
   * 🎛️ THE SOVEREIGN CORE CONSOLE
   * Polymorphic command control system merging persistent glass pill chassis,
   * storyboard controls, storymode input composer, settings control panel, and conclusion modals.
   */
  import { db, session_driver, simulation_log, stories } from "@data";
  import { chrono_engine, execute_epilogue, execute_ghostwriter, force_recover_simulation, get_transport, runtime, simulation_state } from "@engine";
  import { Audio, get_signature_color, item_in, overlay_in, overlay_out, pulse, roll, shimmy, stab } from "@media";
  import { Accordion, Backdrop, Button, Dialog, ProgressBar, ScrollArea, Shimmer, Slider, TextField, Toggle, tooltip } from "@primitives";
  import { install_begin_flight_effect, storyboard } from "@ui";
  import { build_story_export_filename, click_outside, download_text_file, export_story_markdown, resolve_ms } from "@utils";
  import { AlertDialog } from "bits-ui";
  import { tick } from "svelte";
  import { app } from "./interface.svelte.js";
  import StoryCard from "./StoryCard.svelte";

  // --- STORYMODE CONSOLE & COMPOSER STATE ---
  let value = $state("");
  let has_text = $derived(value.length > 0);
  let is_ghostwriting = $state(false);
  /** Messages typed while composer is busy - sent the moment it's free */
  let pending = $state([]);

  /** @type {HTMLTextAreaElement | undefined} */
  let textarea = $state();

  // Story conclusion status
  let story_concluded = $derived(
    simulation_log.feed.some((e) => e?.meta?.is_epilogue && (e.story_id === undefined || String(e.story_id) === String(runtime.story_id))),
  );
  let story_locked = $derived(simulation_state.phase === "locked" || story_concluded);
  let signature_color = $derived(get_signature_color(runtime.active_user || app.selected_user, "var(--color-gunmetal)"));

  let is_locked = $derived(simulation_state.busy);
  let send_blocked = $derived(is_locked || app.simulation.loading || app.control_panel_open);
  let pending_count = $derived(pending.length);

  // Models & storyboard readiness
  let models_ready = $derived(app.models_ready);
  let has_active_story = $derived(Boolean(runtime.story_id));
  let ready_to_begin = $derived(has_active_story || (app.is_ready && models_ready));

  // Audio controls state (silent boot: muted until the user opts in)
  let previous_volume = $state(1.0);
  let explicitly_muted = $state(true);
  let is_muted = $derived(Audio.volume === 0 || explicitly_muted);

  // Modals & operations
  let show_end_story_modal = $state(false);
  let is_ending_story = $state(false);
  let is_exporting = $state(false);
  let is_rewinding = $state(false);
  let is_confirming_reset = $state(false);

  // Library / Story Manager state
  let is_confirming_story_delete = $state(false);
  let pending_story_delete = $state(null);
  let is_renaming_story = $state(false);
  let pending_rename_story = $state(null);
  let rename_draft = $state("");
  let story_cache = $state([]);

  async function load_story(id) {
    app.log(`Control Panel: Loading Story [${id}]`, "system");
    app.stash_storyboard_selection();
    await session_driver.set_active(String(id));
    await runtime.sync(String(id));
    await simulation_log.refresh();
    if (simulation_log.feed.some((e) => e.meta?.is_epilogue)) {
      simulation_state.lock();
    } else {
      simulation_state.unlock();
    }
    await app.load_entities();
    app.set_view("storymode");
    app.control_panel_open = false;
  }

  async function refresh_stories() {
    try {
      if (db.isOpen()) {
        story_cache = await stories.list();
      }
    } catch {
      // Ignore if db is closed during teardown
    }
  }

  async function export_story(story) {
    try {
      const row = await stories.get(story.id);
      const log = await db.simulation_log
        .where("story_id")
        .anyOf([String(story.id), story.id])
        .sortBy("created_at");
      const markdown = export_story_markdown({ ...(row || {}), ...story }, log);
      download_text_file(build_story_export_filename(story), markdown, "text/markdown;charset=utf-8");
      app.log(`Story "${story.title}" exported as Markdown.`, "system");
    } catch (err) {
      console.error(err);
      app.log(`Export failed: ${err.message}`, "error");
    }
  }

  async function delete_story(story) {
    pending_story_delete = story;
    is_confirming_story_delete = true;
  }

  async function start_rename_story(story) {
    pending_rename_story = story;
    rename_draft = story.title || "";
    is_renaming_story = true;
  }

  async function confirm_rename_story() {
    if (!pending_rename_story) return;
    const trimmed = rename_draft.trim();
    if (trimmed && trimmed !== pending_rename_story.title) {
      try {
        await stories.update(pending_rename_story.id, { title: trimmed });
        await refresh_stories();
        app.log(`Story renamed to "${trimmed}".`, "system");
      } catch (err) {
        app.log(`Rename failed: ${err.message}`, "error");
      }
    }
    pending_rename_story = null;
    rename_draft = "";
  }

  async function confirm_story_delete() {
    if (!pending_story_delete) return;
    try {
      await stories.delete(pending_story_delete.id);
      await refresh_stories();
      await app.load_entities();
      app.log(`Story "${pending_story_delete.title}" deleted.`, "system");
      if (String(runtime.story_id) === String(pending_story_delete.id)) {
        await session_driver.clear_active();
        app.set_view("storyboard");
      }
    } catch (err) {
      app.log(`Delete failed: ${err.message}`, "error");
    } finally {
      pending_story_delete = null;
    }
  }

  $effect(() => {
    const _stories_version = app.stories_version;
    refresh_stories();
  });

  // Active story guard on storyboard
  let show_active_guard = $state(false);
  let is_concluding = $state(false);

  // Prologue loading phrase ticker
  const PROLOGUE_PHRASES = ["INITIALIZING SIMULATION...", "SETTING THE STAGE...", "ONCE UPON A TIMING...", "WRITING PROLOGUE..."];
  let phrase_index = $state(0);

  $effect(() => {
    if (!app.simulation.loading) {
      phrase_index = 0;
      return;
    }
    const interval = setInterval(() => {
      phrase_index = (phrase_index + 1) % PROLOGUE_PHRASES.length;
    }, 2800);
    return () => clearInterval(interval);
  });

  let label_text = $derived(
    app.simulation.loading
      ? PROLOGUE_PHRASES[phrase_index]
      : has_active_story
        ? "ENTER STORYMODE"
        : ready_to_begin
          ? "BEGIN STORY"
          : `SELECT ENTITIES (${app.selected_count}/3)`,
  );

  // Install begin-story flight watcher on mount
  install_begin_flight_effect();

  // Ghostwriter trigger watcher
  let handled_ghostwrite_req = 0;
  $effect(() => {
    const req = app.ghostwrite_request;
    if (req === 0 || req === handled_ghostwrite_req) return;
    if (is_ghostwriting || is_locked) return;

    handled_ghostwrite_req = req;
    is_ghostwriting = true;
    const previous_text = value;
    value = "";
    execute_ghostwriter(get_transport(), previous_text)
      .then(async (generated_text) => {
        if (generated_text && generated_text.trim()) {
          value = generated_text;
        } else {
          value = previous_text;
        }
        await tick();
        adjust_height();
      })
      .catch((err) => {
        console.error("Ghostwriter failed:", err);
        value = previous_text;
        adjust_height();
      })
      .finally(async () => {
        is_ghostwriting = false;
        await tick();
        adjust_height();
        drain_pending_queue();
      });
  });

  // Focus textarea when entering storymode
  $effect(() => {
    if (app.view === "storymode" && textarea && !app.control_panel_open) {
      textarea.focus();
    }
  });

  // Reactive queue drainer when lock releases
  $effect(() => {
    if (!send_blocked && pending.length > 0) {
      drain_pending_queue();
    }
  });

  function adjust_height() {
    if (!textarea) return;
    textarea.style.height = "auto";
    const next_height = Math.min(textarea.scrollHeight, 240);
    textarea.style.height = `${next_height}px`;
    textarea.style.overflowY = textarea.scrollHeight > 240 ? "auto" : "hidden";
  }

  async function send_or_restore(text) {
    try {
      const accepted = await chrono_engine.send(text);
      if (!accepted) value = text;
    } catch (e) {
      console.error("Failed to send message:", e);
      value = text;
    }
  }

  async function handle_send() {
    const text = value.trim();
    if (!text) return;

    value = "";
    await tick();
    adjust_height();

    if (send_blocked) {
      pending.push(text);
      return;
    }
    await send_or_restore(text);
  }

  let is_draining = false;
  async function drain_pending_queue() {
    if (is_draining || send_blocked || pending.length === 0) return;
    is_draining = true;
    try {
      while (!send_blocked && pending.length > 0) {
        const next_text = pending[0];
        const accepted = await chrono_engine.send(next_text);
        if (accepted) {
          pending.shift();
        } else {
          break;
        }
      }
    } catch (e) {
      console.error("Failed to drain pending queue:", e);
    } finally {
      is_draining = false;
    }
  }

  function handle_keydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handle_send();
    }
  }

  function toggle_mute() {
    if (explicitly_muted || Audio.volume === 0) {
      explicitly_muted = false;
      Audio.volume = previous_volume || 1.0;
      Audio.is_muted = false;
    } else {
      previous_volume = Audio.volume;
      explicitly_muted = true;
      Audio.volume = 0;
      Audio.is_muted = true;
      Audio.voice.stop();
    }
  }

  async function hard_reset() {
    db.close();
    await db.delete();
    setTimeout(() => window.location.reload(), 150);
  }

  function handle_primary_storyboard_click() {
    if (has_active_story) {
      app.set_view("storymode");
    } else if (ready_to_begin && !app.simulation.loading) {
      storyboard.begin();
    }
  }

  async function handle_rewind() {
    if (is_rewinding || !runtime.story_id) return;
    is_rewinding = true;
    try {
      const epilogues = simulation_log.feed.filter(
        (e) => e?.meta?.is_epilogue && (e.story_id === undefined || String(e.story_id) === String(runtime.story_id)),
      );
      for (const ep of epilogues) {
        if (ep?.id != null) await simulation_log.delete_entry(String(ep.id));
      }
      simulation_state.phase = "idle";
      if (runtime.story_id) {
        await stories.update(runtime.story_id, { is_concluded: 0, conclusion_status: null });
        await session_driver.set_active(runtime.story_id);
      }
      app.log("Story rewound: you can continue chatting.", "system");
    } catch (err) {
      console.error("[Rewind Error]", err);
      app.log(`Rewind failed: ${err.message || err}`, "error");
    } finally {
      is_rewinding = false;
    }
  }

  async function handle_export_story() {
    if (is_exporting) return;
    is_exporting = true;
    try {
      const story_id = runtime.story_id;
      if (!story_id) return;
      const story_record = (await stories.get(story_id)) || runtime.active_story || {};
      const entries = await session_driver.load_log(story_id);
      const md = export_story_markdown(story_record, entries);
      const title = story_record.title || runtime.active_story?.title || "story";
      const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-export.md`;
      download_text_file(filename, md);
      app.log("Story exported as Markdown.", "system");
    } catch (err) {
      console.error("[Export Error]", err);
      app.log(`Export failed: ${err.message || err}`, "error");
    } finally {
      is_exporting = false;
    }
  }

  async function handle_epilogue_and_conclude() {
    if (is_ending_story) return;
    is_ending_story = true;
    try {
      app.control_panel_open = false;
      await execute_epilogue(runtime.story_id);
      if (runtime.story_id) {
        await stories.conclude(runtime.story_id);
        await app.load_entities();
      }
    } catch (err) {
      console.error("[End Story Error]", err);
      app.log(`Failed to end story: ${err.message || err}`, "error");
    } finally {
      is_ending_story = false;
      show_end_story_modal = false;
    }
  }

  async function handle_conclude_immediately() {
    if (is_ending_story) return;
    is_ending_story = true;
    try {
      app.control_panel_open = false;
      if (runtime.story_id) {
        await stories.conclude(runtime.story_id);
        await chrono_engine.stop?.();
        await app.load_entities();
      }
    } catch (err) {
      console.error("[End Story Immediate Error]", err);
      app.log(`Failed to conclude story: ${err.message || err}`, "error");
    } finally {
      is_ending_story = false;
      show_end_story_modal = false;
    }
  }

  const duration_in = resolve_ms("--duration-standard", 300);
  const duration_out = resolve_ms("--duration-fast", 150);
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape") {
      if (app.control_panel_open) {
        app.control_panel_open = false;
      } else if (show_end_story_modal && !is_ending_story) {
        show_end_story_modal = false;
      }
    }
  }}
/>

{#if app.control_panel_open}
  <Backdrop layer="console" onclick={() => (app.control_panel_open = false)} />
{/if}

<!-- ========================================================================= -->
<!-- SNIPPET: SETTINGS BUTTON (THE GEAR)                                       -->
<!-- ========================================================================= -->
{#snippet settings_gear(variant = "invisible")}
  <Button flank={true} {variant} aria-label="Settings" onclick={app.toggle_control_panel} actions={[roll, tooltip]} class="touch-target-coarse">
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
{/snippet}

<!-- ========================================================================= -->
<!-- SNIPPET: STORYBOARD BAR                                                   -->
<!-- ========================================================================= -->
{#snippet storyboard_bar()}
  {@render settings_gear(app.control_panel_open ? "secondary" : "invisible")}

  {#if !models_ready && !has_active_story}
    <ProgressBar value={app.models_progress} class="flex-1" />
  {:else}
    <Button
      class="group touch-target-coarse flex-1"
      data-ready={ready_to_begin}
      variant="invisible"
      busy={!ready_to_begin || app.simulation.loading}
      disabled={app.control_panel_open}
      onclick={handle_primary_storyboard_click}
      actions={[pulse]}
    >
      <h6
        class="m-0 text-[clamp(0.65rem,1.2vw,0.875rem)] tracking-widest whitespace-nowrap transition-all duration-300 {ready_to_begin
          ? 'group-hover:scale-105 group-hover:brightness-125'
          : 'text-slate-400 opacity-80'}"
        style={ready_to_begin
          ? "color: var(--color-emerald-green); text-shadow: 0 0 0.5rem color-mix(in srgb, var(--color-emerald-green) 25%, transparent);"
          : undefined}
      >
        {label_text}
      </h6>
    </Button>
  {/if}

  <Button
    flank={true}
    variant="invisible"
    actions={[shimmy, tooltip]}
    aria-label="Shuffle Storyboard"
    onclick={() => storyboard.shuffle()}
    class="touch-target-coarse shrink-0"
    disabled={storyboard.is_shuffling || app.simulation.loading || app.control_panel_open}
  >
    <svg class="block size-icon-medium" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"
      />
    </svg>
  </Button>
{/snippet}

<!-- ========================================================================= -->
<!-- SNIPPET: STORYMODE BAR                                                    -->
<!-- ========================================================================= -->
{#snippet storymode_bar()}
  <textarea
    bind:this={textarea}
    class="
      m-0
      box-border
      max-h-60
      flex-1
      resize-none
      border-none
      bg-transparent
      p-standard
      font-sans
      text-base
      leading-normal
      text-slate-50
      outline-none
      placeholder:text-slate-500
      disabled:cursor-wait
      disabled:opacity-30
    "
    bind:value
    onkeydown={handle_keydown}
    oninput={adjust_height}
    placeholder={app.control_panel_open ? "" : is_ghostwriting ? "Ghostwriting..." : "Type a message..."}
    rows="1"
    disabled={app.control_panel_open || is_ghostwriting}
    aria-label="Input message"></textarea>

  {#if pending_count > 0}
    <span
      class="flex shrink-0 items-center gap-tight text-[10px] font-bold tracking-widest text-amber-300 uppercase"
      use:tooltip={pending_count > 1
        ? `${pending_count} messages queued; they send when the current turn finishes.`
        : "Message queued; it sends when the current turn finishes."}
    >
      <span class="inline-block size-1.5 shrink-0 animate-pulse rounded-full bg-amber-400" role="status" aria-label="Status indicator"></span>
      {pending_count > 1 ? `${pending_count} queued` : "Queued"}
    </span>
  {/if}

  {#if app.streaming.active && runtime.round > 0}
    <Button
      variant="invisible"
      disabled={app.control_panel_open}
      onclick={() => app.trigger_interrupt()}
      aria-label="Interrupt Generation"
      actions={[tooltip]}
      class="touch-target-coarse text-slate-500 transition-colors hover:bg-transparent! hover:text-red-500!"
    >
      <svg class="block size-icon-medium" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" />
      </svg>
    </Button>
  {:else if is_locked || app.simulation.loading || app.streaming.active}
    <Button
      variant="invisible"
      onclick={() => force_recover_simulation("Manual unstick from composer")}
      aria-label="Unstick Simulation"
      actions={[tooltip]}
      class="touch-target-coarse text-amber-400 transition-colors hover:bg-transparent! hover:text-amber-300!"
    >
      <svg class="block size-icon-medium" viewBox="0 0 24 24">
        <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
      </svg>
    </Button>
  {:else}
    <Button
      variant="invisible"
      onclick={handle_send}
      disabled={!value.trim() || send_blocked}
      aria-label="Send Message"
      actions={[stab, tooltip]}
      class="touch-target-coarse"
    >
      <svg class="block size-icon-medium" viewBox="0 0 24 24">
        <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
      </svg>
    </Button>
  {/if}
{/snippet}

<!-- ========================================================================= -->
<!-- SNIPPET: CONTROL PANEL ACCORDIONS                                         -->
<!-- ========================================================================= -->
{#snippet control_panel()}
  <div
    class="grid min-h-0 w-full transition-[grid-template-rows] duration-500 ease-in-out {app.control_panel_open
      ? 'grid-rows-[1fr]'
      : 'grid-rows-[0fr]'}"
  >
    <div class="flex min-h-0 w-full flex-col overflow-hidden">
      <div
        class="mx-auto flex min-h-0 w-full flex-col gap-standard pb-standard opacity-0 transition-opacity md:w-[calc(var(--spacing-column-unit)*5-2rem)] {app.control_panel_open
          ? 'opacity-100 delay-300 duration-200'
          : 'delay-0 duration-150'}"
      >
        <ScrollArea class="min-h-0 w-full">
          <div class="flex w-full flex-col gap-tight px-2" style="--signature-color: var(--color-frozen);">
            <!-- DECK A: AUDIO -->
            <Accordion label="Audio" content_class="flex flex-col gap-standard">
              <div class="grid w-full grid-cols-2 gap-standard">
                <div class="flex min-w-0 items-center">
                  <Toggle label="NOTIFICATIONS" bind:value={Audio.notifications_enabled} />
                </div>
                <div class="flex min-w-0 flex-wrap items-center gap-tight">
                  <Button
                    variant="bare"
                    onclick={toggle_mute}
                    aria-label={is_muted ? "Unmute" : "Mute"}
                    actions={[[tooltip, is_muted ? "Unmute" : "Mute"]]}
                    class="
                      pointer-events-auto
                      flex h-6 w-10
                      shrink-0 items-center justify-center
                      rounded-md
                      bg-transparent
                      text-slate-400 transition-colors
                      hover:bg-slate-700/50 hover:text-white
                      focus-visible:outline
                      focus-visible:outline-offset-1 focus-visible:outline-slate-600 active:scale-95
                    "
                  >
                    {#if is_muted}
                      <svg viewBox="0 0 24 24" class="size-5">
                        <path
                          fill="currentColor"
                          d="M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z"
                        />
                      </svg>
                    {:else}
                      <svg viewBox="0 0 24 24" class="size-5">
                        <path
                          fill="currentColor"
                          d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16.03C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z"
                        />
                      </svg>
                    {/if}
                  </Button>
                  <div class="h-4 w-28">
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      bind:value={Audio.volume}
                      oninput={() => {
                        explicitly_muted = false;
                        Audio.is_muted = false;
                      }}
                    />
                  </div>
                </div>
              </div>
            </Accordion>

            <!-- DECK B: STORYBOARD (Contextual) -->
            {#if app.view === "storyboard"}
              <Accordion label="Storyboard" content_class="flex flex-col gap-standard">
                <div class="w-full">
                  <TextField is_edit={true} placeholder="Optional Prologue Instructions" bind:value={app.prologue} />
                </div>
              </Accordion>
            {/if}

            <!-- DECK C: STORYMODE (Contextual) -->
            {#if app.view === "storymode"}
              <Accordion label="Storymode" content_class="flex flex-row flex-wrap items-center gap-standard">
                <Button
                  label="Return to Storyboard"
                  variant="primary"
                  size="small"
                  onclick={async () => {
                    await app.set_view("storyboard");
                  }}
                />

                <Button
                  label="END STORY"
                  variant="danger"
                  size="small"
                  loading={is_ending_story}
                  busy={is_ending_story}
                  disabled={is_ending_story || is_locked}
                  onclick={() => (show_end_story_modal = true)}
                />
              </Accordion>
            {/if}

            <!-- DECK D: LIBRARY (Always available) -->
            <Accordion label="Library" content_class="flex flex-col gap-standard">
              {#if story_cache.length > 0}
                <div class="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-standard">
                  {#each story_cache as story (story.id)}
                    <div class="min-w-0" in:item_in>
                      <StoryCard
                        {story}
                        active={runtime.story_id === String(story.id)}
                        onclick={() => load_story(story.id)}
                        ondelete={delete_story}
                        onrename={start_rename_story}
                        onexport={export_story}
                      />
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="m-0 py-4 text-center text-sm text-slate-500 italic">No stories yet..</p>
              {/if}
            </Accordion>

            <!-- DECK E: ADVANCED -->
            <Accordion label="Advanced" content_class="flex w-full flex-wrap items-center justify-between gap-standard">
              <Dialog
                type="confirm"
                bind:open={is_confirming_reset}
                title="Wipe Data?"
                message="This will permanently delete all stories, characters, and logs. This action cannot be undone."
                confirm_label="Erase All"
                on_confirm={hard_reset}
              />

              <Toggle label="DEVMODE" bind:value={app.settings.dev_mode} onchange={() => app.save_settings()} />
              <Toggle label="DIRECTOR" bind:value={app.settings.director_enabled} onchange={() => app.save_settings()} />
              <Toggle label="GRID" bind:value={app.settings.dev_grid_visible} onchange={() => app.save_settings()} />
              <Button variant="danger" size="small" onclick={() => (is_confirming_reset = true)} title="Delete All">
                <svg
                  class="size-3.5 -translate-y-kinetic-shimmy-y fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-2 2-2 2H7c0 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                <span class="text-xs font-bold tracking-widest uppercase">Delete All</span>
              </Button>
            </Accordion>
          </div>
        </ScrollArea>
      </div>
    </div>
  </div>
{/snippet}

<!-- ========================================================================= -->
<!-- MAIN CONSOLE CHASSIS                                                      -->
<!-- ========================================================================= -->
<div
  class="
    pointer-events-none
    relative
    z-50
    flex
    w-full
    items-center
    justify-center
  "
>
  <div
    use:click_outside={(e) => {
      if (!app.control_panel_open) return;
      const target = /** @type {HTMLElement|null} */ (e?.target || document.activeElement);
      if (target?.closest?.(".custom-dropdown-panel") || target?.closest?.(".modal-backdrop") || target?.closest?.("[role='dialog']")) {
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
      ? 'absolute bottom-0 w-full rounded-none p-standard md:w-[calc(var(--spacing-column-unit)*5)] md:rounded-[calc(var(--spacing-row-unit)*0.5)]'
      : 'relative h-auto w-full rounded-none px-4 py-2 md:absolute md:bottom-0 md:h-auto md:min-h-[calc(var(--spacing-row-unit)*0.5)] md:rounded-[calc(var(--spacing-row-unit)*0.5)]'}
      {!app.control_panel_open && has_text && app.view === 'storymode'
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
    style:width={!app.control_panel_open && story_locked ? "fit-content" : null}
    data-testid="unified-console"
  >
    {#if app.simulation.loading || app.is_ghostwriting || (simulation_state.busy && app.control_panel_open)}
      <Shimmer />
    {/if}

    {#if app.control_panel_open || !story_locked}
      {@render control_panel()}
    {/if}

    <!-- BOTTOM CONSOLE / INPUT AREA -->
    <div class="flex w-full items-center justify-between gap-tight transition-colors duration-300 {app.control_panel_open ? 'pt-tight' : ''}">
      {#if app.view === "storyboard"}
        {@render storyboard_bar()}
      {:else if story_locked}
        <div class="flex w-full flex-col items-center gap-tight">
          {#if app.conclusion_status === "COLLAPSED"}
            <span class="text-[10px] font-bold tracking-widest text-rose-400/90 uppercase">💀 Story Collapsed</span>
          {:else}
            <span class="text-[10px] font-bold tracking-widest text-amber-300/90 uppercase">✨ Story Concluded</span>
          {/if}
          <div class="flex w-full items-center justify-center gap-tight">
            <Button
              label="Return to Storyboard"
              variant="primary"
              size="small"
              onclick={async () => {
                app.control_panel_open = false;
                await session_driver.clear_active();
                app.set_view("storyboard");
              }}
            />
            <Button label="Export Story" variant="primary" size="small" loading={is_exporting} onclick={handle_export_story} />
            <Button
              label={is_rewinding ? "Rewinding…" : "⟲ Keep Chatting"}
              variant="secondary"
              size="small"
              loading={is_rewinding}
              onclick={handle_rewind}
            />
          </div>
        </div>
      {:else}
        {@render settings_gear(app.control_panel_open ? "secondary" : "invisible")}
        {@render storymode_bar()}
      {/if}
    </div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- MODAL: END ACTIVE STORY                                                   -->
<!-- ========================================================================= -->
<AlertDialog.Root bind:open={show_end_story_modal} preventScroll={false}>
  <AlertDialog.Portal>
    <AlertDialog.Overlay forceMount>
      {#snippet child({ props: overlayProps, open: is_open })}
        {#if is_open}
          <Backdrop
            {...overlayProps}
            onclick={() => {
              if (!is_ending_story) show_end_story_modal = false;
            }}
            layer="max"
            busy={is_ending_story}
            variant="mini"
          >
            <AlertDialog.Content forceMount>
              {#snippet child({ props: contentProps })}
                <div
                  {contentProps}
                  class="
                    pointer-events-auto
                    relative
                    z-max
                    flex
                    w-(--dialog-width)
                    cursor-default
                    flex-col
                    justify-between
                    gap-standard
                    overflow-hidden
                    rounded-standard
                    bg-glass-elevated
                    p-standard
                    duration-300

                    before:pointer-events-none
                    before:absolute
                    before:inset-0
                    before:-z-10
                    before:bg-(--noise-url)
                    before:opacity-10
                    before:mix-blend-overlay

                    sm:w-[calc(var(--spacing-column-unit)*4)]

                    {is_ending_story ? 'pointer-events-none cursor-wait brightness-75 grayscale' : ''}"
                  style="
                    --dialog-width: 90vw;

                    backdrop-filter: var(--blur-mist);
                    transition-property: filter;
                  "
                  in:overlay_in={{ duration: duration_in }}
                  out:overlay_out={{ duration: duration_out }}
                >
                  <AlertDialog.Title class="m-0 p-0 text-left">
                    <h6 class="m-0 uppercase">Conclude Active Story</h6>
                  </AlertDialog.Title>

                  <AlertDialog.Description class="m-0 min-h-0 flex-1 p-0 text-left">
                    <p class="m-0 text-left text-base leading-relaxed whitespace-pre-wrap text-frisk">
                      Would you like to author a final epilogue before concluding, or conclude immediately?
                    </p>
                  </AlertDialog.Description>

                  <!-- display:flex inline: unlayered normalize.css v3 resets footer to block, defeating Tailwind's layered flex utility -->
                  <footer style="display: flex;" class="flex w-full flex-col justify-end gap-tight outline-none sm:flex-row">
                    <Button
                      variant="primary"
                      onclick={handle_epilogue_and_conclude}
                      label="Generate Epilogue & Conclude"
                      disabled={is_ending_story}
                    />
                    <Button variant="danger" onclick={handle_conclude_immediately} label="Conclude Immediately" disabled={is_ending_story} />
                  </footer>
                </div>
              {/snippet}
            </AlertDialog.Content>
          </Backdrop>
        {/if}
      {/snippet}
    </AlertDialog.Overlay>
  </AlertDialog.Portal>
</AlertDialog.Root>

<!-- ========================================================================= -->
<!-- MODAL: ACTIVE STORY GUARD (CONFIRM BEFORE OVERWRITING IN STORYBOARD)       -->
<!-- ========================================================================= -->
<Dialog
  type="confirm"
  bind:open={show_active_guard}
  title="Conclude Active Story?"
  message="Ending this story will archive it in your library and free up its entities so you can select them for a new story."
  confirm_label={is_concluding ? "Concluding..." : "Conclude & Free Entities"}
  confirm_variant="danger"
  on_confirm={async () => {
    is_concluding = true;
    try {
      if (runtime.story_id) {
        await stories.conclude(runtime.story_id);
      }
      await session_driver.clear_active();
      await app.load_entities();
      show_active_guard = false;
    } catch (err) {
      console.error("[Storyboard End Story Error]", err);
      app.log(`Failed to conclude story: ${err.message || err}`, "error");
    } finally {
      is_concluding = false;
    }
  }}
/>

<Dialog
  type="confirm"
  bind:open={is_confirming_story_delete}
  title="Delete Story?"
  message={`This will permanently delete "${pending_story_delete?.title ?? ""}" and its entire simulation log. This action cannot be undone.`}
  confirm_label="Delete"
  on_confirm={confirm_story_delete}
/>

<Dialog
  type="confirm"
  bind:open={is_renaming_story}
  title="Rename Story"
  message={`Enter a new title for "${pending_rename_story?.title ?? ""}":`}
  confirm_label="Save"
  show_input={true}
  input_placeholder="New story title..."
  bind:input_value={rename_draft}
  on_confirm={confirm_rename_story}
/>

<style>
  /* Shuffle deal reveal - flying clones are art-only (strip_card_text); the
     landed cards fade their text/badges back in after arrival.
     Scoped with specificity to override component inline styles cleanly without !important. */
  :global(.deal-reveal [data-card-text]),
  :global(.deal-reveal [data-card-badge]) {
    opacity: 0;
    transition: none;
  }

  :global(.deal-revealed [data-card-text]),
  :global(.deal-revealed [data-card-badge]) {
    opacity: 1;
    transition: opacity 0.45s ease 0.1s;
  }
</style>
