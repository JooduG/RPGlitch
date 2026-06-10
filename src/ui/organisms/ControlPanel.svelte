<script>
  import { db, stories } from "@data";
  import { session_driver } from "@engine";
  import { Audio } from "@media";
  import { app, runtime, simulation_log, simulationState } from "@state";

  import { Button, Modal, ScrollArea, Slider, TextField, Toggle } from "@atoms";
  import { StoryCard, Dialog } from "@molecules";

  /** @typedef {import('@data/repository.js').Story} Story */
  /** @typedef {import('@state/status.svelte.js').AppSettings} AppSettings */
  /** @typedef {'ai' | 'fractal'} MockRole */

  /**
   * @typedef {Object} Props
   * @property {AppSettings} [settings=app.settings]
   * @property {string} [prologue=app.prologue]
   */

  /** @type {Props} */
  let { settings = $bindable(app.settings), prologue = $bindable(app.prologue) } = $props();

  /** @type {any[]} */
  let story_cache = $state([]);
  let is_confirming_reset = $state(false);

  let is_storyboard = $derived(app.view === "storyboard");
  let is_storymode = $derived(app.view === "storymode");

  /** @type {Record<string, string>} */
  const MOCK_CONTENT = {
    fractal: `<think>The simulation layer shifts. Applying high-altitude atmospheric metrics to the local shard.</think>\n\n[[ Cyber London ]] Â· [[ 21:30 ]] Â· [[ Acid Neon ]] \n\nLorem ipsum dolor sit amet, **consectetur** adipiscing elit. *Sed do eiusmod* tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud **exercitation** ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
    ai: `<think>Subject is entering the dead-zone. Adjusting internal optics for low-light tracking.</think>\n\n"Listen, champ," *voice drops to conspiratorial whisper*, "Duis aute irure dolor in **reprehenderit** in voluptate velit esse cillum dolore eu fugiat nulla pariatur."\n\n*Excepteurekar sint occaecat* cupidatat non proident. Sunt in culpa qui officia **deserunt** mollit anim id est laborum.`,
  };

  /**
   * Logs a system action with standard prefix.
   * @param {string} action
   */
  const log_action = (action) => app.log(`Control Panel: ${action}`, "system");

  /**
   * Transitions view and loads the target story into active memory.
   * @param {string|number} id
   */
  async function load_story(id) {
    log_action(`Loading Story [${id}]`);
    await session_driver.set_active(String(id));
    await runtime.sync(String(id));
    await simulation_log.refresh();

    app.set_view("storymode");
    app.toggle_control_panel();
  }

  /**
   * Simulates a progressive streaming typewriter effect for text output.
   * @param {string} text
   */
  async function simulate_stream(text) {
    let buffer = "";
    const words = text.split(" ");

    for (let i = 0; i < words.length; i++) {
      buffer += (i === 0 ? "" : " ") + words[i];
      app.streaming.content = buffer;
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
  }

  /**
   * Generates mock streaming content for local debugging.
   * @param {MockRole} role
   */
  async function run_mock(role) {
    const is_fractal = role === "fractal";
    const entity_name = is_fractal
      ? app.selected_fractal?.name || runtime.active_fractal?.name || "Fractal"
      : app.selected_ai?.name || runtime.active_ai?.name || "AI";

    const content = MOCK_CONTENT[role];

    app.toggle_control_panel();
    simulationState.start_generation(role);

    // Initial logical think-delay
    await new Promise((resolve) => setTimeout(resolve, 2500));

    simulationState.complete();
    app.start_stream("mock-node", role);

    await simulate_stream(content);

    await session_driver.log_turn(content, entity_name, role, { turn_type: "SYSTEM_TURN" });
    app.end_stream();

    log_action(`Mock ${role} transition complete`);
  }

  /**
   * Deletes all local persistent data and reloads the client.
   */
  async function hard_reset() {
    db.close();
    await db.delete();
    setTimeout(() => window.location.reload(), 150);
  }

  // Hydrate story list
  $effect(() => {
    stories.list().then((res) => {
      story_cache = /** @type {Story[]} */ (res);
    });
  });
</script>

<Dialog
  type="confirm"
  bind:open={is_confirming_reset}
  title="Wipe Memories?"
  message="This will permanently delete all stories, characters, and logs. This action cannot be undone."
  confirm_label="Erase All"
  on_confirm={hard_reset}
/>

<Modal variant="standard" on_close={() => app.toggle_control_panel()} data-testid="control-panel">
  <header>
    <div
      class="
      flex
      w-full
      flex-wrap
      items-center
      justify-around
      gap-4
    "
    >
      <Toggle
        label="CALL MODE"
        bind:value={settings.call_mode}
        onchange={() => app.save_settings()}
      />
      <Toggle label="NOTIFICATIONS" bind:value={Audio.notifications_enabled} />
      <Toggle
        label="CHARACTER VOICE"
        bind:value={Audio.voice_enabled}
        onchange={() => {
          if (!Audio.voice_enabled) Audio.voice.stop();
        }}
      />
      <div style="width: calc(var(--column-unit) * 2); min-width: calc(var(--spacing-unit) * 25);">
        <Slider label="VOLUME" bind:value={Audio.volume} min={0} max={1} step={0.1} />
      </div>
    </div>
  </header>

  <div
    class="
    flex
    h-full
    w-full
    flex-col
    justify-center
    gap-4
  "
  >
    {#if is_storyboard}
      <section
        class="
        flex
        w-full
        flex-col
        gap-4
      "
      >
        <TextField
          is_edit={true}
          placeholder="Optional Prologue Instructions like 'Start in media res' or 'Describe the weather first'"
          bind:value={prologue}
        />
      </section>
    {/if}

    {#if is_storymode}
      <section
        class="
        flex
        w-full
        flex-col
        items-center
        gap-4
      "
      >
        <div
          class="
          flex
          w-full
          justify-center
          gap-4
        "
        >
          <Button
            label="GHOSTWRITE"
            variant="primary"
            size="small"
            onclick={() => log_action("Ghostwrite")}
          />
          <Button
            label="PHOTO"
            variant="secondary"
            size="small"
            onclick={() => log_action("Photo")}
          />
        </div>
        <div
          class="
          flex
          w-full
          justify-center
          gap-4
          opacity-30
        "
        >
          <Button
            label="MOCK PROLOGUE"
            variant="invisible"
            size="small"
            onclick={() => run_mock("fractal")}
          />
          <Button
            label="MOCK TURN"
            variant="invisible"
            size="small"
            onclick={() => run_mock("ai")}
          />
        </div>
        <div
          class="
          flex
          w-[80%]
          justify-center
          gap-4
          border-t
          border-white/15
          pt-2
        "
        >
          <Button
            label="END STORY"
            variant="secondary"
            size="small"
            onclick={() => log_action("EndStory")}
          />
        </div>
      </section>
    {/if}

    <section
      class="
      flex
      w-full
      flex-col
      gap-4
    "
    >
      {#if story_cache.length > 0}
        <ScrollArea style="max-height: var(--dropdown-max-height);">
          <div
            class="
            flex
            flex-col
            gap-2
          "
          >
            {#each story_cache as story (story.id)}
              <StoryCard
                {story}
                active={runtime.story_id === String(story.id)}
                onclick={() => load_story(story.id)}
              />
            {/each}
          </div>
        </ScrollArea>
      {:else}
        <p
          class="
            m-0
            min-h-(--row-unit)
            content-center
            rounded-md
            bg-black/15
            text-center
            text-sm
            text-slate-600
            italic
            backdrop-blur-sm
          "
        >
          No stories yet..
        </p>
      {/if}
    </section>
  </div>

  <footer>
    <div
      class="
      flex
      w-full
      items-center
      justify-between
      gap-4
    "
    >
      <div
        class="
        flex
        w-full
        flex-wrap
        items-center
        justify-around
        gap-4
      "
      >
        <Toggle
          label="DEVMODE"
          bind:value={settings.dev_mode}
          onchange={() => app.save_settings()}
        />
        <Toggle
          label="GRID"
          bind:value={settings.dev_grid_visible}
          onchange={() => app.save_settings()}
        />
        <Button
          variant="danger"
          size="medium"
          onclick={() => (is_confirming_reset = true)}
          title="Wipe Memories"
        >
          <svg
            class="
              size-(--icon-medium)
              fill-none
              stroke-current
              stroke-2
              [stroke-linecap:round]
              [stroke-linejoin:round]
            "
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-2 2-2 2H7c0 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </Button>
      </div>
    </div>
  </footer>
</Modal>
