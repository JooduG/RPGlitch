<script>
  /**
   * @file UnifiedConsole.svelte
   * 🎛️ THE SOVEREIGN CORE CONSOLE
   * Polymorphic command control system merging GlassPill, StoryboardPill, ControlPanel, and InputBar.
   * Standard: Ultra-Lean DOM
   */
  import { tick } from "svelte";
  import { click_outside } from "@actions";
  import { Backdrop, Button, Dropdown, ScrollArea, Slider, TextField, Toggle, tooltip } from "@atoms";
  import { db, stories, NARRATIVE_STYLES } from "@data";
  import { Chrono, session_driver } from "@engine";
  import { gamemaster } from "@intelligence";
  import { Audio, get_signature_color, visual_engine } from "@media";
  import { Dialog, ImportEntity, StoryCard } from "@molecules";
  import { motion, pulse, roll, shimmy, stab } from "@motion";
  import { llm_service } from "@platform";
  import { app, runtime, simulationState, simulation_log } from "@state";
  import { pickRandom } from "@utils";

  // --- CORE VIEW ENGINE STATE ---
  let ready_to_begin = $derived(app.is_ready);
  let label_text = $derived(ready_to_begin ? "BEGIN STORY" : `SELECT ENTITIES (${app.selected_count}/3)`);

  // --- STORYMODE CONSOLE STATE ---
  let value = $state("");
  let is_focused = $state(false);
  /** @type {HTMLTextAreaElement | undefined} */
  let textarea = $state();

  let is_locked = $derived(simulationState.busy);
  let signature_color = $derived(get_signature_color(runtime.active_user || app.selected_user, "var(--color-gunmetal)"));

  // --- CONTROL PANEL STATE ---
  let is_confirming_reset = $state(false);
  /** @type {any[]} */
  let story_cache = $state([]);

  // --- ACCORDION SECTIONS STATE ---
  let open_sections = $state({
    audio: false,
    storyboard: false,
    storymode: false,
    library: false,
    style: false,
    advanced: false,
  });

  const author_options = Object.values(NARRATIVE_STYLES)
    .sort((a, b) => {
      if (a.id === "default") return -1;
      if (b.id === "default") return 1;
      return a.name.localeCompare(b.name);
    })
    .map((style) => ({
      value: style.id,
      label: style.name,
      tag: style.tags ? style.tags.join(", ") : "",
    }));

  // --- MUTE STATE ---
  let previous_volume = $state(1.0);
  let explicitly_muted = $state(false);
  let is_muted = $derived(Audio.volume === 0 || explicitly_muted);

  function toggle_mute() {
    if (explicitly_muted || Audio.volume === 0) {
      explicitly_muted = false;
      Audio.volume = previous_volume || 1.0;
    } else {
      previous_volume = Audio.volume;
      explicitly_muted = true;
      Audio.volume = 0;
      Audio.voice.stop();
    }
  }

  const log_action = (action) => app.log(`Control Panel: ${action}`, "system");

  async function load_story(id) {
    log_action(`Loading Story [${id}]`);
    await session_driver.set_active(String(id));
    await runtime.sync(String(id));
    await simulation_log.refresh();
    app.set_view("storymode");
    app.toggle_control_panel();
  }

  async function run_mock(role) {
    const is_fractal = role === "fractal";
    const entity_name = is_fractal
      ? app.selected_fractal?.name || runtime.active_fractal?.name || "Fractal"
      : app.selected_ai?.name || runtime.active_ai?.name || "AI";

    const content = llm_service.get_mock_message();

    app.toggle_control_panel();
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

    await session_driver.log_message(content, role, entity_name, "SYSTEM_TURN");
    app.end_stream();
    log_action(`Mock ${role} transition complete`);
  }

  async function hard_reset() {
    db.close();
    await db.delete();
    setTimeout(() => window.location.reload(), 150);
  }

  async function refresh_stories() {
    story_cache = await stories.list();
  }

  $effect(() => {
    if (app.control_panel_open) {
      refresh_stories();
    }
  });

  let show_import_modal = $state(false);

  // --- STORYBOARD NARRATIVE ORCHESTRATION ---
  const storyboard = {
    async shuffle() {
      if (!app.ai_list.length) {
        await app.load_entities();
      }
      if (!app.ai_list.length) return;

      app.selected_ai = pickRandom(Array.isArray(app.ai_list) ? app.ai_list : []);
      let available_users = app.user_list;
      if (app.selected_ai && Array.isArray(app.user_list)) {
        available_users = app.user_list.filter((u) => u.id !== app.selected_ai.id);
      }

      if (available_users.length) {
        app.selected_user = pickRandom(available_users);
      } else if (app.user_list.length) {
        app.user_list = app.user_list[0];
      }

      if (Array.isArray(app.fractal_list) && app.fractal_list.length) {
        app.selected_fractal = pickRandom(Array.isArray(app.fractal_list) ? app.fractal_list : []);
      }

      if (typeof app.reroll_title === "function") {
        app.reroll_title();
      }
    },
    async begin() {
      if (app.settings.dev_mode) {
        app.log("Lobby Bypass Triggered (DEV_MODE)", "system");
        const selection = {
          ai: app.selected_ai || { id: "dev_ai", name: "Dev AI" },
          user: app.selected_user || { id: "dev_user", name: "Dev User" },
          fractal: app.selected_fractal || { id: "dev_fractal", name: "Dev Fractal" },
        };
        motion.intensity = 0.4;
        await Chrono.start(selection);
        refresh_stories();
        return;
      }
      if (!app.selected_ai || !app.selected_user || !app.selected_fractal) return;
      motion.intensity = 0.4;
      await Chrono.start({
        ai: app.selected_ai,
        user: app.selected_user,
        fractal: app.selected_fractal,
      });
      refresh_stories(); // Ensure list is instantly updated right after creation
    },
  };

  function adjust_height() {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  async function handle_send() {
    const text = value.trim();
    if (!text || is_locked) return;

    value = "";

    // Wait for Svelte to flush the empty value to the DOM before measuring
    await tick();
    adjust_height();

    try {
      await Chrono.send(text);
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  }

  function handle_keydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handle_send();
    }
  }

  function handle_window_keydown(e) {
    if (e.key === "Escape" && app.control_panel_open) {
      e.preventDefault();
      app.control_panel_open = false;
    }
  }

  $effect(() => {
    if (app.view === "storymode" && textarea && !app.control_panel_open) {
      textarea.focus();
    }
  });
</script>

<svelte:window onkeydown={handle_window_keydown} />

<Dialog
  type="confirm"
  bind:open={is_confirming_reset}
  title="Wipe Data?"
  message="This will permanently delete all stories, characters, and logs. This action cannot be undone."
  confirm_label="Erase All"
  on_confirm={hard_reset}
/>

<div class="relative flex h-full w-full justify-center {app.control_panel_open ? 'z-50' : 'z-10'}">
  {#if app.control_panel_open}
    <Backdrop z_index="40" is_blurred={true} onclick={() => (app.control_panel_open = false)} />
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
      pointer-events-auto absolute bottom-0
      z-50
      flex flex-col
      items-center
      {app.control_panel_open ? 'justify-end' : 'justify-center'}
      bg-glass-elevated
      shadow-2xl
      shadow-black/50 [backdrop-filter:var(--blur-mist)]
      transition-all
      duration-500
      ease-in-out
      md:max-h-[calc(var(--spacing-row-unit)*9)]

      {app.control_panel_open
      ? 'w-full rounded-none p-4 md:w-[calc(var(--spacing-column-unit)*6)] md:rounded-[calc(var(--spacing-row-unit)*0.5)]'
      : 'h-full w-full rounded-none px-4 py-2 md:h-auto md:min-h-[calc(var(--spacing-row-unit)*0.5)] md:rounded-[calc(var(--spacing-row-unit)*0.5)]'}
    {!app.control_panel_open && is_focused && app.view === 'storymode'
      ? `
      border-(--signature-color,var(--color-slate-600))
      shadow-[0_0_calc(var(--spacing-spacing-unit)*4)_color-mix(in_srgb,var(--signature-color,var(--color-slate-600))_30%,transparent)]
      md:w-[calc(var(--spacing-column-unit)*6)]
    `
      : !app.control_panel_open
        ? 'md:w-[max(24rem,calc(var(--spacing-column-unit)*4))]'
        : ''}
  "
    style:--signature-color={app.view === "storymode" ? signature_color : undefined}
    data-testid="unified-console"
  >
    <!-- ACCORDION SETTINGS (VERTICAL EXPANSION) -->
    <div
      class="grid min-h-0 w-full transition-[grid-template-rows] duration-500 ease-in-out {app.control_panel_open
        ? 'mt-2 grid-rows-[1fr]'
        : 'grid-rows-[0fr]'}"
    >
      <div class="flex min-h-0 w-full flex-col overflow-hidden">
        <div
          class="mx-auto flex min-h-0 w-full flex-col gap-4 py-2 pb-4 opacity-0 transition-opacity md:w-[calc(var(--spacing-column-unit)*6-2rem)] {app.control_panel_open
            ? 'opacity-100 delay-300 duration-200'
            : 'delay-0 duration-150'}"
        >
          <ScrollArea class="min-h-0 w-full">
            <div class="flex w-full flex-col gap-2 px-2" style="--signature-color: var(--color-frozen);">
              <!-- DECK A: AUDIO -->
              <div class="w-full">
                <button
                  type="button"
                  onclick={() => (open_sections.audio = !open_sections.audio)}
                  class="group flex w-full items-center justify-between py-2 text-left text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-white"
                >
                  Audio
                  <span class="opacity-50 transition-transform {open_sections.audio ? 'rotate-180' : ''}">▼</span>
                </button>
                <div
                  class="grid transition-[grid-template-rows] duration-300 ease-in-out {open_sections.audio ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}"
                >
                  <div class="min-h-0 overflow-hidden">
                    <div class="grid grid-cols-1 gap-x-6 gap-y-4 pt-2 pb-4 sm:grid-cols-2">
                      <Toggle label="USER PERSONA MICROPHONE" bind:value={app.settings.call_mode} onchange={() => app.save_settings()} />
                      <Toggle label="NOTIFICATIONS" bind:value={Audio.notifications_enabled} />
                      <Toggle
                        label="AI CHARACTER VOICE"
                        bind:value={Audio.voice_enabled}
                        onchange={() => {
                          if (!Audio.voice_enabled) Audio.voice.stop();
                        }}
                      />
                      <div class="flex w-full items-center gap-4">
                        <button
                          type="button"
                          onclick={toggle_mute}
                          aria-label={is_muted ? "Unmute" : "Mute"}
                          use:tooltip={is_muted ? "Unmute" : "Mute"}
                          class="
                            pointer-events-auto
                            flex h-6 w-10
                            shrink-0 items-center justify-center
                            rounded-md
                            bg-transparent
                            text-slate-400 transition-colors
                            duration-300 hover:text-white
                            focus-visible:outline focus-visible:outline-offset-1 focus-visible:outline-slate-600
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
                                d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18.01,19.86 21,16.28 21,12C21,7.72 18.01,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16.03C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z"
                              />
                            </svg>
                          {/if}
                        </button>
                        <Slider
                          horizontal
                          label=""
                          bind:value={Audio.volume}
                          min={0}
                          max={1}
                          step={0.1}
                          neutral={0}
                          format={(v) => Math.round(v * 100) + "%"}
                          disabled={explicitly_muted}
                          disabled_label="MUTED"
                          show_value_tooltip={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- DECK F: NARRATIVE STYLE -->
              <div class="w-full">
                <button
                  type="button"
                  onclick={() => (open_sections.style = !open_sections.style)}
                  class="group flex w-full items-center justify-between py-2 text-left text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-white"
                >
                  Narrative Style
                  <span class="opacity-50 transition-transform {open_sections.style ? 'rotate-180' : ''}">▼</span>
                </button>
                <div
                  class="grid transition-[grid-template-rows] duration-300 ease-in-out {open_sections.style ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}"
                >
                  <div class="min-h-0 overflow-hidden">
                    <div class="flex flex-col gap-4 pt-2 pb-4">
                      <Dropdown
                        bind:value={app.settings.narrative_style}
                        items={author_options}
                        onchange={() => app.save_settings()}
                        label="Select Writing Style"
                        uppercase={false}
                        matchWidth={true}
                        dropdownHeight="max-h-80"
                      />
                      {#if app.settings.narrative_style && app.settings.narrative_style !== "default"}
                        <div class="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/30 p-3">
                          <span class="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            {NARRATIVE_STYLES[app.settings.narrative_style]?.name} Prompt Profile
                          </span>
                          <p class="m-0 text-xs leading-relaxed text-slate-300 italic">
                            {NARRATIVE_STYLES[app.settings.narrative_style]?.description}
                          </p>
                          <textarea
                            readonly
                            class="h-32 w-full resize-y rounded-lg border border-white/5 bg-black/40 p-2 font-mono text-[10px] text-slate-400 focus:outline-none"
                            value={NARRATIVE_STYLES[app.settings.narrative_style]?.narrative_engine}
                          ></textarea>
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>

              <!-- DECK B: STORYBOARD (Contextual) -->
              {#if app.view === "storyboard"}
                <div class="w-full">
                  <button
                    type="button"
                    onclick={() => (open_sections.storyboard = !open_sections.storyboard)}
                    class="group flex w-full items-center justify-between py-2 text-left text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-white"
                  >
                    Storyboard
                    <span class="opacity-50 transition-transform {open_sections.storyboard ? 'rotate-180' : ''}">▼</span>
                  </button>
                  <div
                    class="grid transition-[grid-template-rows] duration-300 ease-in-out {open_sections.storyboard
                      ? 'grid-rows-[1fr]'
                      : 'grid-rows-[0fr]'}"
                  >
                    <div class="min-h-0 overflow-hidden">
                      <div class="flex flex-col gap-6 pt-2 pb-4">
                        <div class="w-full">
                          <TextField is_edit={true} placeholder="Optional Prologue Instructions" bind:value={app.prologue} />
                        </div>

                        <div class="flex flex-col gap-2">
                          <div class="flex flex-wrap gap-2">
                            <Button variant="primary" size="small" disabled={simulationState.busy} onclick={() => (show_import_modal = true)}>
                              <svg
                                viewBox="0 0 24 24"
                                class="size-3.5 fill-none stroke-current stroke-2"
                                style="stroke-linecap: round; stroke-linejoin: round;"
                              >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                              <span class="text-xs font-bold tracking-widest uppercase">Import</span>
                            </Button>
                          </div>
                          {#if simulationState.busy}
                            <span class="mt-1 animate-pulse font-mono text-[10px] tracking-widest text-white uppercase">Importing...</span>
                          {/if}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              {/if}

              <!-- DECK C: STORYMODE (Contextual) -->
              {#if app.view === "storymode"}
                <div class="w-full">
                  <button
                    type="button"
                    onclick={() => (open_sections.storymode = !open_sections.storymode)}
                    class="group flex w-full items-center justify-between py-2 text-left text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-white"
                  >
                    Storymode
                    <span class="opacity-50 transition-transform {open_sections.storymode ? 'rotate-180' : ''}">▼</span>
                  </button>
                  <div
                    class="grid transition-[grid-template-rows] duration-300 ease-in-out {open_sections.storymode
                      ? 'grid-rows-[1fr]'
                      : 'grid-rows-[0fr]'}"
                  >
                    <div class="min-h-0 overflow-hidden">
                      <div class="flex flex-row flex-wrap items-center gap-4 pt-2 pb-4">
                        <Button
                          label="PHOTO"
                          variant="secondary"
                          size="small"
                          loading={visual_engine.isLoading}
                          disabled={visual_engine.isLoading || is_locked}
                          onclick={async () => {
                            try {
                              // Directly set role for guaranteed reactivity before triggering phase change
                              simulationState.role = "ai";
                              simulationState.start_generation("ai");

                              const result = await visual_engine.visualize(
                                runtime.story_id,
                                app.prologue || "Taking an outstretched phone selfie portrait capturing the moment",
                                "selfie",
                              );

                              if (result?.imageUrl) {
                                const entity = runtime.active_ai || app.selected_ai;
                                const entity_name = entity?.name || "AI";
                                const caption = result.caption || "Here, caught this moment for you.";
                                await session_driver.log_message(caption, "ai", entity_name, "AI_TURN", {}, [
                                  {
                                    src: result.imageUrl,
                                    metadata: {
                                      ...result.metadata,
                                      prompt: result.refinedPrompt,
                                    },
                                  },
                                ]);
                              } else {
                                console.warn("[PHOTO] No imageUrl returned");
                              }
                            } catch (err) {
                              console.error("[PHOTO ERROR]", err);
                            } finally {
                              simulationState.complete();
                            }
                          }}
                        />
                        <Button label="MOCK PROLOGUE" variant="invisible" size="small" class="opacity-30" onclick={() => run_mock("fractal")} />
                        <Button label="MOCK TURN" variant="invisible" size="small" class="opacity-30" onclick={() => run_mock("ai")} />

                        <Button label="STORYBOARD" variant="secondary" size="small" onclick={() => app.set_view("storyboard")} />

                        <Button
                          label="END STORY"
                          variant="danger"
                          size="small"
                          class="ml-auto"
                          onclick={() => gamemaster.execute_epilogue(runtime.story_id)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              {/if}

              <!-- DECK D: LIBRARY (Always available) -->
              <div class="w-full">
                <button
                  type="button"
                  onclick={() => (open_sections.library = !open_sections.library)}
                  class="group flex w-full items-center justify-between py-2 text-left text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-white"
                >
                  Library
                  <span class="opacity-50 transition-transform {open_sections.library ? 'rotate-180' : ''}">▼</span>
                </button>
                <div
                  class="grid transition-[grid-template-rows] duration-300 ease-in-out {open_sections.library
                    ? 'grid-rows-[1fr]'
                    : 'grid-rows-[0fr]'}"
                >
                  <div class="min-h-0 overflow-hidden">
                    <div class="flex flex-col gap-4 pt-2 pb-4">
                      {#if story_cache.length > 0}
                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {#each story_cache as story (story.id)}
                            <StoryCard {story} active={runtime.story_id === String(story.id)} onclick={() => load_story(story.id)} />
                          {/each}
                        </div>
                      {:else}
                        <p class="m-0 py-4 text-center text-sm text-slate-500 italic">No stories yet..</p>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>

              <!-- DECK E: ADVANCED -->
              <div class="w-full">
                <button
                  type="button"
                  onclick={() => (open_sections.advanced = !open_sections.advanced)}
                  class="group flex w-full items-center justify-between py-2 text-left text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-white"
                >
                  Advanced
                  <span class="opacity-50 transition-transform {open_sections.advanced ? 'rotate-180' : ''}">▼</span>
                </button>
                <div
                  class="grid transition-[grid-template-rows] duration-300 ease-in-out {open_sections.advanced
                    ? 'grid-rows-[1fr]'
                    : 'grid-rows-[0fr]'}"
                >
                  <div class="min-h-0 overflow-hidden">
                    <div class="grid grid-cols-1 gap-x-6 gap-y-4 pt-2 pb-4 sm:grid-cols-2">
                      <Toggle label="DEVMODE" bind:value={app.settings.dev_mode} onchange={() => app.save_settings()} />
                      <Toggle label="GRID OVERLAYS" bind:value={app.settings.dev_grid_visible} onchange={() => app.save_settings()} />
                      <div class="mt-2 flex w-full justify-center pt-4 sm:col-span-2">
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
          style="view-transition-name: console-settings-node"
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

        <Button
          class="group touch-target-coarse"
          data-ready={ready_to_begin}
          variant="invisible"
          busy={!ready_to_begin}
          disabled={app.control_panel_open}
          onclick={storyboard.begin}
          actions={[pulse]}
          style="view-transition-name: console-center-axis"
        >
          <h6
            class="m-0 tracking-widest transition-all duration-300 {ready_to_begin
              ? 'group-hover:scale-105 group-hover:brightness-125'
              : 'text-slate-400 opacity-80'}"
            style={ready_to_begin
              ? "color: var(--color-emerald-green); text-shadow: 0 0 0.5rem color-mix(in srgb, var(--color-emerald-green) 25%, transparent);"
              : undefined}
          >
            {label_text}
          </h6>
        </Button>

        <Button
          flank={true}
          variant="invisible"
          aria-label="Shuffle Entities"
          disabled={app.control_panel_open}
          onclick={() => storyboard.shuffle()}
          actions={[shimmy, tooltip]}
          class="touch-target-coarse"
          style="view-transition-name: console-right-flank"
        >
          <svg viewBox="0 0 24 24" class="block size-icon-medium">
            <path
              fill="currentColor"
              d="M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z"
            />
          </svg>
        </Button>
      {:else}
        <Button
          flank={true}
          variant={app.control_panel_open ? "secondary" : "invisible"}
          onclick={() => app.toggle_control_panel()}
          aria-label="Settings"
          actions={[roll, tooltip]}
          class="touch-target-coarse"
          style="view-transition-name: console-settings-node"
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

        <textarea
          bind:this={textarea}
          class="
          max-h-32
          flex-1
          resize-none
          overflow-y-hidden
          border-none
          bg-transparent
          p-2
          text-base
          text-inherit
          outline-none
          placeholder:text-slate-600
          placeholder:opacity-15
          disabled:cursor-wait
          disabled:opacity-30
        "
          bind:value
          onkeydown={handle_keydown}
          oninput={adjust_height}
          onfocus={() => (is_focused = true)}
          onblur={() => (is_focused = false)}
          placeholder="Type a message..."
          rows="1"
          disabled={app.control_panel_open}
          aria-label="Input message"
          style="view-transition-name: console-center-axis"
        ></textarea>

        {#if app.streaming.active}
          <Button
            variant="invisible"
            disabled={app.control_panel_open}
            onclick={() => app.trigger_interrupt()}
            aria-label="Interrupt Generation"
            actions={[tooltip]}
            class="touch-target-coarse text-slate-500 transition-colors hover:bg-transparent! hover:text-red-500!"
            style="view-transition-name: console-right-flank"
          >
            <svg class="block size-icon-medium" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" />
            </svg>
          </Button>
        {:else}
          <Button
            variant="invisible"
            onclick={handle_send}
            disabled={!value.trim() || is_locked || app.control_panel_open}
            aria-label="Send Message"
            actions={[stab, tooltip]}
            class="touch-target-coarse"
            style="view-transition-name: console-right-flank"
          >
            <svg class="block size-icon-medium" viewBox="0 0 24 24">
              <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </Button>
        {/if}
      {/if}
    </div>
    <ImportEntity bind:open={show_import_modal} />
  </div>
</div>
