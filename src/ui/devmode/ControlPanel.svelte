<script>
  import { db } from "@data/db.js";
  import { stories } from "@data/repository.js";
  import { app } from "@state/app.svelte.js";
  import { runtime } from "@state/runtime.svelte.js";
  import { session_driver } from "@core/engine/session-driver.svelte.js";
  import Button from "@atoms/Button.svelte";
  import Toggle from "@atoms/Toggle.svelte";
  import Modal from "@atoms/Modal.svelte";
  import TextField from "@atoms/TextField.svelte";
  import Dialog from "@atoms/Dialog.svelte";
  import StoryCard from "./StoryCard.svelte";
  import { simulation_log } from "@state/simulation-log.svelte.js";
  import { simulationState } from "@state/status.svelte.js";

  /** @typedef {import('@data/repository.js').Story} Story */
  /** @typedef {import('@state/control.svelte.js').AppSettings} AppSettings */
  /** @typedef {'ai' | 'fractal'} MockRole */

  /**
   * @typedef {Object} Props
   * @property {AppSettings} [settings=app.settings] - Explicit settings object for the panel.
   * @property {string} [prologue=app.prologue] - Narrative prologue text.
   */

  /** @type {Props} */
  let { settings = $bindable(app.settings), prologue = $bindable(app.prologue) } = $props();

  /**
   * Main system interface for settings and prologue configuration.
   * [070] - Implemented strict Prop interfaces and type tightening.
   */

  /**
   * @param {string} action
   */
  function handleAction(action) {
    app.log(`Control Panel: ${action}`, "system");
  }

  /** @type {Story[]} */
  let stories_list = $state([]);

  $effect(() => {
    stories.list().then((res) => {
      stories_list = /** @type {Story[]} */ (res);
    });
  });

  /**
   * @param {string|number} id
   */
  async function loadStory(id) {
    handleAction("LoadStory: " + id);
    await session_driver.set_active(String(id));
    await runtime.sync(String(id));
    await simulation_log.refresh();
    app.set_view("storymode");
    app.toggle_control_panel();
  }

  /**
   * @param {MockRole} role
   */
  async function mock_generation(role) {
    const is_fractal = role === "fractal";
    const name = is_fractal
      ? runtime.active_fractal?.name || "Fractal"
      : runtime.active_ai?.name || "AI";

    const dummyText = is_fractal
      ? `<think>The simulation layer shifts. Applying high-altitude atmospheric metrics to the local shard.</think>\n\n[[ Cyber London ]] · [[ 21:30 ]] · [[ Acid Neon ]] \n\nLorem ipsum dolor sit amet, **consectetur** adipiscing elit. *Sed do eiusmod* tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud **exercitation** ullamco laboris nisi ut aliquip ex ea commodo consequat.`
      : `<think>Subject is entering the dead-zone. Adjusting internal optics for low-light tracking.</think>\n\n"Listen, champ," *voice drops to conspiratorial whisper*, "Duis aute irure dolor in **reprehenderit** in voluptate velit esse cillum dolore eu fugiat nulla pariatur."\n\n*Excepteur sint occaecat* cupidatat non proident. Sunt in culpa qui officia **deserunt** mollit anim id est laborum.`;

    // 1. Enter thinking state
    app.toggle_control_panel(); // Close panel to see the animation
    simulationState.start_generation(role);

    // Simulate AI thinking time to show animation
    await new Promise((r) => setTimeout(r, 2500));

    // 2. Transition to streaming
    simulationState.complete(); // Stop "thinking" indicator
    app.start_stream("mock-node", role);

    // 2. Stream in content
    let current = "";
    const words = dummyText.split(" ");
    for (let i = 0; i < words.length; i++) {
      current += (i === 0 ? "" : " ") + words[i];
      app.streaming.content = current;
      await new Promise((r) => setTimeout(r, 60));
    }

    // 3. Push to log, then end stream
    await session_driver.log_turn(dummyText, name, role, { turn_type: "SYSTEM_TURN" });
    app.end_stream();

    app.log(`Mock ${role} turn complete.`, "system");
  }

  let show_reset_confirm = $state(false);

  /**
   *
   */
  async function executeReset() {
    db.close();
    await db.delete();
    setTimeout(() => window.location.reload(), 150);
  }

  /* --- STATE HELPERS --- */
  let isStoryboard = $derived(app.view === "storyboard");
  let isStoryMode = $derived(app.view === "storymode");
</script>

<Dialog
  type="confirm"
  bind:open={show_reset_confirm}
  title="Wipe Memories?"
  message="This will permanently delete all stories, characters, and logs. This action cannot be undone."
  confirm_label="Erase All"
  on_confirm={executeReset}
/>

<Modal variant="standard" on_close={() => app.toggle_control_panel()}>
  <article class="control-panel-wrapper" data-testid="control-panel">
    <!-- HEADER: System Toggles -->
    <header>
      <Toggle
        label="CALL MODE"
        bind:value={settings.call_mode}
        onchange={() => app.save_settings()}
      />
      <Toggle
        label="NOTIFICATIONS"
        bind:value={settings.sound}
        onchange={() => app.save_settings()}
      />
    </header>

    <!-- BODY: Prologue (Lobby Only) -->
    {#if isStoryboard}
      <div class="storyboard">
        <TextField
          class="text-area custom-field"
          is_edit={true}
          placeholder="(Optional) e.g., 'Start in media res', 'Describe the weather first'"
          bind:value={prologue}
        />
      </div>
    {/if}

    <!-- BODY: Actions (Story Mode Only) -->
    {#if isStoryMode}
      <div class="storymode">
        <Button
          label="GHOSTWRITE"
          variant="primary"
          size="sm"
          onclick={() => handleAction("Ghostwrite")}
        />
        <Button label="PHOTO" variant="secondary" size="sm" onclick={() => handleAction("Photo")} />

        <!-- DEBUG MOCKS -->
        <Button
          label="MOCK: PROLOGUE"
          variant="invisible"
          size="sm"
          onclick={() => mock_generation("fractal")}
        />
        <Button
          label="MOCK: AI TURN"
          variant="invisible"
          size="sm"
          onclick={() => mock_generation("ai")}
        />

        <Button
          label="END STORY"
          variant="secondary"
          size="sm"
          onclick={() => handleAction("EndStory")}
        />
      </div>
    {/if}

    <footer>
      <div class="stories-section">
        <h3 class="stories-headline">STORIES</h3>
        {#if stories_list && stories_list.length > 0}
          <div class="stories-list">
            {#each stories_list as story (story.id)}
              <StoryCard {story} onclick={() => loadStory(story.id)} />
            {/each}
          </div>
        {:else}
          <p class="no-stories">No stories found in the archives.</p>
        {/if}
      </div>

      <div class="dev-row">
        <Toggle
          label="DevMode"
          bind:value={settings.dev_mode}
          onchange={() => app.save_settings()}
        />
        <Button variant="danger" size="sm" onclick={() => (show_reset_confirm = true)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-2 2-2 2H7c0 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
          <span>RESET DATA</span>
        </Button>
      </div>
    </footer>
  </article>
</Modal>

<style>
  .control-panel-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-s);
  }

  .storymode {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-s);
    justify-content: center;
  }

  footer {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }

  .stories-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    width: 100%;
  }

  .stories-headline {
    font-size: var(--font-size-small);
    color: var(--font-color-m);
    text-align: center;
    letter-spacing: var(--letter-spacing-m);
    margin: 0 0 var(--spacing-xs);
    border-bottom: var(--spacing-px) solid var(--color-border-s);
    padding-bottom: var(--spacing-xxs);
  }

  .stories-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    max-height: 200px;
    overflow-y: auto;
  }

  .no-stories {
    text-align: center;
    font-size: var(--font-size-small);
    color: var(--font-color-m);
    font-style: italic;
    padding: var(--spacing-m) 0;
  }

  .dev-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
