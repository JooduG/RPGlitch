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

  /**
   * System actions logger
   * @param {string} action
   */
  const log_action = (action) => app.log(`Control Panel: ${action}`, "system");

  /**
   * Load a story and transition view
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
   * Generate mock content for debugging
   * @param {MockRole} role
   */
  async function run_mock(role) {
    const is_fractal = role === "fractal";
    const name = is_fractal
      ? runtime.active_fractal?.name || "Fractal"
      : runtime.active_ai?.name || "AI";

    const content = is_fractal
      ? `<think>The simulation layer shifts. Applying high-altitude atmospheric metrics to the local shard.</think>\n\n[[ Cyber London ]] · [[ 21:30 ]] · [[ Acid Neon ]] \n\nLorem ipsum dolor sit amet, **consectetur** adipiscing elit. *Sed do eiusmod* tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud **exercitation** ullamco laboris nisi ut aliquip ex ea commodo consequat.`
      : `<think>Subject is entering the dead-zone. Adjusting internal optics for low-light tracking.</think>\n\n"Listen, champ," *voice drops to conspiratorial whisper*, "Duis aute irure dolor in **reprehenderit** in voluptate velit esse cillum dolore eu fugiat nulla pariatur."\n\n*Excepteur sint occaecat* cupidatat non proident. Sunt in culpa qui officia **deserunt** mollit anim id est laborum.`;

    app.toggle_control_panel();
    simulationState.start_generation(role);

    await new Promise((r) => setTimeout(r, 2500));

    simulationState.complete();
    app.start_stream("mock-node", role);

    let buffer = "";
    const words = content.split(" ");
    for (let i = 0; i < words.length; i++) {
      buffer += (i === 0 ? "" : " ") + words[i];
      app.streaming.content = buffer;
      await new Promise((r) => setTimeout(r, 60));
    }

    await session_driver.log_turn(content, name, role, { turn_type: "SYSTEM_TURN" });
    app.end_stream();
    log_action(`Mock ${role} transition complete`);
  }

  /**
   * Destructive system reset
   */
  async function hard_reset() {
    db.close();
    await db.delete();
    setTimeout(() => window.location.reload(), 150);
  }

  let is_confirming_reset = $state(false);
  let is_storyboard = $derived(app.view === "storyboard");
  let is_storymode = $derived(app.view === "storymode");

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

<Modal variant="standard" on_close={() => app.toggle_control_panel()}>
  <article class="wrapper" data-testid="control-panel">
    <header class="header">
      <Toggle
        label="CALL MODE"
        bind:value={settings.call_mode}
        onchange={() => app.save_settings()}
      />
      <Toggle label="SOUND" bind:value={settings.sound} onchange={() => app.save_settings()} />
    </header>

    {#if is_storyboard}
      <section class="body">
        <TextField
          class="text-area"
          is_edit={true}
          placeholder="(Optional) e.g., 'Start in media res', 'Describe the weather first'"
          bind:value={prologue}
        />
      </section>
    {/if}

    {#if is_storymode}
      <section class="body actions">
        <Button
          label="GHOSTWRITE"
          variant="primary"
          size="sm"
          onclick={() => log_action("Ghostwrite")}
        />
        <Button label="PHOTO" variant="secondary" size="sm" onclick={() => log_action("Photo")} />
        <Button
          label="MOCK PROLOGUE"
          variant="invisible"
          size="sm"
          onclick={() => run_mock("fractal")}
        />
        <Button label="MOCK TURN" variant="invisible" size="sm" onclick={() => run_mock("ai")} />
        <Button
          label="END STORY"
          variant="secondary"
          size="sm"
          onclick={() => log_action("EndStory")}
        />
      </section>
    {/if}

    <footer class="footer">
      <section class="section">
        <h3 class="headline">STORIES</h3>
        {#if story_cache.length > 0}
          <div class="list scrollbar">
            {#each story_cache as story (story.id)}
              <StoryCard {story} onclick={() => load_story(story.id)} />
            {/each}
          </div>
        {:else}
          <p class="status">No stories found in the archives.</p>
        {/if}
      </section>

      <div class="actions secondary">
        <Toggle
          label="DEVMODE"
          bind:value={settings.dev_mode}
          onchange={() => app.save_settings()}
        />
        <Button variant="danger" size="sm" onclick={() => (is_confirming_reset = true)}>
          <svg
            class="icon-small icon-outline"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
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
  .wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    width: 100%;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-3);
    flex-wrap: wrap;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-3);
    justify-content: center;
  }

  .footer {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    width: 100%;
  }

  .headline {
    margin: 0 0 var(--spacing-2);
    padding-bottom: var(--spacing-1);
    border-bottom: var(--border-muted);
    color: var(--font-color-muted);
    font-size: var(--font-size-nano);
    letter-spacing: var(--font-spacing-loose);
    text-align: center;
    text-transform: uppercase;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    max-height: var(--dropdown-max-height);
    overflow-y: auto;
  }

  .status {
    padding: var(--spacing-4) 0;
    color: var(--font-color-muted);
    font-size: var(--font-size-small);
    font-style: italic;
    text-align: center;
  }

  .actions.secondary {
    justify-content: space-between;
    padding-top: var(--spacing-3);
    border-top: var(--border-muted);
  }
</style>
