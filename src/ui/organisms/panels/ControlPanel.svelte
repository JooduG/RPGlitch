<script>
  import { db } from "@data/db.js";
  import { app } from "@state/app.svelte.js";
  import Button from "@ui/atoms/Button.svelte";
  import Toggle from "@ui/atoms/Toggle.svelte";
  import Modal from "@ui/molecules/dialogs/Modal.svelte";

  /**
   * 🕹️ ControlPanel (UI)
   * Main system interface for settings and prologue configuration.
   * Follows the [Polish Protocol] v1.0.0
   */

  function handleAction(action) {
    app.log(`Control Panel: ${action}`, "system");
  }

  async function handleReset() {
    if (confirm("This will wash away all memories. Are you sure?")) {
      await db.delete();
      window.location.reload();
    }
  }

  /* --- STATE HELPERS --- */
  let isStoryboard = $derived(app.view === "lobby");
  let isStoryMode = $derived(app.view === "game");
</script>

<Modal variant="standard" on_close={() => app.toggle_control_panel()}>
  <article class="control-panel-wrapper" data-testid="control-panel">
    <!-- HEADER: System Toggles -->
    <header class="panel-header">
      <div class="status-toggles">
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
      </div>
    </header>

    <!-- BODY: Prologue (Lobby Only) -->
    {#if isStoryboard}
      <section class="prologue-setup">
        <div class="input-wrapper seamless-field">
          <textarea
            class="prologue-field"
            placeholder="(Optional) e.g., 'Start in media res', 'Describe the weather first'"
            bind:value={app.prologue}
          ></textarea>
        </div>
      </section>
    {/if}

    <!-- BODY: Actions (Story Mode Only) -->
    {#if isStoryMode}
      <nav class="action-grid">
        <Button
          label="GHOSTWRITE"
          variant="secondary"
          size="sm"
          onclick={() => handleAction("Ghostwrite")}
        />
        <Button label="PHOTO" variant="secondary" size="sm" onclick={() => handleAction("Photo")} />
        <Button
          label="END STORY"
          variant="secondary"
          size="sm"
          onclick={() => handleAction("EndStory")}
        />
      </nav>
    {/if}

    <!-- FOOTER: Navigation & Meta -->
    <footer class="panel-footer">
      <div class="navigation-links">
        <button class="nav-button" onclick={() => handleAction("OpenLibrary")}> Story Library </button>
      </div>

      <div class="system-meta">
        <div class="dev-toggle">
          <Toggle
            label="DevMode"
            bind:value={app.settings.dev_mode}
            onchange={() => app.save_settings()}
          />
        </div>
        <Button variant="secondary" size="sm" onclick={handleReset}>
          <div class="reset-wrapper">
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
          </div>
        </Button>
      </div>
    </footer>
  </article>
</Modal>

<style>
  .control-panel-wrapper {
    width: 100%;
    padding: var(--spacing-xl);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-l);
    font-family: var(--font-family-body);
    color: var(--font-color-m);
  }

  .status-toggles {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    justify-content: center;
    align-items: center;
    margin-bottom: var(--spacing-l);
    padding: var(--spacing-m) 0;
    box-shadow: 0 1px 0 var(--glass-edge-l);
  }

  .prologue-setup .input-wrapper .prologue-field {
    width: 100%;
    min-height: 8rem;
    background: transparent;
    border: none;
    color: var(--font-color-s);
    font-family: var(--font-family-body);
    font-size: var(--font-size-s);
    resize: none;
    outline: none;
    line-height: var(--line-height-m);
  }

  .action-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-s);
    justify-content: center;
    padding: var(--spacing-m) 0;
  }

  .panel-footer {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-l);
    margin-top: auto;
    padding-top: var(--spacing-m);
    border-top: 1px solid var(--glass-edge-l);
  }

  .navigation-links {
    display: flex;
    justify-content: center;
  }

  .navigation-links .nav-button {
    background: none;
    border: none;
    color: var(--font-color-s);
    font-weight: var(--font-weight-l);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-m);
    cursor: pointer;
    transition: all var(--motion-fast) var(--motion-elastic);
    opacity: var(--opacity-l);
  }

  .navigation-links .nav-button:hover {
    color: var(--font-color-m);
    opacity: var(--opacity-full);
  }

  .system-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-m);
  }

  .system-meta .dev-toggle {
    opacity: var(--opacity-xl);
    transition: opacity var(--motion-fast);
  }

  .system-meta .dev-toggle:hover {
    opacity: var(--opacity-full);
  }

  .system-meta .reset-wrapper {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
</style>
