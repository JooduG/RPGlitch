<script>
  import { db } from "@data/db.js";
  import { app } from "@state/app.svelte.js";
  import { runtime } from "@state/runtime.svelte.js";
  import { Session } from "@core/engine/engine.js";
  import Button from "@ui/atoms/Button.svelte";
  import Toggle from "@ui/atoms/Toggle.svelte";
  import Modal from "@ui/molecules/Modal.svelte";
  import TextField from "@ui/atoms/TextField.svelte";
  import Confirm from "@ui/molecules/Confirm.svelte";

  /**
   * Main system interface for settings and prologue configuration.
   * Follows the [Polish Protocol] v1.0.0
   */

  function handleAction(action) {
    app.log(`Control Panel: ${action}`, "system");
  }

  async function handleMockMessage(role) {
    const name =
      role === "fractal"
        ? runtime.active_fractal?.name || "Fractal"
        : runtime.active_ai?.name || "AI";

    const dummyText =
      role === "fractal"
        ? `<think>The simulation layer shifts. Applying high-altitude atmospheric metrics to the local shard.</think>\n\n『 [Cyber London] · [21:30] · [Acid Neon] 』\n\nLorem ipsum dolor sit amet, **consectetur** adipiscing elit. *Sed do eiusmod* tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud **exercitation** ullamco laboris nisi ut aliquip ex ea commodo consequat.`
        : `<think>Subject is entering the dead-zone. Adjusting internal optics for low-light tracking.</think>\n\nDuis aute irure dolor in **reprehenderit** in voluptate velit esse cillum dolore eu fugiat nulla pariatur. *Excepteur sint occaecat* cupidatat non proident.\n\nSunt in culpa qui officia **deserunt** mollit anim id est laborum.`;

    await Session.log_turn(dummyText, name, role);
    app.log(`Mock ${role} message injected.`, "system");
  }

  let showResetConfirm = $state(false);
  async function handleReset() {
    showResetConfirm = true;
  }

  async function executeReset() {
    db.close(); // Close connection first
    await db.delete();
    // Tiny delay to ensure IO is complete
    setTimeout(() => window.location.reload(), 150);
  }

  /* --- STATE HELPERS --- */
  let isStoryboard = $derived(app.view === "storyboard");
  let isStoryMode = $derived(app.view === "storymode");
</script>

<Confirm
  bind:open={showResetConfirm}
  title="Wipe Memories?"
  message="This will permanently delete all characters and logs. This action cannot be undone."
  confirm_label="Wipe Everything"
  on_confirm={executeReset}
/>

<Modal variant="standard" on_close={() => app.toggle_control_panel()}>
  <article class="control-panel-wrapper" data-testid="control-panel">
    <!-- HEADER: System Toggles -->
    <header>
      <Toggle
        label="CALL MODE"
        bind:value={app.settings.call_mode}
        onchange={() => app.save_settings()}
      />
      <Toggle
        label="NOTIFICATIONS"
        bind:value={app.settings.sound}
        onchange={() => app.save_settings()}
      />
    </header>

    <!-- BODY: Prologue (Lobby Only) -->
    {#if isStoryboard}
      <div class="storyboard">
        <TextField
          class="prologue-field"
          is_edit={true}
          placeholder="(Optional) e.g., 'Start in media res', 'Describe the weather first'"
          bind:value={app.prologue}
        />
      </div>
    {/if}

    <!-- BODY: Actions (Story Mode Only) -->
    {#if isStoryMode}
      <div class="storymode">
        <Button
          label="GHOSTWRITE"
          variant="secondary"
          size="sm"
          onclick={() => handleAction("Ghostwrite")}
        />
        <Button label="PHOTO" variant="secondary" size="sm" onclick={() => handleAction("Photo")} />
        <Button
          label="MOCK: FRACTAL"
          variant="secondary"
          size="sm"
          onclick={() => handleMockMessage("fractal")}
        />
        <Button
          label="MOCK: AI"
          variant="secondary"
          size="sm"
          onclick={() => handleMockMessage("ai")}
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
      <div class="stories-row">
        <Button
          label="STORIES"
          variant="secondary"
          size="sm"
          onclick={() => handleAction("OpenLibrary")}
        />
      </div>

      <div class="dev-row">
        <Toggle
          label="DevMode"
          bind:value={app.settings.dev_mode}
          onchange={() => app.save_settings()}
        />
        <Button variant="secondary" size="sm" onclick={handleReset}>
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

  .stories-row {
    display: flex;
    justify-content: center;
  }

  .dev-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
