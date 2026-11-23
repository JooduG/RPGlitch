<script>
  /**
   * @file src/ui/organisms/Console.svelte
   * 🎛️ THE SOVEREIGN CORE CONSOLE
   * Polymorphic command control system merging persistent glass pill chassis,
   * storyboard controls, storymode input composer, settings control panel, and conclusion modals.
   */
  import { Accordion, Backdrop, Button, Icon, ProgressBar, ScrollArea, Shimmer, Slider, Toggle, tooltip } from "@atoms";
  import { export_story_record, reset_database, stories } from "@data";
  import { chrono_engine, generate_closing, generate_user_draft, reset_turn_scope_for_testing } from "@engine";
  import { Audio, pulse, reset_generation_in_flight, reset_image_generation_queue, roll, shimmy, stab } from "@media";
  import { Dialog, TextField } from "@molecules";
  import { StoryLibrary } from "@organisms";
  import { app, execution, session } from "@state";
  import { download_text_file, embeddings_engine, get_signature_color } from "@utils";
  import { tick } from "svelte";

  /**
   * @typedef {Object} Props
   * @property {() => void} [on_shuffle] Callback when storyboard shuffle is clicked.
   * @property {() => void} [on_begin] Callback when storyboard begin is clicked.
   * @property {boolean} [is_shuffling=false] Whether storyboard is currently shuffling.
   */

  /** @type {Props} */
  let { on_shuffle = () => {}, on_begin = () => {}, is_shuffling = false } = $props();

  // --- STORYMODE CONSOLE & COMPOSER STATE ---
  let value = $state(app.composer_draft);
  let has_text = $derived(value.length > 0);
  let is_ghostwriting = $state(false);
  /** Messages typed while composer is busy - sent the moment it's free */
  let pending = $state([]);

  /** @type {HTMLTextAreaElement | undefined} */
  let textarea = $state();

  // Keep app.composer_draft synchronized with local value
  $effect(() => {
    app.composer_draft = value;
  });

  // Story conclusion status
  let story_concluded = $derived(
    session.feed.some((e) => e?.meta?.is_epilogue && (e.story_id === undefined || String(e.story_id) === String(session.active_id))),
  );
  let story_locked = $derived(execution.phase === "locked" || story_concluded);
  let signature_color = $derived(get_signature_color(session.active_user || app.selected_user, "var(--color-gunmetal)"));

  let is_locked = $derived(execution.busy);
  let send_blocked = $derived(is_locked || execution.loading || app.control_panel_open);
  let pending_count = $derived(pending.length);

  // Models & storyboard readiness
  let models_ready = $derived(embeddings_engine.model_ready);
  let has_active_story = $derived(Boolean(session.active_id));
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

  // Prologue loading phrase ticker
  const PROLOGUE_PHRASES = ["INITIALIZING SIMULATION...", "SETTING THE STAGE...", "ONCE UPON A TIMING...", "WRITING PROLOGUE..."];
  let phrase_index = $state(0);

  $effect(() => {
    if (!execution.loading) {
      phrase_index = 0;
      return;
    }
    const interval = setInterval(() => {
      phrase_index = (phrase_index + 1) % PROLOGUE_PHRASES.length;
    }, 2800);
    return () => clearInterval(interval);
  });

  let label_text = $derived(
    execution.loading ? PROLOGUE_PHRASES[phrase_index]
    : has_active_story ? "ENTER STORYMODE"
    : ready_to_begin ? "BEGIN STORY"
    : `SELECT ENTITIES (${app.selected_count}/3)`,
  );

  // Ghostwriter trigger watcher
  let handled_ghostwrite_req = 0;
  let ghostwrite_generation = 0;
  /** @type {AbortController | null} */
  let ghostwrite_controller = null;
  $effect(() => {
    const req = app.ghostwrite_request;
    if (req === 0 || req === handled_ghostwrite_req) return;
    if (is_ghostwriting || is_locked) return;

    handled_ghostwrite_req = req;
    const my_generation = ++ghostwrite_generation;
    is_ghostwriting = true;
    const previous_text = value;
    value = "";
    const controller = new AbortController();
    ghostwrite_controller = controller;
    generate_user_draft(previous_text, { signal: controller.signal })
      .then(async (generated_text) => {
        if (my_generation !== ghostwrite_generation || controller.signal.aborted) return;
        if (generated_text && generated_text.trim()) {
          value = generated_text;
        } else {
          value = previous_text;
        }
        await tick();
        adjust_height();
      })
      .catch((err) => {
        if (my_generation !== ghostwrite_generation || controller.signal.aborted) return;
        console.error("Ghostwriter failed:", err);
        value = previous_text;
        adjust_height();
      })
      .finally(async () => {
        if (my_generation !== ghostwrite_generation) return;
        ghostwrite_controller = null;
        is_ghostwriting = false;
        await tick();
        adjust_height();
        drain_pending_queue();
      });
  });

  /**
   * Manual unstick: recovers execution AND clears every busy-visual source
   * the recover path cannot reach — the local ghostwrite flag (Shimmer +
   * disabled textarea), the turn re-entrancy guard (else the next send throws
   * "Simulation is locked"), and image in-flight sets/queue (else future
   * beats stay capped). Late ghostwrite results are ignored via generation.
   */
  async function handle_unstick() {
    ghostwrite_generation += 1;
    handled_ghostwrite_req = app.ghostwrite_request;
    is_ghostwriting = false;
    try {
      ghostwrite_controller?.abort();
    } catch {
      /* abort is best-effort */
    }
    ghostwrite_controller = null;
    try {
      execution.recover("Manual unstick from composer");
    } finally {
      try {
        if (typeof reset_turn_scope_for_testing === "function") reset_turn_scope_for_testing();
      } catch {
        /* turn guard reset is best-effort */
      }
      try {
        if (typeof reset_generation_in_flight === "function") reset_generation_in_flight();
      } catch {
        /* image bookkeeping reset is best-effort */
      }
      try {
        if (typeof reset_image_generation_queue === "function") reset_image_generation_queue();
      } catch {
        /* image queue reset is best-effort */
      }
    }
  }

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
    await reset_database();
    setTimeout(() => window.location.reload(), 150);
  }

  function handle_primary_storyboard_click() {
    if (has_active_story) {
      app.set_view("storymode");
    } else if (ready_to_begin && !execution.loading) {
      on_begin();
    }
  }

  async function handle_rewind() {
    if (is_rewinding || !session.active_id) return;
    is_rewinding = true;
    try {
      const epilogues = session.feed.filter((e) => e?.meta?.is_epilogue && (e.story_id === undefined || String(e.story_id) === String(session.active_id)));
      for (const ep of epilogues) {
        if (ep?.id != null) await session.delete_entry(String(ep.id));
      }
      execution.phase = "idle";
      if (session.active_id) {
        await stories.update(session.active_id, { is_concluded: 0, conclusion_status: null });
        await session.set_active(session.active_id);
      }
      console.info("Story rewound: you can continue chatting.");
    } catch (err) {
      console.error("[Rewind Error]", err);
    } finally {
      is_rewinding = false;
    }
  }

  async function handle_export_story() {
    if (is_exporting) return;
    is_exporting = true;
    try {
      const story_id = session.active_id;
      if (!story_id) return;
      const { markdown, filename } = await export_story_record(story_id, session.active_story);
      download_text_file(filename, markdown, "text/markdown;charset=utf-8");
      console.info("Story exported as Markdown.");
    } catch (err) {
      console.error("[Export Error]", err);
    } finally {
      is_exporting = false;
    }
  }

  async function handle_epilogue_and_conclude() {
    if (is_ending_story) return;
    is_ending_story = true;
    try {
      app.control_panel_open = false;
      await generate_closing(session.active_id);
      if (session.active_id) {
        await stories.conclude(session.active_id);
        await app.load_entities();
      }
    } catch (err) {
      console.error("[End Story Error]", err);
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
      if (session.active_id) {
        await stories.conclude(session.active_id);
        await chrono_engine.stop?.();
        await app.load_entities();
      }
    } catch (err) {
      console.error("[End Story Immediate Error]", err);
    } finally {
      is_ending_story = false;
      show_end_story_modal = false;
    }
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape") {
      if (is_confirming_reset || show_end_story_modal || document.querySelector('[role="alertdialog"], [role="dialog"]')) {
        return;
      }
      if (app.control_panel_open) {
        app.control_panel_open = false;
      }
    }
  }} />

{#if app.control_panel_open}
  <Backdrop layer="console" onclick={() => (app.control_panel_open = false)} />
{/if}

<!-- ========================================================================= -->
<!-- SNIPPET: SETTINGS BUTTON (THE GEAR)                                       -->
<!-- ========================================================================= -->
{#snippet settings_gear(variant = "invisible")}
  <Button flank={true} {variant} aria-label="Settings" onclick={app.toggle_control_panel} actions={[roll, tooltip]} class="touch-target-coarse">
    <Icon name="settings" class="block size-icon-medium {app.control_panel_open ? 'rotate-90 opacity-100 transition-transform' : 'transition-transform'}" />
  </Button>
{/snippet}

<!-- ========================================================================= -->
<!-- SNIPPET: STORYBOARD BAR                                                   -->
<!-- ========================================================================= -->
{#snippet storyboard_bar()}
  {@render settings_gear(app.control_panel_open ? "secondary" : "invisible")}

  {#if !models_ready && !has_active_story}
    <ProgressBar value={embeddings_engine.load_progress} class="flex-1" />
  {:else}
    <Button
      class="group touch-target-coarse flex-1"
      data-ready={ready_to_begin}
      variant="invisible"
      busy={!ready_to_begin || execution.loading}
      disabled={app.control_panel_open}
      onclick={handle_primary_storyboard_click}
      actions={[pulse]}>
      <h6
        class="whitespace-nowrap transition duration-standard {ready_to_begin ?
          'text-emerald-green [text-shadow:0_0_0.5rem_color-mix(in_srgb,var(--color-emerald-green)_25%,transparent)] group-hover:scale-105 group-hover:brightness-125'
        : 'text-slate-300'}">
        {label_text}
      </h6>
    </Button>
  {/if}

  <Button
    flank={true}
    variant="invisible"
    actions={[shimmy, tooltip]}
    aria-label="Shuffle Storyboard"
    onclick={on_shuffle}
    class="touch-target-coarse shrink-0"
    disabled={is_shuffling || execution.loading || app.control_panel_open}>
    <Icon name="shuffle" class="block size-icon-medium" />
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
      type-body
      text-frisk
      outline-none
      placeholder:text-slate-500
      disabled:cursor-wait
      disabled:opacity-30
    "
    bind:value
    onkeydown={handle_keydown}
    oninput={adjust_height}
    placeholder={app.control_panel_open ? ""
    : is_ghostwriting ? "Ghostwriting..."
    : "Type a message..."}
    rows="1"
    disabled={app.control_panel_open || is_ghostwriting}
    aria-label="Input message"></textarea>

  {#if pending_count > 0}
    <span
      class="flex shrink-0 items-center gap-tight type-uppercase-label text-amber-300"
      use:tooltip={pending_count > 1 ?
        `${pending_count} messages queued; they send when the current turn finishes.`
      : "Message queued; it sends when the current turn finishes."}>
      <span class="inline-block size-1.5 shrink-0 animate-pulse rounded-full bg-amber-400" role="status" aria-label="Status indicator"></span>
      {pending_count > 1 ? `${pending_count} queued` : "Queued"}
    </span>
  {/if}

  {#if (execution.stream.active || execution.loading) && (session.round > 0 || execution.loading)}
    <Button
      variant="invisible"
      disabled={app.control_panel_open}
      onclick={() => execution.interrupt()}
      aria-label="Interrupt Generation"
      actions={[tooltip]}
      class="touch-target-coarse text-slate-500 transition-colors hover:bg-transparent! hover:text-red-500!">
      <Icon name="interrupt" class="block size-icon-medium" />
    </Button>
  {:else if is_locked}
    <Button
      variant="invisible"
      onclick={handle_unstick}
      aria-label="Unstick Simulation"
      actions={[tooltip]}
      class="touch-target-coarse text-amber-400 transition-colors hover:bg-transparent! hover:text-amber-300!">
      <Icon name="octagon" class="block size-icon-medium" />
    </Button>
  {:else}
    <Button
      variant="invisible"
      onclick={handle_send}
      disabled={!value.trim() || send_blocked}
      aria-label="Send Message"
      actions={[stab, tooltip]}
      class="touch-target-coarse">
      <Icon name="send" class="block size-icon-medium" />
    </Button>
  {/if}
{/snippet}

<!-- ========================================================================= -->
<!-- SNIPPET: CONTROL PANEL ACCORDIONS                                         -->
<!-- ========================================================================= -->
{#snippet control_panel()}
  <div class="grid min-h-0 w-full transition-[grid-template-rows] duration-500 ease-in-out {app.control_panel_open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}">
    <div class="flex min-h-0 w-full flex-col overflow-hidden">
      <div
        class="mx-auto flex min-h-0 w-full flex-col gap-standard pb-standard opacity-0 transition-opacity md:w-[calc(var(--spacing-column-unit)*5-2rem)] {(
          app.control_panel_open
        ) ?
          'opacity-100 delay-300 duration-200'
        : 'delay-0 duration-150'}">
        <ScrollArea class="min-h-0 w-full">
          <div class="flex w-full flex-col gap-tight px-tight" style="--signature-color: var(--color-frozen);">
            <!-- DECK A: AUDIO -->
            <Accordion label="Audio" content_class="flex flex-col gap-standard">
              <div class="grid w-full grid-cols-2 gap-standard">
                <div class="flex min-w-0 items-center">
                  <Toggle
                    label="NOTIFICATIONS"
                    bind:value={Audio.notifications_enabled}
                    onchange={(enabled) => {
                      if (enabled && (explicitly_muted || Audio.volume === 0)) {
                        explicitly_muted = false;
                        Audio.volume = previous_volume || 1.0;
                        Audio.is_muted = false;
                      }
                    }} />
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
                    ">
                    {#if is_muted}
                      <Icon name="volume_mute" class="size-5" />
                    {:else}
                      <Icon name="volume" class="size-5" />
                    {/if}
                  </Button>
                  <div class="h-4 w-28">
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      bind:value={Audio.volume}
                      onchange={(val) => {
                        explicitly_muted = val === 0;
                        Audio.is_muted = val === 0;
                      }} />
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
                  }} />

                <Button
                  label="END STORY"
                  variant="danger"
                  size="small"
                  loading={is_ending_story}
                  busy={is_ending_story}
                  disabled={is_ending_story || is_locked}
                  onclick={() => (show_end_story_modal = true)} />
              </Accordion>
            {/if}

            <!-- DECK D: LIBRARY (Always available) -->
            <StoryLibrary />

            <!-- DECK E: ADVANCED -->
            <Accordion label="Advanced" content_class="flex w-full flex-wrap items-center justify-between gap-standard">
              <Dialog
                type="confirm"
                bind:open={is_confirming_reset}
                title="Wipe Data?"
                message="This will permanently delete all stories, characters, and logs. This action cannot be undone."
                confirm_label="Erase All"
                on_confirm={hard_reset} />

              <Toggle label="DEVMODE" bind:value={app.settings.dev_mode} onchange={() => app.save_settings()} />
              <Toggle label="GRID" bind:value={app.settings.dev_grid_visible} onchange={() => app.save_settings()} />
              <Button variant="danger" size="small" onclick={() => (is_confirming_reset = true)} title="Delete All">
                <Icon name="trash" class="size-3.5 -translate-y-kinetic-shimmy-y" />
                <span>Delete All</span>
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
    z-sticky
    flex
    w-full
    items-center
    justify-center
  ">
  <div
    class="
      pointer-events-auto
      z-sticky
      flex flex-col
      {app.control_panel_open ? 'justify-end' : 'justify-center'}
      bg-glass-elevated
      shadow-2xl
      shadow-black/50 [backdrop-filter:var(--blur-mist)]
      transition-[height,min-height,max-height,width,max-width]
      duration-500
      ease-in-out
      md:max-h-[calc(var(--spacing-row-unit)*9)]

      {app.control_panel_open ?
      'absolute bottom-0 w-full rounded-none p-standard md:w-[calc(var(--spacing-column-unit)*5)] md:rounded-[calc(var(--spacing-row-unit)*0.5)]'
    : 'relative h-auto w-full rounded-none px-standard py-tight md:absolute md:bottom-0 md:h-auto md:min-h-[calc(var(--spacing-row-unit)*0.5)] md:rounded-[calc(var(--spacing-row-unit)*0.5)]'}
      {!app.control_panel_open && has_text && app.view === 'storymode' ?
      `
      border-(--signature-color,var(--color-slate-600))
      shadow-[0_0_calc(var(--spacing-unit)*4)_color-mix(in_srgb,var(--signature-color,var(--color-slate-600))_30%,transparent)]
      md:w-[calc(var(--spacing-column-unit)*5)]
    `
    : !app.control_panel_open ? 'md:w-[max(24rem,calc(var(--spacing-column-unit)*4))]'
    : ''}
    "
    style:--signature-color={app.view === "storymode" ? signature_color : undefined}
    style:view-transition-name="unified-console"
    style:width={!app.control_panel_open && story_locked ? "fit-content" : null}
    data-testid="unified-console">
    {#if execution.loading || is_ghostwriting || (execution.busy && app.control_panel_open)}
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
          {#if session.active_story?.conclusion_status === "COLLAPSED"}
            <span class="type-uppercase-label text-rose-400/90">💀 Story Collapsed</span>
          {:else}
            <span class="type-uppercase-label text-amber-300/90">✨ Story Concluded</span>
          {/if}
          <div class="flex w-full items-center justify-center gap-tight">
            <Button
              label="Return to Storyboard"
              variant="primary"
              size="small"
              onclick={async () => {
                app.control_panel_open = false;
                await session.clear_active();
                app.set_view("storyboard");
              }} />
            <Button label="Export Story" variant="primary" size="small" loading={is_exporting} onclick={handle_export_story} />
            <Button label={is_rewinding ? "Rewinding…" : "⟲ Keep Chatting"} variant="secondary" size="small" loading={is_rewinding} onclick={handle_rewind} />
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
<Dialog
  bind:open={show_end_story_modal}
  title="Conclude Active Story"
  message="Would you like to author a final epilogue before concluding, or conclude immediately?"
  busy={is_ending_story}>
  {#snippet footer()}
    <Button variant="primary" onclick={handle_epilogue_and_conclude} label="Generate Epilogue & Conclude" disabled={is_ending_story} />
    <Button variant="danger" onclick={handle_conclude_immediately} label="Conclude Immediately" disabled={is_ending_story} />
  {/snippet}
</Dialog>
