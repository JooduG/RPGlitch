<script>
  /**
   * @file src/ui/organisms/Console.svelte
   * Persistent glass pill console: storyboard bar, storymode composer, settings control panel, and story conclusion controls.
   */
  import { Accordion, Backdrop, Button, Icon, ProgressBar, ScrollArea, Shimmer, Slider, Toggle, tooltip } from "@atoms";
  import { export_story_record, reset_database, stories } from "@data";
  import { chrono_engine, generate_closing, generate_user_draft } from "@engine";
  import { Audio, pulse, roll, shimmy, stab } from "@media";
  import { Dialog, TextField } from "@molecules";
  import { StoryLibrary } from "@organisms";
  import { app, execution, session } from "@state";
  import { download_text_file, embeddings_engine, get_signature_color } from "@utils";
  import { tick } from "svelte";

  const PROLOGUE_PHRASES = ["INITIALIZING SIMULATION...", "SETTING THE STAGE...", "ONCE UPON A TIMING...", "WRITING PROLOGUE..."];

  /** @type {{ on_shuffle?: () => void; on_begin?: () => void; is_shuffling?: boolean }} */
  let { on_shuffle = () => {}, on_begin = () => {}, is_shuffling = false } = $props();

  // --- COMPOSER STATE ---
  let value = $state(app.composer_draft);
  let is_ghostwriting = $state(false);
  /** @type {string[]} */
  let pending = $state([]);
  /** @type {HTMLTextAreaElement | undefined} */
  let textarea = $state();

  // --- AUDIO & MODAL STATE ---
  let previous_volume = $state(1.0);
  let explicitly_muted = $state(true);
  let show_end_story_modal = $state(false);
  let is_ending_story = $state(false);
  let is_exporting = $state(false);
  let is_rewinding = $state(false);
  let is_confirming_reset = $state(false);
  let phrase_index = $state(0);

  let handled_ghostwrite_req = 0;
  let ghostwrite_generation = 0;
  /** @type {AbortController | null} */
  let ghostwrite_controller = null;
  let is_draining = false;

  // --- DERIVED ---
  const is_storymode = $derived(app.view === "storymode");
  const panel_open = $derived(app.control_panel_open);
  const has_text = $derived(value.length > 0);
  const pending_count = $derived(pending.length);
  const is_muted = $derived(Audio.volume === 0 || explicitly_muted);
  const models_ready = $derived(embeddings_engine.model_ready);
  const has_active_story = $derived(Boolean(session.active_id));
  const ready_to_begin = $derived(
    has_active_story || (app.selected_ai !== null && app.selected_user !== null && app.selected_fractal !== null && models_ready),
  );
  const send_blocked = $derived(execution.busy || execution.loading || panel_open);
  const signature_color = $derived(get_signature_color(session.active_user || app.selected_user, "var(--color-gunmetal)"));

  const story_concluded = $derived(
    session.feed.some((e) => e?.meta?.is_epilogue && (e.story_id === undefined || String(e.story_id) === String(session.active_id))),
  );
  const story_locked = $derived(execution.phase === "locked" || story_concluded);

  const label_text = $derived(
    execution.loading ? PROLOGUE_PHRASES[phrase_index]
    : has_active_story ? "ENTER STORYMODE"
    : ready_to_begin ? "BEGIN STORY"
    : `SELECT ENTITIES (${(app.selected_ai ? 1 : 0) + (app.selected_user ? 1 : 0) + (app.selected_fractal ? 1 : 0)}/3)`,
  );

  // --- EFFECTS ---
  $effect(() => {
    app.composer_draft = value;
  });

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

  $effect(() => {
    if (is_storymode && textarea && !panel_open) textarea.focus();
  });

  $effect(() => {
    if (!send_blocked && pending.length > 0) drain_pending_queue();
  });

  // Ghostwriter trigger watcher
  $effect(() => {
    const req = app.ghostwrite_request;
    if (req === 0 || req === handled_ghostwrite_req || is_ghostwriting || execution.busy) return;

    handled_ghostwrite_req = req;
    const my_generation = ++ghostwrite_generation;
    const previous_text = value;
    is_ghostwriting = true;
    value = "";

    const controller = new AbortController();
    ghostwrite_controller = controller;

    generate_user_draft(previous_text, { signal: controller.signal })
      .then((generated) => {
        if (my_generation !== ghostwrite_generation || controller.signal.aborted) return;
        value = generated?.trim() ? generated : previous_text;
      })
      .catch((err) => {
        if (my_generation !== ghostwrite_generation || controller.signal.aborted) return;
        console.error("Ghostwriter failed:", err);
        value = previous_text;
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

  // --- COMPOSER ACTIONS ---
  function adjust_height() {
    if (!textarea) return;
    textarea.style.height = "auto";
    const next_height = Math.min(textarea.scrollHeight, 240);
    textarea.style.height = `${next_height}px`;
    textarea.style.overflowY = textarea.scrollHeight > 240 ? "auto" : "hidden";
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

    try {
      const accepted = await chrono_engine.send(text);
      if (!accepted) value = text;
    } catch (e) {
      console.error("Failed to send message:", e);
      value = text;
    }
  }

  async function drain_pending_queue() {
    if (is_draining || send_blocked || pending.length === 0) return;
    is_draining = true;
    try {
      while (!send_blocked && pending.length > 0) {
        const accepted = await chrono_engine.send(pending[0]);
        if (accepted) pending.shift();
        else break;
      }
    } catch (e) {
      console.error("Failed to drain pending queue:", e);
    } finally {
      is_draining = false;
    }
  }

  function handle_stop() {
    ghostwrite_generation += 1;
    handled_ghostwrite_req = app.ghostwrite_request;
    is_ghostwriting = false;
    try {
      ghostwrite_controller?.abort();
    } catch {
      /* best-effort */
    }
    ghostwrite_controller = null;
    chrono_engine.abort();
  }

  // --- AUDIO & STORY ACTIONS ---
  function unmute_audio() {
    explicitly_muted = false;
    Audio.volume = previous_volume || 1.0;
    Audio.is_muted = false;
  }

  function toggle_mute() {
    if (is_muted) {
      unmute_audio();
    } else {
      previous_volume = Audio.volume;
      explicitly_muted = true;
      Audio.volume = 0;
      Audio.is_muted = true;
      Audio.voice?.stop?.();
    }
  }

  function handle_primary_storyboard_click() {
    if (has_active_story) app.set_view("storymode");
    else if (ready_to_begin && !execution.loading) on_begin();
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
      await stories.update(session.active_id, { is_concluded: 0, conclusion_status: null });
      await session.set_active(session.active_id);
    } catch (err) {
      console.error("[Rewind Error]", err);
    } finally {
      is_rewinding = false;
    }
  }

  async function handle_export_story() {
    if (is_exporting || !session.active_id) return;
    is_exporting = true;
    try {
      const { markdown, filename } = await export_story_record(session.active_id, session.active_story);
      download_text_file(filename, markdown, "text/markdown;charset=utf-8");
    } catch (err) {
      console.error("[Export Error]", err);
    } finally {
      is_exporting = false;
    }
  }

  async function conclude_story(with_epilogue) {
    if (is_ending_story) return;
    is_ending_story = true;
    try {
      app.control_panel_open = false;
      if (with_epilogue) await generate_closing(session.active_id);
      if (session.active_id) {
        await stories.conclude(session.active_id);
        if (!with_epilogue) await chrono_engine.stop?.();
        await app.load_entities();
      }
    } catch (err) {
      console.error("[End Story Error]", err);
    } finally {
      is_ending_story = false;
      show_end_story_modal = false;
    }
  }

  async function hard_reset() {
    await reset_database();
    setTimeout(() => window.location.reload(), 150);
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key !== "Escape" || !panel_open) return;
    if (is_confirming_reset || show_end_story_modal || document.querySelector('[role="alertdialog"], [role="dialog"]')) return;
    app.control_panel_open = false;
  }} />

{#if panel_open}
  <Backdrop layer="console" onclick={() => (app.control_panel_open = false)} />
{/if}

{#snippet settings_gear()}
  <Button
    flank={true}
    variant={panel_open ? "secondary" : "invisible"}
    aria-label="Settings"
    onclick={() => (app.control_panel_open = !app.control_panel_open)}
    actions={[roll, tooltip]}
    class="touch-target-coarse">
    <Icon name="settings" class={["block size-icon-medium transition-transform", panel_open && "rotate-90 opacity-100"]} />
  </Button>
{/snippet}

{#snippet storyboard_bar()}
  {@render settings_gear()}

  {#if !models_ready && !has_active_story}
    <ProgressBar value={embeddings_engine.load_progress} class="flex-1" />
  {:else}
    <Button
      class="group touch-target-coarse flex-1"
      data-ready={ready_to_begin}
      variant="invisible"
      busy={!ready_to_begin || execution.loading}
      disabled={panel_open}
      onclick={handle_primary_storyboard_click}
      actions={[pulse]}>
      <h6
        class={[
          "whitespace-nowrap transition duration-standard",
          ready_to_begin ?
            "text-emerald-green [text-shadow:0_0_0.5rem_color-mix(in_srgb,var(--color-emerald-green)_25%,transparent)] group-hover:scale-105 group-hover:brightness-125"
          : "text-slate-300",
        ]}>
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
    disabled={is_shuffling || execution.loading || panel_open}>
    <Icon name="shuffle" class="block size-icon-medium" />
  </Button>
{/snippet}

{#snippet storymode_bar()}
  <textarea
    bind:this={textarea}
    class="m-0 box-border max-h-60 flex-1 resize-none border-none bg-transparent p-standard type-body text-frisk outline-none placeholder:text-slate-500 disabled:cursor-wait disabled:opacity-30"
    bind:value
    onkeydown={(e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handle_send();
      }
    }}
    oninput={adjust_height}
    placeholder={panel_open ? ""
    : is_ghostwriting ? "Ghostwriting..."
    : "Type a message..."}
    rows="1"
    disabled={panel_open || is_ghostwriting}
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

  {#if execution.busy || execution.stream.active || execution.loading}
    <Button
      variant="invisible"
      disabled={panel_open}
      onclick={handle_stop}
      aria-label="Stop Generation"
      actions={[(node) => roll(node, -1), tooltip]}
      class="touch-target-coarse text-slate-400 transition-colors hover:bg-transparent! hover:text-red-500!">
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

{#snippet control_panel()}
  <div
    class="grid min-h-0 w-full overflow-hidden transition-[grid-template-rows] duration-500 ease-in-out"
    style:grid-template-rows={panel_open ? "1fr" : "0fr"}
    inert={!panel_open}>
    <div
      class={[
        "mx-auto flex min-h-0 w-full flex-col overflow-hidden transition-opacity md:w-[calc(var(--spacing-column-unit)*5-2rem)]",
        panel_open ? "opacity-100 delay-300 duration-200" : "opacity-0 delay-0 duration-150",
      ]}>
      <ScrollArea class="min-h-0 w-full">
        <div class="flex w-full flex-col gap-tight px-tight pb-standard" style:--signature-color="var(--color-frozen)">
          <!-- Deck A: Audio -->
          <Accordion label="Audio" content_class="grid w-full grid-cols-2 items-center gap-standard">
            <Toggle
              label="NOTIFICATIONS"
              bind:value={Audio.notifications_enabled}
              onchange={(enabled) => {
                if (enabled && is_muted) unmute_audio();
              }} />
            <div class="flex min-w-0 flex-wrap items-center gap-tight">
              <Button
                variant="bare"
                onclick={toggle_mute}
                aria-label={is_muted ? "Unmute" : "Mute"}
                actions={[[tooltip, is_muted ? "Unmute" : "Mute"]]}
                class="pointer-events-auto flex h-6 w-10 shrink-0 items-center justify-center rounded-md bg-transparent text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-white focus-visible:outline focus-visible:outline-offset-1 focus-visible:outline-slate-600 active:scale-95">
                <Icon name={is_muted ? "volume_mute" : "volume"} class="size-5" />
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
          </Accordion>

          <!-- Deck B: Storyboard -->
          {#if app.view === "storyboard"}
            <Accordion label="Storyboard" content_class="flex flex-col gap-standard">
              <TextField is_edit={true} placeholder="Optional Prologue Instructions" bind:value={app.prologue} />
            </Accordion>
          {/if}

          <!-- Deck C: Storymode -->
          {#if is_storymode}
            <Accordion label="Storymode" content_class="flex flex-row flex-wrap items-center gap-standard">
              <Button label="Return to Storyboard" variant="primary" size="small" onclick={() => app.set_view("storyboard")} />
              <Button
                label="END STORY"
                variant="danger"
                size="small"
                loading={is_ending_story}
                busy={is_ending_story}
                disabled={is_ending_story || execution.busy}
                onclick={() => (show_end_story_modal = true)} />
            </Accordion>
          {/if}

          <!-- Deck D: Library -->
          <StoryLibrary />

          <!-- Deck E: Advanced -->
          <Accordion label="Advanced" content_class="flex w-full flex-wrap items-center justify-between gap-standard">
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
{/snippet}

<!-- Main Console Chassis -->
<div class="pointer-events-none relative z-sticky flex w-full items-center justify-center">
  <div
    class={[
      "pointer-events-auto z-sticky flex flex-col bg-glass-elevated shadow-2xl shadow-black/50 [backdrop-filter:var(--blur-mist)] transition-[height,min-height,max-height,width,max-width] duration-500 ease-in-out md:max-h-[calc(var(--spacing-row-unit)*9)]",
      panel_open ?
        "absolute bottom-0 w-full justify-end rounded-none p-standard md:w-[calc(var(--spacing-column-unit)*5)] md:rounded-[calc(var(--spacing-row-unit)*0.5)]"
      : [
          "relative h-auto w-full justify-center rounded-none px-standard py-tight md:absolute md:bottom-0 md:min-h-[calc(var(--spacing-row-unit)*0.5)] md:rounded-[calc(var(--spacing-row-unit)*0.5)]",
          has_text && is_storymode ?
            "border-(--signature-color,var(--color-slate-600)) shadow-[0_0_calc(var(--spacing-unit)*4)_color-mix(in_srgb,var(--signature-color,var(--color-slate-600))_30%,transparent)] md:w-[calc(var(--spacing-column-unit)*5)]"
          : "md:w-[max(24rem,calc(var(--spacing-column-unit)*4))]",
        ],
    ]}
    style:--signature-color={is_storymode ? signature_color : undefined}
    style:view-transition-name="unified-console"
    style:width={!panel_open && story_locked ? "fit-content" : null}
    data-testid="unified-console">
    {#if execution.loading || execution.busy || is_ghostwriting}
      <Shimmer />
    {/if}

    {#if panel_open || !story_locked}
      {@render control_panel()}
    {/if}

    <div class={["flex w-full items-center justify-between gap-tight transition-colors duration-300", panel_open && "pt-tight"]}>
      {#if app.view === "storyboard"}
        {@render storyboard_bar()}
      {:else if story_locked}
        <div class="flex w-full flex-col items-center gap-tight">
          <span class={["type-uppercase-label", session.active_story?.conclusion_status === "COLLAPSED" ? "text-rose-400/90" : "text-amber-300/90"]}>
            {session.active_story?.conclusion_status === "COLLAPSED" ? "💀 Story Collapsed" : "✨ Story Concluded"}
          </span>
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
        {@render settings_gear()}
        {@render storymode_bar()}
      {/if}
    </div>
  </div>
</div>

<!-- Modals (mounted at root, never inside accordions) -->
<Dialog
  type="confirm"
  bind:open={is_confirming_reset}
  title="Wipe Data?"
  message="This will permanently delete all stories, characters, and logs. This action cannot be undone."
  confirm_label="Erase All"
  on_confirm={hard_reset} />

<Dialog
  bind:open={show_end_story_modal}
  title="Conclude Active Story"
  message="Would you like to author a final epilogue before concluding, or conclude immediately?"
  busy={is_ending_story}>
  {#snippet footer()}
    <Button variant="primary" onclick={() => conclude_story(true)} label="Generate Epilogue & Conclude" disabled={is_ending_story} />
    <Button variant="danger" onclick={() => conclude_story(false)} label="Conclude Immediately" disabled={is_ending_story} />
  {/snippet}
</Dialog>
