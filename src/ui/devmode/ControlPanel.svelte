<script>
  import { session_driver } from "@core/engine/session-driver.svelte.js";
  import { db } from "@data/db.js";
  import { stories } from "@data/repository.js";
  import { app } from "@state/app.svelte.js";
  import { runtime } from "@state/runtime.svelte.js";
  import { simulation_log } from "@state/simulation-log.svelte.js";
  import { simulationState } from "@state/status.svelte.js";

  import Button from "@atoms/Button.svelte";
  import Dialog from "@atoms/Dialog.svelte";
  import Modal from "@atoms/Modal.svelte";
  import TextField from "@atoms/TextField.svelte";
  import Toggle from "@atoms/Toggle.svelte";
  import StoryCard from "./StoryCard.svelte";

  /** @typedef {import('@data/repository.js').Story} Story */
  /** @typedef {import('@state/control.svelte.js').AppSettings} AppSettings */
  /** @typedef {'ai' | 'fractal'} MockRole */

  /**
   * @typedef {Object} Props
   * @property {AppSettings} [settings=app.settings]
   * @property {string} [prologue=app.prologue]
   */

  /** @type {Props} */
  let { settings = $bindable(app.settings), prologue = $bindable(app.prologue) } = $props();

  /** @type {Story[]} */
  let story_cache = $state([]);
  let is_confirming_reset = $state(false);

  let is_storyboard = $derived(app.view === "storyboard");
  let is_storymode = $derived(app.view === "storymode");

  const MOCK_CONTENT = {
    fractal: `<think>The simulation layer shifts. Applying high-altitude atmospheric metrics to the local shard.</think>\n\n[[ Cyber London ]] · [[ 21:30 ]] · [[ Acid Neon ]] \n\nLorem ipsum dolor sit amet, **consectetur** adipiscing elit. *Sed do eiusmod* tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud **exercitation** ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
    ai: `<think>Subject is entering the dead-zone. Adjusting internal optics for low-light tracking.</think>\n\n"Listen, champ," *voice drops to conspiratorial whisper*, "Duis aute irure dolor in **reprehenderit** in voluptate velit esse cillum dolore eu fugiat nulla pariatur."\n\n*Excepteurীকার sint occaecat* cupidatat non proident. Sunt in culpa qui officia **deserunt** mollit anim id est laborum.`,
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
      ? runtime.active_fractal?.name || "Fractal"
      : runtime.active_ai?.name || "AI";

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
  <!-- Top-Level Settings -->
  <header class="header">
    <div class="settings-group">
      <Toggle
        label="CALL MODE"
        bind:value={settings.call_mode}
        onchange={() => app.save_settings()}
      />
      <Toggle label="SOUND" bind:value={settings.sound} onchange={() => app.save_settings()} />
    </div>
  </header>

  <div class="content-body">
    <!-- Contextual Body Blocks -->
    {#if is_storyboard}
      <section class="section">
        <TextField
          class="text-area"
          is_edit={true}
          placeholder="Optional Prologue Instructions like 'Start in media res' or 'Describe the weather first'"
          bind:value={prologue}
        />
      </section>
    {/if}

    {#if is_storymode}
      <section class="section actions">
        <div class="action-row">
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
        <div class="action-row secondary">
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
        <div class="action-row danger-zone">
          <Button
            label="END STORY"
            variant="secondary"
            size="small"
            onclick={() => log_action("EndStory")}
          />
        </div>
      </section>
    {/if}

    <!-- Stories Listing -->
    <section class="section">
      {#if story_cache.length > 0}
        <div class="list scrollbar">
          {#each story_cache as story (story.id)}
            <StoryCard {story} onclick={() => load_story(story.id)} />
          {/each}
        </div>
      {:else}
        <p class="status">No stories yet..</p>
      {/if}
    </section>
  </div>

  <!-- Dangerous / Admin Actions -->
  <footer class="footer">
    <div class="admin-bar">
      <div class="settings-group">
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
            class="icon-medium icon-outline"
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

<style>
  .settings-group {
    width: 100%;
    align-items: center;
    display: flex;
    justify-content: space-between;
  }

  .content-body {
    display: flex;
    flex-direction: column;
    gap: var(--gap-standard);
    width: 100%;
    height: 100%;
    justify-content: center;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--gap-standard);
    width: 100%;
  }

  .actions {
    align-items: center;
    gap: var(--gap-standard);
  }

  .action-row {
    display: flex;
    justify-content: center;
    gap: var(--gap-standard);
    width: 100%;
  }

  .action-row.secondary {
    opacity: var(--opacity-whisper);
  }

  .action-row.danger-zone {
    padding-top: var(--padding-tight);
    border-top: var(--border-whisper);
    width: 80%;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--gap-tight);
    max-height: var(--dropdown-max-height);
    overflow-y: auto;
    padding-right: var(--padding-tight);
  }

  .status {
    color: var(--frozen);
    font-size: var(--font-size-small);
    font-style: italic;
    text-align: center;
    align-content: center;
    margin: 0;
    background: var(--glass-sunken);
    backdrop-filter: var(--blur-whisper);
    border-radius: var(--radius-standard);
    min-height: var(--row-unit);
  }

  .admin-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--gap-standard);
    width: 100%;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.6;
    }
  }

  .icon-outline {
    fill: none;
    stroke: currentcolor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
