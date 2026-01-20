<script>
  import Modal from "../../artificer/Modal.svelte";
  import Panel from "../../artificer/Panel.svelte";
  import Button from "../../artificer/Button.svelte";
  import { app } from "../../gamemaster/state.svelte.js";
  import { db } from "../../scholar/database/db.js";

  function handleAction(action) {
    console.log("Action:", action);
  }
  async function handleReset() {
    if (confirm("This will wash away all memories. Are you sure?")) {
      console.log("Wiping Database...");
      await db.delete();
      localStorage.clear();
      window.location.reload();
    }
  }
</script>

<Modal variant="transparent" onclose={() => app.toggleControlPanel()}>
  <div class="header">
    <h2>Weaving</h2>
    <Button
      class="close"
      variant="ghost"
      onclick={() => app.toggleControlPanel()}
      aria-label="Close"
    >
      ×
    </Button>
  </div>

  <Panel>
    <div class="row">
      <span class="label">Sound Effects</span>
      <Button
        label={app.settings.sound ? "On" : "Off"}
        variant={app.settings.sound ? "primary" : "secondary"}
        onclick={app.toggleSound}
      />
    </div>
    <div class="row">
      <span class="label">Stream Text</span>
      <Button
        label={app.settings.streamText ? "Flow" : "Instant"}
        variant={app.settings.streamText ? "primary" : "secondary"}
        onclick={app.toggleStreamText}
      />
    </div>
    <div class="row">
      <span class="label">Auto-Scroll</span>
      <Button
        label={app.settings.autoScroll ? "Follow" : "Stay"}
        variant={app.settings.autoScroll ? "primary" : "secondary"}
        onclick={app.toggleAutoScroll}
      />
    </div>
    <div class="row">
      <span class="label">Director Mode</span>
      <Button
        label={app.settings.debugMode ? "Visible" : "Hidden"}
        variant={app.settings.debugMode ? "primary" : "secondary"}
        onclick={app.toggleDebugMode}
      />
    </div>
  </Panel>

  {#if app.view === "game"}
    <Panel>
      <div class="grid">
        <Button
          label="Ghostwrite"
          variant="primary"
          onclick={() => handleAction("Ghostwrite")}
        />
        <Button
          label="Request Photo"
          variant="secondary"
          onclick={() => handleAction("RequestPhoto")}
        />
      </div>
      <div style="margin-top: 0.5rem">
        <Button
          label="End Story"
          variant="danger"
          onclick={() => handleAction("EndStory")}
        />
      </div>
    </Panel>
  {/if}

  <Panel>
    <div class="row">
      <span class="label">Developer Mode</span>
      <Button
        label={app.settings.devMode ? "Active" : "Hidden"}
        variant={app.settings.devMode ? "warden" : "secondary"}
        onclick={app.toggleDevMode}
      />
    </div>
    <div style="margin-top: 0.5rem">
      <Button label="Reset World" variant="danger" onclick={handleReset} />
    </div>
  </Panel>
</Modal>

<style lang="scss">
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0.5rem;
    margin-bottom: 0.5rem;

    h2 {
      font-family: var(--font-heading);
      font-weight: normal;
      font-size: 1.2rem;
      color: #e4e4e7;
      margin: 0;
      font-style: italic;
    }
    /* Use :global() to style the inner button element of the component */
    :global(.close) {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #71717a;
      cursor: pointer;
      transition: color 0.2s;
      padding: 0 0.5rem; /* Adjust padding for button component */
      line-height: 1;
      min-width: auto; /* Override default button width if any of standard btn styles interfere */
      &:hover {
        color: #fff;
        background: transparent; /* specific override for ghost hover */
      }
    }
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    .label {
      font-size: 0.9rem;
      color: #a1a1aa;
      font-family: var(--font-body);
    }
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
</style>
